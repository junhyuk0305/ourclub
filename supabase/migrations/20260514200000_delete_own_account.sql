-- profiles에 deleted_at 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- 회원 탈퇴 함수: 프로필 익명화 + 활동 중 멤버십 탈퇴 처리
CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 프로필 PII 익명화
  UPDATE profiles SET
    name         = '탈퇴한 회원',
    phone        = NULL,
    university   = NULL,
    major        = NULL,
    skills       = NULL,
    resume_url   = NULL,
    portfolio_url = NULL,
    deleted_at   = NOW()
  WHERE id = auth.uid();

  -- 활동 중인 동아리 멤버십 탈퇴 처리
  UPDATE club_members
  SET status = '탈퇴'
  WHERE user_id = auth.uid() AND status = '활동중';
END;
$$;

GRANT EXECUTE ON FUNCTION delete_own_account() TO authenticated;
