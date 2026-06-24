import { Loader } from 'lucide-react';

// 콘텐츠 영역 전체를 덮는 통일 로딩 화면.
// 라우트 청크 로딩(Suspense), 권한 가드, 페이지 초기 데이터 로딩에서 동일하게 사용해
// "빈 화면 → 부분 렌더 → 콘텐츠" 단계별 깜빡임 없이 한 번에 등장하도록 한다.
// 헤더/푸터는 덮지 않음(콘텐츠 영역만): flex-1로 부모 사이 공간을 채운다.
export function LoadingScreen() {
  return (
    <div className="flex-1 min-h-[50vh] w-full flex items-center justify-center">
      <Loader className="w-8 h-8 animate-spin text-brand" strokeWidth={2.5} />
    </div>
  );
}
