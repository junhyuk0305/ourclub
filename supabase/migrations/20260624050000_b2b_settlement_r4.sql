-- ─────────────────────────────────────────────────────────────
-- B2B 정산 + 미납 자동제재 (RISK R4 / HANDOFF M3)
--   ⑥ 정산: 기업→동아리 대금 수령 + 동아리→OURCLUB 수수료 납부 추적
--   미납 자동제재: 미납 동아리는 신규 제안(b2b_applications) 발송 차단
--   짝 문서: B2B_RISK_REMEDIATION_PLAN.md §R4, B2B_HANDOFF_FLOW_PLAN.md M3
--   표준값(대표 확정 2026.06.24): 수수료율 10%, 납부기한 대금 수령 후 7일
-- 권한 패턴: 해당 application의 동아리 운영진 OR 프로젝트 소유 기업담당자 OR global_admin
-- ─────────────────────────────────────────────────────────────

-- ── 정산 (application 당 1행 공유) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.b2b_settlements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL UNIQUE REFERENCES public.b2b_applications(id) ON DELETE CASCADE,
  amount          numeric,                       -- 거래금액(프로젝트 예산 스냅샷)
  fee_pct         numeric NOT NULL DEFAULT 10,   -- 중개수수료율(%) — 표준값 10%
  fee_amount      numeric,                       -- amount * fee_pct / 100
  due_days        int NOT NULL DEFAULT 7,        -- 대금 수령 후 수수료 납부기한(일)
  paid_to_club_at timestamptz,                   -- 기업→동아리 대금 지급 완료 시점
  fee_paid_at     timestamptz,                   -- 동아리→OURCLUB 수수료 납부 시점
  status          text NOT NULL DEFAULT '대기'
                  CHECK (status IN ('대기', '대금수령', '수수료납부완료', '미납')),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE public.b2b_settlements ENABLE ROW LEVEL SECURITY;

-- 조회: 동아리 운영진 OR 기업담당자 OR global_admin
CREATE POLICY "정산 조회" ON public.b2b_settlements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_settlements.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.b2b_projects p ON p.id = a.project_id
    JOIN public.corp_members cm ON cm.corp_id = p.corp_id
    WHERE a.id = b2b_settlements.application_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- 생성/수정: 동아리 운영진(수수료 납부 표시) OR 기업담당자(대금 지급 표시) OR global_admin
CREATE POLICY "정산 생성" ON public.b2b_settlements FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_settlements.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.b2b_projects p ON p.id = a.project_id
    JOIN public.corp_members cm ON cm.corp_id = p.corp_id
    WHERE a.id = b2b_settlements.application_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);
CREATE POLICY "정산 수정" ON public.b2b_settlements FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_settlements.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.b2b_projects p ON p.id = a.project_id
    JOIN public.corp_members cm ON cm.corp_id = p.corp_id
    WHERE a.id = b2b_settlements.application_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- ── 미납 판정 함수 (단일 진실원) ──────────────────────────────
-- 미납 = 명시적 '미납' OR (대금수령 후 납부기한 경과했는데 수수료 미납)
CREATE OR REPLACE FUNCTION public.b2b_club_has_overdue(p_club_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.b2b_settlements s
    JOIN public.b2b_applications a ON a.id = s.application_id
    WHERE a.club_id = p_club_id
      AND s.fee_paid_at IS NULL
      AND (
        s.status = '미납'
        OR (
          s.status = '대금수령'
          AND s.paid_to_club_at IS NOT NULL
          AND s.paid_to_club_at + (s.due_days || ' days')::interval < now()
        )
      )
  );
$$;

-- ── 미납 자동제재: 신규 제안 발송 차단 트리거 ─────────────────
-- 미납 수수료가 있는 동아리는 b2b_applications INSERT 불가(서버 backstop).
CREATE OR REPLACE FUNCTION public.b2b_block_overdue_application()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.b2b_club_has_overdue(NEW.club_id) THEN
    RAISE EXCEPTION '미납 수수료가 있어 신규 제안을 보낼 수 없습니다. 정산을 완료해 주세요.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS b2b_applications_block_overdue ON public.b2b_applications;
CREATE TRIGGER b2b_applications_block_overdue
  BEFORE INSERT ON public.b2b_applications
  FOR EACH ROW EXECUTE FUNCTION public.b2b_block_overdue_application();
