-- =========================================================
-- Supabase Schema for OURCLUB — 초기화 후 재생성
-- =========================================================

-- ==========================================
-- 0. 기존 테이블 전체 DROP (초기화)
-- ==========================================
DROP TABLE IF EXISTS public.bookmarks           CASCADE;
DROP TABLE IF EXISTS public.b2b_applications    CASCADE;
DROP TABLE IF EXISTS public.b2b_projects        CASCADE;
DROP TABLE IF EXISTS public.corp_members        CASCADE;
DROP TABLE IF EXISTS public.corporations        CASCADE;
DROP TABLE IF EXISTS public.global_admins       CASCADE;
DROP TABLE IF EXISTS public.posts               CASCADE;
DROP TABLE IF EXISTS public.pulse_responses     CASCADE;
DROP TABLE IF EXISTS public.pulse_surveys       CASCADE;
DROP TABLE IF EXISTS public.attendances         CASCADE;
DROP TABLE IF EXISTS public.sessions            CASCADE;
DROP TABLE IF EXISTS public.recruitment_applications CASCADE;
DROP TABLE IF EXISTS public.recruitments        CASCADE;
DROP TABLE IF EXISTS public.club_pages          CASCADE;
DROP TABLE IF EXISTS public.club_members        CASCADE;
DROP TABLE IF EXISTS public.clubs               CASCADE;
DROP TABLE IF EXISTS public.profiles            CASCADE;

-- UUID 자동 생성 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. 사용자 프로필 (auth.users 와 1:1 매핑)
-- ==========================================
CREATE TABLE public.profiles (
  id            uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  name          text NOT NULL DEFAULT '',
  email         text UNIQUE NOT NULL DEFAULT '',
  phone         text,
  university    text,
  major         text,
  skills        text[],
  resume_url    text,
  portfolio_url text,
  created_at    timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

-- 신규 유저 가입 시 profiles 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 프로필 조회 허용"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "본인 프로필 수정 허용"  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ==========================================
-- 1.5. 시스템 관리자 (마스터 계정)
-- ==========================================
CREATE TABLE public.global_admins (
  id         uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.global_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 마스터 여부 조회" ON public.global_admins FOR SELECT USING (auth.uid() = id);

-- ==========================================
-- 2. 동아리 & 운영진
-- ==========================================
CREATE TABLE public.clubs (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug          text UNIQUE NOT NULL,
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('연합 동아리', '교내 동아리', '학회/프로젝트팀')),
  theme_color   text DEFAULT 'orange-500',
  one_line_desc text,
  description   text,                        -- 상세 소개 (Markdown)
  logo_url      text,                        -- 로고 이미지 URL
  location      text,                        -- 활동 장소 (예: '매주 토요일 신촌')
  recruit_fee   integer,                     -- 회비 (원)
  instagram_url text,
  notion_url    text,
  kakao_url     text,
  is_certified  boolean DEFAULT false,
  created_at    timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE public.club_members (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id    uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role       text NOT NULL CHECK (role IN ('운영진', '부원')),
  generation text,
  position   text,
  status     text DEFAULT '활동중' CHECK (status IN ('활동중', '수료', '탈퇴', '활동정지')),
  joined_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(club_id, user_id)
);

ALTER TABLE public.clubs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "동아리 전체 조회"   ON public.clubs FOR SELECT USING (true);
CREATE POLICY "운영진 동아리 수정"  ON public.clubs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = clubs.id AND user_id = auth.uid() AND role = '운영진'
  ));

CREATE POLICY "부원 전체 조회"     ON public.club_members FOR SELECT USING (true);
CREATE POLICY "운영진 부원 추가"   ON public.club_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.club_members cm
    WHERE cm.club_id = club_members.club_id AND cm.user_id = auth.uid() AND cm.role = '운영진'
  ));
CREATE POLICY "운영진 부원 수정"   ON public.club_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.club_members cm
    WHERE cm.club_id = club_members.club_id AND cm.user_id = auth.uid() AND cm.role = '운영진'
  ));

-- ==========================================
-- 3. 웹빌더 & 리크루팅
-- ==========================================
CREATE TABLE public.club_pages (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id      uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  blocks       jsonb NOT NULL DEFAULT '[]',
  published_at timestamp with time zone,
  updated_at   timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.club_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "동아리 페이지 전체 조회" ON public.club_pages FOR SELECT USING (true);
CREATE POLICY "운영진 페이지 저장"      ON public.club_pages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = club_pages.club_id AND user_id = auth.uid() AND role = '운영진'
  ));
CREATE POLICY "운영진 페이지 수정"      ON public.club_pages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = club_pages.club_id AND user_id = auth.uid() AND role = '운영진'
  ));

CREATE TABLE public.recruitments (
  id             uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id        uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  title          text NOT NULL,
  generation     text,                        -- '14기'
  max_applicants integer,
  form_schema    jsonb NOT NULL DEFAULT '[]',
  status         text DEFAULT '모집중' CHECK (status IN ('준비중', '모집중', '마감')),
  deadline       timestamp with time zone,
  created_at     timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE public.recruitment_applications (
  id               uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  recruitment_id   uuid REFERENCES public.recruitments(id) ON DELETE CASCADE NOT NULL,
  user_id          uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  answers          jsonb NOT NULL DEFAULT '{}',
  -- 운영진 평가 필드
  status           text DEFAULT '서류심사' CHECK (status IN ('서류심사', '면접', '최종합격', '불합격')),
  score            integer CHECK (score BETWEEN 0 AND 100),
  interviewer_note text,
  interview_at     timestamp with time zone,
  submitted_at     timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(recruitment_id, user_id)
);

ALTER TABLE public.recruitments              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_applications  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "공개 모집 조회"      ON public.recruitments FOR SELECT USING (true);
CREATE POLICY "운영진 모집 생성"    ON public.recruitments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = recruitments.club_id AND user_id = auth.uid() AND role = '운영진'
  ));
CREATE POLICY "운영진 모집 수정"    ON public.recruitments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = recruitments.club_id AND user_id = auth.uid() AND role = '운영진'
  ));

CREATE POLICY "본인 지원 내역 조회" ON public.recruitment_applications FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.recruitments r
      JOIN public.club_members cm ON cm.club_id = r.club_id
      WHERE r.id = recruitment_applications.recruitment_id
        AND cm.user_id = auth.uid() AND cm.role = '운영진'
    )
  );
CREATE POLICY "지원서 제출"         ON public.recruitment_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "운영진 지원서 수정"  ON public.recruitment_applications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.recruitments r
    JOIN public.club_members cm ON cm.club_id = r.club_id
    WHERE r.id = recruitment_applications.recruitment_id
      AND cm.user_id = auth.uid() AND cm.role = '운영진'
  ));

-- ==========================================
-- 4. 출석 관리 & Pulse Check
-- ==========================================
CREATE TABLE public.sessions (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id         uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  title           text NOT NULL,
  attendance_code text NOT NULL,
  expires_at      timestamp with time zone,
  created_at      timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE public.attendances (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id  uuid REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
  member_id   uuid REFERENCES public.club_members(id) ON DELETE CASCADE NOT NULL,
  status      text NOT NULL CHECK (status IN ('출석', '지각', '결석')),
  recorded_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(session_id, member_id)
);

CREATE TABLE public.pulse_surveys (
  id         uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id    uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  title      text NOT NULL,
  status     text DEFAULT '진행중' CHECK (status IN ('진행중', '종료')),
  created_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE public.pulse_responses (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  survey_id    uuid REFERENCES public.pulse_surveys(id) ON DELETE CASCADE NOT NULL,
  user_id      uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score        integer CHECK (score BETWEEN 1 AND 5),
  feedback     text,
  submitted_at timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(survey_id, user_id)
);

ALTER TABLE public.sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_surveys  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pulse_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "세션 조회"        ON public.sessions FOR SELECT USING (true);
CREATE POLICY "운영진 세션 생성" ON public.sessions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = sessions.club_id AND user_id = auth.uid() AND role = '운영진'
  ));
CREATE POLICY "운영진 세션 수정" ON public.sessions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = sessions.club_id AND user_id = auth.uid() AND role = '운영진'
  ));

CREATE POLICY "출석 조회"        ON public.attendances FOR SELECT USING (true);
CREATE POLICY "출석 등록"        ON public.attendances FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.club_members cm
      JOIN public.sessions s ON s.club_id = cm.club_id
      WHERE cm.id = attendances.member_id AND cm.user_id = auth.uid()
    )
  );
CREATE POLICY "운영진 출석 수정" ON public.attendances FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.club_members cm
    JOIN public.sessions s ON s.club_id = cm.club_id
    WHERE s.id = attendances.session_id AND cm.user_id = auth.uid() AND cm.role = '운영진'
  ));

CREATE POLICY "설문 조회"        ON public.pulse_surveys FOR SELECT USING (true);
CREATE POLICY "운영진 설문 생성" ON public.pulse_surveys FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = pulse_surveys.club_id AND user_id = auth.uid() AND role = '운영진'
  ));
CREATE POLICY "운영진 설문 수정" ON public.pulse_surveys FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = pulse_surveys.club_id AND user_id = auth.uid() AND role = '운영진'
  ));

CREATE POLICY "설문 응답 등록"   ON public.pulse_responses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "설문 응답 조회"   ON public.pulse_responses FOR SELECT USING (true);

-- ==========================================
-- 5. 콘텐츠 및 스토리
-- ==========================================
CREATE TABLE public.posts (
  id           uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  club_id      uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  author_id    uuid REFERENCES public.club_members(id) ON DELETE SET NULL,
  title        text NOT NULL,
  content      text NOT NULL,
  view_count   integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at   timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "공개 포스트 조회"  ON public.posts FOR SELECT USING (is_published = true);
CREATE POLICY "운영진 포스트 전체조회" ON public.posts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = posts.club_id AND user_id = auth.uid() AND role = '운영진'
  ));
CREATE POLICY "운영진 포스트 생성" ON public.posts FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = posts.club_id AND user_id = auth.uid() AND role = '운영진'
  ));
CREATE POLICY "운영진 포스트 수정" ON public.posts FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = posts.club_id AND user_id = auth.uid() AND role = '운영진'
  ));
CREATE POLICY "운영진 포스트 삭제" ON public.posts FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = posts.club_id AND user_id = auth.uid() AND role = '운영진'
  ));

-- ==========================================
-- 6. 기업 파트너 & B2B
-- ==========================================
CREATE TABLE public.corporations (
  id              uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name            text NOT NULL,
  business_number text,
  credit_balance  integer DEFAULT 0,
  created_at      timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE public.corp_members (
  id      uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  corp_id uuid REFERENCES public.corporations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role    text DEFAULT '담당자',
  UNIQUE(corp_id, user_id)
);

CREATE TABLE public.b2b_projects (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  corp_id     uuid REFERENCES public.corporations(id) ON DELETE CASCADE NOT NULL,
  title       text NOT NULL,
  category    text NOT NULL,
  budget      integer,
  description text,
  status      text DEFAULT '모집중' CHECK (status IN ('모집중', '진행중', '완료')),
  created_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL
);

CREATE TABLE public.b2b_applications (
  id            uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id    uuid REFERENCES public.b2b_projects(id) ON DELETE CASCADE NOT NULL,
  club_id       uuid REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
  proposal_text text,
  status        text DEFAULT '미열람' CHECK (status IN ('미열람', '검토중', '미팅요청', '매칭완료', '거절')),
  submitted_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(project_id, club_id)
);

ALTER TABLE public.corporations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corp_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.b2b_applications ENABLE ROW LEVEL SECURITY;

-- corporations 정책
CREATE POLICY "기업 정보 조회" ON public.corporations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.corp_members
    WHERE corp_id = corporations.id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.global_admins WHERE id = auth.uid()
  )
);
CREATE POLICY "기업담당자 정보 수정" ON public.corporations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.corp_members
    WHERE corp_id = corporations.id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.global_admins WHERE id = auth.uid()
  ));

-- corp_members 정책
CREATE POLICY "기업 멤버 조회" ON public.corp_members FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.corp_members cm
    WHERE cm.corp_id = corp_members.corp_id AND cm.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.global_admins WHERE id = auth.uid()
  )
);
CREATE POLICY "기업 멤버 추가" ON public.corp_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.corp_members cm
      WHERE cm.corp_id = corp_members.corp_id AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.global_admins WHERE id = auth.uid()
    )
  );
CREATE POLICY "기업 멤버 수정" ON public.corp_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.corp_members cm
      WHERE cm.corp_id = corp_members.corp_id AND cm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.global_admins WHERE id = auth.uid()
    )
  );

CREATE POLICY "B2B 프로젝트 조회"  ON public.b2b_projects FOR SELECT USING (true);
CREATE POLICY "기업담당자 B2B 생성" ON public.b2b_projects FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.corp_members
    WHERE corp_id = b2b_projects.corp_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.global_admins WHERE id = auth.uid()
  ));
CREATE POLICY "기업담당자 B2B 수정" ON public.b2b_projects FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.corp_members
    WHERE corp_id = b2b_projects.corp_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.global_admins WHERE id = auth.uid()
  ));

CREATE POLICY "B2B 지원 조회"      ON public.b2b_applications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = b2b_applications.club_id AND user_id = auth.uid() AND role = '운영진'
  ));
CREATE POLICY "운영진 B2B 지원 제출" ON public.b2b_applications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.club_members
    WHERE club_id = b2b_applications.club_id AND user_id = auth.uid() AND role = '운영진'
  ));

-- ==========================================
-- 7. 북마크 (스크랩)
-- ==========================================
CREATE TABLE public.bookmarks (
  id          uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('CLUB', 'B2B_PROJECT', 'POST')),
  target_id   uuid NOT NULL,
  created_at  timestamp with time zone DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, target_type, target_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "본인 북마크 조회" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "북마크 추가"      ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "북마크 삭제"      ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);
