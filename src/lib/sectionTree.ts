/* ─────────────────────────────────────────────────────────────
   sectionTree — 웹빌더 블록 트리(전체 → 섹션 → 행 → 컬럼 → 위젯)의
   불변(immutable) CRUD 순수 함수 모음.

   트리 형태:
     blocks: (Widget | Section)[]
     Section.rows: Row[]
     Row.columns: Column[]
     Column.widgets: Widget[]        ← 위젯은 leaf (section 중첩 금지)

   모든 함수는 새 배열/객체를 반환하며 입력을 변형하지 않는다.
   (WORKSPACE_SECTION_SPEC.md §9 — referential identity 보존)
───────────────────────────────────────────────────────────── */
import { mkColumn } from '../components/blockKit';

export type NodeKind = 'widget' | 'section' | 'row' | 'column';
export interface FoundNode {
  node: any;
  kind: NodeKind;
  sectionId?: string;
  rowId?: string;
  colId?: string;
}

const isSection = (b: any) => b?.type === 'section';

/** id 로 노드(위젯/섹션/행/컬럼) 찾기 + 위치 정보 반환. */
export function findNode(blocks: any[], id: string): FoundNode | null {
  for (const b of blocks) {
    if (b.id === id) return { node: b, kind: isSection(b) ? 'section' : 'widget' };
    if (isSection(b)) {
      for (const r of b.rows || []) {
        if (r.id === id) return { node: r, kind: 'row', sectionId: b.id };
        for (const c of r.columns || []) {
          if (c.id === id) return { node: c, kind: 'column', sectionId: b.id, rowId: r.id };
          for (const w of c.widgets || []) {
            if (w.id === id) return { node: w, kind: 'widget', sectionId: b.id, rowId: r.id, colId: c.id };
          }
        }
      }
    }
  }
  return null;
}

/** 노드(위젯/섹션/행/컬럼) 필드 patch — id 로 위치 무관 갱신. */
export function patchNode(blocks: any[], id: string, patch: Record<string, any>): any[] {
  return blocks.map(b => {
    if (b.id === id) return { ...b, ...patch };
    if (!isSection(b)) return b;
    return {
      ...b,
      rows: (b.rows || []).map((r: any) => {
        if (r.id === id) return { ...r, ...patch };
        return {
          ...r,
          columns: (r.columns || []).map((c: any) => {
            if (c.id === id) return { ...c, ...patch };
            const widgets = (c.widgets || []).map((w: any) => (w.id === id ? { ...w, ...patch } : w));
            return { ...c, widgets };
          }),
        };
      }),
    };
  });
}

/** 노드 삭제 — top-level 위젯/섹션, 행, 컬럼 내 위젯 모두 대응. */
export function deleteNode(blocks: any[], id: string): any[] {
  return blocks
    .filter(b => b.id !== id)
    .map(b => {
      if (!isSection(b)) return b;
      return {
        ...b,
        rows: (b.rows || [])
          .filter((r: any) => r.id !== id)
          .map((r: any) => ({
            ...r,
            columns: (r.columns || []).map((c: any) => ({
              ...c,
              widgets: (c.widgets || []).filter((w: any) => w.id !== id),
            })),
          })),
      };
    });
}

/** 위젯을 트리 어디서든 떼어냄. [새 blocks, 떼어낸 위젯|null] 반환. */
export function removeWidget(blocks: any[], id: string): [any[], any | null] {
  let removed: any = null;
  const next = blocks
    .filter(b => {
      if (!isSection(b) && b.id === id) { removed = b; return false; }
      return true;
    })
    .map(b => {
      if (!isSection(b)) return b;
      return {
        ...b,
        rows: (b.rows || []).map((r: any) => ({
          ...r,
          columns: (r.columns || []).map((c: any) => {
            const idx = (c.widgets || []).findIndex((w: any) => w.id === id);
            if (idx < 0) return c;
            removed = c.widgets[idx];
            return { ...c, widgets: c.widgets.filter((w: any) => w.id !== id) };
          }),
        })),
      };
    });
  return [next, removed];
}

/** top-level 에 위젯 삽입 (beforeId 앞, 없으면 끝). */
export function insertTop(blocks: any[], widget: any, beforeId?: string | null): any[] {
  const arr = [...blocks];
  const i = beforeId ? arr.findIndex(b => b.id === beforeId) : -1;
  if (i >= 0) arr.splice(i, 0, widget);
  else arr.push(widget);
  return arr;
}

/** 특정 컬럼에 위젯 삽입 (beforeWidgetId 앞, 없으면 끝). */
export function insertInColumn(
  blocks: any[], widget: any,
  sectionId: string, rowId: string, colId: string, beforeWidgetId?: string | null,
): any[] {
  return blocks.map(b => {
    if (b.id !== sectionId) return b;
    return {
      ...b,
      rows: (b.rows || []).map((r: any) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          columns: (r.columns || []).map((c: any) => {
            if (c.id !== colId) return c;
            const widgets = [...(c.widgets || [])];
            const i = beforeWidgetId ? widgets.findIndex((w: any) => w.id === beforeWidgetId) : -1;
            if (i >= 0) widgets.splice(i, 0, widget);
            else widgets.push(widget);
            return { ...c, widgets };
          }),
        };
      }),
    };
  });
}

/** 섹션에 행 추가. */
export function addRow(blocks: any[], sectionId: string, row: any): any[] {
  return blocks.map(b => (b.id === sectionId ? { ...b, rows: [...(b.rows || []), row] } : b));
}

/** 행 순서 이동 (섹션 내). */
export function moveRow(blocks: any[], sectionId: string, rowId: string, dir: 'up' | 'down'): any[] {
  return blocks.map(b => {
    if (b.id !== sectionId) return b;
    const rows = [...(b.rows || [])];
    const i = rows.findIndex((r: any) => r.id === rowId);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= rows.length) return b;
    [rows[i], rows[j]] = [rows[j], rows[i]];
    return { ...b, rows };
  });
}

/**
 * 행의 컬럼 수 변경.
 * 늘리면 빈 컬럼 추가, 줄이면 뒤쪽 컬럼 제거(호출 전 위젯 손실 경고는 UI 책임 — D6).
 * colRatios 는 컬럼 수가 바뀌면 무효화(균등 분할로 리셋).
 */
export function setRowCols(blocks: any[], rowId: string, n: number): any[] {
  const clamped = Math.max(1, Math.min(4, n));
  return patchRow(blocks, rowId, (r: any) => {
    let columns = [...(r.columns || [])];
    if (clamped < columns.length) columns = columns.slice(0, clamped);
    else while (columns.length < clamped) columns.push(mkColumn());
    return { ...r, cols: clamped, colRatios: null, columns };
  });
}

/** 행 내 위젯 순서 이동(같은 컬럼 내 ↑↓). */
export function moveWidgetInColumn(blocks: any[], colId: string, widgetId: string, dir: 'up' | 'down'): any[] {
  return blocks.map(b => {
    if (!isSection(b)) return b;
    return {
      ...b,
      rows: (b.rows || []).map((r: any) => ({
        ...r,
        columns: (r.columns || []).map((c: any) => {
          if (c.id !== colId) return c;
          const widgets = [...(c.widgets || [])];
          const i = widgets.findIndex((w: any) => w.id === widgetId);
          const j = dir === 'up' ? i - 1 : i + 1;
          if (i < 0 || j < 0 || j >= widgets.length) return c;
          [widgets[i], widgets[j]] = [widgets[j], widgets[i]];
          return { ...c, widgets };
        }),
      })),
    };
  });
}

/* 내부: 특정 행을 transform 으로 교체 */
function patchRow(blocks: any[], rowId: string, fn: (r: any) => any): any[] {
  return blocks.map(b => {
    if (!isSection(b)) return b;
    return { ...b, rows: (b.rows || []).map((r: any) => (r.id === rowId ? fn(r) : r)) };
  });
}

/** 어떤 행이 위젯을 줄였을 때 잃게 되는 위젯 수 (D6 경고용). */
export function widgetsLostOnShrink(row: any, n: number): number {
  const clamped = Math.max(1, Math.min(4, n));
  if (clamped >= (row.columns || []).length) return 0;
  return (row.columns || [])
    .slice(clamped)
    .reduce((sum: number, c: any) => sum + (c.widgets || []).length, 0);
}
