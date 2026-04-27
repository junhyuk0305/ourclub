# 🎯 Supabase 사용자 역할 설정 완벽 가이드

## 현재 상황
- ✅ users 테이블에 "IT/개발" 동아리 데이터 존재
- ❌ Supabase Auth에 해당 사용자가 없어서 로그인 불가능

---

## 📋 해결 방법: Supabase Dashboard에서 Auth 사용자 추가

### **Step 1: Supabase Dashboard 접속**

1. [Supabase](https://supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **Authentication** 클릭

### **Step 2: Auth 사용자 생성**

1. **Users** 탭 선택
2. **Add user** 클릭
3. 다음 정보 입력:
   ```
   Email: it-club@ourclub.com (또는 원하는 이메일)
   Password: 111111 (또는 원하는 비밀번호 6자 이상)
   ```
4. **Create user** 클릭
5. **생성된 사용자의 ID 복사** (이것이 매우 중요!)

### **Step 3: users 테이블 확인 및 수정**

1. 좌측 메뉴에서 **SQL Editor** 또는 **Table Editor** 클릭
2. **users** 테이블 선택
3. 다음 행을 찾거나 수정:
   ```
   id: (Step 2에서 복사한 사용자 ID)
   role: "club_admin"
   name: "IT/개발" (또는 기존 값 유지)
   created_at: (자동)
   ```

### **Step 4: clubs 테이블 확인**

1. **clubs** 테이블 선택
2. 다음 행 확인:
   ```
   user_id: (Step 2에서 복사한 사용자 ID)
   name: "IT/개발"
   ```

### **Step 5: 로그인 테스트**

1. 애플리케이션 `/auth/login` 접속
2. 다음 정보 입력:
   ```
   Email: it-club@ourclub.com
   Password: 111111
   ```
3. ✅ 자동으로 `/dashboard/club/builder`로 이동

---

## 🔄 각 역할별 완전한 설정 체크리스트

### **Student (대학생)**
```
Supabase Auth:
- [ ] Email & Password 생성

users 테이블:
- [ ] id = (auth user id)
- [ ] role = "student"
- [ ] name = "학생이름"
```

### **Club Admin (동아리 운영진)** ← 현재 설정 중
```
Supabase Auth:
- [ ] Email & Password 생성

users 테이블:
- [ ] id = (auth user id)
- [ ] role = "club_admin"
- [ ] name = "동아리이름"

clubs 테이블:
- [ ] user_id = (auth user id)
- [ ] name = "동아리이름"
```

### **Corp Admin (기업 담당자)**
```
Supabase Auth:
- [ ] Email & Password 생성

users 테이블:
- [ ] id = (auth user id)
- [ ] role = "corp_admin"
- [ ] name = "기업이름"

projects 테이블:
- [ ] corp_id = (auth user id)
```

### **Platform Admin (플랫폼 관리자)**
```
Supabase Auth:
- [ ] Email & Password 생성

users 테이블:
- [ ] id = (auth user id)
- [ ] role = "platform_admin"
- [ ] name = "관리자이름"
```

---

## 🚀 빠른 SQL로 전체 설정하기

다음 SQL을 Supabase SQL Editor에서 실행:

```sql
-- Step 1: 먼저 Supabase Auth에서 사용자 생성 후 ID 확인
-- Step 2: 아래 {USER_ID}를 실제 ID로 변경

-- Club Admin 설정
UPDATE users 
SET role = 'club_admin', name = 'IT/개발'
WHERE id = '{USER_ID}';

-- clubs 테이블 확인/수정
UPDATE clubs 
SET user_id = '{USER_ID}'
WHERE name = 'IT/개발';
```

---

## ✅ 검증 SQL

현재 설정이 올바른지 확인:

```sql
-- 동아리 관리자 확인
SELECT u.id, u.role, u.name, c.name as club_name
FROM users u
LEFT JOIN clubs c ON u.id = c.user_id
WHERE u.role = 'club_admin';

-- 결과 예상:
-- id | role | name | club_name
-- {USER_ID} | club_admin | IT/개발 | IT/개발
```

---

## 🎓 시스템 작동 원리

### 로그인 → 대시보드 라우팅 흐름

```
1. 사용자 로그인 (/auth/login)
   ↓
2. Supabase Auth 인증
   ↓
3. /auth/callback으로 이동
   ↓
4. users 테이블에서 role 조회
   ↓
5. role 값에 따라 대시보드 결정:
   - role = "student" → /dashboard/student
   - role = "club_admin" → /dashboard/club
   - role = "corp_admin" → /dashboard/corp
   - role = "platform_admin" → /dashboard/admin
```

### 데이터 흐름

```
Supabase Auth (인증)
    ↓ (user.id)
    ↓
users 테이블 (프로필 + role)
    ↓ (role = "club_admin"이면)
    ↓
clubs 테이블 (동아리 정보)
    ↓ (club_admin의 경우)
    ↓
/dashboard/club/builder (동아리 프로필 편집)
```

---

## ❓ 자주 묻는 질문

**Q: 왜 로그인이 계속 안 되나요?**
A: Supabase Auth에 사용자가 없을 가능성이 높습니다. 반드시 Step 2를 완료하세요.

**Q: 로그인은 되는데 "클럽 없음"이 나와요?**
A: users.role이 "club_admin"이 아니거나, clubs 테이블의 user_id가 일치하지 않습니다.

**Q: 기업 담당자가 되려면?**
A: users.role을 "corp_admin"으로 설정하고, projects 테이블에 corp_id를 추가하세요.

**Q: 여러 역할을 가질 수 있나요?**
A: 현재 구조상 한 사용자는 하나의 역할만 가집니다. (role은 단일 text 필드)

---

## 📞 추가 도움이 필요하면

위 과정을 따라했는데도 문제가 발생하면:
1. Supabase Auth에 사용자가 실제로 생성되었는지 확인
2. 생성된 사용자의 ID를 정확히 확인
3. users 테이블의 id, role 값 재확인
4. 브라우저 캐시 삭제 후 다시 시도
