import React, { useState, useEffect, useRef } from 'react';
import {
  Type, CheckSquare, Plus, Layout, ArrowLeft,
  Loader, Check, Globe, ChevronDown, ChevronUp, Clock,
  MessageSquare, Layers, MousePointer, GripVertical, Image as ImageIcon,
  Minus, Columns, RotateCcw, RotateCw, Monitor, Tablet, Smartphone,
  Copy, BarChart2, LayoutGrid, Timer, Trash2, X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { WorkspaceProperties } from '../../components/admin/WorkspaceProperties';
import { BlockPropertiesPanel } from '../../components/admin/BlockPropertiesPanel';
import { BlockBody, WB_STYLE, genId, mkSection, mkRow, rowGridTemplate, resolveSectionBg, SectionDecor, rowCardWrapStyle, RowCardHeader, resolveThemeHex } from '../../components/blockKit';
import {
  findNode, patchNode, deleteNode, removeWidget, insertTop, insertInColumn,
  addRow as addRowTo, moveRow, setRowCols, moveWidgetInColumn, widgetsLostOnShrink,
} from '../../lib/sectionTree';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

/* ─────────────────────────────────────────────
   Widget palette definition
───────────────────────────────────────────── */
const PALETTE: { type: string; label: string; icon: React.ElementType; disabled?: boolean }[] = [
  { type: 'section',         label: '섹션',            icon: LayoutGrid },
  { type: 'text',            label: '텍스트',          icon: Type },
  { type: 'layoutContainer', label: '탭·캐러셀',        icon: Columns },
  { type: 'stats',           label: '통계 카운터',      icon: BarChart2 },
  { type: 'faq',             label: 'FAQ 아코디언',    icon: MessageSquare },
  { type: 'timeline',        label: '프로세스 다이어그램', icon: Clock },
  { type: 'heroSlider',      label: '슬라이드',         icon: Layers },
  { type: 'button',          label: '버튼',            icon: CheckSquare },
  { type: 'countdown',       label: '카운트다운',       icon: Timer },
  { type: 'image',           label: '이미지',           icon: ImageIcon },
  { type: 'spacer',          label: '여백 (Spacer)',    icon: Layout },
  { type: 'divider',         label: '구분 요소',        icon: Minus },
];

const PALETTE_LABEL: Record<string, string> = Object.fromEntries(PALETTE.map(p => [p.type, p.label]));

function mkStatItem(id: string, value: string, label: string) {
  return { id, value, label };
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function mkCell(id: string, n: number) {
  return { id, title: `카드 제목 ${n}`, text: '여기에 내용을 입력하세요.', align: 'left', bgColor: '#ffffff', textColor: '#374151', titleColor: '#111827', titleSize: 18, textSize: 14, padding: 24, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', imgSrc: '', imgPosition: 'top', imgHeight: 180 };
}

function mkSlide(id: string) {
  return { id, bgType: 'color', bgValue: '#111111', overlayOpacity: 0, h1: '메인 카피를\n입력하세요', subtitle: '서브 카피를 입력하세요', href: '', align: 'center' };
}

/* ─────────────────────────────────────────────
   makeWidget — 위젯 타입별 기본값 (top-level·섹션 컬럼 공용)
   섹션(section)은 mkSection() 으로 별도 생성한다.
───────────────────────────────────────────── */
function makeWidget(type: string): any {
  const id = genId();
  let nb: any = { id, type };
  if (type === 'text')            nb = { ...nb, text: '텍스트를 입력하세요.', seoTag: 'p', align: 'left', fontSize: 16, fontWeight: 400, textColor: '#111827', lineHeight: 1.7, paddingY: 32 };
  if (type === 'button')          nb = { ...nb, text: '버튼 텍스트', actionUrl: '', btnSize: 'm', btnTextColor: '#ffffff', borderWidth: 0, radius: 8, btnShadow: 'none', btnAnim: 'none', btnTemplate: 'solid', paddingY: 32 };
  if (type === 'countdown')       nb = { ...nb, label: '모집 마감까지', expiredText: '모집이 마감되었습니다', bgColor: '#0a0a0a', textColor: '#ffffff', accentColor: '', paddingY: 56 };
  if (type === 'faq')             nb = { ...nb, title: '자주 묻는 질문', items: [{ id: id + '_1', question: '질문을 입력하세요', answer: '답변을 입력하세요.' }], iconStyle: 'plus', openBg: '#fff7ed' };
  if (type === 'timeline')        nb = { ...nb, title: '채용 프로세스', nodes: [{ id: id + '_1', title: '1단계', desc: '설명을 입력하세요' }, { id: id + '_2', title: '2단계', desc: '설명을 입력하세요' }], activeColor: '#f97316', lineColor: '#111827' };
  if (type === 'heroSlider')      nb = { ...nb, height: 60, slides: [mkSlide(id + '_s1')], autoPlay: false, interval: 4000 };
  if (type === 'layoutContainer') nb = { ...nb, mode: 'tabs', cols: 2, gap: 20, paddingY: 40, bgColor: '', cells: [mkCell(id + '_c1', 1), mkCell(id + '_c2', 2)] };
  if (type === 'spacer')          nb = { ...nb, height: 64 };
  if (type === 'image')           nb = { ...nb, src: '', alt: '', width: 100, align: 'center', aspect: 'auto', objectFit: 'cover', radius: 0, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 };
  if (type === 'divider')         nb = { ...nb, variant: 'line', style: 'solid', color: '#e5e7eb', thickness: 1, width: 100, paddingY: 24, bgColor: '',
                                          tickerItems: ['브랜드 전략 동아리', '2019년 창립', '누적 프로젝트 32건', '현업 취업률 80%'], separator: '✦', speed: 24, tickerFontSize: 13 };
  if (type === 'stats')           nb = { ...nb, items: [mkStatItem(id+'_1','200+','누적 회원'),mkStatItem(id+'_2','50+','완성 프로젝트'),mkStatItem(id+'_3','3년','운영 역사')], cols: 3, layout: 'strip', bgColor: '#ffffff', valueColor: '#111827', labelColor: '#6b7280', valueSize: 48, labelSize: 14, paddingY: 56, animate: true };
  return nb;
}

/* ─────────────────────────────────────────────
   Default blocks — 빈 캔버스 (사용자가 위젯으로 직접 구성)
───────────────────────────────────────────── */
const DEFAULT_BLOCKS: any[] = [];

/* ─────────────────────────────────────────────
   Main Workspace component
───────────────────────────────────────────── */
export default function Workspace() {
  const { adminClub, adminClubId } = useAdmin();
  const { user, profile } = useAuth();

  /* global config */
  const [activeTheme, setActiveTheme] = useState('black');
  const [showFloatingBtn, setShowFloatingBtn] = useState(true);
  const [smoothScroll, setSmoothScroll] = useState(false);
  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false);

  /* blocks */
  const [blocks, setBlocks] = useState<any[]>(DEFAULT_BLOCKS);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  /* inter-block insert menu (gap index, or null) */
  const [insertMenuIdx, setInsertMenuIdx] = useState<number | null>(null);

  /* 섹션 컬럼 위젯 피커 (어느 컬럼에 추가 중인지) */
  const [colPicker, setColPicker] = useState<{ sectionId: string; rowId: string; colId: string } | null>(null);

  /* drag-to-reorder */
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  /* slider per-block current slide index (editor-only, not persisted) */

  /* db */
  const [pageId, setPageId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  /* 초안이 공개본과 달라 아직 발행되지 않은 변경사항이 있는지 */
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [toast, setToast] = useState('');

  /* ── 동시 편집 제어 (낙관적 잠금 + presence) ──
     versionRef: 마지막으로 읽거나 저장한 행 버전. 저장은 이 버전이 그대로일 때만 성공.
     conflict: 내가 편집하는 동안 다른 운영진이 저장해 버전이 어긋난 상태(모달 표시).
     conflictRef: 디바운스 콜백 등 비동기 경로에서 최신 충돌 여부를 즉시 읽기 위한 미러. */
  const versionRef = useRef<number>(0);
  const [conflict, setConflict] = useState(false);
  const conflictRef = useRef(false);
  const setConflictState = (v: boolean) => { conflictRef.current = v; setConflict(v); };
  /* 현재 같은 페이지를 열고 있는 다른 편집자(나 제외) */
  const [editors, setEditors] = useState<{ id: string; name: string }[]>([]);

  /* auto-scroll to new block */
  const newBlockIdRef = useRef<string | null>(null);
  const blockElRefs = useRef<Record<string, HTMLDivElement>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* undo/redo */
  const blockHistoryRef = useRef<any[][]>([]);
  const historyIdxRef = useRef<number>(-1);
  const lastPushRef = useRef<number>(0);
  /* 마지막으로 합쳐진 편집 대상(`id:field`) — 같은 필드 연속 편집만 한 undo 단계로 합친다 */
  const lastKeyRef = useRef<string | null>(null);
  /* 마지막 발행본 payload(JSON) — 초안이 이와 다를 때만 '미발행 변경' 으로 표시 */
  const publishedRef = useRef<string>('');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const undoFnRef = useRef<() => void>(() => {});
  const redoFnRef = useRef<() => void>(() => {});

  /* viewport preview */
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  /* inline text editing mode */
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  /* global page settings */
  const [contentWidth, setContentWidth] = useState('860');
  const [pageBgColor, setPageBgColor] = useState('');
  const [globalFont, setGlobalFont] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [pageDesc, setPageDesc] = useState('');
  useEffect(() => { if (adminClubId) loadPage(adminClubId); }, [adminClubId]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undoFnRef.current(); }
      if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redoFnRef.current(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  /* block-level shortcuts: Esc deselect · Cmd+S save · Del remove · Cmd+D duplicate */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        saveToDb(blocks);
        return;
      }
      if (e.key === 'Escape') { setSelectedBlockId(null); setEditingBlockId(null); setInsertMenuIdx(null); return; }
      if (typing || editingBlockId || !selectedBlockId) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); handleDeleteBlock(selectedBlockId); }
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); handleDuplicateBlock(selectedBlockId); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [blocks, selectedBlockId, editingBlockId]);

  /* warn before leaving with unsaved changes */
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (saveStatus !== 'saved') { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [saveStatus]);

  useEffect(() => {
    const id = newBlockIdRef.current;
    if (!id) return;
    const el = blockElRefs.current[id];
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); newBlockIdRef.current = null; }
  }, [blocks]);

  const loadPage = async (clubId: string) => {
    setFetching(true);
    const { data } = await supabase.from('club_pages').select('id, blocks, draft, published_at, version').eq('club_id', clubId).maybeSingle();
    if (data) {
      setPageId(data.id);
      setIsPublished(!!data.published_at);
      versionRef.current = data.version ?? 0;
      setConflictState(false);
      /* 편집은 항상 초안(draft)을 불러온다. 구버전 행(draft 없음)은 공개본으로 폴백. */
      const published = data.blocks as any;
      const saved = (data.draft ?? data.blocks) as any;
      publishedRef.current = JSON.stringify(published ?? null);
      /* 초안이 공개본과 다르면 = 아직 발행 안 된 변경사항 */
      setHasUnpublishedChanges(JSON.stringify(saved ?? null) !== publishedRef.current);
      if (saved?.config) {
        const c = saved.config;
        if (c.activeTheme) setActiveTheme(c.activeTheme);
        if (c.showFloatingBtn !== undefined) setShowFloatingBtn(c.showFloatingBtn);
        if (c.smoothScroll !== undefined) setSmoothScroll(c.smoothScroll);
        if (c.contentWidth) setContentWidth(c.contentWidth);
        if (c.pageBgColor !== undefined) setPageBgColor(c.pageBgColor);
        if (c.globalFont !== undefined) setGlobalFont(c.globalFont);
        if (c.pageTitle !== undefined) setPageTitle(c.pageTitle);
        if (c.pageDesc !== undefined) setPageDesc(c.pageDesc);
      }
      if (Array.isArray(saved?.blocks)) {
        const loaded = saved.blocks.map(normalizeBlock);
        setBlocks(loaded);
        blockHistoryRef.current = [loaded]; historyIdxRef.current = 0;
        setCanUndo(false); setCanRedo(false);
      }
    }
    setFetching(false);
  };

  /* normalize old block formats for backward compat */
  const normalizeBlock = (b: any): any => {
    if (b.type === 'heroSlider' && !b.slides) {
      return { ...b, slides: [{ id: 's1', bgType: b.bgType || 'color', bgValue: b.bgValue || '#111', overlayOpacity: b.overlayOpacity || 0, h1: b.h1 || '', subtitle: b.subtitle || '', ctaText: b.ctaText || '지원하기', ctaShow: b.ctaShow !== false, align: 'center' }] };
    }
    if (b.type === 'text' && (b.title !== undefined || b.content !== undefined) && b.text === undefined) {
      return { ...b, text: [b.title, b.content].filter(Boolean).join('\n\n') };
    }
    return b;
  };

  const buildPayload = (b: any[], cfg: any) => ({ blocks: b, config: cfg });
  const currentCfg = () => ({ activeTheme, showFloatingBtn, smoothScroll, contentWidth, pageBgColor, globalFont, pageTitle, pageDesc });
  const triggerAutoSave = (upd: any[], cfg?: any) => {
    setSaveStatus('unsaved');
    /* 발행본과 실제로 다를 때만 배지 표시 → undo 로 발행본과 같아지면 자동으로 꺼짐 */
    const nowJson = JSON.stringify(buildPayload(upd, cfg ?? currentCfg()));
    setHasUnpublishedChanges(nowJson !== publishedRef.current);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    /* 충돌 모달이 떠 있는 동안엔 자동저장을 멈춘다(해결 전까지 덮어쓰기 방지). */
    if (conflictRef.current) return;
    debounceRef.current = setTimeout(() => saveToDb(upd, cfg), 5000);
  };
  /* 자동저장 = 초안(draft)에만 기록. 공개본(blocks)·방문자 페이지는 건드리지 않는다.
     낙관적 잠금: 내가 읽은 version 그대로일 때만 저장하고 version 을 +1. 어긋나면(다른
     운영진이 먼저 저장) 영향 행이 0건 → 충돌로 보고 모달을 띄운다. */
  const saveToDb = async (cur: any[], cfgOvr?: any) => {
    if (!adminClubId) {
      showToast('❌ 동아리 정보를 불러오지 못했습니다. 페이지를 새로고침해주세요.');
      return;
    }
    if (conflictRef.current) return;
    setSaveStatus('saving');
    const cfg = cfgOvr ?? currentCfg();
    const payload = buildPayload(cur, cfg);
    if (pageId) {
      const v = versionRef.current;
      const { data, error } = await supabase.from('club_pages')
        .update({ draft: payload, version: v + 1, updated_at: new Date().toISOString() })
        .eq('id', pageId).eq('version', v).select('version');
      if (error) { showToast(`❌ 임시저장 실패: ${error.message}`); setSaveStatus('unsaved'); return; }
      if (!data || data.length === 0) { setConflictState(true); setSaveStatus('unsaved'); return; }
      versionRef.current = data[0].version;
    } else {
      const { data, error } = await supabase.from('club_pages').insert({ club_id: adminClubId, draft: payload }).select('id, version').single();
      if (error) { showToast(`❌ 임시저장 실패: ${error.message}`); setSaveStatus('unsaved'); return; }
      if (data) { setPageId(data.id); versionRef.current = data.version ?? 0; }
    }
    setSaveStatus('saved');
  };
  /* 발행 = 현재 초안을 공개본(blocks)으로 복사 + 발행 시각 갱신.
     공개 페이지는 항상 이 공개본을 보여주므로, 발행 전까지는 방문자에게 이전 발행본
     (또는 미발행 시 기본 소개 페이지)만 노출된다. '발행 취소(숨김)' 개념은 없다. */
  const handlePublish = async () => {
    if (!adminClubId) {
      showToast('❌ 동아리 정보를 불러오지 못했습니다. 페이지를 새로고침해주세요.');
      return;
    }
    if (publishing) return;
    setPublishing(true);
    /* 발행 직전, 디바운스 대기 중인 초안 저장을 확정해 최신 상태를 반영 */
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const cfg = currentCfg();
    const payload = buildPayload(blocks, cfg);
    const ts = new Date().toISOString();
    /* 공개본·초안을 동일하게 맞춰 '발행 안 된 변경사항'을 0으로 리셋.
       발행도 자동저장과 같은 version 가드를 거쳐 동시 편집 유실을 막는다. */
    if (pageId) {
      const v = versionRef.current;
      const { data, error } = await supabase.from('club_pages')
        .update({ blocks: payload, draft: payload, published_at: ts, updated_at: ts, version: v + 1 })
        .eq('id', pageId).eq('version', v).select('version');
      if (error) { showToast(`❌ 발행 실패: ${error.message}`); setPublishing(false); return; }
      if (!data || data.length === 0) { setConflictState(true); setPublishing(false); return; }
      versionRef.current = data[0].version;
    } else {
      const { data, error } = await supabase.from('club_pages').insert({ club_id: adminClubId, blocks: payload, draft: payload, published_at: ts }).select('id, version').single();
      if (error) { showToast(`❌ 발행 실패: ${error.message}`); setPublishing(false); return; }
      if (data) { setPageId(data.id); versionRef.current = data.version ?? 0; }
    }
    const wasPublished = isPublished;
    publishedRef.current = JSON.stringify(payload);
    setIsPublished(true);
    setHasUnpublishedChanges(false);
    setSaveStatus('saved');
    setPublishing(false);
    showToast(wasPublished ? '변경사항이 발행되었습니다!' : '홈페이지가 발행되었습니다!');
  };
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── 충돌 해결 ──
     불러오기: 내 변경을 버리고 다른 운영진이 저장한 최신 초안을 다시 로드.
     덮어쓰기: 최신 version 을 받아온 뒤 내 변경을 그 위에 강제 저장(상대 변경은 사라짐). */
  const resolveReload = async () => {
    setConflictState(false);
    if (adminClubId) await loadPage(adminClubId);
  };
  const resolveOverwrite = async () => {
    if (!pageId) { setConflictState(false); return; }
    const { data } = await supabase.from('club_pages').select('version').eq('id', pageId).maybeSingle();
    versionRef.current = data?.version ?? versionRef.current;
    setConflictState(false);
    await saveToDb(blocks);
  };

  /* ── presence: 같은 페이지를 동시에 보고 있는 다른 운영진 표시(경고 전용) ──
     ephemeral broadcast 라 DB/RLS 변경 불필요. 같은 사용자의 여러 탭은 id 로 dedupe. */
  useEffect(() => {
    if (!pageId || !user) return;
    const ch = supabase.channel(`wb-page:${pageId}`, { config: { presence: { key: user.id } } });
    ch.on('presence', { event: 'sync' }, () => {
      const state = ch.presenceState() as Record<string, any[]>;
      const list = Object.values(state).flat().map((p: any) => ({ id: p.id, name: p.name }));
      const uniq = Array.from(new Map(list.map(e => [e.id, e])).values());
      setEditors(uniq.filter(e => e.id !== user.id));
    });
    ch.subscribe(async status => {
      if (status === 'SUBSCRIBED') await ch.track({ id: user.id, name: profile?.name ?? '운영진' });
    });
    return () => { supabase.removeChannel(ch); };
  }, [pageId, user?.id, profile?.name]);

  /* ── undo / redo ── */
  /* force=true for structural ops (add/delete/move) → always a discrete undo step.
     Without force, rapid same-length edits (e.g. typing per keystroke) within
     COALESCE_MS collapse into a single undo entry instead of flooding history. */
  const COALESCE_MS = 500;
  const pushHistory = (newBlocks: any[], force = false, key?: string) => {
    const now = Date.now();
    const h = blockHistoryRef.current.slice(0, historyIdxRef.current + 1);
    const top = h[h.length - 1];
    /* 같은 필드(key)를 COALESCE_MS 안에 연속 편집할 때만 한 단계로 합친다.
       서로 다른 블록/필드 편집은 길이가 같아도 별도 undo 단계로 보존한다. */
    const coalesce = !force && top && (now - lastPushRef.current) < COALESCE_MS
      && top.length === newBlocks.length && key != null && key === lastKeyRef.current;
    if (coalesce) {
      h[h.length - 1] = newBlocks;
    } else {
      h.push(newBlocks);
      if (h.length > 50) h.shift();
    }
    blockHistoryRef.current = h;
    historyIdxRef.current = h.length - 1;
    lastPushRef.current = now;
    lastKeyRef.current = force ? null : (key ?? null);
    setCanUndo(h.length > 1);
    setCanRedo(false);
  };
  const undo = () => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    const prev = blockHistoryRef.current[historyIdxRef.current];
    setBlocks(prev); triggerAutoSave(prev);
    setCanUndo(historyIdxRef.current > 0); setCanRedo(true);
  };
  const redo = () => {
    if (historyIdxRef.current >= blockHistoryRef.current.length - 1) return;
    historyIdxRef.current += 1;
    const next = blockHistoryRef.current[historyIdxRef.current];
    setBlocks(next); triggerAutoSave(next);
    setCanUndo(true); setCanRedo(historyIdxRef.current < blockHistoryRef.current.length - 1);
  };
  undoFnRef.current = undo; redoFnRef.current = redo;

  const handleAddBlock = (type: string, atIndex?: number) => {
    if (type === 'header') return;
    const nb = type === 'section' ? mkSection() : makeWidget(type);
    newBlockIdRef.current = nb.id;
    const selIdx = selectedBlockId ? blocks.findIndex(b => b.id === selectedBlockId) : -1;
    const insertAt = atIndex ?? (selIdx >= 0 ? selIdx + 1 : blocks.length);
    const next = [...blocks.slice(0, insertAt), nb, ...blocks.slice(insertAt)];
    commit(next, true); setSelectedBlockId(nb.id);
    setInsertMenuIdx(null);
  };

  /* 상태 갱신 단일 진입점 (set + history + autosave). key=같은 필드 연속 편집 합치기용 */
  const commit = (next: any[], force = false, key?: string) => { setBlocks(next); pushHistory(next, force, key); triggerAutoSave(next); };

  /* 노드 깊은 복제 + 모든 id 재생성 (섹션/행/컬럼/위젯 전체) */
  const regenIds = (node: any): any => {
    const n = { ...node, id: genId() };
    if (n.type === 'section') {
      n.rows = (n.rows || []).map((r: any) => ({
        ...r, id: genId(),
        columns: (r.columns || []).map((c: any) => ({ ...c, id: genId(), widgets: (c.widgets || []).map(regenIds) })),
      }));
    }
    return n;
  };

  /* 필드 갱신 — 위젯(top/nested)·섹션·행·컬럼 위치 무관 */
  const upd = (id: string, field: string, value: any) => commit(patchNode(blocks, id, { [field]: value }), false, `${id}:${field}`);

  const handleDeleteBlock = (id: string) => {
    commit(deleteNode(blocks, id), true);
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const handleDuplicateBlock = (id: string) => {
    const found = findNode(blocks, id);
    if (!found) return;
    const clone = regenIds(found.node);
    newBlockIdRef.current = clone.id;
    if (found.kind === 'widget' && found.colId) {
      const next = blocks.map(b => b.id !== found.sectionId ? b : {
        ...b, rows: (b.rows || []).map((r: any) => r.id !== found.rowId ? r : {
          ...r, columns: (r.columns || []).map((c: any) => {
            if (c.id !== found.colId) return c;
            const ws = c.widgets || [];
            const i = ws.findIndex((w: any) => w.id === id);
            const widgets = [...ws]; widgets.splice(i + 1, 0, clone);
            return { ...c, widgets };
          }),
        }),
      });
      commit(next, true); setSelectedBlockId(clone.id); return;
    }
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    commit([...blocks.slice(0, idx + 1), clone, ...blocks.slice(idx + 1)], true);
    setSelectedBlockId(clone.id);
  };

  const handleMoveBlock = (id: string, dir: 'up' | 'down') => {
    const found = findNode(blocks, id);
    if (!found) return;
    if (found.kind === 'widget' && found.colId) { commit(moveWidgetInColumn(blocks, found.colId, id, dir), true); return; }
    const idx = blocks.findIndex(b => b.id === id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= blocks.length) return;
    const arr = [...blocks]; [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    commit(arr, true);
  };

  /* ── 섹션 전용 핸들러 ── */
  const addWidgetToColumn = (type: string, sectionId: string, rowId: string, colId: string) => {
    const w = makeWidget(type);
    newBlockIdRef.current = w.id;
    commit(insertInColumn(blocks, w, sectionId, rowId, colId), true);
    setSelectedBlockId(w.id);
  };
  const addRowToSection = (sectionId: string, cols: number) => commit(addRowTo(blocks, sectionId, mkRow(cols)), true);
  const handleMoveRow = (sectionId: string, rowId: string, dir: 'up' | 'down') => commit(moveRow(blocks, sectionId, rowId, dir), true);
  const handleSetRowCols = (rowId: string, n: number) => {
    const found = findNode(blocks, rowId);
    if (found?.kind === 'row') {
      const lost = widgetsLostOnShrink(found.node, n);
      if (lost > 0 && !window.confirm(`열을 줄이면 사라지는 칸의 위젯 ${lost}개가 삭제됩니다. 계속할까요?`)) return;
    }
    const next = setRowCols(blocks, rowId, n);
    commit(next, true);
    /* 축소로 선택 중이던 위젯이 사라졌으면 선택 해제(패널이 빈 위젯을 가리키지 않도록) */
    if (selectedBlockId && !findNode(next, selectedBlockId)) setSelectedBlockId(null);
  };

  /* ── 드래그앤드롭 (위젯=어디든 이동 / 섹션=top-level 순서) ── */
  const onDragStartNode = (e: React.DragEvent, id: string) => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; setDragId(id); };
  const clearDrag = () => { setDragId(null); setDragOverId(null); };
  const moveWidgetTo = (target: { type: 'col'; sectionId: string; rowId: string; colId: string; before?: string | null } | { type: 'top'; before?: string | null }) => {
    if (!dragId) return;
    const [stripped, w] = removeWidget(blocks, dragId);
    if (!w) { clearDrag(); return; }
    const next = target.type === 'col'
      ? insertInColumn(stripped, w, target.sectionId, target.rowId, target.colId, target.before ?? null)
      : insertTop(stripped, w, target.before ?? null);
    commit(next, true); clearDrag();
  };
  const reorderTopTo = (beforeId: string | null) => {
    if (!dragId) return;
    const arr = [...blocks];
    const from = arr.findIndex(b => b.id === dragId);
    if (from < 0) { clearDrag(); return; }
    const [moved] = arr.splice(from, 1);
    let to = beforeId ? arr.findIndex(b => b.id === beforeId) : arr.length;
    if (to < 0) to = arr.length;
    arr.splice(to, 0, moved);
    commit(arr, true); clearDrag();
  };
  /* top-level wrapper 위로 드롭: 섹션이면 순서변경, 위젯이면 top-level 편입 */
  const onDropOnTop = (beforeId: string | null) => {
    if (!dragId || dragId === beforeId) { clearDrag(); return; }
    const found = findNode(blocks, dragId);
    if (!found) { clearDrag(); return; }
    if (found.kind === 'section') reorderTopTo(beforeId);
    else moveWidgetTo({ type: 'top', before: beforeId });
  };
  /* 컬럼/컬럼내 위젯 위로 드롭: 위젯만 허용(섹션 중첩 금지) */
  const onDropInColumn = (sectionId: string, rowId: string, colId: string, beforeWidgetId: string | null) => {
    if (!dragId) { clearDrag(); return; }
    const found = findNode(blocks, dragId);
    if (!found || found.kind === 'section') { clearDrag(); return; }
    moveWidgetTo({ type: 'col', sectionId, rowId, colId, before: beforeWidgetId });
  };

  const mkConfigSetter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: string) =>
    (val: T) => { setter(val); triggerAutoSave(blocks, { activeTheme, showFloatingBtn, smoothScroll, contentWidth, pageBgColor, globalFont, pageTitle, pageDesc, [key]: val }); };

  const themeHex: Record<string, string> = {
    'orange-500': '#f97316', 'black': '#000000', 'white': '#ffffff',
    'blue-600': '#2563eb', 'green-600': '#16a34a', 'purple-500': '#a855f7',
  };
  const resolveThemeHex = (t: string) =>
    t.startsWith('custom:') ? t.replace('custom:', '') : (themeHex[t] || '#f97316');
  const getThemeText = (t: string) => {
    const hex = resolveThemeHex(t);
    if (t === 'white' || hex === '#ffffff') return 'text-black';
    return 'text-white';
  };

  const selectedFound = selectedBlockId ? findNode(blocks, selectedBlockId) : null;
  const selectedBlock = selectedFound?.node ?? null;
  const selectedKind = selectedFound?.kind ?? null;

  /* inter-block insert affordance — a hairline+button at each gap that opens a widget picker */
  const insertZone = (idx: number) => {
    const open = insertMenuIdx === idx;
    return (
      <div className="relative w-full h-0 z-30" onClick={e => e.stopPropagation()}>
        <div className="group/iz absolute left-0 right-0 -top-2 h-4 flex items-center justify-center">
          <div className={`absolute left-10 right-10 h-px bg-orange-400 transition-opacity ${open ? 'opacity-100' : 'opacity-0 group-hover/iz:opacity-100'}`} />
          <button
            onClick={() => setInsertMenuIdx(open ? null : idx)}
            title="여기에 위젯 추가"
            className={`relative flex items-center justify-center w-5 h-5 rounded-full border border-orange-500 bg-white text-orange-500 hover:bg-orange-500 hover:text-white transition-all ${open ? 'opacity-100 rotate-45' : 'opacity-0 group-hover/iz:opacity-100'}`}>
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {open && (
          <div className="absolute z-50 left-1/2 -translate-x-1/2 top-2.5 w-64 bg-white border border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] p-2"
            onClick={e => e.stopPropagation()}>
            <div className="text-[12px] font-black text-gray-400 uppercase tracking-widest px-1 pb-1.5">여기에 위젯 삽입</div>
            <div className="grid grid-cols-3 gap-1">
              {PALETTE.filter(p => !p.disabled).map(({ type, label, icon: Icon }) => (
                <button key={type} onClick={() => handleAddBlock(type, idx)}
                  className="flex flex-col items-center gap-1 p-2 border border-gray-200 rounded hover:border-black hover:bg-orange-50 transition-colors">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[12px] font-bold text-gray-600 leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* 컬럼에 넣을 수 있는 위젯(섹션 중첩 금지) */
  const COLUMN_WIDGETS = PALETTE.filter(p => !p.disabled && p.type !== 'section');

  /* 위젯 미니 툴바 + 시각(BlockBody). top-level·컬럼 내부 공용. */
  const renderWidgetShell = (
    block: any,
    opts: { nested?: boolean; colInfo?: { sectionId: string; rowId: string; colId: string }; topIndex?: number } = {},
  ) => {
    const { nested, colInfo, topIndex } = opts;
    const isSel = selectedBlockId === block.id;
    const isDragOver = dragOverId === block.id;
    return (
      <div
        key={block.id}
        ref={el => { if (el) blockElRefs.current[block.id] = el as HTMLDivElement; }}
        /* 캡처 단계에서 선택 — 위젯 내부 입력창(텍스트 등)을 눌러도 해당 위젯이 선택되도록
           (입력창의 stopPropagation 보다 먼저 실행) */
        onClickCapture={() => { setSelectedBlockId(block.id); setInsertMenuIdx(null); }}
        onClick={e => e.stopPropagation()}
        onDragOver={e => { if (dragId && dragId !== block.id) { e.preventDefault(); e.stopPropagation(); setDragOverId(block.id); } }}
        onDrop={e => { e.preventDefault(); e.stopPropagation(); nested && colInfo ? onDropInColumn(colInfo.sectionId, colInfo.rowId, colInfo.colId, block.id) : onDropOnTop(block.id); }}
        onDragEnd={clearDrag}
        className={`wbe-widget relative group transition-all ${nested ? '' : 'animate-slide-down'}
          ${isSel ? 'z-20' : 'hover:ring-inset hover:ring-2 hover:ring-orange-300 hover:z-10'}
          ${isDragOver && dragId !== block.id ? 'ring-2 ring-green-500' : ''}`}
      >
        {/* 선택 외곽선 — 위젯 콘텐츠(배경 포함) 위에 그려 항상 보이게 */}
        {isSel && <div className="pointer-events-none absolute inset-0 z-[25] border-[3px] border-orange-500" />}
        {/* 드래그 핸들 — 위젯 좌측 중앙 '바깥'(콘텐츠와 안 겹침). hover/선택 시 노출 */}
        <div draggable onDragStart={e => onDragStartNode(e, block.id)} onClick={e => e.stopPropagation()}
          className={`absolute -left-6 top-1/2 -translate-y-1/2 cursor-grab z-30 bg-orange-500 text-white p-1 rounded-l transition-opacity ${isSel ? 'opacity-90' : 'opacity-0 group-hover:opacity-70'}`}
          title="드래그하여 이동">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* 라벨 + 액션 — 선택 시 상단 가장자리. 드래그 핸들은 위 좌측 바깥에 분리 배치. */}
        <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-0.5 z-30 pointer-events-none transition-opacity ${isSel ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-white text-[11px] font-black px-1.5 py-0.5 pointer-events-none bg-orange-500">{PALETTE_LABEL[block.type] ?? block.type}</span>
          {isSel && (
            <div className="flex items-center gap-0.5 pointer-events-auto">
              <button onClick={e => { e.stopPropagation(); handleMoveBlock(block.id, 'up'); }} disabled={!nested && topIndex === 0} title="위로 이동"
                className="bg-gray-700 text-white text-[11px] font-black px-1 py-0.5 hover:bg-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleMoveBlock(block.id, 'down'); }} disabled={!nested && topIndex === blocks.length - 1} title="아래로 이동"
                className="bg-gray-700 text-white text-[11px] font-black px-1 py-0.5 hover:bg-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center"><ChevronDown className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleDuplicateBlock(block.id); }} title="복제"
                className="bg-blue-500 text-white text-[11px] font-black px-1.5 py-0.5 hover:bg-blue-600 transition-colors flex items-center gap-0.5"><Copy className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleDeleteBlock(block.id); }} title="삭제"
                className="bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 hover:bg-red-600 transition-colors">✕</button>
            </div>
          )}
        </div>

        {/* 텍스트 서식은 멀티라인 필드의 리치 에디터(RichEditable) 자체 툴바가 담당 — 드래그 선택 글자에 적용 */}
        <BlockBody block={block} ctx={{ activeTheme, themeColor: resolveThemeHex(activeTheme), edit: true, upd: (field: string, value: any) => upd(block.id, field, value) }} />
      </div>
    );
  };

  /* 섹션 에디터 — chrome(툴바·DnD) + 행/컬럼. 위젯 시각은 renderWidgetShell 재사용. */
  const renderSection = (section: any, topIndex: number) => {
    const isSel = selectedBlockId === section.id;
    const hasOverlay = section.bgType === 'image' && (section.bgOverlay ?? 0) > 0;
    return (
      <div key={section.id}
        ref={el => { if (el) blockElRefs.current[section.id] = el as HTMLDivElement; }}
        onClick={e => { e.stopPropagation(); setSelectedBlockId(section.id); setInsertMenuIdx(null); }}
        onDragOver={e => { if (dragId && dragId !== section.id) { e.preventDefault(); setDragOverId(section.id); } }}
        onDrop={e => { e.preventDefault(); onDropOnTop(section.id); }}
        onDragEnd={clearDrag}
        /* hover/선택 시 z-30 으로 올려, 음수 오프셋 chrome(+위젯·행 추가·열 버튼)이
           다음 섹션에 가려지지 않고 위에 그려지도록 한다. */
        className={`relative group/sec transition-all animate-slide-down ${isSel ? 'z-30' : 'hover:ring-inset hover:ring-2 hover:ring-orange-300 hover:z-30'}`}
      >
        {/* 선택 외곽선 — 섹션 배경/콘텐츠 위에 그려 항상 보이게 */}
        {isSel && <div className="pointer-events-none absolute inset-0 z-[35] border-[3px] border-orange-500" />}
        {/* 섹션 툴바 — hover 시엔 라벨만, 선택 시에만 액션 버튼 노출 (위젯과 동일한 맥락형 규칙) */}
        <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-0.5 z-40 pointer-events-none transition-opacity ${isSel ? 'opacity-100' : 'opacity-0 group-hover/sec:opacity-100'}`}>
          <span className={`ml-5 text-white text-[11px] font-black px-1.5 py-0.5 pointer-events-none ${isSel ? 'bg-orange-500' : 'bg-orange-400/90'}`}>섹션</span>
          {isSel && (
            <div className="flex items-center gap-0.5 pointer-events-auto">
              <button onClick={e => { e.stopPropagation(); handleMoveBlock(section.id, 'up'); }} disabled={topIndex === 0} title="위로 이동"
                className="bg-gray-700 text-white text-[11px] font-black px-1 py-0.5 hover:bg-gray-900 disabled:opacity-30 flex items-center"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleMoveBlock(section.id, 'down'); }} disabled={topIndex === blocks.length - 1} title="아래로 이동"
                className="bg-gray-700 text-white text-[11px] font-black px-1 py-0.5 hover:bg-gray-900 disabled:opacity-30 flex items-center"><ChevronDown className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleDuplicateBlock(section.id); }} title="복제"
                className="bg-blue-500 text-white text-[11px] font-black px-1.5 py-0.5 hover:bg-blue-600 flex items-center"><Copy className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleDeleteBlock(section.id); }} title="섹션 삭제"
                className="bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 hover:bg-red-600">✕</button>
            </div>
          )}
        </div>
        <div draggable onDragStart={e => onDragStartNode(e, section.id)} onClick={e => e.stopPropagation()}
          className={`absolute left-1 top-1 cursor-grab z-40 p-1 rounded transition-opacity ${isSel ? 'opacity-70' : 'opacity-0 group-hover/sec:opacity-60'}`} title="드래그하여 섹션 순서 변경">
          <GripVertical className="w-3.5 h-3.5 text-orange-400" />
        </div>

        {/* 섹션 배경 + 콘텐츠 (공개 렌더 SectionBlock 과 동일 시각) */}
        {/* 에디터에선 overflow:visible — 행 툴바(-top-6)·+위젯(-bottom-3) 등 음수 오프셋 chrome 이
            섹션 경계 밖으로 나가도 보이게 한다. 공개 SectionBlock 은 overflow:hidden 유지(장식 클리핑). */}
        <div className="wb-section" style={{ position: 'relative', overflow: 'visible', ...resolveSectionBg(section) }}>
          {/* 배경 장식(워터마크·셰이프) — 공개 SectionBlock 과 동일한 공유 컴포넌트. 자체 overflow:hidden 으로 섹션 경계 클리핑 → 에디터/공개 동일 시각 */}
          <SectionDecor block={section} />
          {hasOverlay && <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${(section.bgOverlay || 0) / 100})`, zIndex: 1 }} />}
          <div className="wbe-secbody" style={{
            position: 'relative', zIndex: 2,
            maxWidth: section.maxWidth ? `${section.maxWidth}px` : '100%', margin: '0 auto',
            paddingTop: `${section.paddingY ?? 80}px`, paddingBottom: `${section.paddingY ?? 80}px`,
            paddingLeft: `${section.paddingX ?? 32}px`, paddingRight: `${section.paddingX ?? 32}px`,
            display: 'flex', flexDirection: 'column', gap: `${section.gap ?? 32}px`,
          }}>
            {(section.rows || []).map((row: any, ri: number) => (
              <div key={row.id} className="relative group/row">
                {/* 행 툴바 — 행 위쪽 gap 에 오버레이. 해당 행 hover 또는 행 선택 시에만(맥락형) */}
                <div className={`absolute -top-6 left-0 z-30 flex items-center gap-1.5 transition-opacity pointer-events-auto ${selectedBlockId === row.id ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'}`}
                  onClick={e => e.stopPropagation()}>
                  <span className="text-[11px] font-black text-orange-700/70 bg-white/80 px-1 rounded">열</span>
                  <div className="inline-flex border border-orange-300 rounded overflow-hidden bg-white">
                    {[1, 2, 3, 4].map(n => (
                      <button key={n} onClick={e => { e.stopPropagation(); handleSetRowCols(row.id, n); }}
                        className={`px-2 py-0.5 text-[11px] font-black ${ (row.cols || 1) === n ? 'bg-orange-500 text-white' : 'bg-white text-orange-600 hover:bg-orange-50'}`}>{n}</button>
                    ))}
                  </div>
                  <button onClick={e => { e.stopPropagation(); setSelectedBlockId(row.id); }} title="행 세부 설정 (비율)"
                    className="px-1.5 py-0.5 text-[11px] font-bold border border-orange-200 rounded text-orange-600 bg-white hover:bg-orange-50">비율</button>
                  <button onClick={e => { e.stopPropagation(); handleMoveRow(section.id, row.id, 'up'); }} disabled={ri === 0} title="행 위로"
                    className="p-0.5 border border-orange-200 rounded text-orange-600 bg-white hover:bg-orange-50 disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={e => { e.stopPropagation(); handleMoveRow(section.id, row.id, 'down'); }} disabled={ri === (section.rows.length - 1)} title="행 아래로"
                    className="p-0.5 border border-orange-200 rounded text-orange-600 bg-white hover:bg-orange-50 disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteBlock(row.id); }} title="행 삭제"
                    className="p-0.5 border border-red-200 rounded text-red-500 bg-white hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                </div>
                {/* 행 그리드 */}
                <div className="wb-section-row" data-collapse={(row.cols || 1) >= 2 ? '' : undefined}
                  style={{ display: 'grid', gridTemplateColumns: rowGridTemplate(row), gap: `${row.gap ?? 24}px`, alignItems: 'start' }}>
                  {(row.columns || []).map((col: any, ci: number) => {
                    const colInfo = { sectionId: section.id, rowId: row.id, colId: col.id };
                    const empty = (col.widgets || []).length === 0;
                    const isColOver = dragOverId === col.id;
                    const rowCard = rowCardWrapStyle(row, resolveThemeHex(activeTheme));
                    return (
                      <div key={col.id}
                        onDragOver={e => { if (dragId) { e.preventDefault(); setDragOverId(col.id); } }}
                        onDrop={e => { e.preventDefault(); onDropInColumn(section.id, row.id, col.id, null); }}
                        className={`wbe-col relative group/col rounded transition-colors ${isColOver ? 'outline outline-2 outline-green-500 bg-green-50/40' : ''}`}
                        style={{ display: 'flex', flexDirection: 'column', gap: `${row.rowGap ?? row.gap ?? 24}px`, minWidth: 0, minHeight: empty ? '56px' : undefined, ...(rowCard || {}) }}>
                        {rowCard && <RowCardHeader row={row} idx={ci} accent={resolveThemeHex(activeTheme)} />}
                        {(col.widgets || []).map((w: any) => renderWidgetShell(w, { nested: true, colInfo }))}
                        {/* 빈 칸 — 점선 테두리 + 작은 + 아이콘만(문구 제거로 노이즈 감소). 칸 hover/섹션 선택 시 */}
                        {empty && (
                          <div className={`absolute inset-0 flex items-center justify-center border border-dashed border-orange-200 rounded transition-opacity pointer-events-none ${isSel ? 'opacity-100' : 'opacity-0 group-hover/col:opacity-100'}`}>
                            <Plus className="w-4 h-4 text-orange-300" />
                          </div>
                        )}
                        {/* + 위젯 — 컬럼 하단 오버레이. 해당 칸 hover 또는 섹션 선택 시에만(맥락형) */}
                        <button onClick={e => { e.stopPropagation(); setColPicker(colInfo); }} title="이 칸에 위젯 추가"
                          className={`absolute left-1/2 -translate-x-1/2 -bottom-3 z-30 inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-orange-300 bg-white text-orange-600 text-[12px] font-bold rounded shadow-sm transition-opacity ${isSel ? 'opacity-100' : 'opacity-0 group-hover/col:opacity-100'}`}>
                          <Plus className="w-3 h-3" /> 위젯
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {/* 행 추가 — 섹션 하단 오버레이. 섹션 선택 시에만. 단일 버튼으로 단순화(열 수는 행 툴바에서 1~4 조정) */}
          <div className={`absolute left-0 right-0 bottom-1 z-30 flex items-center justify-center transition-opacity ${isSel ? 'opacity-100' : 'opacity-0'}`} onClick={e => e.stopPropagation()}>
            <button onClick={e => { e.stopPropagation(); addRowToSection(section.id, 1); }} title="행 추가 (열 수는 행 위 1~4 버튼에서 조정)"
              className="inline-flex items-center gap-1 px-3 py-1 border border-dashed border-orange-300 bg-white text-orange-600 text-[11px] font-bold rounded hover:bg-orange-50">
              <Plus className="w-3 h-3" /> 행 추가
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">

      {/* 단일 렌더 코어(blockKit)가 의존하는 공유 CSS — 공개 페이지와 동일 시각 보장 */}
      <style dangerouslySetInnerHTML={{ __html: WB_STYLE }} />

      {/* ── Top Bar ── */}
      <header className="h-13 border-b border-black bg-white flex items-center justify-between px-5 flex-shrink-0" style={{ height: '52px' }}>
        <div className="flex items-center gap-3">
          <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 border border-transparent hover:border-black rounded transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-px h-5 bg-gray-200" />
          <h1 className="font-black text-sm tracking-tight">1-Page 웹빌더</h1>
          <div className="w-px h-5 bg-gray-200" />
          <button onClick={undo} disabled={!canUndo} title="실행취소 (Ctrl+Z)"
            className="p-1.5 border border-transparent hover:border-gray-300 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={redo} disabled={!canRedo} title="재실행 (Ctrl+Y)"
            className="p-1.5 border border-transparent hover:border-gray-300 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-5 bg-gray-200" />
          <div className="text-xs font-bold flex items-center gap-1" title="편집 내용은 초안으로 자동 임시저장됩니다. 방문자에게는 '발행'한 내용만 보입니다.">
            {saveStatus === 'saving'  && <><Loader className="w-3 h-3 animate-spin text-gray-400" /><span className="text-gray-400">임시저장 중...</span></>}
            {saveStatus === 'saved'   && <><Check className="w-3 h-3 text-green-500" /><span className="text-gray-400">초안 저장됨</span></>}
            {saveStatus === 'unsaved' && <span className="text-orange-500 font-black">● 저장 안 됨</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded overflow-hidden">
            {[{ mode: 'desktop', Icon: Monitor, label: '데스크톱' }, { mode: 'tablet', Icon: Tablet, label: '태블릿' }, { mode: 'mobile', Icon: Smartphone, label: '모바일' }].map(({ mode, Icon, label }) => (
              <button key={mode} onClick={() => setViewportMode(mode as typeof viewportMode)} title={label}
                className={`p-1.5 transition-colors ${viewportMode === mode ? 'bg-black text-white' : 'text-gray-400 hover:bg-gray-100'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          {/* 발행 상태 안내 — 무엇이 방문자에게 보이는지 명확히 */}
          <div className="text-[11px] font-bold flex items-center gap-1 mr-0.5"
            title={isPublished ? '방문자에게는 마지막으로 발행한 내용이 보입니다.' : '아직 발행 전이라 방문자에게는 기본 소개 페이지가 보입니다.'}>
            {!isPublished
              ? <span className="text-gray-400">미발행 · 기본 페이지 노출</span>
              : hasUnpublishedChanges
                ? <span className="text-orange-500">● 발행 안 된 변경사항</span>
                : <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />발행됨</span>}
          </div>
          <Link to={`/clubs/${adminClub?.slug ?? ''}`} target="_blank"
            title="편집 중인 초안을 새 탭에서 전체 화면으로 미리봅니다."
            className="px-3 py-1.5 border border-black bg-white hover:bg-gray-50 text-xs font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-px transition-all">
            미리보기
          </Link>
          {(() => {
            const canPublish = !isPublished || hasUnpublishedChanges;
            return (
              <button onClick={handlePublish} disabled={!canPublish || publishing}
                title={canPublish ? '현재 초안을 공개본으로 발행합니다.' : '발행할 변경사항이 없습니다.'}
                className={`px-4 py-1.5 font-black border text-xs transition-all flex items-center gap-1.5 ${
                  canPublish
                    ? 'border-black bg-orange-500 text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px active:shadow-none active:translate-y-px'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-default'}`}>
                <Globe className="w-3.5 h-3.5" />
                {publishing ? '발행 중...' : (!isPublished ? '발행' : hasUnpublishedChanges ? '변경사항 발행' : '발행됨')}
              </button>
            );
          })()}
        </div>
      </header>

      {/* ── 동시 편집 안내 배너 — 다른 운영진이 같은 페이지를 열고 있을 때만 ── */}
      {editors.length > 0 && (
        <div className="flex items-center gap-2 px-5 py-1.5 bg-amber-50 border-b border-amber-300 text-[12px] font-bold text-amber-800 flex-shrink-0">
          <span className="inline-flex w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          지금 <b className="font-black">{editors.map(e => e.name).join(', ')}</b>님도 이 페이지를 편집 중이에요.
          같은 부분을 동시에 바꾸면 나중에 저장한 쪽이 우선되니 주의하세요.
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Rail: 얇은 바 + 위젯 추가(+) → 모달 ── */}
        <aside className="w-14 border-r border-black bg-white flex flex-col items-center pt-4 shrink-0 gap-1.5">
          <button onClick={() => setWidgetPickerOpen(true)} title="위젯 추가"
            className="w-10 h-10 flex items-center justify-center border-2 border-black rounded bg-white hover:bg-black hover:text-white transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none">
            <Plus className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-black text-gray-400 tracking-wide">추가</span>
        </aside>

        {/* ── Center Canvas ── */}
        <main
          className="flex-1 bg-[#f0f0f0] flex flex-col items-center overflow-y-auto p-6 relative min-h-0"
          onClick={() => { setSelectedBlockId(null); setEditingBlockId(null); setInsertMenuIdx(null); }}
        >
          {fetching ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-7 h-7 animate-spin text-orange-500" />
            </div>
          ) : (
            <div
              /* overflowX:clip → 풀블리드 위젯이 프레임 좌우로 새는 것만 막고,
                 overflowY:visible → 위젯/섹션 편집 chrome(툴바·+버튼)이 위아래로 안 잘리게 한다.
                 (overflow:hidden 은 양축을 모두 잘라 chrome 을 먹어버림) */
              className="border border-gray-300 shadow-xl min-h-[800px] flex flex-col relative shrink-0 w-full transition-[max-width] duration-200"
              style={{
                maxWidth: viewportMode === 'mobile' ? '390px' : viewportMode === 'tablet' ? '768px' : '100%',
                backgroundColor: pageBgColor || '#ffffff',
                fontFamily: globalFont || undefined,
                overflowX: 'clip',
                overflowY: 'visible',
              }}
              onClick={e => e.stopPropagation()}>

              {/* ── Blocks list ── 페이지 배경(pageBgColor)은 프레임 전체를 채우고,
                   본문만 contentWidth로 캡 → 너비를 줄이면 좌우 여백에 배경색이 드러남(실제 페이지와 동일)
                   wb-root: 공개 페이지와 동일한 한글 줄바꿈(word-break:keep-all) 규칙을 에디터에도 적용 */}
              <div className="wb-root flex-1 w-full flex flex-col" style={{ backgroundColor: pageBgColor || '#ffffff' }}>
                <div
                  className="w-full mx-auto flex flex-col flex-1 transition-[max-width] duration-200"
                  style={{ maxWidth: contentWidth === 'full' ? '100%' : `${contentWidth}px` }}
                >
                {blocks.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-300 py-20">
                    <MousePointer className="w-8 h-8" />
                    <button onClick={() => setWidgetPickerOpen(true)} className="font-black text-sm flex items-center gap-1.5 px-4 py-2.5 border-2 border-black rounded text-black hover:bg-black hover:text-white transition-colors shadow-[3px_3px_0_0_rgba(0,0,0,1)]"><Plus className="w-4 h-4" /> 위젯 추가하기</button>
                  </div>
                )}

                {blocks.map((block, bi) => (
                  <React.Fragment key={block.id}>
                    {insertZone(bi)}
                    {block.type === 'section' ? renderSection(block, bi) : renderWidgetShell(block, { topIndex: bi })}
                  </React.Fragment>
                ))}

                {blocks.length > 0 && insertZone(blocks.length)}

                {/* 섹션 밖으로 빼기(위젯) / 끝으로 이동 드롭존 — 드래그 중에만 노출 */}
                {dragId && (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOverId('__bottom__'); }}
                    onDrop={e => { e.preventDefault(); onDropOnTop(null); }}
                    className={`mx-10 my-3 py-4 border-2 border-dashed rounded text-center text-[12px] font-bold transition-colors ${dragOverId === '__bottom__' ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 text-gray-400'}`}>
                    ⬇ 여기에 놓으면 섹션 밖 맨 아래로 이동합니다
                  </div>
                )}

                {blocks.length > 0 && (
                  <div className="py-8 px-10">
                    <button onClick={() => setWidgetPickerOpen(true)} className="w-full py-6 border-2 border-dashed border-gray-200 hover:border-black flex items-center justify-center gap-2 text-gray-400 hover:text-black text-xs font-bold transition-colors">
                      <Plus className="w-3.5 h-3.5" /> 위젯 추가
                    </button>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {showFloatingBtn && (
            <div className="sticky bottom-6 self-end mr-4 z-50 pointer-events-none max-w-[860px] w-full flex justify-end -mt-16">
              <button
                className={`pointer-events-auto px-6 py-3 font-black border-2 border-black text-sm shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all ${getThemeText(activeTheme)}`}
                style={{ backgroundColor: resolveThemeHex(activeTheme) }}
              >
                지원하기 →
              </button>
            </div>
          )}
        </main>

        {/* ── Right Panel ── */}
        {selectedBlock ? (
          <BlockPropertiesPanel
            block={selectedBlock}
            kind={selectedKind}
            onUpdate={(field, value) => {
              if (field === '__setCols') handleSetRowCols(selectedBlock.id, value);
              else if (field === '__merge') commit(patchNode(blocks, selectedBlock.id, value), false, `${selectedBlock.id}:merge`);
              else upd(selectedBlock.id, field, value);
            }}
            onDeselect={() => setSelectedBlockId(null)}
            onDelete={() => handleDeleteBlock(selectedBlock.id)}
            themeHex={themeHex}
            activeTheme={activeTheme}
          />
        ) : (
          <WorkspaceProperties
            activeTheme={activeTheme} setActiveTheme={mkConfigSetter(setActiveTheme, 'activeTheme')}
            showFloatingBtn={showFloatingBtn} setShowFloatingBtn={mkConfigSetter(setShowFloatingBtn, 'showFloatingBtn')}
            smoothScroll={smoothScroll} setSmoothScroll={mkConfigSetter(setSmoothScroll, 'smoothScroll')}
            contentWidth={contentWidth} setContentWidth={mkConfigSetter(setContentWidth, 'contentWidth')}
            pageBgColor={pageBgColor} setPageBgColor={mkConfigSetter(setPageBgColor, 'pageBgColor')}
            globalFont={globalFont} setGlobalFont={mkConfigSetter(setGlobalFont, 'globalFont')}
          />
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 font-bold text-sm flex items-center gap-2 shadow-[4px_4px_0_0_rgba(249,115,22,0.7)]">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}

      {/* ── 저장 충돌 모달 — 다른 운영진이 먼저 저장해 버전이 어긋났을 때 ── */}
      {conflict && (
        <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] w-[440px] max-w-[92vw] p-6">
            <div className="font-black text-lg mb-2">다른 사람이 페이지를 수정했어요</div>
            <p className="text-[13px] font-bold text-gray-600 leading-relaxed mb-5">
              내가 편집하는 동안 다른 운영진이 이 페이지를 저장했습니다.
              지금 내 변경을 그대로 저장하면 <b className="text-black">상대의 변경이 사라집니다.</b><br />
              어떻게 할지 선택해 주세요.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={resolveReload}
                className="w-full px-4 py-2.5 font-black text-sm border-2 border-black bg-orange-500 text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px active:translate-y-px active:shadow-none transition-all">
                최신 내용 불러오기 <span className="font-bold text-black/70">(내 변경 취소)</span>
              </button>
              <button onClick={resolveOverwrite}
                className="w-full px-4 py-2.5 font-black text-sm border-2 border-black bg-white hover:bg-gray-50 shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-px active:shadow-none transition-all">
                내 변경으로 덮어쓰기 <span className="font-bold text-gray-500">(상대 변경 삭제)</span>
              </button>
            </div>
            <p className="text-[11px] font-bold text-gray-400 mt-3 leading-snug">
              내 변경이 중요하다면 먼저 내용을 복사해 둔 뒤 ‘최신 내용 불러오기’를 누르는 것이 안전합니다.
            </p>
          </div>
        </div>
      )}

      {/* 위젯 추가 모달 (좌측 레일 + 버튼) */}
      {widgetPickerOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={() => setWidgetPickerOpen(false)}>
          <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] p-5 w-[540px] max-w-[92vw] animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-black text-base">위젯 추가</div>
              <button onClick={() => setWidgetPickerOpen(false)} className="p-1.5 border border-gray-200 hover:border-black rounded transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-[62vh] overflow-y-auto hide-scrollbar">
              {PALETTE.map(({ type, label, icon: Icon, disabled }) => (
                <button key={type} disabled={disabled} onClick={() => { handleAddBlock(type); setWidgetPickerOpen(false); }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 border rounded transition-all text-center group
                    ${disabled ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                      : 'border-gray-200 hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] cursor-pointer'}`}>
                  <Icon className={`w-5 h-5 shrink-0 ${disabled ? 'text-gray-300' : 'text-gray-500 group-hover:text-black'}`} />
                  <span className={`font-bold text-[12px] leading-tight ${disabled ? 'text-gray-300' : 'text-gray-700 group-hover:text-black'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 섹션 컬럼 위젯 피커 */}
      {colPicker && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center" onClick={() => setColPicker(null)}>
          <div className="bg-white border-2 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] p-4 w-[360px]" onClick={e => e.stopPropagation()}>
            <div className="text-xs font-black mb-3">이 칸에 추가할 위젯 선택</div>
            <div className="grid grid-cols-3 gap-1.5 max-h-[60vh] overflow-y-auto hide-scrollbar">
              {COLUMN_WIDGETS.map(({ type, label, icon: Icon }) => (
                <button key={type} onClick={() => { addWidgetToColumn(type, colPicker.sectionId, colPicker.rowId, colPicker.colId); setColPicker(null); }}
                  className="flex flex-col items-center gap-1 p-2.5 border border-gray-200 rounded hover:border-black hover:bg-rose-50 transition-colors">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <span className="text-[12px] font-bold text-gray-600 leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDownIn { from { opacity:0; transform:translateY(-12px) scale(0.99); } to { opacity:1; transform:none; } }
        .animate-slide-down { animation: slideDownIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards; }
      ` }} />
    </div>
  );
}
