-- 모집 공고 상태 라벨 통일: '모집중' → '진행중'
-- 배경: 발행 코드(FormTab)는 status='진행중'을 쓰는데 DB 기본값과 일부 집계는 '모집중'을 써서
--       대시보드 '모집중 지원자' 카운트가 항상 0이 되는 등 상태 라벨이 혼용됨.
--       (주의: b2b_projects.status 의 '모집중'은 별개 도메인 — 변경하지 않음.)

ALTER TABLE recruitments ALTER COLUMN status SET DEFAULT '진행중';

UPDATE recruitments SET status = '진행중' WHERE status = '모집중';
