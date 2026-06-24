---
description: 커밋/PR 전 코드 리뷰. "커밋할게", "올릴게", "ship", "PR 만들어", "배포 전에 봐줘" 요청에 자동 로드.
---

## 변경된 코드 (staged + unstaged)
!`git diff HEAD`

## 현재 브랜치 상태
!`git status --short`

## 최근 커밋 메시지 스타일
!`git log --oneline -5`

---

위 변경사항을 **10년차 시니어 엔지니어** 시각으로 검토해줘.

### 검토 기준

**🔴 Critical (배포 전 반드시 수정)**
- null/undefined 접근으로 인한 런타임 크래시 가능성
- Supabase RLS 우회 가능성 또는 인증 체크 누락
- 비동기 처리 실수 (await 누락, race condition)
- 민감정보(API 키, 토큰) 하드코딩

**🟡 Warning (가능하면 수정)**
- TypeScript 타입 단언(`as`, `!`) 남용
- useEffect 의존성 배열 누락/과다
- 컴포넌트 리렌더링 과다 유발 패턴

**🟢 Suggestion (선택)**
- CLAUDE.md 원칙 위반 (불필요한 추상화, 과도한 코드)
- 기존 코드 스타일과 불일치

### 출력 형식
1. 이슈 목록 (위 형식 사용)
2. 이슈 없으면 "✅ 배포 준비 완료" 한 줄로
3. 마지막에 conventional commits 형식 커밋 메시지 초안 1개

수정이 필요한 이슈가 있으면 구체적인 코드 제안도 포함해줘.
