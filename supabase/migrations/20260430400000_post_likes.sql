-- posts 테이블에 like_count 컬럼 추가
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;

-- post_likes 테이블: 사용자별 좋아요 추적 (중복 방지)
CREATE TABLE IF NOT EXISTS post_likes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT timezone('utc', now()),
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- 누구나 좋아요 조회 가능
CREATE POLICY "좋아요 전체 조회"
ON post_likes FOR SELECT
USING (true);

-- 로그인 사용자만 좋아요 등록 가능
CREATE POLICY "로그인 사용자 좋아요 등록"
ON post_likes FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- 본인 좋아요만 취소 가능
CREATE POLICY "본인 좋아요 취소"
ON post_likes FOR DELETE
USING (auth.uid() = user_id);

-- 트리거: post_likes 변경 시 posts의 like_count 자동 업데이트
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS post_likes_count_trigger ON post_likes;
CREATE TRIGGER post_likes_count_trigger
AFTER INSERT OR DELETE ON post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_like_count();
