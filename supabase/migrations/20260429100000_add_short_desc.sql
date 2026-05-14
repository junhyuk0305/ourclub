-- recruitments 테이블에 세부 설명(100자 이내) 컬럼 추가
ALTER TABLE public.recruitments
  ADD COLUMN IF NOT EXISTS short_desc text;
