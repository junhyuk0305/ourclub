# UI/UX 감사 보고서

이 문서는 `attend.md`에 정의된 디자인 시스템을 기반으로 주요 페이지의 UI/UX를 진단하고 개선 방안을 제안합니다.

---

## 1. 메인 페이지 (`src/pages/public/Home.tsx`)

### 전반적인 진단
- 대체로 '모던 브루탈리즘' 컨셉을 잘 따르고 있으나, 일부 컴포넌트에서 시각적 위계가 명확하지 않아 사용자의 시선을 분산시키는 문제가 있습니다.
- 모바일 환경에서의 터치 편의성 개선이 필요합니다.

### 상세 개선안

#### 이슈 1: 시각적 위계 혼란
- **[발견된 문제점]**
  - Hero 섹션의 메인 CTA 버튼(`🚀 검증된 동아리 합류하기`)이 가장 중요함에도 불구하고, 우측의 통계 패널 역시 강렬한 색상(`bg-black text-orange-500`)을 사용하여 시선이 분산됩니다.
  - `CurationSection`의 "다음 모집 알림 설정" 버튼이 회색(`bg-gray-100`)으로 처리되어 비활성화된 것처럼 보입니다.
- **[UI/UX적 원인]**
  - 핵심 액션과 부가 정보 간의 시각적 대비가 부족하여 사용자의 시선 흐름을 효과적으로 유도하지 못합니다.
  - 비활성화 상태와 유사한 스타일을 클릭 가능한 버튼에 적용하여 사용자의 혼란을 유발하고 행동 가능성을 저해합니다.
- **[개선된 코드 스니펫 및 설명]**
  - **1) Hero Section 우측 패널 대비 조정:** 우측 통계 패널의 배경을 차분하게 변경하여 메인 CTA 버튼의 시각적 중요도를 높입니다.
    ```tsx
    // src/pages/public/Home.tsx
    // ...
    <div className="grid grid-rows-2">
      {/* 변경: bg-black -> bg-gray-100, text-white -> text-black 으로 대비 조정 */}
      <div className="p-8 border-b border-black bg-gray-100 text-black flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2 text-black">
          <CheckCircle className="w-5 h-5 text-orange-500" />
          <span className="font-bold tracking-widest text-sm">엄격한 동아리 검증</span>
        </div>
        <div className="text-5xl font-black text-black mb-2">124<span className="text-2xl text-gray-500 ml-2">팀</span></div>
        <p className="text-gray-600 font-medium">의 동아리가 엄격한 안전 검증을 통과하여 오렌지 뱃지를 획득했습니다.</p>
      </div>
    // ...
    ```
  - **2) '다음 모집 알림' 버튼 스타일 개선:** 비활성화된 느낌을 주는 회색 배경 대신, 디자인 시스템에 정의된 2차 버튼 스타일(흰색 배경, 검은색 테두리, 그림자 효과)을 적용하여 클릭 가능한 요소임을 명확히 합니다.
    ```tsx
    // src/pages/public/Home.tsx
    // ...
    ) : (
      <button onClick={onOpenAlert} className="w-full bg-white border border-black py-3 font-bold text-black flex items-center justify-center gap-2 hover:bg-gray-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5">
        <Bell className="w-4 h-4" /> 다음 모집 알림 설정
      </button>
    )}
    // ...
    ```

#### 이슈 2: 모바일 터치 타겟
- **[발견된 문제점]** `CurationSection`의 필터 버튼들이 모바일 화면에서 간격(`gap-3`)이 좁아 터치 시 오작동의 가능성이 있습니다.
- **[UI/UX적 원인]** 모바일 환경에서의 터치 영역(Touch Target) 크기를 충분히 고려하지 않았습니다.
- **[개선된 코드 스니펫 및 설명]** 필터 버튼의 좌우 패딩과 버튼 간의 간격을 늘려 모바일 터치 편의성을 높입니다.
  ```tsx
  // src/pages/public/Home.tsx
  // ...
  <div className="flex justify-between items-center pr-4">
    {/* 변경: gap-3 -> gap-4 */}
    <div className="flex p-4 gap-4">
      {filters.map(filter => (
        <button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          {/* 변경: px-5 -> px-6 으로 터치 영역 확대 */}
          className={`whitespace-nowrap px-6 py-2.5 font-bold border border-black text-sm ...`}
        >
          {filter}
        </button>
      ))}
    </div>
  // ...
  ```

---

## 2. 동아리 찾기 (`src/pages/public/Clubs.tsx`)

### 전반적인 진단
- '벤토 박스'와 '모던 브루탈리즘' 컨셉을 잘 활용하여 정보 구조가 명확합니다.
- 단, 카드 내 정보 그룹화 방식과 데이터가 없는 '빈 상태(Empty State)' 디자인에서 개선의 여지가 있습니다.

### 상세 개선안

#### 이슈 1: 정보 그룹화 및 가독성
- **[발견된 문제점]** 클럽 카드(`ClubCard`) 하단의 통계 정보('누적 수주', '예산 공개', '경쟁률')가 명확한 구분선 없이 나열되어 있으며, 폰트 크기(`text-[10px]`)가 너무 작아 가독성이 떨어집니다.
- **[UI/UX적 원인]** 정보 덩어리(Chunk)가 시각적으로 명확하게 분리되지 않았고, 과도하게 작은 폰트 사이즈가 사용되었습니다.
- **[개선된 코드 스니펫 및 설명]** 각 통계 항목 사이에 디자인 시스템에 정의된 `1px 실선`을 추가하고, 폰트 크기를 키워 가독성을 개선합니다.
  ```tsx
  // src/pages/public/Clubs.tsx
  // ...
  {/* 변경: bg-gray-50 -> bg-white, 각 항목에 border-r 추가 */}
  <div className="grid grid-cols-3 border-t border-black bg-white relative z-10">
    <div className="p-3 border-r border-black flex flex-col items-center justify-center text-center">
      {/* 변경: text-[10px] -> text-xs 로 가독성 개선 */}
      <span className="text-xs font-bold text-gray-500 mb-1">누적 수주</span>
      <span className="font-black text-sm">{club.stats.project}건</span>
    </div>
    <div className="p-3 border-r border-black flex flex-col items-center justify-center text-center">
      <span className="text-xs font-bold text-gray-500 mb-1">예산 공개</span>
      <span className="font-black text-sm text-orange-600">{club.stats.budget}%</span>
    </div>
    <div className="p-3 flex flex-col items-center justify-center text-center">
      <span className="text-xs font-bold text-gray-500 mb-1">경쟁률</span>
      <span className="font-black text-sm">{club.stats.comp}</span>
    </div>
  </div>
  // ...
  ```

#### 이슈 2: 빈 상태(Empty State)에서의 액션 유도 부족
- **[발견된 문제점]** 검색 결과가 없을 때 표시되는 `EmptyState` 컴포넌트가 '검색 초기화하기'라는 단일 액션만 제공하여 사용자를 막다른 길(Dead-end)로 유도합니다.
- **[UI/UX적 원인]** 사용자가 다음에 무엇을 해야 할지에 대한 구체적이고 긍정적인 가이드를 제공하지 못하고 있습니다.
- **[개선된 코드 스니펫 및 설명]** `EmptyState` 컴포넌트에 '원하는 동아리 알림 받기'와 같은 2차 CTA 버튼을 추가하여 사용자에게 유용한 다음 행동을 제안합니다.
  ```tsx
  // src/pages/public/Clubs.tsx
  // ...
  const EmptyState = ({ onReset }: any) => (
    // ...
    <div className="flex flex-col w-full gap-3">
      <button onClick={onReset} ... >
        <RefreshCcw className="w-4 h-4" /> 검색 초기화하기
      </button>
      {/* 추가: 2차 액션 버튼 */}
      <button className="w-full bg-white text-black font-bold py-3 border border-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
        <Bell className="w-4 h-4" /> 원하는 동아리 알림 받기
      </button>
    </div>
    // ...
  );
  ```

---

## 3. B2B 라운지 (`src/pages/public/B2BLounge.tsx`)

### 전반적인 진단
- 전문적이고 정돈된 레이아웃을 갖추고 있으나, 페이지 내에서만 사용되는 모달 디자인이 공통 디자인 시스템과 달라 일관성을 해칩니다.
- 목록의 정보량이 많아 사용자의 인지 부하를 가중시킬 수 있습니다.

### 상세 개선안

#### 이슈 1: 디자인 시스템 불일치
- **[발견된 문제점]** 프로젝트 상세 정보를 보여주는 `ProjectDetailModal`의 디자인(테두리, 그림자, 헤더 구성 등)이 공통 `Modal` 컴포넌트와 달라 사용자에게 일관된 경험을 제공하지 못합니다.
- **[UI/UX적 원인]** 재사용 가능한 공통 컴포넌트를 활용하지 않고, 페이지 특화 스타일을 개별적으로 구현하여 디자인 일관성이 깨졌습니다.
- **[개선된 코드 스니펫 및 설명]** 기존 `ProjectDetailModal`을 제거하고, 재사용 가능한 공통 `Modal` 컴포넌트(`src/components/ui/Modal.tsx`)를 사용하여 상세 정보 뷰를 재구성합니다.
  ```tsx
  // src/pages/public/B2BLounge.tsx
  // 1. 공통 Modal 컴포넌트 import
  import { Modal } from '../../components/ui/Modal'; 

  // 2. ProjectDetailModal을 공통 Modal을 사용하도록 변경
  function ProjectDetailModal({ project, onClose, onProposal }: ...) {
    return (
      <Modal isOpen={true} onClose={onClose} title={project.title}>
        {/* ... 기존 모달의 content를 공통 Modal 자식으로 재구성 ... */}
      </Modal>
    );
  }
  ```

#### 이슈 2: 과도한 인지 부하
- **[발견된 문제점]** 프로젝트 목록(`ProjectRow`)에서 각 항목의 모든 정보(개요, 스킬 태그, 예산 등)가 한 번에 노출되어 목록을 훑어볼 때 인지적 부담을 줍니다.
- **[UI/UX적 원인]** 점진적 공개(Progressive Disclosure) 원칙이 적용되지 않았습니다. 핵심 정보와 상세 정보를 구분하지 않고 모두 표시하여 정보 과부하를 유발합니다.
- **[개선된 코드 스니펫 및 설명]** `ProjectRow`에서 상대적으로 덜 중요한 '프로젝트 개요' 텍스트를 제거하여 목록의 가독성을 높이고, 사용자가 '상세 보기'를 통해 필요시 정보를 확인하도록 유도합니다.
  ```tsx
  // src/pages/public/B2BLounge.tsx
  // ... in ProjectRow component
  <div className="p-6 lg:w-4/12 ...">
    <div>
      <p className="text-xs font-bold text-gray-500 ...">
        <DollarSign className="w-3 h-3" /> 리워드/지원
      </p>
      <p className="font-black text-lg text-black">{formatBudget(project.budget)}</p>
    </div>
    {/* 
      REMOVED: 프로젝트 개요 섹션 제거
      {project.description && (
        <div> ... </div>
      )}
    */}
  </div>
  ```
