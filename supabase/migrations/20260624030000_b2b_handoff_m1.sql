-- ─────────────────────────────────────────────────────────────
-- B2B 매칭 후 핸드오프 M1 (HANDOFF FLOW)
--   매칭완료 이후 "절벽" 해소:
--     ① 동아리 PL·팀원 지정(민법상 조합 구성) → b2b_project_team
--     ② 계약 업로드/상태 + 기업 담당자 연락처 → b2b_contracts
--     ③ 프로젝트 상태 확장(진행중/완료/중단) → b2b_projects.status
--   짝 문서: B2B_HANDOFF_FLOW_PLAN.md
-- 권한 패턴: 해당 application의 동아리 운영진 OR 프로젝트 소유 기업담당자 OR global_admin
-- ─────────────────────────────────────────────────────────────

-- ── b2b_projects 상태 확장 ────────────────────────────────────
-- 기존: '모집중'|'모집마감' → +진행중/완료/중단 (킥오프~완료 전이)
ALTER TABLE public.b2b_projects DROP CONSTRAINT IF EXISTS b2b_projects_status_check;
ALTER TABLE public.b2b_projects
  ADD CONSTRAINT b2b_projects_status_check
  CHECK (status IN ('모집중', '모집마감', '진행중', '완료', '중단'));

-- 기업담당자가 자기 기업 프로젝트의 상태를 변경할 수 있도록(킥오프/완료)
-- (추가 permissive 정책 — 기존 정책과 OR 결합)
CREATE POLICY "기업담당자 프로젝트 상태 수정"
ON public.b2b_projects FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.corp_members cm
    WHERE cm.corp_id = b2b_projects.corp_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- ── 프로젝트 팀 (PL + 팀원, 민법상 조합) ──────────────────────
CREATE TABLE IF NOT EXISTS public.b2b_project_team (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.b2b_applications(id) ON DELETE CASCADE,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role           text NOT NULL CHECK (role IN ('PL', '팀원')),
  share_pct      numeric,                       -- 대금 배분 비율(%)
  member_name    text,                          -- 지정 시점 스냅샷(기업 측 표시용 — 교차 프로필 RLS 회피)
  member_email   text,
  accepted_at    timestamptz,                   -- PL 책임 수락 시점
  created_at     timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS b2b_project_team_application_idx ON public.b2b_project_team(application_id);

ALTER TABLE public.b2b_project_team ENABLE ROW LEVEL SECURITY;

-- 조회: 해당 동아리 운영진 OR 프로젝트 소유 기업담당자 OR global_admin
CREATE POLICY "팀 조회" ON public.b2b_project_team FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_project_team.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.b2b_projects p ON p.id = a.project_id
    JOIN public.corp_members cm ON cm.corp_id = p.corp_id
    WHERE a.id = b2b_project_team.application_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- 생성/수정/삭제: 해당 동아리 운영진만(팀 구성은 동아리 권한) OR global_admin
CREATE POLICY "팀 운영진 생성" ON public.b2b_project_team FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_project_team.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);
CREATE POLICY "팀 운영진 수정" ON public.b2b_project_team FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_project_team.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);
CREATE POLICY "팀 운영진 삭제" ON public.b2b_project_team FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_project_team.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- ── 계약 + 기업 담당자 연락처 (application 당 1행 공유) ────────
CREATE TABLE IF NOT EXISTS public.b2b_contracts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id     uuid NOT NULL UNIQUE REFERENCES public.b2b_applications(id) ON DELETE CASCADE,
  doc_path           text,                       -- b2b-contracts 버킷 객체 경로(비공개 → 서명URL)
  status             text NOT NULL DEFAULT '미체결' CHECK (status IN ('미체결', '체결완료')),
  signed_at          timestamptz,
  corp_contact_name  text,                        -- 기업 단일창구 담당자(기업이 입력 → 동아리에 공개)
  corp_contact_email text,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

ALTER TABLE public.b2b_contracts ENABLE ROW LEVEL SECURITY;

-- 조회: 동아리 운영진 OR 기업담당자 OR global_admin
CREATE POLICY "계약 조회" ON public.b2b_contracts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_contracts.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.b2b_projects p ON p.id = a.project_id
    JOIN public.corp_members cm ON cm.corp_id = p.corp_id
    WHERE a.id = b2b_contracts.application_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- 생성/수정: 동아리 운영진(계약서 업로드/체결) OR 기업담당자(연락처 입력) OR global_admin
CREATE POLICY "계약 생성" ON public.b2b_contracts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_contracts.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.b2b_projects p ON p.id = a.project_id
    JOIN public.corp_members cm ON cm.corp_id = p.corp_id
    WHERE a.id = b2b_contracts.application_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);
CREATE POLICY "계약 수정" ON public.b2b_contracts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.club_members m ON m.club_id = a.club_id
    WHERE a.id = b2b_contracts.application_id
      AND m.user_id = auth.uid() AND m.role = '운영진'
  )
  OR EXISTS (
    SELECT 1 FROM public.b2b_applications a
    JOIN public.b2b_projects p ON p.id = a.project_id
    JOIN public.corp_members cm ON cm.corp_id = p.corp_id
    WHERE a.id = b2b_contracts.application_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
);

-- ── 계약서 비공개 스토리지 버킷 ──────────────────────────────
-- 법률 문서 → 비공개 버킷 + createSignedUrl 로만 열람(certification-docs 패턴)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('b2b-contracts', 'b2b-contracts', false, 20971520)  -- 20MB
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "b2b-contracts 조회"
ON storage.objects FOR SELECT
USING (bucket_id = 'b2b-contracts' AND auth.uid() IS NOT NULL);

CREATE POLICY "b2b-contracts 업로드"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'b2b-contracts' AND auth.uid() IS NOT NULL);

CREATE POLICY "b2b-contracts 수정"
ON storage.objects FOR UPDATE
USING (bucket_id = 'b2b-contracts' AND auth.uid() IS NOT NULL);
