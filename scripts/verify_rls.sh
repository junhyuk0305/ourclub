#!/usr/bin/env bash
# RLS 보안 수정 검증 — anon(비로그인) 키로 민감 테이블 노출 여부 확인.
# 사용: bash scripts/verify_rls.sh
# 기대(수정 적용 후): club_members / sessions / attendances = []  (빈 배열)
#                     clubs = 데이터 있음 (의도된 공개 — 차단되면 안 됨)
set -euo pipefail
cd "$(dirname "$0")/.."

URL=$(grep VITE_SUPABASE_URL .env | cut -d= -f2- | tr -d '"\r')
KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d= -f2- | tr -d '"\r')

probe() { # $1=라벨 $2=쿼리경로
  local body
  body=$(curl -s "$URL/rest/v1/$2" -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
  if [ "$body" = "[]" ]; then
    echo "✅ $1 → [] (차단됨)"
  else
    echo "❌ $1 → 노출!  ${body:0:160}"
  fi
}

echo "== anon 노출 차단 확인 (모두 ✅ 여야 함) =="
probe "club_members        " "club_members?select=user_id,role&limit=3"
probe "sessions.code       " "sessions?select=id,attendance_code&limit=3"
probe "attendances         " "attendances?select=id&limit=3"
# 레거시 잠금 테이블(20260623020000) — 존재 시 [], 미존재 시 404 에러바디(무시 가능)
probe "applications(legacy)" "applications?select=id&limit=3"
probe "events(legacy)      " "events?select=id&limit=3"
probe "projects(legacy)    " "projects?select=id&limit=3"

echo
echo "== 의도된 공개는 유지되는지 (clubs 는 데이터 있어야 정상) =="
clubs=$(curl -s "$URL/rest/v1/clubs?select=id,name&limit=1" -H "apikey: $KEY" -H "Authorization: Bearer $KEY")
if [ "$clubs" = "[]" ]; then echo "⚠️  clubs 도 []  — 과도 차단 점검 필요"; else echo "✅ clubs 정상 공개  ${clubs:0:120}"; fi
