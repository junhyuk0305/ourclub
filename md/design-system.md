# 디자인 시스템 — 모던 브루탈리즘 UI 토큰

> OURCLUB 전 화면에 적용되는 시각 언어·타이포·컬러·여백·인터랙션 토큰 정의.
> (구 파일명 `attend.md` → `design-system.md`로 변경. 출처: Header/Footer/Modal 등 공통 컴포넌트 실측)
> UI/UX 진단은 [ux-audit-report.md](ux-audit-report.md) 참고.

핵심 디자인 언어:
- **모던 브루탈리즘 (Modern Brutalism):** `border-[3px] border-black`, `shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]` (Modal), `shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]` (Header 로고, 로그인/가입 버튼) 등 두껍고 명확한 경계선과 입체적인 그림자 효과를 통해 강렬하고 견고한 느낌을 줍니다. 이는 모던 브루탈리즘 디자인의 핵심 시각적 특징으로 보입니다.
- **1px 실선 활용:** `h-16 border-b border-black` (Header), `border-t border-black` (Footer), `divide-y md:divide-y-0 md:divide-x divide-black` (Footer 섹션 구분) 등 얇은 실선을 사용하여 UI 요소 간의 구분을 명확히 하고 깔끔한 시각적 계층을 형성합니다.
- **벤토 박스 레이아웃 (Bento Box Layout):** Footer의 `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`와 같은 그리드 시스템을 활용하여 콘텐츠 블록을 명확히 분리하고, 각 블록이 독립적인 UI 컴포넌트처럼 보이도록 구성합니다. 이는 시각적으로 정돈되고 모듈화된 느낌을 줍니다.
- **미니멀리즘과 기능성 강조:** 불필요한 장식을 최소화하고, 직관적인 아이콘 (`Bell`, `User`, `X`)과 명확한 텍스트 라벨을 사용하여 사용자가 기능을 쉽게 이해하고 사용할 수 있도록 디자인되어 있습니다.

타이포그래피 규칙:
- **헤딩 (Heading):**
    - `font-black text-2xl tracking-tighter`: 주로 로고 (`OURCLUB`)에 사용되어 강렬하고 존재감 있는 브랜딩을 나타냅니다.
    - `font-black text-lg`: 모달 (`Modal`) 제목과 같은 주요 섹션 타이틀에 사용되어 시각적 중요도를 부여합니다.
    - `font-black text-xl`: 푸터 (`Footer`)의 메인 섹션 제목에 사용됩니다.
    - `font-black mb-4`: 푸터 (`Footer`)의 서브 헤딩에 사용되어 정보 그룹을 명확히 합니다.
- **본문 (Body):**
    - `text-black font-sans`: 전반적인 기본 텍스트에 사용되는 기본 스타일로, 가독성을 중시합니다.
    - `text-sm font-bold`: 네비게이션 링크, 마이페이지 링크, 알림 버튼 등 중요한 인터랙션 요소에 사용되어 주목도를 높입니다.
    - `text-sm font-medium text-gray-600`: 푸터 (`Footer`)의 본문 텍스트와 같이 보조적인 정보 전달에 사용되어 덜 강조하면서도 충분한 가독성을 제공합니다.
- **캡션 (Caption) / 보조 텍스트:**
    - `text-xs font-bold tracking-widest`: 푸터 (`Footer`) 하단의 저작권 정보와 같이 작은 텍스트에 사용되어 세부 정보를 제공하면서도 디자인의 일관성을 유지합니다.

컬러 팔레트:
- **Primary (액센트/강조):**
    - `bg-orange-500`: 로고, 모달 헤더 배경, 활성/호버 상태 등 주요 액션 및 강조 요소에 사용됩니다.
    - `text-orange-500`: 활성 네비게이션 링크, 호버 텍스트 등 인터랙티브 요소에 사용됩니다.
- **Secondary (기업 관련):**
    - `bg-purple-600`: 기업 관련 링크의 배경색으로 사용됩니다.
    - `hover:text-purple-800`: 기업 관련 링크의 호버 텍스트 색상으로 사용됩니다.
- **Background:**
    - `bg-white`: 전반적인 페이지 및 컴포넌트의 기본 배경색입니다.
    - `bg-black`: 푸터 (`Footer`) 하단, 특정 버튼의 호버 배경색 등으로 사용되어 강렬한 대비를 제공합니다.
    - `bg-gray-50`: 푸터 (`Footer`) 섹션의 기본 배경색으로, 호버 시 `bg-white`로 변경되어 시각적 피드백을 줍니다.
- **Border:**
    - `border-black`: 대부분의 경계선에 사용되어 강한 대비와 브루탈리즘적인 특징을 강조합니다.
    - `bg-gray-300`: 구분선 (`w-px h-4 bg-gray-300`)에 사용되어 부드러운 구분을 제공합니다.
- **Text:**
    - `text-black`: 기본 텍스트 색상입니다.
    - `text-gray-600`: 보조적인 정보나 덜 강조되는 텍스트에 사용됩니다.
    - `text-white`: 검은색 배경 위에 사용되어 텍스트 가독성을 확보합니다.

여백 및 레이아웃 (Spacing & Layout):
- **패딩 (Padding):**
    - `p-1`, `p-2`, `p-4`, `p-5`, `p-6`, `p-8`: 다양한 크기의 패딩이 요소 내부의 여백을 조절하는 데 일관되게 사용됩니다.
    - 예: `px-6` (Header 좌우), `py-2` (버튼 수직), `p-8` (Footer 각 섹션)
- **마진 (Margin):**
    - `ml-1`, `mb-4`, `mb-6`, `mx-2`, `mt-auto`: 요소 외부의 간격을 조절하는 데 사용됩니다. `mt-auto`는 푸터 (`Footer`)를 하단에 고정하는 데 활용됩니다.
- **플렉스 (Flex):**
    - `flex`, `flex-col`, `flex-row`, `items-center`, `justify-between`, `gap-2`, `gap-4`, `gap-6`, `gap-8`: 플렉스박스 유틸리티를 광범위하게 사용하여 요소들을 정렬하고 간격을 효율적으로 배분합니다.
    - 예: `flex items-center justify-between` (Header), `flex-1 flex flex-col` (메인 컨텐츠 영역이 남은 공간을 채우도록 함)
- **그리드 (Grid):**
    - `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`: 푸터 (`Footer`) 섹션에 반응형 그리드 레이아웃을 적용하여 다양한 화면 크기에서 콘텐츠를 유연하게 배치합니다.

인터랙션 및 상태:
- **Hover:**
    - `hover:text-orange-500`, `hover:text-purple-800`: 텍스트 링크에 마우스를 올렸을 때 색상이 변경되어 클릭 가능한 요임을 시각적으로 명확히 합니다.
    - `hover:bg-orange-500`, `hover:bg-black`, `hover:bg-white`: 버튼이나 섹션에 마우스를 올렸을 때 배경색이 변경되어 인터랙션 가능성을 나타냅니다.
    - `hover:border-black`, `hover:border-orange-500`: 테두리 색상이 변경되어 호버 상태를 강조합니다.
    - `hover:text-white`: 검은색 배경의 버튼에 마우스를 올렸을 때 텍스트 색상이 반전되어 시각적 대비를 제공합니다.
    - `group-hover:block`: 푸터 (`Footer`) 섹션에서 `div className="absolute top-0 left-0 w-full h-1 bg-black translate-y-[-1px] hidden group-hover:block"></div>`와 같이, 부모 요소에 호버했을 때 특정 자식 요소가 나타나도록 하여 동적인 시각적 피드백을 제공합니다.
- **Active:**
    - `active:translate-y-px active:shadow-none`: 로그인/가입 버튼 (`Link to="/login"`)에 클릭 이벤트가 발생했을 때 (`active` 상태) 버튼이 아래로 살짝 움직이고 그림자가 사라지는 듯한 효과를 주어 물리적으로 눌리는 듯한 시각적 피드백을 제공합니다.
- **Focus:** 코드에서 명시적인 `focus` Tailwind 클래스는 직접적으로 발견되지 않았으나, 브라우저의 기본 `focus` 스타일이 적용되거나 Tailwind CSS의 기본 `focus` 링 스타일이 적용될 수 있습니다.
- **Disabled:** 코드에서 `disabled` 상태에 대한 명시적인 시각적 피드백 패턴은 발견되지 않았습니다.