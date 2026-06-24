# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## 6. Workspace Layout (어드민 / 기업 / 마스터)

**대시보드형 화면(헤더 + 사이드바)은 공통 레이아웃이 셸을 소유한다. 페이지는 콘텐츠만 반환한다.**

라우트 전환 시 사이드바가 깜빡이지(언마운트→리마운트) 않도록, 헤더·사이드바는 레이아웃이 한 번만 마운트하고 콘텐츠만 `<Outlet/>`으로 교체한다.

- **레이아웃 컴포넌트**: 어드민 `src/pages/admin/AdminLayout.tsx`, 기업 `src/pages/corp/CorpLayout.tsx`, 마스터 `src/pages/master/MasterLayout.tsx`. 각자 헤더 + `<aside>`(사이드바) + `<Suspense><Outlet/></Suspense>`를 소유한다. (Suspense는 콘텐츠 영역에만 둬, lazy 로딩 중에도 사이드바가 유지된다.)
- **라우팅**: `App.tsx`에서 가드+레이아웃을 부모 라우트로 두고 페이지를 자식으로 중첩한다. 예: `<Route element={<AdminRoute><AdminLayout/></AdminRoute>}> <Route path="/admin/..." element={<Page/>}/> ... </Route>`. 레이아웃은 **eager import**(즉시 셸 표시), 자식 페이지는 lazy.
- **페이지 작성 규칙**: 어드민/기업/마스터 페이지는 `<div h-screen>`/`<AdminHeader>`/`<aside><Sidebar/>` 셸을 **직접 그리지 않는다.** 자신의 `<main className="...">`(또는 콘텐츠)만 루트로 반환한다. 페이지 바깥 형제(모달·토스트)는 Fragment로 감싼다.
- **헤더 액션 버튼**: 페이지별 헤더 버튼은 `AdminHeaderPortal`/`CorpHeaderPortal`(레이아웃 파일에서 export)로 포털 주입한다. 헤더를 직접 렌더하지 않는다.
- **예외(전용 풀스크린 셸, 레이아웃 미적용)**: `Workspace`(1-Page 빌더), `PostsAdmin`. 이들은 자체 셸을 유지하며 중첩 라우트 밖에 둔다.
- 새 대시보드형 페이지를 추가할 때도 이 규칙을 따른다(셸 직접 렌더 금지).