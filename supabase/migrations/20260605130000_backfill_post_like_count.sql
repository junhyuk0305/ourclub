-- posts.like_count 백필: post_likes 실제 행 수로 재계산.
-- 배경: StoryDetail이 트리거(post_likes_count_trigger) 위에 수동 update를 한 번 더 해서
-- 과거 좋아요가 +2/−2로 이중 집계됨(20260605 코드 수정으로 신규는 정상화). 기존 값만 1회 보정.
-- 멱등: post_likes를 단일 출처로 다시 세므로 몇 번 돌려도 결과 동일.
UPDATE posts p
SET like_count = COALESCE((
  SELECT count(*) FROM post_likes pl WHERE pl.post_id = p.id
), 0)
WHERE p.like_count IS DISTINCT FROM COALESCE((
  SELECT count(*) FROM post_likes pl WHERE pl.post_id = p.id
), 0);
