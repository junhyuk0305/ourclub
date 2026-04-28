-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  club_id uuid,
  project_id uuid,
  status text DEFAULT 'pending'::text,
  proposal_url text,
  submitted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.attendances (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  member_id uuid NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['출석'::text, '지각'::text, '결석'::text])),
  recorded_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT attendances_pkey PRIMARY KEY (id),
  CONSTRAINT attendances_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT attendances_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.club_members(id)
);
CREATE TABLE public.b2b_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  club_id uuid NOT NULL,
  proposal_text text,
  status text DEFAULT '미열람'::text CHECK (status = ANY (ARRAY['미열람'::text, '검토중'::text, '미팅요청'::text, '매칭완료'::text, '거절'::text])),
  submitted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT b2b_applications_pkey PRIMARY KEY (id),
  CONSTRAINT b2b_applications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.b2b_projects(id),
  CONSTRAINT b2b_applications_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id)
);
CREATE TABLE public.b2b_projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  corp_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  budget integer,
  description text,
  status text DEFAULT '모집중'::text CHECK (status = ANY (ARRAY['모집중'::text, '진행중'::text, '완료'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT b2b_projects_pkey PRIMARY KEY (id),
  CONSTRAINT b2b_projects_corp_id_fkey FOREIGN KEY (corp_id) REFERENCES public.corporations(id)
);
CREATE TABLE public.bookmarks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type = ANY (ARRAY['CLUB'::text, 'B2B_PROJECT'::text, 'POST'::text])),
  target_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.club_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  club_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['운영진'::text, '부원'::text])),
  generation text,
  position text,
  status text DEFAULT '활동중'::text CHECK (status = ANY (ARRAY['활동중'::text, '수료'::text, '탈퇴'::text, '활동정지'::text])),
  joined_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT club_members_pkey PRIMARY KEY (id),
  CONSTRAINT club_members_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
  CONSTRAINT club_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.club_pages (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  club_id uuid NOT NULL,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT club_pages_pkey PRIMARY KEY (id),
  CONSTRAINT club_pages_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id)
);
CREATE TABLE public.clubs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['연합 동아리'::text, '교내 동아리'::text, '학회/프로젝트팀'::text])),
  theme_color text DEFAULT 'orange-500'::text,
  one_line_desc text,
  description text,
  logo_url text,
  location text,
  recruit_fee integer,
  instagram_url text,
  notion_url text,
  kakao_url text,
  is_certified boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT clubs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.corp_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  corp_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT '담당자'::text,
  CONSTRAINT corp_members_pkey PRIMARY KEY (id),
  CONSTRAINT corp_members_corp_id_fkey FOREIGN KEY (corp_id) REFERENCES public.corporations(id),
  CONSTRAINT corp_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.corporations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  business_number text,
  credit_balance integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT corporations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.event_registrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid,
  user_id uuid,
  status text DEFAULT 'registered'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_registrations_pkey PRIMARY KEY (id),
  CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id),
  CONSTRAINT event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  host_club_id uuid,
  title text NOT NULL,
  date timestamp with time zone,
  capacity integer,
  status text DEFAULT 'open'::text,
  co_host_ids ARRAY,
  cover_url text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.global_admins (
  id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT global_admins_pkey PRIMARY KEY (id),
  CONSTRAINT global_admins_id_fkey FOREIGN KEY (id) REFERENCES public.profiles(id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  club_id uuid NOT NULL,
  author_id uuid,
  title text NOT NULL,
  content text NOT NULL,
  view_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id),
  CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.club_members(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text NOT NULL DEFAULT ''::text,
  email text NOT NULL DEFAULT ''::text UNIQUE,
  phone text,
  university text,
  major text,
  skills ARRAY,
  resume_url text,
  portfolio_url text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  corp_id uuid,
  title text NOT NULL,
  description text,
  budget integer,
  deadline date,
  status text DEFAULT 'open'::text,
  tags ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_corp_id_fkey FOREIGN KEY (corp_id) REFERENCES public.users(id)
);
CREATE TABLE public.pulse_responses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  survey_id uuid NOT NULL,
  user_id uuid NOT NULL,
  score integer CHECK (score >= 1 AND score <= 5),
  feedback text,
  submitted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT pulse_responses_pkey PRIMARY KEY (id),
  CONSTRAINT pulse_responses_survey_id_fkey FOREIGN KEY (survey_id) REFERENCES public.pulse_surveys(id),
  CONSTRAINT pulse_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.pulse_surveys (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  club_id uuid NOT NULL,
  title text NOT NULL,
  status text DEFAULT '진행중'::text CHECK (status = ANY (ARRAY['진행중'::text, '종료'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT pulse_surveys_pkey PRIMARY KEY (id),
  CONSTRAINT pulse_surveys_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id)
);
CREATE TABLE public.recruitment_applications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  recruitment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text DEFAULT '서류심사'::text CHECK (status = ANY (ARRAY['서류심사'::text, '면접'::text, '최종합격'::text, '불합격'::text])),
  score integer CHECK (score >= 0 AND score <= 100),
  interviewer_note text,
  interview_at timestamp with time zone,
  submitted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT recruitment_applications_pkey PRIMARY KEY (id),
  CONSTRAINT recruitment_applications_recruitment_id_fkey FOREIGN KEY (recruitment_id) REFERENCES public.recruitments(id),
  CONSTRAINT recruitment_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.recruitments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  club_id uuid NOT NULL,
  title text NOT NULL,
  generation text,
  max_applicants integer,
  form_schema jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text DEFAULT '모집중'::text CHECK (status = ANY (ARRAY['준비중'::text, '모집중'::text, '마감'::text])),
  deadline timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT recruitments_pkey PRIMARY KEY (id),
  CONSTRAINT recruitments_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id)
);
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  club_id uuid NOT NULL,
  title text NOT NULL,
  attendance_code text NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_club_id_fkey FOREIGN KEY (club_id) REFERENCES public.clubs(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  role text NOT NULL DEFAULT 'student'::text,
  name text,
  phone text,
  school text,
  major text,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  email text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.verification_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  club_id uuid NOT NULL,
  status text DEFAULT 'pending'::text,
  answers jsonb DEFAULT '{}'::jsonb,
  reviewer_note text,
  submitted_at timestamp with time zone DEFAULT now(),
  reviewed_at timestamp with time zone,
  CONSTRAINT verification_requests_pkey PRIMARY KEY (id)
);