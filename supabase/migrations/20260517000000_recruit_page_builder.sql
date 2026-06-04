-- Phase 5: 채용 메인 페이지 빌더
-- 1) clubs.recruit_page JSONB 컬럼 추가 - 채용 홈 섹션 설정 저장
-- 2) club_reviews 테이블 - 잡플래닛 스타일 후기·평점

-- ── 1) clubs.recruit_page 컬럼 ───────────────────────────────────────────
ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS recruit_page jsonb;

COMMENT ON COLUMN clubs.recruit_page IS
  '채용 홈 페이지 섹션 설정 (hero/recruitments/story/reviews/faq + brand_color)';

-- ── 2) club_reviews 테이블 ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS club_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating      int  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title       text NOT NULL,
  body        text NOT NULL,
  generation  text,                 -- 몇 기 지원이었는지 (예: 24기)
  result      text,                 -- 합격 / 불합격 / 지원포기 등
  is_published boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (club_id, user_id, generation)
);

CREATE INDEX IF NOT EXISTS idx_club_reviews_club_id ON club_reviews(club_id);
CREATE INDEX IF NOT EXISTS idx_club_reviews_published ON club_reviews(club_id, is_published);

ALTER TABLE club_reviews ENABLE ROW LEVEL SECURITY;

-- 공개 후기 누구나 조회
DROP POLICY IF EXISTS "공개 후기 조회" ON club_reviews;
CREATE POLICY "공개 후기 조회"
ON club_reviews FOR SELECT
USING (
  is_published = true
  OR user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = club_reviews.club_id
      AND cm.user_id = auth.uid()
      AND cm.role = '운영진'
  )
);

-- 로그인 사용자는 자신의 후기 작성
DROP POLICY IF EXISTS "로그인 사용자 후기 작성" ON club_reviews;
CREATE POLICY "로그인 사용자 후기 작성"
ON club_reviews FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 본인 후기 수정/삭제
DROP POLICY IF EXISTS "본인 후기 수정" ON club_reviews;
CREATE POLICY "본인 후기 수정"
ON club_reviews FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "본인 후기 삭제" ON club_reviews;
CREATE POLICY "본인 후기 삭제"
ON club_reviews FOR DELETE
USING (auth.uid() = user_id);

-- 운영진은 자기 동아리 후기 노출 토글 (UPDATE)
DROP POLICY IF EXISTS "운영진 후기 노출 관리" ON club_reviews;
CREATE POLICY "운영진 후기 노출 관리"
ON club_reviews FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = club_reviews.club_id
      AND cm.user_id = auth.uid()
      AND cm.role = '운영진'
  )
);
