-- club-pages Storage 버킷 생성 (이미 있으면 무시)
-- 용도: 동아리 홈페이지 빌더 이미지(ImageUploader) + 리크루팅 페이지 이미지(RecruitPageBuilder)
--       + 공개 지원서 첨부파일(ClubApply, applications/ 폴더)
-- public 버킷이라 getPublicUrl 로 바로 노출. mime 제한은 클라이언트에서 처리
-- (지원서 첨부는 PDF·문서도 허용해야 하므로 버킷 레벨 mime 제한은 두지 않음).
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('club-pages', 'club-pages', true, 10485760)  -- 10MB
ON CONFLICT (id) DO NOTHING;

-- 조회: 누구나 (public bucket)
CREATE POLICY "club-pages 공개 조회"
ON storage.objects FOR SELECT
USING (bucket_id = 'club-pages');

-- 업로드: 누구나 (운영진 빌더 이미지 + 비로그인 지원자 첨부)
CREATE POLICY "club-pages 업로드"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'club-pages');

-- 수정(upsert 덮어쓰기): 로그인 사용자만
CREATE POLICY "club-pages 수정"
ON storage.objects FOR UPDATE
USING (bucket_id = 'club-pages' AND auth.uid() IS NOT NULL);

-- 삭제: 로그인 사용자만
CREATE POLICY "club-pages 삭제"
ON storage.objects FOR DELETE
USING (bucket_id = 'club-pages' AND auth.uid() IS NOT NULL);
