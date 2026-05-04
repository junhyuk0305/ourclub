-- posts 테이블에 author text 컬럼 추가
-- author_id(uuid)와 별개로, 운영진이 자유롭게 입력하는 표시용 이름(예: "기획팀", "운영진")
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS author text;
1