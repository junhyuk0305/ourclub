---
description: 새 페이지/컴포넌트 생성. "페이지 만들어", "컴포넌트 추가", "new page", "scaffold", "화면 만들어" 요청에 자동 로드.
---

## 기존 라우팅 (패턴 참고용)
!`git show HEAD:src/App.tsx`

## public 페이지 인덱스 (export 패턴)
!`git show HEAD:src/pages/public/index.ts`

## admin 페이지 인덱스 (export 패턴)
!`git show HEAD:src/pages/admin/index.ts`

---

새 페이지/컴포넌트를 생성하기 전에 다음을 확인해줘.

### 생성 전 물어볼 것 (정보가 부족하면 먼저 질문)
- 어느 역할(public / admin / user / corp / master)?
- 파일 이름과 경로?
- 라우팅이 필요한가, 독립 컴포넌트인가?
- 주요 기능 3가지?

### 생성 규칙 (반드시 준수)

**파일 구조**
- `src/pages/{role}/{ComponentName}.tsx` 에 생성
- 해당 `index.ts`에 export 추가
- 라우팅이 필요하면 `App.tsx`에 Route 추가

**코드 스타일**
- 기존 페이지와 동일한 import 순서 (React → 외부 라이브러리 → 내부)
- Tailwind 클래스 패턴 기존과 일치
- `export default function ComponentName()` 형식
- 불필요한 state, props, 추상화 없음

**Supabase 연동이 필요한 경우**
- `src/lib/supabaseClient.ts` import
- 기존 컴포넌트의 fetch 패턴 그대로 따름
- loading / error 상태 최소한으로

**금지사항**
- 요청하지 않은 기능 추가 금지
- 주석 블록 금지 (코드가 자명해야 함)
- 별도 헬퍼 함수 파일 생성 금지 (단순한 경우)
