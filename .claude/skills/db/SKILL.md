---
description: Supabase 마이그레이션/스키마 검토. "마이그레이션", "테이블 추가", "RLS", "스키마 변경", "DB 바꿀게" 요청에 자동 로드.
---

## 기존 마이그레이션 목록
!`git ls-files supabase/migrations/`

## 미커밋 마이그레이션 (새로 작성 중인 파일)
!`git diff HEAD -- supabase/migrations/`

## 현재 RLS 정책 파일
!`git show HEAD:supabase/migrations/20260428120000_rls_policies.sql`

---

Supabase 마이그레이션을 **프로덕션 배포 전 체크리스트** 기준으로 검토해줘.

### 검토 항목

**🔴 데이터 안전성 (배포 차단 수준)**
- `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` — 데이터 유실 위험
- `NOT NULL` 컬럼 추가 시 기존 행에 기본값 없음
- `ALTER COLUMN` 타입 변경으로 인한 캐스팅 실패 가능성
- 롤백 불가능한 변경 (되돌릴 방법 명시)

**🔴 보안 - RLS**
- 새 테이블에 RLS 활성화 누락 (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- SELECT/INSERT/UPDATE/DELETE policy 중 누락된 것
- `auth.uid()` 체크 없이 열려있는 policy
- `anon` role에 불필요한 권한

**🟡 성능 - 인덱스**
- Foreign Key 컬럼에 인덱스 누락
- 자주 필터링할 컬럼 (`status`, `club_id`, `user_id` 등) 인덱스 제안
- 복합 인덱스가 효율적인 경우

**🟢 일관성**
- 기존 네이밍 컨벤션 준수 (snake_case, 복수형 테이블명)
- `id uuid DEFAULT gen_random_uuid()` 표준 패턴
- `created_at`, `updated_at` 컬럼 포함 여부

### 출력 형식
이슈가 없으면 "✅ 마이그레이션 안전" 한 줄로.
이슈가 있으면 항목별로 나열 후, **수정된 SQL 전체**를 제시해줘.
