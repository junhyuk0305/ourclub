-- club_alerts: 사용자가 특정 동아리의 모집 알림을 구독하는 테이블
CREATE TABLE IF NOT EXISTS club_alerts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  club_id    uuid NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, club_id)
);

-- RLS 활성화
ALTER TABLE club_alerts ENABLE ROW LEVEL SECURITY;

-- 자신의 알림만 조회/추가/삭제 가능
CREATE POLICY "club_alerts_owner_all"
  ON club_alerts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 인덱스 (user_id 기준 조회 최적화)
CREATE INDEX IF NOT EXISTS club_alerts_user_id_idx ON club_alerts(user_id);
CREATE INDEX IF NOT EXISTS club_alerts_club_id_idx ON club_alerts(club_id);
