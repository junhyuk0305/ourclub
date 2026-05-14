-- =============================================================
-- seed_applicants_v2.sql
-- 기존 클럽(d00f5484-e781-43e8-97cf-9edfd19fd515)에
-- 시드 모집공고 + 지원자 8명 추가
--
-- 수정 내역:
--   - pipeline_stages: ARRAY → jsonb
--   - interview_questions: ARRAY → jsonb
-- =============================================================

SET LOCAL row_security = off;

-- =============================================================
-- 1. auth.users — 가상 지원자 8명
-- =============================================================
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  aud, role, created_at, updated_at
)
VALUES
  ('a0000001-0000-0000-0000-000000000001','minjun.kim@example.com',  crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW()),
  ('a0000001-0000-0000-0000-000000000002','seoyeon.lee@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW()),
  ('a0000001-0000-0000-0000-000000000003','jiho.park@example.com',   crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW()),
  ('a0000001-0000-0000-0000-000000000004','yeeun.choi@example.com',  crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW()),
  ('a0000001-0000-0000-0000-000000000005','hyunwoo.jung@example.com',crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW()),
  ('a0000001-0000-0000-0000-000000000006','nayeon.kang@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW()),
  ('a0000001-0000-0000-0000-000000000007','dohyun.yoon@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW()),
  ('a0000001-0000-0000-0000-000000000008','sujin.lim@example.com',   crypt('password123', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, 'authenticated', 'authenticated', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 2. profiles — 지원자 프로필 (skills는 text[] 타입이므로 ARRAY[] 유지)
-- =============================================================
INSERT INTO public.profiles (id, name, email, phone, university, major, skills, portfolio_url)
VALUES
  ('a0000001-0000-0000-0000-000000000001','김민준','minjun.kim@example.com',  '010-1234-5678','한국대학교',   '컴퓨터공학과',  ARRAY['React','TypeScript','Node.js'],   'https://github.com/minjun-dev'),
  ('a0000001-0000-0000-0000-000000000002','이서연','seoyeon.lee@example.com', '010-2345-6789','서울대학교',   '소프트웨어학부',ARRAY['Python','FastAPI','PostgreSQL'],  'https://portfolio.seoyeon.dev'),
  ('a0000001-0000-0000-0000-000000000003','박지호','jiho.park@example.com',   '010-3456-7890','연세대학교',   '전산학과',      ARRAY['Java','Spring','MySQL'],          NULL),
  ('a0000001-0000-0000-0000-000000000004','최예은','yeeun.choi@example.com',  '010-4567-8901','고려대학교',   '정보통신학과',  ARRAY['Flutter','Dart','Firebase'],      'https://yeeun.notion.site'),
  ('a0000001-0000-0000-0000-000000000005','정현우','hyunwoo.jung@example.com','010-5678-9012','성균관대학교', '컴퓨터교육과',  ARRAY['Vue.js','Django','AWS'],          NULL),
  ('a0000001-0000-0000-0000-000000000006','강나연','nayeon.kang@example.com', '010-6789-0123','한양대학교',   '소프트웨어학과',ARRAY['React Native','TypeScript'],      'https://github.com/nayeon-dev'),
  ('a0000001-0000-0000-0000-000000000007','윤도현','dohyun.yoon@example.com', '010-7890-1234','서강대학교',   '컴퓨터공학과',  ARRAY['Go','Kubernetes','Docker'],       NULL),
  ('a0000001-0000-0000-0000-000000000008','임수진','sujin.lim@example.com',   '010-8901-2345','중앙대학교',   '소프트웨어학부',ARRAY['Swift','iOS','SwiftUI'],          'https://sujin.dev')
ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 3. recruitments — 실제 클럽에 모집공고 생성
--    ★ pipeline_stages: jsonb (ARRAY[] 아님)
-- =============================================================
INSERT INTO public.recruitments (
  id, club_id, title, generation, status,
  deadline, description, category,
  pipeline_stages, form_schema, deployed_form_schema
)
VALUES (
  'b0000001-0000-0000-0000-000000000001',
  'd00f5484-e781-43e8-97cf-9edfd19fd515',
  '2026년 1학기 신입 부원 모집',
  '26기',
  '진행중',
  '2026-05-31 23:59:59+09',
  '함께할 신입 부원을 모집합니다. 개발 경험이 없어도 열정만 있으면 도전하세요!',
  '개발',
  '["서류접수","서류검토","면접","최종합격"]'::jsonb,
  '[
    {"id":"q1","type":"textarea","title":"지원 동기를 알려주세요","required":true},
    {"id":"q2","type":"textarea","title":"본인의 개발 경험을 알려주세요 (없어도 괜찮아요)","required":true},
    {"id":"q3","type":"text","title":"희망 역할을 알려주세요 (예: 프론트엔드, 백엔드, 모바일)","required":false}
  ]'::jsonb,
  '[
    {"id":"q1","type":"textarea","title":"지원 동기를 알려주세요","required":true},
    {"id":"q2","type":"textarea","title":"본인의 개발 경험을 알려주세요 (없어도 괜찮아요)","required":true},
    {"id":"q3","type":"text","title":"희망 역할을 알려주세요 (예: 프론트엔드, 백엔드, 모바일)","required":false}
  ]'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 4. recruitment_applications — 지원서 8건
--    ★ interview_questions: jsonb (ARRAY[] 아님)
-- =============================================================
INSERT INTO public.recruitment_applications (
  id, recruitment_id, user_id,
  status, score, interviewer_note, interview_at,
  submitted_at, answers, interview_questions, memos
)
VALUES

  ('ab000001-0000-0000-0000-000000000001','b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001',
   '서류접수',NULL,NULL,NULL,'2026-04-27 10:30:00+09',
   '{"이름":"김민준","연락처":"010-1234-5678","지원 동기를 알려주세요":"프론트엔드 개발에 깊은 관심이 있으며 팀 프로젝트를 통해 실전 경험을 쌓고 싶어 지원했습니다.","본인의 개발 경험을 알려주세요 (없어도 괜찮아요)":"React와 TypeScript를 활용한 개인 프로젝트 3개를 진행했습니다. 최근에는 Supabase와 연동한 커뮤니티 앱을 제작했습니다.","희망 역할을 알려주세요 (예: 프론트엔드, 백엔드, 모바일)":"프론트엔드"}'::jsonb,
   '[]'::jsonb, '[]'::jsonb),

  ('ab000001-0000-0000-0000-000000000002','b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000002',
   '서류접수',NULL,NULL,NULL,'2026-04-26 14:20:00+09',
   '{"이름":"이서연","연락처":"010-2345-6789","지원 동기를 알려주세요":"백엔드 실력을 키우고 좋은 동료들과 함께 의미 있는 서비스를 만들고 싶어 지원했습니다.","본인의 개발 경험을 알려주세요 (없어도 괜찮아요)":"FastAPI와 PostgreSQL로 REST API 서버를 구축한 경험이 있고 데이터 파이프라인 프로젝트도 진행했습니다.","희망 역할을 알려주세요 (예: 프론트엔드, 백엔드, 모바일)":"백엔드"}'::jsonb,
   '[]'::jsonb, '[]'::jsonb),

  ('ab000001-0000-0000-0000-000000000003','b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000003',
   '서류검토',NULL,NULL,NULL,'2026-04-24 09:15:00+09',
   '{"이름":"박지호","연락처":"010-3456-7890","지원 동기를 알려주세요":"Java와 Spring으로 백엔드를 공부하며 실제 서비스에 기여해보고 싶습니다.","본인의 개발 경험을 알려주세요 (없어도 괜찮아요)":"Spring Boot로 게시판 CRUD API 제작 및 팀 스터디에서 리더 역할을 맡았습니다.","희망 역할을 알려주세요 (예: 프론트엔드, 백엔드, 모바일)":"백엔드"}'::jsonb,
   '[]'::jsonb,
   '[{"author":"이운영","content":"포트폴리오 없음. 스터디 리더 경험 인상적.","created_at":"2026-04-25T10:00:00+09:00"}]'::jsonb),

  ('ab000001-0000-0000-0000-000000000004','b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000004',
   '서류검토',NULL,NULL,NULL,'2026-04-23 16:45:00+09',
   '{"이름":"최예은","연락처":"010-4567-8901","지원 동기를 알려주세요":"Flutter로 크로스플랫폼 앱을 개발하고 싶고 팀에서 함께 배우며 성장하고 싶습니다.","본인의 개발 경험을 알려주세요 (없어도 괜찮아요)":"Flutter와 Firebase로 Todo 앱과 날씨 앱을 개발했습니다.","희망 역할을 알려주세요 (예: 프론트엔드, 백엔드, 모바일)":"모바일"}'::jsonb,
   '[]'::jsonb, '[]'::jsonb),

  ('ab000001-0000-0000-0000-000000000005','b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000005',
   '면접',75,'기술 이해도 보통, 협업 태도 우수. Vue 경험을 React로 전환 가능 여부 확인 필요.','2026-05-03 14:00:00+09','2026-04-22 11:00:00+09',
   '{"이름":"정현우","연락처":"010-5678-9012","지원 동기를 알려주세요":"웹 풀스택 개발자가 목표이며 다양한 기술 스택을 팀과 함께 경험해보고 싶습니다.","본인의 개발 경험을 알려주세요 (없어도 괜찮아요)":"Vue.js와 Django로 팀 프로젝트 1회 완료, AWS EC2 배포 경험 있습니다.","희망 역할을 알려주세요 (예: 프론트엔드, 백엔드, 모바일)":"풀스택"}'::jsonb,
   '["Vue.js와 React의 주요 차이점을 설명해주세요.","RESTful API 설계 원칙 3가지를 말해주세요.","팀 프로젝트에서 갈등 상황을 어떻게 해결했나요?"]'::jsonb,
   '[{"author":"김운영","content":"면접 5/3 14시 확정.","created_at":"2026-04-28T09:00:00+09:00"}]'::jsonb),

  ('ab000001-0000-0000-0000-000000000006','b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000006',
   '면접',88,'기술 역량 매우 우수, 커뮤니케이션 탁월. 출시 경험 보유.','2026-05-04 10:00:00+09','2026-04-21 13:30:00+09',
   '{"이름":"강나연","연락처":"010-6789-0123","지원 동기를 알려주세요":"React Native로 크로스플랫폼 앱을 개발해왔고 더 큰 팀에서 협업하며 성장하고 싶습니다.","본인의 개발 경험을 알려주세요 (없어도 괜찮아요)":"React Native로 출시된 앱 1개 개발에 참여했으며 TypeScript 기반 설계와 성능 최적화 경험이 있습니다.","희망 역할을 알려주세요 (예: 프론트엔드, 백엔드, 모바일)":"모바일 / 프론트엔드"}'::jsonb,
   '["React와 React Native의 공통점과 차이점은?","앱 성능 최적화 기법을 소개해주세요.","가장 자랑스러운 프로젝트를 소개해주세요."]'::jsonb,
   '[{"author":"이운영","content":"포트폴리오 매우 인상적. 적극 추천.","created_at":"2026-04-24T15:00:00+09:00"},{"author":"김운영","content":"면접 5/4 10시 확정.","created_at":"2026-04-28T09:05:00+09:00"}]'::jsonb),

  ('ab000001-0000-0000-0000-000000000007','b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000007',
   '최종합격',92,'DevOps + 백엔드 역량 탁월. 마이크로서비스 실무 경험 보유.','2026-04-30 15:00:00+09','2026-04-20 09:00:00+09',
   '{"이름":"윤도현","연락처":"010-7890-1234","지원 동기를 알려주세요":"클라우드 인프라와 백엔드를 결합한 실전 프로젝트를 팀과 함께 해보고 싶어 지원했습니다.","본인의 개발 경험을 알려주세요 (없어도 괜찮아요)":"Go와 Kubernetes로 마이크로서비스 프로젝트 참여, Docker 컨테이너화 및 CI/CD 파이프라인 구축 경험.","희망 역할을 알려주세요 (예: 프론트엔드, 백엔드, 모바일)":"DevOps / 백엔드"}'::jsonb,
   '["마이크로서비스와 모놀리식 장단점 비교","Kubernetes Pod/Deployment/Service 개념 설명","장애 시 대응 방법"]'::jsonb,
   '[{"author":"김운영","content":"서류부터 탁월. 빠른 합격 처리 추천.","created_at":"2026-04-22T10:00:00+09:00"},{"author":"이운영","content":"최종합격 처리.","created_at":"2026-05-01T11:00:00+09:00"}]'::jsonb),

  ('ab000001-0000-0000-0000-000000000008','b0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000008',
   '서류검토',NULL,NULL,NULL,'2026-04-25 17:30:00+09',
   '{"이름":"임수진","연락처":"010-8901-2345","지원 동기를 알려주세요":"iOS 개발에 집중하고 싶고 팀 프로젝트를 통해 협업 경험을 쌓고 싶습니다.","본인의 개발 경험을 알려주세요 (없어도 괜찮아요)":"Swift와 SwiftUI로 개인 앱 2개를 App Store에 출시, 누적 다운로드 500회.","희망 역할을 알려주세요 (예: 프론트엔드, 백엔드, 모바일)":"iOS"}'::jsonb,
   '[]'::jsonb,
   '[{"author":"이운영","content":"iOS 실력 뛰어나지만 현재 팀에 iOS 프로젝트 없어 고민됨.","created_at":"2026-04-26T11:00:00+09:00"}]'::jsonb)

ON CONFLICT (id) DO NOTHING;

-- =============================================================
-- 확인 쿼리
-- =============================================================
SELECT
  ra.status      AS 단계,
  COUNT(*)       AS 지원자수,
  STRING_AGG(p.name, ', ' ORDER BY ra.submitted_at DESC) AS 이름목록
FROM public.recruitment_applications ra
LEFT JOIN public.profiles p ON p.id = ra.user_id
WHERE ra.recruitment_id = 'b0000001-0000-0000-0000-000000000001'
GROUP BY ra.status
ORDER BY MIN(ra.submitted_at);
