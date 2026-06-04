-- Phase B: 리크루팅 최종합격 → 부원 자동 추가 트리거
-- recruitment_applications.status 가 recruitments.pipeline_stages 의 마지막 단계로 변경되면
-- 해당 user_id 를 club_members 에 자동 insert (이미 있으면 무시).
-- SECURITY DEFINER 로 RLS 우회 (지원자 자신이 club_members 에 insert 권한 없을 수 있음).

CREATE OR REPLACE FUNCTION public.promote_applicant_to_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_stage text;
  v_club_id    uuid;
BEGIN
  -- 변경 없으면 종료 (UPDATE 시)
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS NULL THEN
    RETURN NEW;
  END IF;

  -- 공고의 최종 stage + club_id 조회
  SELECT
    pipeline_stages ->> (jsonb_array_length(pipeline_stages) - 1),
    club_id
  INTO v_last_stage, v_club_id
  FROM public.recruitments
  WHERE id = NEW.recruitment_id
    AND jsonb_typeof(pipeline_stages) = 'array'
    AND jsonb_array_length(pipeline_stages) > 0;

  -- 최종 stage 일치 시 club_members 에 추가 (중복 방지)
  IF v_last_stage IS NOT NULL
     AND NEW.status = v_last_stage
     AND v_club_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.club_members
      WHERE user_id = NEW.user_id
        AND club_id = v_club_id
    ) THEN
      INSERT INTO public.club_members (user_id, club_id, role, status)
      VALUES (NEW.user_id, v_club_id, '부원', '활동중');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.promote_applicant_to_member() IS
  '지원자 status 가 공고 파이프라인의 마지막 단계가 되면 자동으로 club_members 에 추가';

DROP TRIGGER IF EXISTS promote_applicant_on_final_status ON public.recruitment_applications;
CREATE TRIGGER promote_applicant_on_final_status
  AFTER INSERT OR UPDATE OF status ON public.recruitment_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_applicant_to_member();
