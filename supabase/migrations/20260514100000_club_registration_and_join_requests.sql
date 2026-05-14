-- ─────────────────────────────────────────────────────────────
-- club_registration_requests
-- 새 동아리 등록 신청 + 안전 인증 서류/설문 통합 테이블
-- 마스터 어드민이 승인 시 clubs + club_members + is_certified=true 생성
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_registration_requests (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 동아리 기본 정보
  club_name             text NOT NULL,
  club_type             text NOT NULL,
  one_line_desc         text NOT NULL,
  description           text,
  location              text,

  -- 안전 인증 서류 (Storage URL)
  registration_doc_url  text,   -- 동아리 등록증
  activity_doc_url      text,   -- 활동 내역
  member_list_doc_url   text,   -- 회원 명단
  representative_id_url text,   -- 대표자 신분증 사본

  -- 안전 설문
  member_count          integer,
  has_regular_meeting   boolean,
  meeting_location      text,
  has_membership_fee    boolean,
  membership_fee_amount integer,
  has_accident_history  boolean,
  accident_description  text,

  -- 심사
  status                text NOT NULL DEFAULT '검토대기'
                          CHECK (status IN ('검토대기', '검토중', '보완요청', '승인', '거절')),
  reviewer_note         text,
  reviewed_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.club_registration_requests ENABLE ROW LEVEL SECURITY;

-- 본인 신청서만 조회 가능 (마스터는 모든 신청서 조회)
CREATE POLICY "registration_requests_select"
  ON public.club_registration_requests
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- 본인만 INSERT 가능
CREATE POLICY "registration_requests_insert"
  ON public.club_registration_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 마스터만 UPDATE 가능 (심사 처리)
CREATE POLICY "registration_requests_master_update"
  ON public.club_registration_requests
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS club_reg_req_user_id_idx   ON public.club_registration_requests(user_id);
CREATE INDEX IF NOT EXISTS club_reg_req_status_idx    ON public.club_registration_requests(status);
CREATE INDEX IF NOT EXISTS club_reg_req_created_at_idx ON public.club_registration_requests(created_at DESC);


-- ─────────────────────────────────────────────────────────────
-- club_join_requests
-- 기존 동아리에 운영진으로 합류 신청하는 테이블
-- 해당 동아리 기존 운영진(또는 마스터)이 승인 시 club_members 생성
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.club_join_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id     uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,

  role_title  text,     -- 희망 직책 (예: 회장, 기획팀장)
  intro       text,     -- 한 줄 소개

  status      text NOT NULL DEFAULT '대기중'
                CHECK (status IN ('대기중', '승인', '거절')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),

  -- 동일 동아리에 대기 중인 신청 중복 방지
  UNIQUE(user_id, club_id)
);

ALTER TABLE public.club_join_requests ENABLE ROW LEVEL SECURITY;

-- 신청자 본인 또는 해당 동아리 운영진 또는 마스터가 조회 가능
CREATE POLICY "join_requests_select"
  ON public.club_join_requests
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = club_join_requests.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = '운영진'
        AND club_members.status = '활동중'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

-- 본인만 INSERT 가능
CREATE POLICY "join_requests_insert"
  ON public.club_join_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 해당 동아리 운영진 또는 마스터만 UPDATE 가능 (승인/거절)
CREATE POLICY "join_requests_update"
  ON public.club_join_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.club_members
      WHERE club_members.club_id = club_join_requests.club_id
        AND club_members.user_id = auth.uid()
        AND club_members.role = '운영진'
        AND club_members.status = '활동중'
    )
    OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS club_join_req_user_id_idx  ON public.club_join_requests(user_id);
CREATE INDEX IF NOT EXISTS club_join_req_club_id_idx  ON public.club_join_requests(club_id);
CREATE INDEX IF NOT EXISTS club_join_req_status_idx   ON public.club_join_requests(status);


-- ─────────────────────────────────────────────────────────────
-- Storage: certification-docs 버킷
-- 경로 규칙: {user_id}/{파일명}
-- ─────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('certification-docs', 'certification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- 로그인된 사용자는 본인 폴더에 업로드 가능
CREATE POLICY "certification_docs_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'certification-docs'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 본인 파일 또는 마스터만 조회 가능
CREATE POLICY "certification_docs_select"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certification-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.global_admins WHERE id = auth.uid())
    )
  );

-- 본인 파일 삭제 가능
CREATE POLICY "certification_docs_delete"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'certification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
