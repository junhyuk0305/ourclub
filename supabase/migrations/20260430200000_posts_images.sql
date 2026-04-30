-- posts 테이블에 images 컬럼 추가 (최대 3개 이미지 URL 저장)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- post-images Storage 버킷 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책: 운영진만 업로드 가능
CREATE POLICY "운영진 포스트 이미지 업로드"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images'
  AND auth.uid() IS NOT NULL
);

-- Storage 정책: 누구나 조회 가능 (public bucket)
CREATE POLICY "포스트 이미지 공개 조회"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

-- Storage 정책: 업로드한 본인만 삭제 가능
CREATE POLICY "포스트 이미지 삭제"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images'
  AND auth.uid() IS NOT NULL
);

-- posts 운영진 조회 정책 보완 (임시저장 포스트도 본인 동아리 운영진은 조회 가능)
DROP POLICY IF EXISTS "공개 포스트 조회" ON posts;

CREATE POLICY "공개 포스트 조회"
ON posts FOR SELECT
USING (
  is_published = true
  OR EXISTS (
    SELECT 1 FROM club_members cm
    WHERE cm.club_id = posts.club_id
      AND cm.user_id = auth.uid()
      AND cm.role = '운영진'
  )
  OR EXISTS (SELECT 1 FROM global_admins WHERE id = auth.uid())
);
