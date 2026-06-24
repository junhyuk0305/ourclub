import React, { useState, useEffect, useRef } from 'react';
import {
  Type, CheckSquare, Plus, Layout, ArrowLeft,
  Loader, Check, Globe, ChevronDown, ChevronUp, Clock,
  MessageSquare, Layers, MousePointer, GripVertical, Image as ImageIcon,
  Minus, Columns, RotateCcw, RotateCw, Monitor, Tablet, Smartphone,
  Copy, BarChart2, LayoutGrid, Timer, Trash2, X, ChevronLeft, ChevronRight, LayoutTemplate,
} from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import SectionTemplateModal from '../../components/admin/SectionTemplateModal';
import { instantiateTemplate } from '../../lib/templates/sections';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { WorkspaceProperties } from '../../components/admin/WorkspaceProperties';
import { BlockPropertiesPanel } from '../../components/admin/BlockPropertiesPanel';
import { BlockBody, WB_STYLE, genId, mkSection, mkRow, rowGridTemplate, resolveSectionBg, SectionDecor, rowCardWrapStyle, RowCardHeader, resolveThemeHex, getThemeText, THEME_HEX } from '../../components/blockKit';
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
  return { id, title: `카드 제목 ${n}`, text: '여기에 내용을 입력하세요.', align: 'left', bgColor: '#ffffff', textColor: '#6B6259', titleColor: '#1F1B18', titleSize: 18, textSize: 14, padding: 24, borderRadius: 12, borderWidth: 1, borderColor: '#EBE6DF', imgSrc: '', imgPosition: 'top', imgHeight: 180 };
}

function mkSlide(id: string) {
  return { id, bgType: 'color', bgValue: '#1F1B18', overlayOpacity: 0, h1: '메인 카피를\n입력하세요', subtitle: '서브 카피를 입력하세요', href: '', align: 'center' };
}

/* ─────────────────────────────────────────────
   makeWidget — 위젯 타입별 기본값 (top-level·섹션 컬럼 공용)
   섹션(section)은 mkSection() 으로 별도 생성한다.
───────────────────────────────────────────── */
function makeWidget(type: string): any {
  const id = genId();
  let nb: any = { id, type };
  if (type === 'text')            nb = { ...nb, text: '텍스트를 입력하세요.', seoTag: 'p', align: 'left', fontSize: 16, fontWeight: 400, textColor: '#1F1B18', lineHeight: 1.7, paddingY: 32 };
  if (type === 'button')          nb = { ...nb, text: '버튼 텍스트', actionUrl: '', btnSize: 'm', btnTextColor: '#ffffff', borderWidth: 0, radius: 12, btnShadow: 'none', btnAnim: 'none', btnTemplate: 'solid', paddingY: 32 };
  if (type === 'countdown')       nb = { ...nb, label: '모집 마감까지', expiredText: '모집이 마감되었습니다', bgColor: '#1F1B18', textColor: '#ffffff', accentColor: '', paddingY: 56 };
  if (type === 'faq')             nb = { ...nb, title: '자주 묻는 질문', items: [{ id: id + '_1', question: '질문을 입력하세요', answer: '답변을 입력하세요.' }], iconStyle: 'plus', openBg: '#FDF2E9' };
  if (type === 'timeline')        nb = { ...nb, title: '모집 프로세스', nodes: [{ id: id + '_1', title: '1단계', desc: '설명을 입력하세요' }, { id: id + '_2', title: '2단계', desc: '설명을 입력하세요' }], activeColor: '#EC6A2C', lineColor: '#1F1B18' };
  if (type === 'heroSlider')      nb = { ...nb, height: 60, slides: [mkSlide(id + '_s1')], autoPlay: false, interval: 4000 };
  if (type === 'layoutContainer') nb = { ...nb, mode: 'tabs', cols: 2, gap: 20, paddingY: 40, bgColor: '', cells: [mkCell(id + '_c1', 1), mkCell(id + '_c2', 2)] };
  if (type === 'spacer')          nb = { ...nb, height: 64 };
  if (type === 'image')           nb = { ...nb, src: '', alt: '', width: 100, align: 'center', aspect: 'auto', objectFit: 'cover', radius: 0, paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 };
  if (type === 'divider')         nb = { ...nb, variant: 'line', style: 'solid', color: '#EBE6DF', thickness: 1, width: 100, paddingY: 24, bgColor: '',
                                          tickerItems: ['브랜드 전략 동아리', '2019년 창립', '누적 프로젝트 32건', '현업 취업률 80%'], separator: '✦', speed: 24, tickerFontSize: 13 };
  if (type === 'stats')           nb = { ...nb, items: [mkStatItem(id+'_1','200+','누적 회원'),mkStatItem(id+'_2','50+','완성 프로젝트'),mkStatItem(id+'_3','3년','운영 역사')], cols: 3, layout: 'strip', bgColor: '#ffffff', valueColor: '#1F1B18', labelColor: '#7A7066', valueSize: 48, labelSize: 14, paddingY: 56, animate: true };
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
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

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

  /* 우측 속성 패널 접기/펼치기 — 접으면 캔버스가 풀폭이 된다(상태는 localStorage 기억). */
  const [panelOpen, setPanelOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('wb-panel-open') !== '0'; } catch { return true; }
  });
  const togglePanel = () => setPanelOpen(o => { const next = !o; try { localStorage.setItem('wb-panel-open', next ? '1' : '0'); } catch {} return next; });
  /* prefers-reduced-motion 준수 — 켜져 있으면 패널 전환 애니메이션을 즉시(0s)로 처리한다. */
  const reduceMotion = useReducedMotion();
  const panelTransition = reduceMotion ? { duration: 0 } : { duration: 0.22, ease: [0.32, 0.72, 0, 1] as const };

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

  /* 섹션 템플릿 삽입 — 선택 블록 다음(없으면 맨 끝)에 한 덩어리. instantiate 가 모든 id 재생성. */
  const handleInsertTemplate = (tplBlock: any) => {
    const nb = instantiateTemplate(tplBlock);
    newBlockIdRef.current = nb.id;
    const selIdx = selectedBlockId ? blocks.findIndex(b => b.id === selectedBlockId) : -1;
    const insertAt = selIdx >= 0 ? selIdx + 1 : blocks.length;
    commit([...blocks.slice(0, insertAt), nb, ...blocks.slice(insertAt)], true);
    setSelectedBlockId(nb.id);
    setTemplateModalOpen(false);
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

  const selectedFound = selectedBlockId ? findNode(blocks, selectedBlockId) : null;
  const selectedBlock = selectedFound?.node ?? null;
  const selectedKind = selectedFound?.kind ?? null;

  /* inter-block insert affordance — a hairline+button at each gap that opens a widget picker */
  const insertZone = (idx: number) => {
    const open = insertMenuIdx === idx;
    return (
      <div className="relative w-full h-0 z-30" onClick={e => e.stopPropagation()}>
        <div className="group/iz absolute left-0 right-0 -top-2 h-4 flex items-center justify-center">
          <div className={`absolute left-10 right-10 h-px bg-brand transition-opacity ${open ? 'opacity-100' : 'opacity-0 group-hover/iz:opacity-100'}`} />
          <button
            onClick={() => setInsertMenuIdx(open ? null : idx)}
            title="여기에 위젯 추가"
            className={`relative flex items-center justify-center w-5 h-5 rounded-full border border-brand bg-white text-brand hover:bg-brand hover:text-white transition-all ${open ? 'opacity-100 rotate-45' : 'opacity-0 group-hover/iz:opacity-100'}`}>
            <Plus className="w-3 h-3" />
          </button>
        </div>
        {open && (
          <div className="absolute z-50 left-1/2 -translate-x-1/2 top-2.5 w-64 bg-white border border-sand-200 rounded-card shadow-soft-lg p-2"
            onClick={e => e.stopPropagation()}>
            <div className="text-[12px] font-black text-sand-400 uppercase tracking-widest px-1 pb-1.5">여기에 위젯 삽입</div>
            <div className="grid grid-cols-3 gap-1">
              {PALETTE.filter(p => !p.disabled).map(({ type, label, icon: Icon }) => (
                <button key={type} onClick={() => handleAddBlock(type, idx)}
                  className="flex flex-col items-center gap-1 p-2 border border-sand-200 rounded-ctl hover:border-brand hover:bg-brand-tint transition-colors">
                  <Icon className="w-3.5 h-3.5 text-sand-500" />
                  <span className="text-[12px] font-bold text-sand-600 leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* 컬럼에 넣을 수 있는 위젯 — 섹션 중첩 금지 + 자체로 폭/레이아웃을 크게 차지하는 위젯은 제외
     (FAQ·프로세스 다이어그램·통계 카운터·탭/캐러셀·카운트다운은 섹션 컬럼 안에 넣지 않는다) */
  const SECTION_EXCLUDED_WIDGETS = new Set(['section', 'faq', 'timeline', 'stats', 'layoutContainer', 'countdown']);
  const COLUMN_WIDGETS = PALETTE.filter(p => !p.disabled && !SECTION_EXCLUDED_WIDGETS.has(p.type));

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
          ${isSel ? 'z-20' : 'hover:ring-inset hover:ring-2 hover:ring-brand/40 hover:z-10'}
          ${isDragOver && dragId !== block.id ? 'ring-2 ring-green-500' : ''}`}
      >
        {/* 선택 외곽선 — 위젯 콘텐츠(배경 포함) 위에 그려 항상 보이게 */}
        {isSel && <div className="pointer-events-none absolute inset-0 z-[25] border-2 border-brand" />}
        {/* 드래그 핸들 — 위젯 좌측 중앙. 섹션 내부(nested)는 컬럼 바깥(-left-6)에, top-level 은
           프레임이 overflowX:clip 이라 바깥이 잘리므로 안쪽(left-0)에 둬서 항상 보이게 한다. */}
        <div draggable onDragStart={e => onDragStartNode(e, block.id)} onClick={e => e.stopPropagation()}
          className={`absolute ${nested ? '-left-6 rounded-l' : 'left-0 rounded-r'} top-1/2 -translate-y-1/2 cursor-grab z-30 bg-brand text-white p-1 transition-opacity ${isSel ? 'opacity-90' : 'opacity-0 group-hover:opacity-70'}`}
          title="드래그하여 이동">
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* 라벨 + 액션 — 선택 시 상단 가장자리. 드래그 핸들은 위 좌측 바깥에 분리 배치. */}
        <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-0.5 z-30 pointer-events-none transition-opacity ${isSel ? 'opacity-100' : 'opacity-0'}`}>
          <span className="text-white text-[11px] font-black px-1.5 py-0.5 pointer-events-none bg-brand">{PALETTE_LABEL[block.type] ?? block.type}</span>
          {isSel && (
            <div className="flex items-center gap-0.5 pointer-events-auto">
              <button onClick={e => { e.stopPropagation(); handleMoveBlock(block.id, 'up'); }} disabled={!nested && topIndex === 0} title="위로 이동"
                className="bg-ink/80 text-white text-[11px] font-black px-1 py-0.5 hover:bg-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleMoveBlock(block.id, 'down'); }} disabled={!nested && topIndex === blocks.length - 1} title="아래로 이동"
                className="bg-ink/80 text-white text-[11px] font-black px-1 py-0.5 hover:bg-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center"><ChevronDown className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleDuplicateBlock(block.id); }} title="복제"
                className="bg-blue-500 text-white text-[11px] font-black px-1.5 py-0.5 hover:bg-blue-600 transition-colors flex items-center gap-0.5"><Copy className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleDeleteBlock(block.id); }} title="삭제"
                className="bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 hover:bg-red-600 transition-colors">✕</button>
            </div>
          )}
        </div>

        {/* 텍스트 서식은 멀티라인 필드의 리치 에디터(RichEditable) 자체 툴바가 담당 — 드래그 선택 글자에 적용 */}
        {/* 기본 글꼴(globalFont)은 위젯 콘텐츠에만 적용 — 빌더 chrome(툴바·+버튼·라벨)은 고정 UI 글꼴 유지.
           공개 렌더의 .wb-root 가 콘텐츠만 감싸는 것과 동일 원리. */}
        <div style={{ fontFamily: globalFont || undefined }}>
          <BlockBody block={block} ctx={{ activeTheme, themeColor: resolveThemeHex(activeTheme), edit: true, upd: (field: string, value: any) => upd(block.id, field, value) }} />
        </div>
      </div>
    );
  };

  /* 섹션 에디터 — chrome(툴바·DnD) + 행/컬럼. 위젯 시각은 renderWidgetShell 재사용. */
  const renderSection = (section: any, topIndex: number) => {
    const isSel = selectedBlockId === section.id;
    const hasImage = section.bgType === 'image' && section.bgImage;
    const hasOverlay = hasImage && (section.bgOverlay ?? 0) > 0;
    /* 배경 패럴랙스(Track B)는 공개 페이지에서만 스크롤로 움직인다. 에디터에는 스크롤 컨텍스트가 없으므로
       '정적 미리보기'로 배경 이미지를 그대로 보여준다(패럴랙스 ON 시 resolveSectionBg 는 검정 반환 → 안 그리면 까맣게 보임). */
    const parallaxPreview = hasImage && (section.bgParallax ?? 0) > 0 ? section.bgImage : null;
    /* 배경 모션(Ken Burns)이 켜지면 배경 이미지는 별도 애니메이션 레이어가 그린다(공개 SectionBlock 과 동일).
       이 레이어가 없으면 resolveSectionBg 가 검정을 반환해 에디터에서 배경이 까맣게 보인다. 패럴랙스가 켜지면 그쪽이 우선. */
    const kenBurns = !parallaxPreview && hasImage && section.bgKenBurns && section.bgKenBurns !== 'none' ? section.bgKenBurns : null;
    return (
      <div key={section.id}
        ref={el => { if (el) blockElRefs.current[section.id] = el as HTMLDivElement; }}
        onClick={e => { e.stopPropagation(); setSelectedBlockId(section.id); setInsertMenuIdx(null); }}
        onDragOver={e => { if (dragId && dragId !== section.id) { e.preventDefault(); setDragOverId(section.id); } }}
        onDrop={e => { e.preventDefault(); onDropOnTop(section.id); }}
        onDragEnd={clearDrag}
        /* hover/선택 시 z-30 으로 올려, 음수 오프셋 chrome(+위젯·행 추가·열 버튼)이
           다음 섹션에 가려지지 않고 위에 그려지도록 한다. */
        className={`relative group/sec transition-all animate-slide-down ${isSel ? 'z-30' : 'hover:ring-inset hover:ring-2 hover:ring-brand/40 hover:z-30'}`}
      >
        {/* 선택 외곽선 — 섹션 배경/콘텐츠 위에 그려 항상 보이게 */}
        {isSel && <div className="pointer-events-none absolute inset-0 z-[35] border-2 border-brand" />}
        {/* 섹션 툴바 — hover 시엔 라벨만, 선택 시에만 액션 버튼 노출 (위젯과 동일한 맥락형 규칙) */}
        <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-0.5 z-40 pointer-events-none transition-opacity ${isSel ? 'opacity-100' : 'opacity-0 group-hover/sec:opacity-100'}`}>
          <span className={`ml-5 text-white text-[11px] font-black px-1.5 py-0.5 pointer-events-none ${isSel ? 'bg-brand' : 'bg-brand/90'}`}>섹션</span>
          {isSel && (
            <div className="flex items-center gap-0.5 pointer-events-auto">
              <button onClick={e => { e.stopPropagation(); handleMoveBlock(section.id, 'up'); }} disabled={topIndex === 0} title="위로 이동"
                className="bg-ink/80 text-white text-[11px] font-black px-1 py-0.5 hover:bg-ink disabled:opacity-30 flex items-center"><ChevronUp className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleMoveBlock(section.id, 'down'); }} disabled={topIndex === blocks.length - 1} title="아래로 이동"
                className="bg-ink/80 text-white text-[11px] font-black px-1 py-0.5 hover:bg-ink disabled:opacity-30 flex items-center"><ChevronDown className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleDuplicateBlock(section.id); }} title="복제"
                className="bg-blue-500 text-white text-[11px] font-black px-1.5 py-0.5 hover:bg-blue-600 flex items-center"><Copy className="w-3 h-3" /></button>
              <button onClick={e => { e.stopPropagation(); handleDeleteBlock(section.id); }} title="섹션 삭제"
                className="bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 hover:bg-red-600">✕</button>
            </div>
          )}
        </div>
        <div draggable onDragStart={e => onDragStartNode(e, section.id)} onClick={e => e.stopPropagation()}
          className={`absolute left-1 top-1 cursor-grab z-40 p-1 rounded-ctl transition-opacity ${isSel ? 'opacity-70' : 'opacity-0 group-hover/sec:opacity-60'}`} title="드래그하여 섹션 순서 변경">
          <GripVertical className="w-3.5 h-3.5 text-brand" />
        </div>

        {/* 섹션 배경 + 콘텐츠 (공개 렌더 SectionBlock 과 동일 시각) */}
        {/* 에디터에선 overflow:visible — 행 툴바(-top-6)·+위젯(-bottom-3) 등 음수 오프셋 chrome 이
            섹션 경계 밖으로 나가도 보이게 한다. 공개 SectionBlock 은 overflow:hidden 유지(장식 클리핑). */}
        <div className="wb-section" style={{ position: 'relative', overflow: 'visible', ...resolveSectionBg(section) }}>
          {parallaxPreview && (
            /* 패럴랙스 정적 미리보기 — 섹션 경계로 클리핑(공개와 동일 시각). 실제 움직임은 공개 페이지에서만. */
            <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${parallaxPreview})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            </div>
          )}
          {kenBurns && (
            /* 에디터 섹션은 overflow:visible 이라 scale 애니메이션 레이어가 섹션 밖으로 새어나간다.
               → 자체 overflow:hidden 래퍼로 감싸 섹션 경계로 클리핑(공개 SectionBlock 의 overflow:hidden 과 동일 효과). */
            <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
              <div className={`wb-kenburns wb-ken-${kenBurns}`} style={{ backgroundImage: `url(${section.bgImage})` }} />
            </div>
          )}
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
                  <span className="text-[11px] font-black text-brand/70 bg-white/80 px-1 rounded">열</span>
                  <div className="inline-flex border border-brand/40 rounded-ctl overflow-hidden bg-white">
                    {[1, 2, 3, 4].map(n => (
                      <button key={n} onClick={e => { e.stopPropagation(); handleSetRowCols(row.id, n); }}
                        className={`px-2 py-0.5 text-[11px] font-black ${ (row.cols || 1) === n ? 'bg-brand text-white' : 'bg-white text-brand hover:bg-brand-tint'}`}>{n}</button>
                    ))}
                  </div>
                  <button onClick={e => { e.stopPropagation(); setSelectedBlockId(row.id); }} title="행 세부 설정 (비율)"
                    className="px-1.5 py-0.5 text-[11px] font-bold border border-brand/30 rounded-ctl text-brand bg-white hover:bg-brand-tint">비율</button>
                  <button onClick={e => { e.stopPropagation(); handleMoveRow(section.id, row.id, 'up'); }} disabled={ri === 0} title="행 위로"
                    className="p-0.5 border border-brand/30 rounded-ctl text-brand bg-white hover:bg-brand-tint disabled:opacity-30"><ChevronUp className="w-3 h-3" /></button>
                  <button onClick={e => { e.stopPropagation(); handleMoveRow(section.id, row.id, 'down'); }} disabled={ri === (section.rows.length - 1)} title="행 아래로"
                    className="p-0.5 border border-brand/30 rounded-ctl text-brand bg-white hover:bg-brand-tint disabled:opacity-30"><ChevronDown className="w-3 h-3" /></button>
                  <button onClick={e => { e.stopPropagation(); handleDeleteBlock(row.id); }} title="행 삭제"
                    className="p-0.5 border border-red-200 rounded-ctl text-red-500 bg-white hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
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
                        className={`wbe-col relative group/col rounded-ctl transition-colors ${isColOver ? 'outline outline-2 outline-green-500 bg-green-50/40' : ''}`}
                        style={{ display: 'flex', flexDirection: 'column', gap: `${row.rowGap ?? 24}px`, minWidth: 0, minHeight: empty ? '56px' : undefined, ...(rowCard || {}) }}>
                        {rowCard && <RowCardHeader row={row} idx={ci} accent={resolveThemeHex(activeTheme)} />}
                        {(col.widgets || []).map((w: any) => renderWidgetShell(w, { nested: true, colInfo }))}
                        {/* 빈 칸 — 점선 테두리 + 작은 + 아이콘만(문구 제거로 노이즈 감소). 칸 hover/섹션 선택 시 */}
                        {empty && (
                          <div className={`absolute inset-0 flex items-center justify-center border border-dashed border-brand/30 rounded-ctl transition-opacity pointer-events-none ${isSel ? 'opacity-100' : 'opacity-0 group-hover/col:opacity-100'}`}>
                            <Plus className="w-4 h-4 text-brand" />
                          </div>
                        )}
                        {/* + 위젯 — 컬럼 하단 오버레이. 해당 칸 hover 또는 섹션 선택 시에만(맥락형) */}
                        <button onClick={e => { e.stopPropagation(); setColPicker(colInfo); }} title="이 칸에 위젯 추가"
                          className={`absolute left-1/2 -translate-x-1/2 -bottom-3 z-30 inline-flex items-center gap-1 px-2.5 py-1 border border-dashed border-brand/40 bg-white text-brand hover:bg-brand-tint text-[12px] font-bold rounded-ctl shadow-sm transition-all ${isSel ? 'opacity-100' : 'opacity-0 group-hover/col:opacity-100'}`}>
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
              className="inline-flex items-center gap-1 px-3 py-1 border border-dashed border-brand/40 bg-white text-brand text-[11px] font-bold rounded-ctl hover:bg-brand-tint">
              <Plus className="w-3 h-3" /> 행 추가
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-sand-50 overflow-hidden font-sans">

      {/* 단일 렌더 코어(blockKit)가 의존하는 공유 CSS — 공개 페이지와 동일 시각 보장 */}
      <style dangerouslySetInnerHTML={{ __html: WB_STYLE }} />

      {/* ── Top Bar ── */}
      <header className="h-13 border-b border-sand-200 bg-white flex items-center justify-between px-5 flex-shrink-0" style={{ height: '52px' }}>
        <div className="flex items-center gap-3">
          <Link to="/admin/dashboard" className="p-2 hover:bg-sand-100 border border-transparent hover:border-brand rounded-ctl transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-px h-5 bg-sand-200" />
          <h1 className="font-black text-sm tracking-tight">1PAGE 웹 디자인</h1>
          <div className="w-px h-5 bg-sand-200" />
          <button onClick={undo} disabled={!canUndo} title="실행취소 (Ctrl+Z)"
            className="p-1.5 border border-transparent hover:border-sand-300 rounded-ctl transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button onClick={redo} disabled={!canRedo} title="재실행 (Ctrl+Y)"
            className="p-1.5 border border-transparent hover:border-sand-300 rounded-ctl transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-5 bg-sand-200" />
          <div className="text-xs font-bold flex items-center gap-1" title="편집 내용은 초안으로 자동 임시저장됩니다. 방문자에게는 '발행'한 내용만 보입니다.">
            {saveStatus === 'saving'  && <><Loader className="w-3 h-3 animate-spin text-sand-400" /><span className="text-sand-400">임시저장 중...</span></>}
            {saveStatus === 'saved'   && <><Check className="w-3 h-3 text-green-500" /><span className="text-sand-400">초안 저장됨</span></>}
            {saveStatus === 'unsaved' && <span className="text-brand font-black">● 저장 안 됨</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-sand-200 rounded-ctl overflow-hidden">
            {[{ mode: 'desktop', Icon: Monitor, label: '데스크톱' }, { mode: 'tablet', Icon: Tablet, label: '태블릿' }, { mode: 'mobile', Icon: Smartphone, label: '모바일' }].map(({ mode, Icon, label }) => (
              <button key={mode} onClick={() => setViewportMode(mode as typeof viewportMode)} title={label}
                className={`p-1.5 transition-colors ${viewportMode === mode ? 'bg-brand text-white' : 'text-sand-400 hover:bg-sand-100'}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
          {/* 발행 상태 안내 — 무엇이 방문자에게 보이는지 명확히 */}
          <div className="text-[11px] font-bold flex items-center gap-1 mr-0.5"
            title={isPublished ? '방문자에게는 마지막으로 발행한 내용이 보입니다.' : '아직 발행 전이라 방문자에게는 기본 소개 페이지가 보입니다.'}>
            {!isPublished
              ? <span className="text-sand-400">미발행 · 기본 페이지 노출</span>
              : hasUnpublishedChanges
                ? <span className="text-brand">● 발행 안 된 변경사항</span>
                : <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3" />발행됨</span>}
          </div>
          <Link to={`/clubs/${adminClub?.slug ?? ''}`} target="_blank"
            title="편집 중인 초안을 새 탭에서 전체 화면으로 미리봅니다."
            className="px-3 py-1.5 border border-sand-300 rounded-ctl bg-white hover:bg-sand-50 hover:border-brand text-xs font-bold text-ink shadow-soft active:translate-y-px transition-all">
            미리보기
          </Link>
          {(() => {
            const canPublish = !isPublished || hasUnpublishedChanges;
            return (
              <button onClick={handlePublish} disabled={!canPublish || publishing}
                title={canPublish ? '현재 초안을 공개본으로 발행합니다.' : '발행할 변경사항이 없습니다.'}
                className={`px-4 py-1.5 font-black border rounded-ctl text-xs transition-all flex items-center gap-1.5 ${
                  canPublish
                    ? 'border-transparent btn-grad text-white shadow-btn hover:-translate-y-0.5 active:translate-y-0'
                    : 'border-sand-200 bg-sand-100 text-sand-400 cursor-default'}`}>
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
        <aside className="w-14 border-r border-sand-200 bg-white flex flex-col items-center pt-4 shrink-0 gap-1.5">
          <button onClick={() => setWidgetPickerOpen(true)} title="위젯 추가"
            className="w-10 h-10 flex items-center justify-center border border-sand-300 rounded-ctl bg-white hover:bg-brand-tint hover:border-brand hover:text-brand transition-colors shadow-soft active:translate-y-0.5">
            <Plus className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-black text-sand-400 tracking-wide">추가</span>
          <div className="w-7 h-px bg-sand-200 my-1.5" />
          <button onClick={() => setTemplateModalOpen(true)} title="섹션 템플릿"
            className="w-10 h-10 flex items-center justify-center border border-transparent rounded-ctl btn-grad text-white shadow-btn hover:-translate-y-0.5 transition-all active:translate-y-0">
            <LayoutTemplate className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-black text-sand-400 tracking-wide">템플릿</span>
        </aside>

        {/* ── Center Canvas ── */}
        <main
          className="flex-1 bg-sand-100 flex flex-col items-center overflow-y-auto p-6 relative min-h-0"
          onClick={() => { setSelectedBlockId(null); setEditingBlockId(null); setInsertMenuIdx(null); }}
        >
          {fetching ? (
            <LoadingScreen />
          ) : (
            <div
              /* overflowX:clip → 풀블리드 위젯이 프레임 좌우로 새는 것만 막고,
                 overflowY:visible → 위젯/섹션 편집 chrome(툴바·+버튼)이 위아래로 안 잘리게 한다.
                 (overflow:hidden 은 양축을 모두 잘라 chrome 을 먹어버림) */
              className="border border-sand-300 shadow-xl min-h-[800px] flex flex-col relative shrink-0 w-full transition-[max-width] duration-200"
              style={{
                maxWidth: viewportMode === 'mobile' ? '390px' : viewportMode === 'tablet' ? '768px' : '100%',
                backgroundColor: pageBgColor || '#ffffff',
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
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-sand-400 py-20">
                    <MousePointer className="w-8 h-8" />
                    <div className="flex items-center gap-2">
                      <button onClick={() => setTemplateModalOpen(true)} className="font-black text-sm flex items-center gap-1.5 px-4 py-2.5 border border-transparent rounded-ctl btn-grad text-white shadow-btn hover:-translate-y-0.5 transition-all"><LayoutTemplate className="w-4 h-4" /> 템플릿으로 시작</button>
                      <button onClick={() => setWidgetPickerOpen(true)} className="font-black text-sm flex items-center gap-1.5 px-4 py-2.5 border border-sand-300 rounded-ctl text-ink bg-white hover:bg-sand-50 hover:border-brand transition-colors shadow-soft"><Plus className="w-4 h-4" /> 위젯 추가하기</button>
                    </div>
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
                    className={`mx-10 my-3 py-4 border-2 border-dashed rounded-ctl text-center text-[12px] font-bold transition-colors ${dragOverId === '__bottom__' ? 'border-green-500 bg-green-50 text-green-600' : 'border-sand-300 text-sand-400'}`}>
                    ⬇ 여기에 놓으면 섹션 밖 맨 아래로 이동합니다
                  </div>
                )}

                {blocks.length > 0 && (
                  <div className="py-8 px-10">
                    <button onClick={() => setWidgetPickerOpen(true)} className="w-full py-6 border-2 border-dashed border-sand-200 hover:border-brand flex items-center justify-center gap-2 text-sand-400 hover:text-brand text-xs font-bold transition-colors">
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
                className={`pointer-events-auto px-6 py-3 font-black border border-transparent rounded-ctl text-sm shadow-btn hover:-translate-y-0.5 transition-all ${getThemeText(activeTheme)}`}
                style={{ backgroundColor: resolveThemeHex(activeTheme) }}
              >
                지원하기 →
              </button>
            </div>
          )}
        </main>

        {/* ── Right Panel (접기/펼치기 + 부드러운 전환) ──
            얇은 핸들 바는 항상 노출 → 접힌 상태에서도 다시 펼칠 수 있다.
            패널 본문은 width+opacity 슬라이드로 등장/이탈(motion, reduced-motion 시 즉시). */}
        <div className="flex shrink-0 min-h-0">
          {/* 토글 레일 — 좌측 레일(w-14)과 동일한 두께·스타일로 맞춰 항상 또렷하게 보이도록 */}
          <div className="w-14 shrink-0 border-l border-sand-200 bg-white flex flex-col items-center pt-4 gap-1.5">
            <button
              onClick={togglePanel}
              title={panelOpen ? '속성 패널 접기' : '속성 패널 펼치기'}
              className="w-10 h-10 flex items-center justify-center border border-sand-300 rounded-ctl bg-white hover:bg-brand-tint hover:border-brand hover:text-brand transition-colors shadow-soft active:translate-y-0.5"
            >
              {panelOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <span className="text-[10px] font-black text-sand-400 tracking-wide">{panelOpen ? '접기' : '속성'}</span>
          </div>
          <AnimatePresence initial={false}>
            {panelOpen && (
              <motion.div
                key="prop-panel"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 288, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={panelTransition}
                className="overflow-hidden flex min-h-0"
              >
        {selectedBlock ? (
          <BlockPropertiesPanel
            block={selectedBlock}
            kind={selectedKind}
            onUpdate={(field, value) => {
              if (field === '__setCols') handleSetRowCols(selectedBlock.id, value);
              else if (field === '__merge') commit(patchNode(blocks, selectedBlock.id, value), false, `${selectedBlock.id}:merge`);
              else if (field === '__layoutOp') {
                /* 섹션 레이아웃 관리 모달의 구조 변경 — 섹션 선택을 유지(위젯으로 선택이 옮겨가면 모달이 깨짐) */
                const v = value;
                if (v.op === 'addRow') addRowToSection(selectedBlock.id, v.cols ?? 1);
                else if (v.op === 'setCols') handleSetRowCols(v.rowId, v.n);
                else if (v.op === 'setRatio') commit(patchNode(blocks, v.rowId, { colRatios: v.ratios }), false, `${v.rowId}:ratio`);
                else if (v.op === 'addWidget') commit(insertInColumn(blocks, makeWidget(v.type), selectedBlock.id, v.rowId, v.colId), true);
                else if (v.op === 'delNode') commit(deleteNode(blocks, v.id), true);
                else if (v.op === 'moveRow') handleMoveRow(selectedBlock.id, v.rowId, v.dir);
                else if (v.op === 'moveWidget') handleMoveBlock(v.id, v.dir);
              }
              else upd(selectedBlock.id, field, value);
            }}
            onDeselect={() => setSelectedBlockId(null)}
            onDelete={() => handleDeleteBlock(selectedBlock.id)}
            themeHex={THEME_HEX}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-white px-5 py-3 rounded-card font-bold text-sm flex items-center gap-2 shadow-soft-lg">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}

      {/* ── 저장 충돌 모달 — 다른 운영진이 먼저 저장해 버전이 어긋났을 때 ── */}
      {conflict && (
        <div className="fixed inset-0 z-[300] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card border border-sand-200 shadow-soft-lg w-[440px] max-w-[92vw] p-6">
            <div className="font-black text-lg mb-2 text-ink">다른 사람이 페이지를 수정했어요</div>
            <p className="text-[13px] font-bold text-sand-600 leading-relaxed mb-5">
              내가 편집하는 동안 다른 운영진이 이 페이지를 저장했습니다.
              지금 내 변경을 그대로 저장하면 <b className="text-ink">상대의 변경이 사라집니다.</b><br />
              어떻게 할지 선택해 주세요.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={resolveReload}
                className="w-full px-4 py-2.5 font-black text-sm border border-transparent rounded-ctl btn-grad text-white shadow-btn hover:-translate-y-0.5 active:translate-y-0 transition-all">
                최신 내용 불러오기 <span className="font-bold text-white/80">(내 변경 취소)</span>
              </button>
              <button onClick={resolveOverwrite}
                className="w-full px-4 py-2.5 font-black text-sm border border-sand-300 rounded-ctl bg-white text-ink hover:bg-sand-50 hover:border-brand shadow-soft active:translate-y-px transition-all">
                내 변경으로 덮어쓰기 <span className="font-bold text-sand-500">(상대 변경 삭제)</span>
              </button>
            </div>
            <p className="text-[11px] font-bold text-sand-400 mt-3 leading-snug">
              내 변경이 중요하다면 먼저 내용을 복사해 둔 뒤 ‘최신 내용 불러오기’를 누르는 것이 안전합니다.
            </p>
          </div>
        </div>
      )}

      {/* 섹션 템플릿 갤러리 모달 (좌측 레일 템플릿 버튼) */}
      <SectionTemplateModal open={templateModalOpen} activeTheme={activeTheme}
        onClose={() => setTemplateModalOpen(false)} onInsert={handleInsertTemplate} />

      {/* 위젯 추가 모달 (좌측 레일 + 버튼) */}
      {widgetPickerOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={() => setWidgetPickerOpen(false)}>
          <div className="bg-white rounded-card border border-sand-200 shadow-soft-lg p-5 w-[540px] max-w-[92vw] animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="font-black text-base text-ink">위젯 추가</div>
              <button onClick={() => setWidgetPickerOpen(false)} className="p-1.5 border border-sand-200 hover:border-brand rounded-ctl transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-[62vh] overflow-y-auto hide-scrollbar">
              {PALETTE.map(({ type, label, icon: Icon, disabled }) => (
                <button key={type} disabled={disabled} onClick={() => { handleAddBlock(type); setWidgetPickerOpen(false); }}
                  className={`flex flex-col items-center justify-center gap-2 p-4 border rounded-ctl transition-all text-center group
                    ${disabled ? 'border-sand-100 text-sand-400 cursor-not-allowed bg-sand-50'
                      : 'border-sand-200 hover:border-brand hover:bg-brand-tint hover:shadow-soft hover:-translate-y-0.5 cursor-pointer'}`}>
                  <Icon className={`w-5 h-5 shrink-0 ${disabled ? 'text-sand-400' : 'text-sand-500 group-hover:text-brand'}`} />
                  <span className={`font-bold text-[12px] leading-tight ${disabled ? 'text-sand-400' : 'text-sand-600 group-hover:text-brand'}`}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 섹션 컬럼 위젯 피커 */}
      {colPicker && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center" onClick={() => setColPicker(null)}>
          <div className="bg-white rounded-card border border-sand-200 shadow-soft-lg p-4 w-[360px]" onClick={e => e.stopPropagation()}>
            <div className="text-xs font-black mb-3 text-ink">이 칸에 추가할 위젯 선택</div>
            <div className="grid grid-cols-3 gap-1.5 max-h-[60vh] overflow-y-auto hide-scrollbar">
              {COLUMN_WIDGETS.map(({ type, label, icon: Icon }) => (
                <button key={type} onClick={() => { addWidgetToColumn(type, colPicker.sectionId, colPicker.rowId, colPicker.colId); setColPicker(null); }}
                  className="flex flex-col items-center gap-1 p-2.5 border border-sand-200 rounded-ctl hover:border-brand hover:bg-brand-tint transition-colors">
                  <Icon className="w-4 h-4 text-sand-500" />
                  <span className="text-[12px] font-bold text-sand-600 leading-tight text-center">{label}</span>
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
