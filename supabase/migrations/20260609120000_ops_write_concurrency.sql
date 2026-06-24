-- ─────────────────────────────────────────────────────────────
-- 운영진 기능 쓰기 동시성·원자성 강화 (사용자 많아질 때의 부분쓰기·레이스 차단)
--
-- 목적: 클라이언트에서 행 단위로 흩어져 일어나던 멀티스텝 쓰기를
--   ① 출석은 (session_id, member_id) 유일 제약으로 upsert 가능하게 하고
--   ② 가입승인 / 단계이동 / 메모추가 / 합격자끌어오기는 RPC(단일 트랜잭션)로
--   묶어 "중간 실패 시 부분쓰기"·"동시 저장 충돌"·"메모 lost-update"를 없앤다.
--
-- 안전성:
--   * 전부 멱등(IF NOT EXISTS / CREATE OR REPLACE) → 재실행 무해.
--   * 유일 인덱스 생성 전 중복행을 정리하므로 기존 데이터에서도 실패하지 않음.
--   * 알림은 기존 트리거(notify_join_request_decision / notify_applicant_stage_move)가
--     그대로 발화하므로 RPC는 핵심 쓰기만 수행한다(중복 알림 없음).
--   * 모든 RPC 는 SECURITY DEFINER + 내부 권한검사(운영진·활동중)로 RLS 우회를 통제.
--
-- 적용 후: 아래 클라이언트들을 RPC/upsert 호출로 교체(이 마이그레이션과 한 쌍).
--   - AttendanceDetail.saveAll          → attendances.upsert(onConflict 'session_id,member_id')
--   - MembersAdmin.handleJoinDecision   → rpc('decide_club_join_request')
--   - ApplicantsTab/RecruitAdmin.addMemo→ rpc('add_application_memo')
--   - *.confirmStageMove                → rpc('move_application_stage')
--   - *.bulkChangeStatus                → rpc('move_applications_stage_bulk')
--   - PullApplicantsModal.submit        → rpc('pull_applicants_to_members')
-- ─────────────────────────────────────────────────────────────


-- ════════════════════════════════════════════════════════════
-- 1) attendances: (session_id, member_id) 유일 인덱스
--    한 세션의 한 멤버는 출석 레코드가 하나여야 한다(앱의 insert-or-update 의도).
--    유일 제약이 있어야 클라이언트가 N개 개별쓰기 대신 단일 upsert 로 저장 가능.
-- ════════════════════════════════════════════════════════════

-- (a) 혹시 존재할 수 있는 중복행 정리 — 쌍마다 한 행만 남긴다.
--     '출석' > 그 외 비-NULL 상태 > NULL 순으로 의미 있는 행을 우선 보존.
WITH ranked AS (
  SELECT ctid,
         row_number() OVER (
           PARTITION BY session_id, member_id
           ORDER BY (status = '출석') DESC NULLS LAST,
                    (status IS NOT NULL) DESC,
                    ctid DESC
         ) AS rn
  FROM public.attendances
)
DELETE FROM public.attendances a
USING ranked r
WHERE a.ctid = r.ctid AND r.rn > 1;

-- (b) 유일 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS attendances_session_member_uniq
  ON public.attendances (session_id, member_id);


-- ════════════════════════════════════════════════════════════
-- 2) decide_club_join_request — 운영진 합류신청 승인/거절(원자·멱등)
--    승인: club_members 생성(운영진/활동중) + 신청 상태 갱신을 한 트랜잭션으로.
--    중간 실패 시 "멤버는 됐는데 신청은 대기중" 같은 어긋남이 없다.
--    이미 처리된(대기중 아님) 신청은 조용히 무시 → 두 운영진 동시 승인에도 안전.
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.decide_club_join_request(
  p_request_id uuid,
  p_decision   text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_req    public.club_join_requests%ROWTYPE;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다.';
  END IF;
  IF p_decision NOT IN ('승인', '거절') THEN
    RAISE EXCEPTION '잘못된 결정값입니다: %', p_decision;
  END IF;

  SELECT * INTO v_req FROM public.club_join_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION '합류 신청을 찾을 수 없습니다.';
  END IF;

  -- 권한: 해당 동아리의 활동중 운영진만
  IF NOT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = v_req.club_id AND user_id = v_caller
      AND role = '운영진' AND status = '활동중'
  ) THEN
    RAISE EXCEPTION '운영진만 처리할 수 있습니다.';
  END IF;

  -- 멱등: 이미 처리된 신청은 무시
  IF v_req.status <> '대기중' THEN
    RETURN;
  END IF;

  IF p_decision = '승인' THEN
    -- (club_id, user_id) 단위 직렬화 → 동시 승인 시 중복 멤버 insert 방지
    PERFORM pg_advisory_xact_lock(
      hashtextextended(v_req.club_id::text || ':' || v_req.user_id::text, 0::bigint)
    );
    IF NOT EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_id = v_req.club_id AND user_id = v_req.user_id
    ) THEN
      INSERT INTO public.club_members (user_id, club_id, role, status, position)
      VALUES (v_req.user_id, v_req.club_id, '운영진', '활동중', v_req.role_title);
    ELSE
      -- 이미 멤버면 운영진으로 승격(탈퇴 후 재합류 등)
      UPDATE public.club_members
      SET role = '운영진', status = '활동중'
      WHERE club_id = v_req.club_id AND user_id = v_req.user_id;
    END IF;
  END IF;

  -- 신청 상태 갱신(AFTER UPDATE OF status 트리거가 신청자 알림 발화)
  UPDATE public.club_join_requests
  SET status = p_decision, reviewed_by = v_caller, reviewed_at = now()
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decide_club_join_request(uuid, text) TO authenticated;


-- ════════════════════════════════════════════════════════════
-- 3) add_application_memo — 지원자 메모 추가(서버측 배열 concat)
--    클라이언트가 memos 배열 전체를 읽어-수정-쓰던 방식은 두 면접관이
--    동시에 추가하면 한 메모가 덮여 사라진다(lost update). 서버에서
--    jsonb || 로 append 하여 손실을 없앤다. 새 memos 배열을 반환.
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.add_application_memo(
  p_application_id uuid,
  p_content        text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_club   uuid;
  v_author text;
  v_memos  jsonb;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다.';
  END IF;

  -- 지원서 → 공고 → 동아리, 권한 확인
  SELECT r.club_id INTO v_club
  FROM public.recruitment_applications ra
  JOIN public.recruitments r ON r.id = ra.recruitment_id
  WHERE ra.id = p_application_id;
  IF v_club IS NULL THEN
    RAISE EXCEPTION '지원서를 찾을 수 없습니다.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = v_club AND user_id = v_caller
      AND role = '운영진' AND status = '활동중'
  ) THEN
    RAISE EXCEPTION '운영진만 메모를 추가할 수 있습니다.';
  END IF;

  -- 작성자명 = 이메일 로컬파트(클라이언트와 동일 규칙)
  SELECT split_part(email, '@', 1) INTO v_author FROM auth.users WHERE id = v_caller;
  v_author := COALESCE(NULLIF(v_author, ''), '운영진');

  UPDATE public.recruitment_applications
  SET memos = COALESCE(memos, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'author',     v_author,
      'content',    p_content,
      'created_at', to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  )
  WHERE id = p_application_id
  RETURNING memos INTO v_memos;

  RETURN v_memos;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_application_memo(uuid, text) TO authenticated;


-- ════════════════════════════════════════════════════════════
-- 4) move_application_stage — 단건 단계이동(상태변경 + 이동로그 원자)
--    상태 update 와 application_stage_log insert 가 한 트랜잭션 →
--    "옮겨졌는데 알림 안 감" 같은 어긋남 제거. 로그 insert 가
--    notify_applicant_stage_move 트리거를 발화해 인앱 알림이 나간다.
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.move_application_stage(
  p_application_id uuid,
  p_to_stage       text,
  p_from_stage     text,
  p_email_sent     boolean,
  p_email_subject  text,
  p_email_body     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_club   uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다.';
  END IF;

  SELECT r.club_id INTO v_club
  FROM public.recruitment_applications ra
  JOIN public.recruitments r ON r.id = ra.recruitment_id
  WHERE ra.id = p_application_id;
  IF v_club IS NULL THEN
    RAISE EXCEPTION '지원서를 찾을 수 없습니다.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = v_club AND user_id = v_caller
      AND role = '운영진' AND status = '활동중'
  ) THEN
    RAISE EXCEPTION '운영진만 단계를 이동할 수 있습니다.';
  END IF;

  UPDATE public.recruitment_applications
  SET status = p_to_stage
  WHERE id = p_application_id;

  INSERT INTO public.application_stage_log (
    application_id, from_stage, to_stage, email_sent, email_subject, email_body, moved_by
  )
  VALUES (
    p_application_id, p_from_stage, p_to_stage, p_email_sent,
    CASE WHEN p_email_sent THEN p_email_subject END,
    CASE WHEN p_email_sent THEN p_email_body END,
    v_caller
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.move_application_stage(uuid, text, text, boolean, text, text) TO authenticated;


-- ════════════════════════════════════════════════════════════
-- 5) move_applications_stage_bulk — 일괄 단계이동(상태변경 + 이동로그 원자)
--    실제 단계가 바뀌는 지원자만(현재 != 목표) 로그를 남겨 알림을 발화한다
--    (단건 confirmStageMove 와 동일 동작). 일괄은 모달이 없으므로 제목/본문 NULL.
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.move_applications_stage_bulk(
  p_ids        uuid[],
  p_to_stage   text,
  p_email_sent boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다.';
  END IF;
  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- 권한: 대상 지원서가 속한 동아리 전부에 대해 활동중 운영진이어야 함
  IF EXISTS (
    SELECT 1
    FROM public.recruitment_applications ra
    JOIN public.recruitments r ON r.id = ra.recruitment_id
    WHERE ra.id = ANY(p_ids)
      AND NOT EXISTS (
        SELECT 1 FROM public.club_members cm
        WHERE cm.club_id = r.club_id AND cm.user_id = v_caller
          AND cm.role = '운영진' AND cm.status = '활동중'
      )
  ) THEN
    RAISE EXCEPTION '권한이 없는 지원서가 포함되어 있습니다.';
  END IF;

  -- 로그 먼저(현재 status = from_stage 를 읽어야 하므로 update 전에)
  INSERT INTO public.application_stage_log (
    application_id, from_stage, to_stage, email_sent, email_subject, email_body, moved_by
  )
  SELECT ra.id, ra.status, p_to_stage, p_email_sent, NULL, NULL, v_caller
  FROM public.recruitment_applications ra
  WHERE ra.id = ANY(p_ids)
    AND ra.status IS DISTINCT FROM p_to_stage;

  UPDATE public.recruitment_applications
  SET status = p_to_stage
  WHERE id = ANY(p_ids)
    AND status IS DISTINCT FROM p_to_stage;
END;
$$;

GRANT EXECUTE ON FUNCTION public.move_applications_stage_bulk(uuid[], text, boolean) TO authenticated;


-- ════════════════════════════════════════════════════════════
-- 6) pull_applicants_to_members — 합격자 끌어오기(멱등 일괄 추가)
--    기존 멤버는 활동중/기수 갱신, 신규는 부원/활동중 insert 를 한 트랜잭션으로.
--    개별쓰기 N개를 한 번에 처리하고, 두 운영진이 같은 공고를 동시에 끌어와도
--    중복 멤버가 생기지 않는다(실행 시점 존재여부로 판정).
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.pull_applicants_to_members(
  p_club_id    uuid,
  p_user_ids   uuid[],
  p_generation text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION '로그인이 필요합니다.';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = p_club_id AND user_id = v_caller
      AND role = '운영진' AND status = '활동중'
  ) THEN
    RAISE EXCEPTION '운영진만 명단에 추가할 수 있습니다.';
  END IF;
  IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
    RETURN;
  END IF;

  -- 기존 멤버: 활동중 + 기수 갱신
  UPDATE public.club_members
  SET status = '활동중', generation = p_generation
  WHERE club_id = p_club_id AND user_id = ANY(p_user_ids);

  -- 신규 멤버: 부원/활동중 insert
  INSERT INTO public.club_members (club_id, user_id, role, status, generation)
  SELECT p_club_id, u, '부원', '활동중', p_generation
  FROM unnest(p_user_ids) AS u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.club_members cm
    WHERE cm.club_id = p_club_id AND cm.user_id = u
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.pull_applicants_to_members(uuid, uuid[], text) TO authenticated;
