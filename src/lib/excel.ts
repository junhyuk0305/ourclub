// 엑셀 다운로드 헬퍼 — xlsx 라이브러리를 동적 import 로 로딩
// (bundle size 최적화: 다운로드 클릭 시점에만 fetch)

export async function downloadExcel(
  rows: Record<string, string | number | null | undefined>[],
  filename: string,
  sheetName = 'Sheet1',
) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const ts = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${ts}.xlsx`);
}
