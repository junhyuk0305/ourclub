-- ─────────────────────────────────────────────────────────────
-- 보안 수정: 모집 지원(recruitment_applications INSERT) 마감/시작전/임시저장
--           가드를 서버측(DB)에서 최종 강제 — SECURITY_REVIEW H1
--
-- 문제: 현재 "마감 후 / 시작 전 / 임시저장 공고"에 대한 지원 차단이 클라이언트
--       전용(ClubApply.tsx 의 status==='임시저장' 분기, isExpired, isBeforeStart)
--       으로만 존재. anon/auth 키로 REST API 를 직접 호출하면
--         POST /rest/v1/recruitment_applications
--       로 가드를 우회해 마감된 공고·시작 전 공고·임시저장(미발행) 공고에도
--       지원서를 INSERT 할 수 있다(무결성/업무규칙 위반).
--
-- 방침: 지원 INSERT 가 아래 (a)(b)(c) 를 "모두" 만족할 때만 통과하도록 DB 가
--       최종 강제한다. 부모 recruitments 테이블을 참조해야 하므로, 레포 컨벤션
--       (20260623000000_security_restrict_anon_reads.sql)대로 판정 로직은
--       SECURITY DEFINER 헬퍼 함수로 분리한다(참조 테이블 RLS 우회 → 재귀/권한
--       이슈 회피). 기존 base INSERT 정책(원격 DB 에 한국어 정책명으로 존재,
--       이 repo 의 remote_schema 는 빈 파일)은 이름을 알 수 없어 건드리지 않고,
--       BEFORE INSERT 트리거로 가드를 "보강(additive)"한다. RLS WITH CHECK 와
--       달리 트리거는 기존 정책과 독립적으로 항상 평가되므로 우회 경로를 덮는다.
--
--   (a) recruitment.status = '진행중'                      → 임시저장(미발행) 차단
--   (b) recruitment.deadline IS NULL OR deadline >= now()  → 마감 후 차단
--   (c) recruitment.recruit_start_date IS NULL
--       OR recruit_start_date <= now()                     → 시작 전 차단
--
--   NULL 처리: deadline / recruit_start_date 가 NULL 이면 "제한 없음"으로 통과
--   (앱 의미와 동일 — recruit_start_date NULL = 즉시 시작, deadline NULL = 무기한).
--   deadline 컬럼이 date 든 timestamptz 든 now() 비교는 Postgres 가 자동 캐스팅.
--
-- 기능 영향(검토 완료, 정상 지원은 전부 통과):
--   - 클라이언트 정상 흐름(ClubApply)은 status IN ('진행중') 인 공고만 로드하고,
--     isExpired/isBeforeStart 가 false 일 때만 폼을 제출 → (a)(b)(c) 동일 조건.
--     따라서 정상 지원은 트리거를 그대로 통과(기능 영향 0).
--   - 합격 자동 등록 트리거(promote_applicant_on_final_status)는
--     status UPDATE 시점에 동작 → 본 BEFORE INSERT 트리거와 무관.
--   - 운영진/마스터가 지원서를 대신 INSERT 하는 흐름은 앱상 없음(지원은 본인 INSERT).
--     혹시 존재하더라도 발행·기간 내 공고에 대한 것이므로 동일하게 통과.
--
-- ⚠️ 적용 후 재검증:
--   1) supabase db push 로 본 마이그레이션 적용.
--   2) anon/auth 키로 부정 경로가 모두 거부(에러)되는지 확인:
--      - 임시저장 공고:  POST /rest/v1/recruitment_applications
--          body: {recruitment_id:<status='임시저장' 공고>, user_id:<uid>, answers:{}, status:'서류접수'}
--          → 거부(트리거 RAISE EXCEPTION). (마이그레이션 후 응답 4xx, 행 미생성)
--      - 마감 공고:      deadline < now() 인 공고로 동일 POST → 거부.
--      - 시작 전 공고:   recruit_start_date > now() 인 공고로 동일 POST → 거부.
--   3) 정상 공고(status='진행중', deadline NULL 또는 미래, start NULL 또는 과거)에
--      대한 정상 지원은 그대로 성공하는지 회귀 확인(ClubApply 에서 실제 제출).
--   4) 거부 사유 메시지는 errcode '23514'(check_violation) + 한국어 HINT 로 노출.
-- ─────────────────────────────────────────────────────────────

-- 1) 판정 헬퍼 (SECURITY DEFINER → recruitments RLS 우회로 재귀/권한 이슈 회피) ──
--    반환: 해당 모집이 "지금 지원 가능"하면 true, 아니면 false.
--    공고가 존재하지 않으면(FK 가 잡겠지만 방어적으로) false → 트리거가 차단.
CREATE OR REPLACE FUNCTION public.app_recruitment_is_open(p_recruitment_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.recruitments r
    WHERE r.id = p_recruitment_id
      AND r.status = '진행중'                                        -- (a)
      AND (r.deadline IS NULL OR r.deadline >= now())               -- (b)
      AND (r.recruit_start_date IS NULL OR r.recruit_start_date <= now()) -- (c)
  );
$$;

GRANT EXECUTE ON FUNCTION public.app_recruitment_is_open(uuid) TO authenticated, anon;


-- 2) BEFORE INSERT 트리거 함수: 가드 위반 시 RAISE EXCEPTION ────────────────────
CREATE OR REPLACE FUNCTION public.enforce_apply_window()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.app_recruitment_is_open(NEW.recruitment_id) THEN
    RAISE EXCEPTION '지원할 수 없는 공고입니다(마감/시작 전/미발행).'
      USING ERRCODE = 'check_violation',
            HINT = '발행(진행중) 상태이고 모집 기간 내인 공고에만 지원할 수 있습니다.';
  END IF;
  RETURN NEW;
END;
$$;


-- 3) 트리거 등록 (멱등성: 재생성 전 동일 이름 트리거 제거) ───────────────────────
DROP TRIGGER IF EXISTS trg_enforce_apply_window ON public.recruitment_applications;

CREATE TRIGGER trg_enforce_apply_window
  BEFORE INSERT ON public.recruitment_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_apply_window();
