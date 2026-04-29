| routine_name    | return_type   |
| --------------- | ------------- |
| handle_new_user | trigger       |
| is_master       | boolean       |
| rls_auto_enable | event_trigger |



| routine_name    | return_type   |
| --------------- | ------------- |
| handle_new_user | trigger       |
| is_master       | boolean       |
| rls_auto_enable | event_trigger |



| tablename                | policyname          | permissive | roles    | cmd    | qual                                                                                                                                                                                                                                                                                                                                                                 | with_check                                                                                                                                                                                                                                                              |
| ------------------------ | ------------------- | ---------- | -------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| applications             | 동아리만 지원             | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | true                                                                                                                                                                                                                                                                    |
| applications             | 전체 조회 가능            | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| attendances              | 운영진 출석 수정           | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM (club_members cm
     JOIN sessions s ON ((s.club_id = cm.club_id)))
  WHERE ((s.id = attendances.session_id) AND (cm.user_id = auth.uid()) AND (cm.role = '운영진'::text))))                                                                                                                                                                | null                                                                                                                                                                                                                                                                    |
| attendances              | 출석 등록               | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | ((auth.uid() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM (club_members cm
     JOIN sessions s ON ((s.club_id = cm.club_id)))
  WHERE ((cm.id = attendances.member_id) AND (cm.user_id = auth.uid())))))                                                                |
| attendances              | 출석 조회               | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| b2b_applications         | B2B 지원 조회           | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = b2b_applications.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text))))                                                                                                                                                                                  | null                                                                                                                                                                                                                                                                    |
| b2b_applications         | 운영진 B2B 지원 제출       | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = b2b_applications.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text))))                                                                                     |
| b2b_projects             | B2B 프로젝트 조회         | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| b2b_projects             | 기업담당자 B2B 생성        | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | ((EXISTS ( SELECT 1
   FROM corp_members
  WHERE ((corp_members.corp_id = b2b_projects.corp_id) AND (corp_members.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid()))))                                       |
| b2b_projects             | 기업담당자 B2B 수정        | PERMISSIVE | {public} | UPDATE | ((EXISTS ( SELECT 1
   FROM corp_members
  WHERE ((corp_members.corp_id = b2b_projects.corp_id) AND (corp_members.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid()))))                                                                                                                                    | null                                                                                                                                                                                                                                                                    |
| bookmarks                | 본인 북마크 조회           | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                               | null                                                                                                                                                                                                                                                                    |
| bookmarks                | 북마크 삭제              | PERMISSIVE | {public} | DELETE | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                               | null                                                                                                                                                                                                                                                                    |
| bookmarks                | 북마크 추가              | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (auth.uid() = user_id)                                                                                                                                                                                                                                                  |
| club_members             | 부원 전체 조회            | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| club_members             | 운영진 부원 수정           | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM club_members cm
  WHERE ((cm.club_id = club_members.club_id) AND (cm.user_id = auth.uid()) AND (cm.role = '운영진'::text))))                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| club_members             | 운영진 부원 추가           | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (EXISTS ( SELECT 1
   FROM club_members cm
  WHERE ((cm.club_id = club_members.club_id) AND (cm.user_id = auth.uid()) AND (cm.role = '운영진'::text))))                                                                                                                    |
| club_pages               | 동아리 페이지 전체 조회       | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| club_pages               | 운영진 페이지 수정          | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = club_pages.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text))))                                                                                                                                                                                        | null                                                                                                                                                                                                                                                                    |
| club_pages               | 운영진 페이지 저장          | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = club_pages.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text))))                                                                                           |
| clubs                    | 동아리 전체 조회           | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| clubs                    | 운영진 및 마스터 동아리 수정    | PERMISSIVE | {public} | UPDATE | (is_master() OR (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = clubs.id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text)))))                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| corp_members             | 기업 멤버 수정            | PERMISSIVE | {public} | UPDATE | ((EXISTS ( SELECT 1
   FROM corp_members cm
  WHERE ((cm.corp_id = corp_members.corp_id) AND (cm.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid()))))                                                                                                                                                     | null                                                                                                                                                                                                                                                                    |
| corp_members             | 기업 멤버 조회            | PERMISSIVE | {public} | SELECT | ((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid()))))                                                                                                                                                                                                                                                       | null                                                                                                                                                                                                                                                                    |
| corp_members             | 기업 멤버 추가            | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | ((EXISTS ( SELECT 1
   FROM corp_members cm
  WHERE ((cm.corp_id = corp_members.corp_id) AND (cm.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid()))))                                                        |
| corporations             | 기업 정보 조회            | PERMISSIVE | {public} | SELECT | ((EXISTS ( SELECT 1
   FROM corp_members
  WHERE ((corp_members.corp_id = corporations.id) AND (corp_members.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid()))))                                                                                                                                         | null                                                                                                                                                                                                                                                                    |
| corporations             | 기업담당자 정보 수정         | PERMISSIVE | {public} | UPDATE | ((EXISTS ( SELECT 1
   FROM corp_members
  WHERE ((corp_members.corp_id = corporations.id) AND (corp_members.user_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid()))))                                                                                                                                         | null                                                                                                                                                                                                                                                                    |
| event_registrations      | 본인 신청 조회            | PERMISSIVE | {public} | SELECT | (auth.uid() = user_id)                                                                                                                                                                                                                                                                                                                                               | null                                                                                                                                                                                                                                                                    |
| event_registrations      | 신청 가능               | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (auth.uid() = user_id)                                                                                                                                                                                                                                                  |
| events                   | 동아리만 생성             | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | true                                                                                                                                                                                                                                                                    |
| events                   | 전체 조회 가능            | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| global_admins            | 본인 마스터 여부 조회        | PERMISSIVE | {public} | SELECT | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                                                                    |
| posts                    | 공개 포스트 조회           | PERMISSIVE | {public} | SELECT | (is_published = true)                                                                                                                                                                                                                                                                                                                                                | null                                                                                                                                                                                                                                                                    |
| posts                    | 운영진 및 마스터 포스트 삭제    | PERMISSIVE | {public} | DELETE | (is_master() OR (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = posts.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text)))))                                                                                                                                                                            | null                                                                                                                                                                                                                                                                    |
| posts                    | 운영진 및 마스터 포스트 생성    | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (is_master() OR (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = posts.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text)))))                                                                               |
| posts                    | 운영진 및 마스터 포스트 수정    | PERMISSIVE | {public} | UPDATE | (is_master() OR (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = posts.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text)))))                                                                                                                                                                            | null                                                                                                                                                                                                                                                                    |
| posts                    | 운영진 포스트 전체조회        | PERMISSIVE | {public} | SELECT | (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = posts.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text))))                                                                                                                                                                                             | null                                                                                                                                                                                                                                                                    |
| profiles                 | profiles_admin_read | PERMISSIVE | {public} | SELECT | ((EXISTS ( SELECT 1
   FROM ((recruitment_applications ra
     JOIN recruitments r ON ((r.id = ra.recruitment_id)))
     JOIN club_members cm ON ((cm.club_id = r.club_id)))
  WHERE ((ra.user_id = profiles.id) AND (cm.user_id = auth.uid()) AND (cm.role = '운영진'::text)))) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid())))) | null                                                                                                                                                                                                                                                                    |
| profiles                 | 본인 프로필 수정 허용        | PERMISSIVE | {public} | UPDATE | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                                                                    |
| profiles                 | 본인 프로필 조회 허용        | PERMISSIVE | {public} | SELECT | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                                                                    |
| projects                 | 기업만 등록              | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (auth.uid() = corp_id)                                                                                                                                                                                                                                                  |
| projects                 | 전체 조회 가능            | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| pulse_responses          | 설문 응답 등록            | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id))                                                                                                                                                                                                                   |
| pulse_responses          | 설문 응답 조회            | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| pulse_surveys            | 설문 조회               | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| pulse_surveys            | 운영진 설문 생성           | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = pulse_surveys.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text))))                                                                                        |
| pulse_surveys            | 운영진 설문 수정           | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = pulse_surveys.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text))))                                                                                                                                                                                     | null                                                                                                                                                                                                                                                                    |
| recruitment_applications | 본인 지원 내역 조회         | PERMISSIVE | {public} | SELECT | ((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM (recruitments r
     JOIN club_members cm ON ((cm.club_id = r.club_id)))
  WHERE ((r.id = recruitment_applications.recruitment_id) AND (cm.user_id = auth.uid()) AND (cm.role = '운영진'::text)))))                                                                                                               | null                                                                                                                                                                                                                                                                    |
| recruitment_applications | 운영진 지원서 수정          | PERMISSIVE | {public} | UPDATE | ((EXISTS ( SELECT 1
   FROM (recruitments r
     JOIN club_members cm ON ((cm.club_id = r.club_id)))
  WHERE ((r.id = recruitment_applications.recruitment_id) AND (cm.user_id = auth.uid()) AND (cm.role = '운영진'::text)))) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid()))))                                                   | null                                                                                                                                                                                                                                                                    |
| recruitment_applications | 지원서 제출              | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (auth.uid() = user_id)                                                                                                                                                                                                                                                  |
| recruitments             | 공개 모집 조회            | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| recruitments             | 운영진 모집 생성           | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | ((EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = recruitments.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text)))) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid())))) |
| recruitments             | 운영진 모집 수정           | PERMISSIVE | {public} | UPDATE | ((EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = recruitments.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text)))) OR (EXISTS ( SELECT 1
   FROM global_admins
  WHERE (global_admins.id = auth.uid()))))                                                                                              | null                                                                                                                                                                                                                                                                    |
| sessions                 | 세션 조회               | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                 | null                                                                                                                                                                                                                                                                    |
| sessions                 | 운영진 세션 생성           | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = sessions.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text))))                                                                                             |
| sessions                 | 운영진 세션 수정           | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM club_members
  WHERE ((club_members.club_id = sessions.club_id) AND (club_members.user_id = auth.uid()) AND (club_members.role = '운영진'::text))))                                                                                                                                                                                          | null                                                                                                                                                                                                                                                                    |
| users                    | 본인만 삽입              | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                 | (auth.uid() = id)                                                                                                                                                                                                                                                       |
| users                    | 본인만 수정              | PERMISSIVE | {public} | UPDATE | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                                                                    |
| users                    | 본인만 조회              | PERMISSIVE | {public} | SELECT | (auth.uid() = id)                                                                                                                                                                                                                                                                                                                                                    | null                                                                                                                                                                                                                                                                    |



| table_name               |
| ------------------------ |
| applications             |
| attendances              |
| b2b_applications         |
| b2b_projects             |
| bookmarks                |
| club_members             |
| club_pages               |
| clubs                    |
| corp_members             |
| corporations             |
| event_registrations      |
| events                   |
| global_admins            |
| posts                    |
| profiles                 |
| projects                 |
| pulse_responses          |
| pulse_surveys            |
| recruitment_applications |
| recruitments             |
| sessions                 |
| users                    |
| verification_requests    |


| table_name          | column_name     | data_type                | is_nullable | column_default               | max_length |
| ------------------- | --------------- | ------------------------ | ----------- | ---------------------------- | ---------- |
| applications        | id              | uuid                     | NO          | gen_random_uuid()            | null       |
| applications        | club_id         | uuid                     | YES         | null                         | null       |
| applications        | project_id      | uuid                     | YES         | null                         | null       |
| applications        | status          | text                     | YES         | 'pending'::text              | null       |
| applications        | proposal_url    | text                     | YES         | null                         | null       |
| applications        | submitted_at    | timestamp with time zone | YES         | now()                        | null       |
| attendances         | id              | uuid                     | NO          | uuid_generate_v4()           | null       |
| attendances         | session_id      | uuid                     | NO          | null                         | null       |
| attendances         | member_id       | uuid                     | NO          | null                         | null       |
| attendances         | status          | text                     | NO          | null                         | null       |
| attendances         | recorded_at     | timestamp with time zone | NO          | timezone('utc'::text, now()) | null       |
| b2b_applications    | id              | uuid                     | NO          | uuid_generate_v4()           | null       |
| b2b_applications    | project_id      | uuid                     | NO          | null                         | null       |
| b2b_applications    | club_id         | uuid                     | NO          | null                         | null       |
| b2b_applications    | proposal_text   | text                     | YES         | null                         | null       |
| b2b_applications    | status          | text                     | YES         | '미열람'::text                  | null       |
| b2b_applications    | submitted_at    | timestamp with time zone | NO          | timezone('utc'::text, now()) | null       |
| b2b_projects        | id              | uuid                     | NO          | uuid_generate_v4()           | null       |
| b2b_projects        | corp_id         | uuid                     | NO          | null                         | null       |
| b2b_projects        | title           | text                     | NO          | null                         | null       |
| b2b_projects        | category        | text                     | NO          | null                         | null       |
| b2b_projects        | budget          | integer                  | YES         | null                         | null       |
| b2b_projects        | description     | text                     | YES         | null                         | null       |
| b2b_projects        | status          | text                     | YES         | '모집중'::text                  | null       |
| b2b_projects        | created_at      | timestamp with time zone | NO          | timezone('utc'::text, now()) | null       |
| bookmarks           | id              | uuid                     | NO          | uuid_generate_v4()           | null       |
| bookmarks           | user_id         | uuid                     | NO          | null                         | null       |
| bookmarks           | target_type     | text                     | NO          | null                         | null       |
| bookmarks           | target_id       | uuid                     | NO          | null                         | null       |
| bookmarks           | created_at      | timestamp with time zone | NO          | timezone('utc'::text, now()) | null       |
| club_members        | id              | uuid                     | NO          | uuid_generate_v4()           | null       |
| club_members        | club_id         | uuid                     | NO          | null                         | null       |
| club_members        | user_id         | uuid                     | NO          | null                         | null       |
| club_members        | role            | text                     | NO          | null                         | null       |
| club_members        | generation      | text                     | YES         | null                         | null       |
| club_members        | position        | text                     | YES         | null                         | null       |
| club_members        | status          | text                     | YES         | '활동중'::text                  | null       |
| club_members        | joined_at       | timestamp with time zone | NO          | timezone('utc'::text, now()) | null       |
| club_pages          | id              | uuid                     | NO          | uuid_generate_v4()           | null       |
| club_pages          | club_id         | uuid                     | NO          | null                         | null       |
| club_pages          | blocks          | jsonb                    | NO          | '[]'::jsonb                  | null       |
| club_pages          | published_at    | timestamp with time zone | YES         | null                         | null       |
| club_pages          | updated_at      | timestamp with time zone | NO          | timezone('utc'::text, now()) | null       |
| clubs               | id              | uuid                     | NO          | uuid_generate_v4()           | null       |
| clubs               | slug            | text                     | NO          | null                         | null       |
| clubs               | name            | text                     | NO          | null                         | null       |
| clubs               | type            | text                     | NO          | null                         | null       |
| clubs               | theme_color     | text                     | YES         | 'orange-500'::text           | null       |
| clubs               | one_line_desc   | text                     | YES         | null                         | null       |
| clubs               | description     | text                     | YES         | null                         | null       |
| clubs               | logo_url        | text                     | YES         | null                         | null       |
| clubs               | location        | text                     | YES         | null                         | null       |
| clubs               | recruit_fee     | integer                  | YES         | null                         | null       |
| clubs               | instagram_url   | text                     | YES         | null                         | null       |
| clubs               | notion_url      | text                     | YES         | null                         | null       |
| clubs               | kakao_url       | text                     | YES         | null                         | null       |
| clubs               | is_certified    | boolean                  | YES         | false                        | null       |
| clubs               | created_at      | timestamp with time zone | NO          | timezone('utc'::text, now()) | null       |
| corp_members        | id              | uuid                     | NO          | uuid_generate_v4()           | null       |
| corp_members        | corp_id         | uuid                     | NO          | null                         | null       |
| corp_members        | user_id         | uuid                     | NO          | null                         | null       |
| corp_members        | role            | text                     | YES         | '담당자'::text                  | null       |
| corporations        | id              | uuid                     | NO          | uuid_generate_v4()           | null       |
| corporations        | name            | text                     | NO          | null                         | null       |
| corporations        | business_number | text                     | YES         | null                         | null       |
| corporations        | credit_balance  | integer                  | YES         | 0                            | null       |
| corporations        | created_at      | timestamp with time zone | NO          | timezone('utc'::text, now()) | null       |
| event_registrations | id              | uuid                     | NO          | gen_random_uuid()            | null       |
| event_registrations | event_id        | uuid                     | YES         | null                         | null       |
| event_registrations | user_id         | uuid                     | YES         | null                         | null       |
| event_registrations | status          | text                     | YES         | 'registered'::text           | null       |
| event_registrations | created_at      | timestamp with time zone | YES         | now()                        | null       |
| events              | id              | uuid                     | NO          | gen_random_uuid()            | null       |
| events              | host_club_id    | uuid                     | YES         | null                         | null       |
| events              | title           | text                     | NO          | null                         | null       |
| events              | date            | timestamp with time zone | YES         | null                         | null       |
| events              | capacity        | integer                  | YES         | null                         | null       |
| events              | status          | text                     | YES         | 'open'::text                 | null       |
| events              | co_host_ids     | ARRAY                    | YES         | null                         | null       |
| events              | cover_url       | text                     | YES         | null                         | null       |
| events              | created_at      | timestamp with time zone | YES         | now()                        | null       |
| global_admins       | id              | uuid                     | NO          | null                         | null       |
| global_admins       | created_at      | timestamp with time zone | NO          | timezone('utc'::text, now()) | null       |
| posts               | id              | uuid                     | NO          | uuid_generate_v4()           | null       |
| posts               | club_id         | uuid                     | NO          | null                         | null       |
| posts               | author_id       | uuid                     | YES         | null                         | null       |
| posts               | title           | text                     | NO          | null                         | null       |
| posts               | content         | text                     | NO          | null                         | null       |
| posts               | view_count      | integer                  | YES         | 0                            | null       |
| posts               | is_published    | boolean                  | YES         | false                        | null       |
| posts               | created_at      | timestamp with time zone | NO          | timezone('utc'::text, now()) | null       |
| profiles            | id              | uuid                     | NO          | null                         | null       |
| profiles            | name            | text                     | NO          | ''::text                     | null       |
| profiles            | email           | text                     | NO          | ''::text                     | null       |
| profiles            | phone           | text                     | YES         | null                         | null       |
| profiles            | university      | text                     | YES         | null                         | null       |
| profiles            | major           | text                     | YES         | null                         | null       |
| profiles            | skills          | ARRAY                    | YES         | null                         | null       |
| profiles            | resume_url      | text                     | YES         | null                         | null       |
| profiles            | portfolio_url   | text                     | YES         | null                         | null       |

