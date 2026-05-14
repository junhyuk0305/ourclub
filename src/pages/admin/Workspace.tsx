import React, { useState, useEffect, useRef } from 'react';
import {
  Type, CheckSquare, Plus, Layout, ArrowLeft, Calendar,
  Loader, Check, Globe, ChevronDown, ChevronRight, ChevronUp, Clock,
  MessageSquare, Layers, MousePointer, GripVertical, Image as ImageIcon,
  Minus, Columns, RotateCcw, RotateCw, Monitor, Tablet, Smartphone,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Copy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { WorkspaceProperties } from '../../components/admin/WorkspaceProperties';
import { BlockPropertiesPanel } from '../../components/admin/BlockPropertiesPanel';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';

/* ─────────────────────────────────────────────
   FAQ Item (sub-component, stays outside main)
───────────────────────────────────────────── */
const FaqEditorItem = ({
  item, idx, onUpdate, onDelete, openBg, iconStyle,
}: {
  item: { id: string; question: string; answer: string };
  idx: number;
  onUpdate: (field: string, val: string) => void;
  onDelete: () => void;
  openBg?: string;
  iconStyle?: 'plus' | 'arrow';
}) => {
  const [open, setOpen] = React.useState(true);
  return (
    <div>
      <div className="flex items-center gap-3 px-5 py-4 bg-white hover:bg-gray-50 transition-colors">
        <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }} className="font-black text-xs text-gray-400 shrink-0 w-5 text-left">{idx + 1}</button>
        <input value={item.question} onChange={e => onUpdate('question', e.target.value)}
          className="flex-1 font-bold outline-none bg-transparent text-sm cursor-text" placeholder="질문을 입력하세요" />
        <button onClick={e => { e.stopPropagation(); setOpen(o => !o); }} className="text-gray-400 text-sm shrink-0">
          {iconStyle === 'arrow' ? (open ? '↑' : '↓') : (open ? '−' : '+')}
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 hover:text-red-600 text-xs font-bold shrink-0 ml-1">✕</button>
      </div>
      {open && (
        <div className="px-5 py-4 border-t border-gray-100" style={{ backgroundColor: openBg || '#fff7ed' }}>
          <textarea value={item.answer} onChange={e => onUpdate('answer', e.target.value)}
            ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
            className="w-full bg-transparent outline-none font-medium text-gray-600 resize-none text-sm leading-relaxed"
            style={{ overflow: 'hidden', minHeight: '1.5em' }}
            placeholder="답변을 입력하세요" />
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   Widget palette definition
───────────────────────────────────────────── */
const PALETTE: { type: string; label: string; icon: React.ElementType; disabled?: boolean }[] = [
  { type: 'text',            label: '텍스트',          icon: Type },
  { type: 'layoutContainer', label: '레이아웃 컨테이너', icon: Columns },
  { type: 'faq',             label: 'FAQ 아코디언',    icon: MessageSquare },
  { type: 'timeline',        label: '타임라인',         icon: Clock },
  { type: 'heroSlider',      label: '히어로 슬라이더',  icon: Layers },
  { type: 'button',          label: '동적 CTA 버튼',   icon: CheckSquare },
  { type: 'image',           label: '이미지',           icon: ImageIcon },
  { type: 'spacer',          label: '여백 (Spacer)',    icon: Layout },
  { type: 'divider',         label: '구분선',           icon: Minus },
  { type: 'header',          label: '글로벌 헤더',      icon: ArrowLeft, disabled: true },
];

const PALETTE_LABEL: Record<string, string> = Object.fromEntries(PALETTE.map(p => [p.type, p.label]));

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function mkCell(id: string, n: number) {
  return { id, title: `카드 제목 ${n}`, text: '여기에 내용을 입력하세요.', align: 'left', bgColor: '#ffffff', textColor: '#374151', titleColor: '#111827', titleSize: 18, textSize: 14, padding: 24, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', imgSrc: '', imgPosition: 'top', imgHeight: 180 };
}

function mkSlide(id: string) {
  return { id, bgType: 'color', bgValue: '#111111', overlayOpacity: 0, h1: '메인 카피를\n입력하세요', subtitle: '서브 카피를 입력하세요', ctaText: '지원하기', ctaShow: true, align: 'center' };
}

/* ─────────────────────────────────────────────
   Default blocks — 데브 허슬러 템플릿
───────────────────────────────────────────── */
const DEFAULT_BLOCKS: any[] = [
  // ① 히어로 슬라이더 — 2슬라이드, 5초 자동재생
  {
    id: '1', type: 'heroSlider', height: 72, autoPlay: true, interval: 5000, h1Size: 56, subtitleSize: 18,
    slides: [
      { id: 's1', bgType: 'color', bgValue: '#0a0a0a', overlayOpacity: 0, align: 'center',
        h1: '코드로 세상을\n바꾸는 사람들', subtitle: '실전 프로젝트 · 코드 리뷰 · 현업 멘토링 · 네트워킹',
        ctaText: '25기 지원하기', ctaShow: true },
      { id: 's2', bgType: 'color', bgValue: '#111827', overlayOpacity: 0, align: 'center',
        h1: '함께 배우고\n같이 성장합니다', subtitle: '2020년 창립 · 졸업생 200+ · 현업 취업 30+',
        ctaText: '활동 더 보기', ctaShow: true },
    ],
  },

  // ② 핵심 슬로건
  {
    id: '2', type: 'text', seoTag: 'h2', align: 'center', animation: 'slideUp',
    text: '실전으로 배우는\n개발 동아리',
    fontSize: 44, fontWeight: 900, textColor: '#0a0a0a', lineHeight: 1.2, letterSpacing: -0.02,
    paddingTop: 72, paddingBottom: 16, maxWidth: 680,
  },

  // ③ 서브카피
  {
    id: '3', type: 'text', seoTag: 'p', align: 'center',
    text: '단순한 공부 모임이 아닙니다.\n데브 허슬러는 실제 서비스를 기획하고, 개발하고, 배포합니다.',
    fontSize: 17, fontWeight: 400, textColor: '#6b7280', lineHeight: 1.8,
    paddingTop: 0, paddingBottom: 56, maxWidth: 560,
  },

  // ④ 핵심 특징 카드 3개 (다크 테마)
  {
    id: '4', type: 'layoutContainer', cols: 3, gap: 16, paddingY: 0, bgColor: '#000000',
    cells: [
      { id: 'c1', title: '실전 프로젝트', text: '팀 단위로 실제 서비스를 기획하고 개발합니다.\n배포까지 경험하는 풀사이클 개발.',
        align: 'left', bgColor: '#000000', titleColor: '#ffffff', textColor: '#9ca3af',
        titleSize: 20, textSize: 14, padding: 36, borderRadius: 0, borderWidth: 0, borderColor: '#1f2937', imgSrc: '' },
      { id: 'c2', title: '주간 코드 리뷰', text: '매주 서로의 코드를 리뷰합니다.\n동료 피드백으로 빠르게 성장하세요.',
        align: 'left', bgColor: '#111827', titleColor: '#ffffff', textColor: '#9ca3af',
        titleSize: 20, textSize: 14, padding: 36, borderRadius: 0, borderWidth: 0, borderColor: '#1f2937', imgSrc: '' },
      { id: 'c3', title: '현업 멘토링', text: '시니어 개발자와 1:1 멘토링.\n취업과 커리어 전략을 함께 설계합니다.',
        align: 'left', bgColor: '#1f2937', titleColor: '#ffffff', textColor: '#9ca3af',
        titleSize: 20, textSize: 14, padding: 36, borderRadius: 0, borderWidth: 0, borderColor: '#1f2937', imgSrc: '' },
    ],
  },

  // ⑤ 구분선
  { id: '5', type: 'divider', style: 'solid', color: '#e5e7eb', thickness: 1, width: 100, paddingY: 56 },

  // ⑥ 섹션 제목 — 학습 스택
  {
    id: '6', type: 'text', seoTag: 'h2', align: 'center', animation: 'slideIn',
    text: '무엇을 배우나요?',
    fontSize: 34, fontWeight: 900, textColor: '#0a0a0a', lineHeight: 1.2, letterSpacing: -0.01,
    paddingTop: 0, paddingBottom: 32, maxWidth: 720,
  },

  // ⑦ 학습 스택 2×2 그리드
  {
    id: '7', type: 'layoutContainer', cols: 2, gap: 20, paddingY: 0, bgColor: 'transparent',
    cells: [
      { id: 'd1', title: 'Frontend', text: 'React · TypeScript · Next.js · Tailwind CSS\n\n프로덕션급 프론트엔드 개발 경험을 쌓습니다.',
        align: 'left', bgColor: '#f9fafb', titleColor: '#0a0a0a', textColor: '#374151',
        titleSize: 17, textSize: 14, padding: 28, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', imgSrc: '' },
      { id: 'd2', title: 'Backend', text: 'Node.js · FastAPI · PostgreSQL · Docker\n\n서버부터 DB 설계까지 직접 구현합니다.',
        align: 'left', bgColor: '#f9fafb', titleColor: '#0a0a0a', textColor: '#374151',
        titleSize: 17, textSize: 14, padding: 28, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', imgSrc: '' },
      { id: 'd3', title: 'DevOps', text: 'AWS · Vercel · GitHub Actions · CI/CD\n\n자동화 배포 파이프라인을 직접 구축합니다.',
        align: 'left', bgColor: '#f9fafb', titleColor: '#0a0a0a', textColor: '#374151',
        titleSize: 17, textSize: 14, padding: 28, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', imgSrc: '' },
      { id: 'd4', title: 'Collaboration', text: 'GitHub · Notion · Figma · Jira\n\n팀 협업과 프로젝트 관리 실전 경험을 쌓습니다.',
        align: 'left', bgColor: '#f9fafb', titleColor: '#0a0a0a', textColor: '#374151',
        titleSize: 17, textSize: 14, padding: 28, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', imgSrc: '' },
    ],
  },

  // ⑧ 여백
  { id: '8', type: 'spacer', height: 64 },

  // ⑨ 스탯 4개 — 다크 배경
  {
    id: '9', type: 'layoutContainer', cols: 4, gap: 0, paddingY: 56, bgColor: '#0a0a0a',
    cells: [
      { id: 'st1', title: '200+', text: '누적 졸업생', align: 'center',
        bgColor: '#0a0a0a', titleColor: '#ffffff', textColor: '#6b7280',
        titleSize: 40, textSize: 13, padding: 24, borderRadius: 0, borderWidth: 0, borderColor: 'transparent', imgSrc: '' },
      { id: 'st2', title: '50+', text: '완성된 프로젝트', align: 'center',
        bgColor: '#0a0a0a', titleColor: '#ffffff', textColor: '#6b7280',
        titleSize: 40, textSize: 13, padding: 24, borderRadius: 0, borderWidth: 0, borderColor: 'transparent', imgSrc: '' },
      { id: 'st3', title: '30+', text: '현업 취업 성공', align: 'center',
        bgColor: '#0a0a0a', titleColor: '#ffffff', textColor: '#6b7280',
        titleSize: 40, textSize: 13, padding: 24, borderRadius: 0, borderWidth: 0, borderColor: 'transparent', imgSrc: '' },
      { id: 'st4', title: '5년', text: '운영 역사', align: 'center',
        bgColor: '#0a0a0a', titleColor: '#ffffff', textColor: '#6b7280',
        titleSize: 40, textSize: 13, padding: 24, borderRadius: 0, borderWidth: 0, borderColor: 'transparent', imgSrc: '' },
    ],
  },

  // ⑩ 구분선
  { id: '10', type: 'divider', style: 'solid', color: '#e5e7eb', thickness: 1, width: 100, paddingY: 56 },

  // ⑪ 모집 프로세스 섹션 제목
  {
    id: '11', type: 'text', seoTag: 'h2', align: 'center',
    text: '모집 프로세스',
    fontSize: 34, fontWeight: 900, textColor: '#0a0a0a', lineHeight: 1.2,
    paddingTop: 0, paddingBottom: 8, maxWidth: 720,
  },

  // ⑫ 타임라인 — 수평 5단계
  {
    id: '12', type: 'timeline', title: '', layout: 'horizontal', activeColor: '#0a0a0a', lineColor: '#d1d5db',
    nodes: [
      { id: 'n1', title: '서류 지원', desc: '지원서 + 포트폴리오 제출' },
      { id: 'n2', title: '서류 심사', desc: '3일 내 개별 결과 안내' },
      { id: 'n3', title: '과제 전형', desc: '48시간 온라인 코딩 과제' },
      { id: 'n4', title: '최종 면접', desc: '팀장단 면접 (30분)' },
      { id: 'n5', title: '합격 발표', desc: '최종 합격을 축하합니다!' },
    ],
  },

  // ⑬ 여백
  { id: '13', type: 'spacer', height: 64 },

  // ⑭ FAQ
  {
    id: '14', type: 'faq', title: '자주 묻는 질문', iconStyle: 'plus', openBg: '#f3f4f6', borderRadius: 8,
    items: [
      { id: 'f1', question: '지원 자격이 어떻게 되나요?',
        answer: '대학교 재학생이라면 전공 불문 누구나 지원 가능합니다. 개발 경험이 없어도 열정이 있다면 환영합니다.' },
      { id: 'f2', question: '활동 기간은 어떻게 되나요?',
        answer: '한 기수는 6개월(한 학기)로 운영됩니다. 매주 정기 모임이 있으며, 프로젝트 팀별로 추가 미팅을 진행합니다.' },
      { id: 'f3', question: '스택을 미리 알아야 하나요?',
        answer: '기초적인 프로그래밍 지식만 있어도 충분합니다. 스터디와 팀 프로젝트를 통해 함께 배워나갑니다.' },
      { id: 'f4', question: '활동비가 있나요?',
        answer: '반기 활동비 30,000원이 있습니다. 스터디 자료, 서버 비용, 네트워킹 행사 비용으로 사용됩니다.' },
      { id: 'f5', question: '취업 연계가 가능한가요?',
        answer: '졸업 후에도 데브 허슬러 네트워크를 유지합니다. 현업 멘토 연결, 레퍼런스 체크, 채용 정보 공유 등 커리어 지원을 제공합니다.' },
      { id: 'f6', question: '포트폴리오가 없어도 지원할 수 있나요?',
        answer: '포트폴리오가 없어도 지원 가능합니다. 지원 동기와 배우고 싶은 것을 구체적으로 작성해주시면 충분합니다.' },
    ],
  },

  // ⑮ 여백
  { id: '15', type: 'spacer', height: 48 },

  // ⑯ 최종 CTA 버튼
  {
    id: '16', type: 'button', text: '25기 지원하기', actionType: 'modal',
    btnSize: 'l', btnBg: '#0a0a0a', btnTextColor: '#ffffff', radius: 0, paddingY: 48,
  },
];

/* ─────────────────────────────────────────────
   Main Workspace component
───────────────────────────────────────────── */
export default function Workspace() {
  const { adminClub, adminClubId } = useAdmin();

  /* global config */
  const [activeTheme, setActiveTheme] = useState('black');
  const [coverImg, setCoverImg] = useState('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1920&q=80');
  const [clubName, setClubName] = useState('');
  const [hashtag1, setHashtag1] = useState('개발');
  const [hashtag2, setHashtag2] = useState('성장');
  const [badgeText, setBadgeText] = useState('25기 모집중');
  const [showFloatingBtn, setShowFloatingBtn] = useState(true);

  /* blocks */
  const [blocks, setBlocks] = useState<any[]>(DEFAULT_BLOCKS);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  /* drag-to-reorder */
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  /* slider per-block current slide index (editor-only, not persisted) */
  const [sliderIdx, setSliderIdx] = useState<Record<string, number>>({});

  /* db */
  const [pageId, setPageId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [toast, setToast] = useState('');

  /* auto-scroll to new block */
  const newBlockIdRef = useRef<string | null>(null);
  const blockElRefs = useRef<Record<string, HTMLDivElement>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* undo/redo */
  const blockHistoryRef = useRef<any[][]>([]);
  const historyIdxRef = useRef<number>(-1);
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

  useEffect(() => { if (adminClub?.name) setClubName(adminClub.name); }, [adminClub]);
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

  useEffect(() => {
    const id = newBlockIdRef.current;
    if (!id) return;
    const el = blockElRefs.current[id];
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); newBlockIdRef.current = null; }
  }, [blocks]);

  const loadPage = async (clubId: string) => {
    setFetching(true);
    const { data } = await supabase.from('club_pages').select('id, blocks, published_at').eq('club_id', clubId).maybeSingle();
    if (data) {
      setPageId(data.id); setIsPublished(!!data.published_at);
      const saved = data.blocks as any;
      if (saved?.config) {
        const c = saved.config;
        if (c.activeTheme) setActiveTheme(c.activeTheme);
        if (c.coverImg) setCoverImg(c.coverImg);
        if (c.clubName) setClubName(c.clubName);
        if (c.hashtag1 !== undefined) setHashtag1(c.hashtag1);
        if (c.hashtag2 !== undefined) setHashtag2(c.hashtag2);
        if (c.badgeText !== undefined) setBadgeText(c.badgeText);
        if (c.showFloatingBtn !== undefined) setShowFloatingBtn(c.showFloatingBtn);
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
  const triggerAutoSave = (upd: any[], cfg?: any) => {
    setSaveStatus('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveToDb(upd, cfg), 5000);
  };
  const saveToDb = async (cur: any[], cfgOvr?: any) => {
    if (!adminClubId) {
      showToast('❌ 동아리 정보를 불러오지 못했습니다. 페이지를 새로고침해주세요.');
      return;
    }
    setSaveStatus('saving');
    const cfg = cfgOvr ?? { activeTheme, coverImg, clubName, hashtag1, hashtag2, badgeText, showFloatingBtn, contentWidth, pageBgColor, globalFont, pageTitle, pageDesc };
    const payload = buildPayload(cur, cfg);
    if (pageId) {
      const { error } = await supabase.from('club_pages').update({ blocks: payload, updated_at: new Date().toISOString() }).eq('id', pageId);
      if (error) { showToast(`❌ 저장 실패: ${error.message}`); setSaveStatus('unsaved'); return; }
    } else {
      const { data, error } = await supabase.from('club_pages').insert({ club_id: adminClubId, blocks: payload }).select().single();
      if (error) { showToast(`❌ 저장 실패: ${error.message}`); setSaveStatus('unsaved'); return; }
      if (data) setPageId(data.id);
    }
    setSaveStatus('saved');
  };
  const handlePublish = async () => {
    if (!adminClubId) {
      showToast('❌ 동아리 정보를 불러오지 못했습니다. 페이지를 새로고침해주세요.');
      return;
    }
    setSaveStatus('saving');
    const cfg = { activeTheme, coverImg, clubName, hashtag1, hashtag2, badgeText, showFloatingBtn, contentWidth, pageBgColor, globalFont, pageTitle, pageDesc };
    const payload = buildPayload(blocks, cfg);
    const ts = isPublished ? null : new Date().toISOString();
    if (pageId) {
      const { error } = await supabase.from('club_pages').update({ blocks: payload, published_at: ts }).eq('id', pageId);
      if (error) { showToast(`❌ 발행 실패: ${error.message}`); setSaveStatus('unsaved'); return; }
    } else {
      const { data, error } = await supabase.from('club_pages').insert({ club_id: adminClubId, blocks: payload, published_at: ts }).select().single();
      if (error) { showToast(`❌ 발행 실패: ${error.message}`); setSaveStatus('unsaved'); return; }
      if (data) setPageId(data.id);
    }
    setIsPublished(!isPublished); setSaveStatus('saved');
    showToast(isPublished ? '비공개로 전환되었습니다.' : '홈페이지가 발행되었습니다!');
  };
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  /* ── undo / redo ── */
  const pushHistory = (newBlocks: any[]) => {
    const h = blockHistoryRef.current.slice(0, historyIdxRef.current + 1);
    h.push(newBlocks);
    if (h.length > 50) h.shift();
    blockHistoryRef.current = h;
    historyIdxRef.current = h.length - 1;
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

  const handleAddBlock = (type: string) => {
    if (type === 'header') return;
    const id = Date.now().toString();
    let nb: any = { id, type };
    if (type === 'text')            nb = { ...nb, text: '텍스트를 입력하세요.', seoTag: 'p', align: 'left', fontSize: 16, fontWeight: 400, textColor: '#111827', lineHeight: 1.7, paddingY: 32 };
    if (type === 'button')          nb = { ...nb, text: '버튼 텍스트', actionType: 'modal', paddingY: 32 };
    if (type === 'faq')             nb = { ...nb, title: '자주 묻는 질문', items: [{ id: id + '_1', question: '질문을 입력하세요', answer: '답변을 입력하세요.' }], iconStyle: 'plus', openBg: '#fff7ed' };
    if (type === 'timeline')        nb = { ...nb, title: '채용 프로세스', nodes: [{ id: id + '_1', title: '1단계', desc: '설명을 입력하세요' }, { id: id + '_2', title: '2단계', desc: '설명을 입력하세요' }], activeColor: '#f97316', lineColor: '#111827' };
    if (type === 'heroSlider')      nb = { ...nb, height: 60, slides: [mkSlide(id + '_s1')], autoPlay: false, interval: 4000 };
    if (type === 'layoutContainer') nb = { ...nb, cols: 2, gap: 20, paddingY: 40, bgColor: '', cells: [mkCell(id + '_c1', 1), mkCell(id + '_c2', 2)] };
    if (type === 'spacer')          nb = { ...nb, height: 64 };
    if (type === 'image')           nb = { ...nb, src: '', alt: '', width: 100, objectFit: 'cover', radius: 0, paddingY: 0 };
    if (type === 'divider')         nb = { ...nb, style: 'solid', color: '#e5e7eb', thickness: 1, width: 100, paddingY: 24 };
    newBlockIdRef.current = id;
    const upd = [...blocks, nb];
    setBlocks(upd); pushHistory(upd); setSelectedBlockId(id); triggerAutoSave(upd);
  };

  const upd = (id: string, field: string, value: any) => {
    const updated = blocks.map(b => b.id === id ? { ...b, [field]: value } : b);
    setBlocks(updated); pushHistory(updated); triggerAutoSave(updated);
  };

  const handleDeleteBlock = (id: string) => {
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated); pushHistory(updated); if (selectedBlockId === id) setSelectedBlockId(null); triggerAutoSave(updated);
  };

  const handleDuplicateBlock = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx === -1) return;
    const clone = { ...blocks[idx], id: Date.now().toString() };
    const updated = [...blocks.slice(0, idx + 1), clone, ...blocks.slice(idx + 1)];
    newBlockIdRef.current = clone.id;
    setBlocks(updated); pushHistory(updated); setSelectedBlockId(clone.id); triggerAutoSave(updated);
  };

  const handleMoveBlock = (id: string, dir: 'up' | 'down') => {
    const idx = blocks.findIndex(b => b.id === id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= blocks.length) return;
    const arr = [...blocks];
    [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
    setBlocks(arr); pushHistory(arr); triggerAutoSave(arr);
  };

  /* drag reorder */
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move'; setDragId(id);
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault(); if (dragId !== id) setDragOverId(id);
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    const arr = [...blocks];
    const from = arr.findIndex(b => b.id === dragId);
    const to = arr.findIndex(b => b.id === targetId);
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setBlocks(arr); pushHistory(arr); triggerAutoSave(arr);
    setDragId(null); setDragOverId(null);
  };

  const mkConfigSetter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: string) =>
    (val: T) => { setter(val); triggerAutoSave(blocks, { activeTheme, coverImg, clubName, hashtag1, hashtag2, badgeText, showFloatingBtn, contentWidth, pageBgColor, globalFont, pageTitle, pageDesc, [key]: val }); };

  const themes: Record<string, string> = {
    'orange-500': 'bg-orange-500', 'black': 'bg-black', 'white': 'bg-white',
    'blue-600': 'bg-blue-600', 'green-600': 'bg-green-600', 'purple-500': 'bg-purple-500',
  };
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
  const getAlignClass = (a?: string) => ({ center: 'text-center', right: 'text-right', justify: 'text-justify' }[a || ''] || 'text-left');

  const selectedBlock = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) : null;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">

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
          <div className="text-xs font-bold flex items-center gap-1">
            {saveStatus === 'saving'  && <><Loader className="w-3 h-3 animate-spin text-gray-400" /><span className="text-gray-400">저장 중...</span></>}
            {saveStatus === 'saved'   && <><Check className="w-3 h-3 text-green-500" /><span className="text-gray-400">저장됨</span></>}
            {saveStatus === 'unsaved' && <span className="text-orange-500 font-black">● 미저장</span>}
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
          <Link to={`/clubs/${adminClub?.slug ?? ''}`} target="_blank"
            className="px-3 py-1.5 border border-black bg-white hover:bg-gray-50 text-xs font-bold shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:shadow-none active:translate-y-px transition-all">
            라이브 프리뷰
          </Link>
          <button onClick={handlePublish}
            className={`px-4 py-1.5 font-black border border-black text-xs shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:-translate-y-px active:shadow-none active:translate-y-px transition-all flex items-center gap-1.5 ${isPublished ? 'bg-gray-700 text-white' : 'bg-orange-500 text-black'}`}>
            <Globe className="w-3.5 h-3.5" />{isPublished ? '발행 취소' : '저장 및 발행'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Panel: Widget Palette ── */}
        <aside className="w-48 border-r border-black bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="px-3 py-2.5 border-b border-gray-100">
            <div className="text-[9px] font-black text-gray-400 tracking-widest uppercase">ENTERPRISE WIDGETS</div>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1.5">
            {PALETTE.map(({ type, label, icon: Icon, disabled }) => (
              <button key={type} onClick={() => handleAddBlock(type)} disabled={disabled}
                title={label}
                className={`flex flex-col items-center gap-1.5 p-2.5 border rounded transition-all group text-center
                  ${disabled
                    ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50'
                    : 'border-gray-200 hover:border-black hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-white cursor-pointer'}`}>
                <Icon className={`w-4 h-4 ${disabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-black'}`} />
                <span className={`font-bold text-[9px] leading-tight ${disabled ? 'text-gray-300' : 'text-gray-500 group-hover:text-black'}`}>{label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Center Canvas ── */}
        <main
          className="flex-1 bg-[#f0f0f0] flex flex-col items-center overflow-y-auto p-6 relative min-h-0"
          onClick={() => { setSelectedBlockId(null); setEditingBlockId(null); }}
        >
          {fetching ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-7 h-7 animate-spin text-orange-500" />
            </div>
          ) : (
            <div
              className="border border-gray-300 shadow-xl min-h-[800px] flex flex-col relative shrink-0 overflow-hidden w-full transition-[max-width] duration-200"
              style={{
                maxWidth: viewportMode === 'mobile' ? '390px' : viewportMode === 'tablet' ? '768px' : (contentWidth === 'full' ? '100%' : `${contentWidth}px`),
                backgroundColor: pageBgColor || '#ffffff',
                fontFamily: globalFont || undefined,
              }}
              onClick={e => e.stopPropagation()}>

              {/* Hero Cover (global config area) */}
              <div className="h-[38vh] bg-gray-900 border-b border-black relative overflow-hidden">
                <img src={coverImg} alt="" className="w-full h-full object-cover opacity-60 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-8">
                  <div className="flex gap-2 mb-3">
                    {hashtag1 && <span className="px-2.5 py-0.5 font-bold text-xs bg-white text-black">#{hashtag1}</span>}
                    {hashtag2 && <span className="px-2.5 py-0.5 font-bold text-xs bg-white text-black">#{hashtag2}</span>}
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-1">{clubName || adminClub?.name}</h1>
                  <p className="text-base font-bold text-gray-300">{adminClub?.one_line_desc ?? ''}</p>
                  {badgeText && (
                    <div
                      className={`absolute top-6 right-6 px-4 py-2 font-black text-sm border-2 border-black rotate-3 shadow-[3px_3px_0_0_rgba(255,255,255,0.9)] ${getThemeText(activeTheme)}`}
                      style={{ backgroundColor: resolveThemeHex(activeTheme) }}
                    >
                      {badgeText}
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky nav bar */}
              <div className="w-full border-b-2 border-black bg-white sticky top-0 z-40">
                <div className="px-6 py-2.5 flex items-center justify-between">
                  <div className="font-bold text-xs text-gray-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-500" /> 지원 기간 표시 영역
                  </div>
                  <div className="px-6 py-2 text-xs font-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] bg-gray-100 text-gray-500">
                    지원하기
                  </div>
                </div>
              </div>

              {/* ── Blocks list ── */}
              <div className="flex-1 flex flex-col bg-white">
                {blocks.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-300 py-20">
                    <MousePointer className="w-8 h-8" />
                    <span className="font-bold text-sm">좌측 팔레트에서 위젯을 클릭하여 추가하세요</span>
                  </div>
                )}

                {blocks.map((block) => {
                  const isSel = selectedBlockId === block.id;
                  const isDragOver = dragOverId === block.id;
                  return (
                    <div
                      key={block.id}
                      ref={el => { if (el) blockElRefs.current[block.id] = el as HTMLDivElement; }}
                      onClick={e => { e.stopPropagation(); setSelectedBlockId(block.id); }}
                      onDragOver={e => handleDragOver(e, block.id)}
                      onDrop={e => handleDrop(e, block.id)}
                      onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                      className={`relative group transition-all animate-slide-down
                        ${isSel ? 'ring-inset ring-[3px] ring-orange-500 z-20' : 'hover:ring-inset hover:ring-2 hover:ring-orange-300 hover:z-10'}
                        ${isDragOver && dragId !== block.id ? 'border-t-4 border-orange-500' : ''}`}
                    >
                      {/* Widget label + toolbar (shows on hover/select) */}
                      <div className={`absolute top-0 left-0 right-0 flex items-center justify-between px-2 py-0.5 z-30 pointer-events-none transition-opacity ${isSel ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <span className="bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 pointer-events-none">
                          {PALETTE_LABEL[block.type] ?? block.type}
                        </span>
                        <div className="flex items-center gap-0.5 pointer-events-auto">
                          <button
                            onClick={e => { e.stopPropagation(); handleMoveBlock(block.id, 'up'); }}
                            disabled={blocks.indexOf(block) === 0}
                            title="위로 이동"
                            className="bg-gray-700 text-white text-[9px] font-black px-1 py-0.5 hover:bg-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center">
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleMoveBlock(block.id, 'down'); }}
                            disabled={blocks.indexOf(block) === blocks.length - 1}
                            title="아래로 이동"
                            className="bg-gray-700 text-white text-[9px] font-black px-1 py-0.5 hover:bg-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center">
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDuplicateBlock(block.id); }}
                            title="복제"
                            className="bg-blue-500 text-white text-[9px] font-black px-1.5 py-0.5 hover:bg-blue-600 transition-colors flex items-center gap-0.5">
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                            title="삭제"
                            className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 hover:bg-red-600 transition-colors">
                            ✕
                          </button>
                        </div>
                      </div>

                      {/* Drag handle */}
                      <div
                        draggable
                        onDragStart={e => handleDragStart(e, block.id)}
                        onClick={e => e.stopPropagation()}
                        className={`absolute left-1 top-1/2 -translate-y-1/2 cursor-grab z-30 p-1 rounded transition-opacity ${isSel ? 'opacity-60 hover:opacity-100' : 'opacity-0 group-hover:opacity-40 hover:opacity-80'}`}
                        title="드래그하여 순서 변경"
                      >
                        <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                      </div>

                      {/* ──────── Widget renders ──────── */}

                      {/* TEXT */}
                      {block.type === 'text' && (() => {
                        const isEditing = editingBlockId === block.id;
                        const ptop = block.paddingTop ?? block.paddingY ?? 32;
                        const pbot = block.paddingBottom ?? block.paddingY ?? 32;
                        const pleft = block.paddingLeft ?? 40;
                        const pright = block.paddingRight ?? 40;
                        const onSelChange = (el: HTMLTextAreaElement) => {
                          if (el.selectionStart !== el.selectionEnd) setEditingBlockId(block.id);
                        };
                        return (
                          <div
                            className={block.animation && block.animation !== 'none' ? `wb-anim-${block.animation}` : ''}
                            onDoubleClick={e => { e.stopPropagation(); setEditingBlockId(block.id); }}
                            style={{ position: 'relative', backgroundColor: block.bgColor || 'transparent', paddingTop: `${ptop}px`, paddingBottom: `${pbot}px`, paddingLeft: `${pleft}px`, paddingRight: `${pright}px` }}>
                            {isEditing && (
                              <div
                                style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 100 }}
                                className="flex items-center gap-1 px-2 py-1.5 bg-white border border-gray-300 border-b-0 shadow-[0_-2px_8px_rgba(0,0,0,0.12)] flex-wrap"
                                onClick={e => e.stopPropagation()}
                                onDoubleClick={e => e.stopPropagation()}
                              >
                                <button
                                  onMouseDown={e => { e.preventDefault(); upd(block.id, 'fontWeight', (block.fontWeight || 400) >= 700 ? 400 : 700); }}
                                  className={`w-7 h-7 flex items-center justify-center rounded font-black text-sm border transition-colors ${(block.fontWeight || 400) >= 700 ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-gray-400'}`}
                                  title="굵게 (Bold)"
                                >B</button>
                                <div className="w-px h-5 bg-gray-200 mx-0.5" />
                                <div className="flex items-center border border-gray-200 rounded overflow-hidden">
                                  <input
                                    type="number"
                                    value={block.fontSize || 16}
                                    onChange={e => upd(block.id, 'fontSize', Number(e.target.value))}
                                    className="w-12 text-xs px-1.5 py-1 outline-none text-center font-bold"
                                    min={8} max={200}
                                  />
                                  <span className="text-[10px] text-gray-400 pr-1.5">px</span>
                                </div>
                                <div className="w-px h-5 bg-gray-200 mx-0.5" />
                                {([
                                  { v: 'left', Icon: AlignLeft, label: '왼쪽' },
                                  { v: 'center', Icon: AlignCenter, label: '가운데' },
                                  { v: 'right', Icon: AlignRight, label: '오른쪽' },
                                  { v: 'justify', Icon: AlignJustify, label: '양쪽' },
                                ] as { v: string; Icon: React.ElementType; label: string }[]).map(({ v, Icon, label }) => (
                                  <button
                                    key={v}
                                    onMouseDown={e => { e.preventDefault(); upd(block.id, 'align', v); }}
                                    className={`w-7 h-7 flex items-center justify-center rounded border transition-colors ${(block.align || 'left') === v ? 'bg-black text-white border-black' : 'border-transparent hover:border-gray-300 text-gray-600'}`}
                                    title={label}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                  </button>
                                ))}
                                <button
                                  onClick={e => { e.stopPropagation(); setEditingBlockId(null); }}
                                  className="ml-auto text-[10px] font-bold text-gray-400 hover:text-black px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                >완료</button>
                              </div>
                            )}
                            <div style={{ maxWidth: block.maxWidth ? `${block.maxWidth}px` : '100%' }} className="mx-auto">
                              <textarea
                                value={block.text || ''}
                                onChange={e => upd(block.id, 'text', e.target.value)}
                                onMouseUp={e => onSelChange(e.currentTarget)}
                                onKeyUp={e => onSelChange(e.currentTarget)}
                                ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                className={`w-full bg-transparent outline-none resize-none border border-transparent focus:border-orange-300 ${getAlignClass(block.align)}`}
                                style={{ fontSize: `${block.fontSize || 16}px`, fontWeight: block.fontWeight || 400, color: block.textColor || '#111827', lineHeight: block.lineHeight || 1.7, letterSpacing: block.letterSpacing ? `${block.letterSpacing}em` : undefined, overflow: 'hidden', minHeight: '1.5em' }}
                                placeholder="텍스트를 입력하세요..."
                              />
                            </div>
                          </div>
                        );
                      })()}

                      {/* HERO SLIDER */}
                      {block.type === 'heroSlider' && (() => {
                        const slides: any[] = block.slides || [mkSlide('s1')];
                        const si = sliderIdx[block.id] ?? 0;
                        const slide = slides[Math.min(si, slides.length - 1)];
                        const bgStyle = slide.bgType === 'image' && slide.bgValue
                          ? { backgroundImage: `url(${slide.bgValue})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : { backgroundColor: slide.bgValue || '#111111' };
                        return (
                          <div className="relative w-full overflow-hidden" style={{ ...bgStyle, minHeight: `${block.height || 60}vh` }}>
                            {slide.bgType === 'image' && slide.bgValue && <div className="absolute inset-0 bg-black" style={{ opacity: (slide.overlayOpacity || 0) / 100 }} />}
                            <div className={`relative z-10 flex flex-col justify-center p-12 h-full ${slide.align === 'center' ? 'items-center text-center' : slide.align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
                              style={{ minHeight: `${block.height || 60}vh` }}>
                              <textarea value={slide.h1 || ''} onChange={e => { const sl = slides.map((s: any) => s.id === slide.id ? { ...s, h1: e.target.value } : s); upd(block.id, 'slides', sl); }}
                                ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                className="bg-transparent outline-none resize-none font-black text-white border border-transparent focus:border-white/40 leading-tight w-full max-w-2xl"
                                style={{ fontSize: `${block.h1Size || 48}px`, overflow: 'hidden', minHeight: '1em' }}
                                placeholder="메인 카피 (H1)" />
                              <textarea value={slide.subtitle || ''} onChange={e => { const sl = slides.map((s: any) => s.id === slide.id ? { ...s, subtitle: e.target.value } : s); upd(block.id, 'slides', sl); }}
                                ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                className="bg-transparent outline-none resize-none text-white/70 border border-transparent focus:border-white/30 mt-4 w-full max-w-2xl"
                                style={{ fontSize: `${block.subtitleSize || 18}px`, overflow: 'hidden', minHeight: '1em' }}
                                placeholder="서브 카피" />
                              {slide.ctaShow !== false && (
                                <input value={slide.ctaText || '지원하기'} onChange={e => { const sl = slides.map((s: any) => s.id === slide.id ? { ...s, ctaText: e.target.value } : s); upd(block.id, 'slides', sl); }}
                                  className="mt-8 px-8 py-3 font-black text-base border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.5)] outline-none text-center min-w-[160px]"
                                  style={{ backgroundColor: resolveThemeHex(activeTheme), color: getThemeText(activeTheme) === 'text-black' ? '#000' : '#fff' }} />
                              )}
                            </div>
                            {/* Slide dots navigation */}
                            {slides.length > 1 && (
                              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                                {slides.map((_: any, i: number) => (
                                  <button key={i} onClick={e => { e.stopPropagation(); setSliderIdx(s => ({ ...s, [block.id]: i })); }}
                                    className={`w-2 h-2 rounded-full border border-white transition-all ${i === si ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`} />
                                ))}
                              </div>
                            )}
                            {/* Slide label */}
                            <div className="absolute top-2 right-10 flex gap-1 z-20">
                              {slides.map((_: any, i: number) => (
                                <button key={i} onClick={e => { e.stopPropagation(); setSliderIdx(s => ({ ...s, [block.id]: i })); }}
                                  className={`px-2 py-0.5 text-[9px] font-black border border-white/50 transition-colors ${i === si ? 'bg-white text-black' : 'text-white hover:bg-white/20'}`}>
                                  슬라이드 {i + 1}
                                </button>
                              ))}
                              <button onClick={e => { e.stopPropagation(); const newSlide = mkSlide(Date.now().toString()); upd(block.id, 'slides', [...slides, newSlide]); }}
                                className="px-2 py-0.5 text-[9px] font-black border border-white/50 text-white hover:bg-white/20 transition-colors">
                                + 슬라이드
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* LAYOUT CONTAINER */}
                      {block.type === 'layoutContainer' && (
                        <div style={{ backgroundColor: block.bgColor || 'transparent', paddingTop: `${block.paddingY || 40}px`, paddingBottom: `${block.paddingY || 40}px` }}>
                          <div className="px-8 mx-auto" style={{ display: 'grid', gridTemplateColumns: `repeat(${block.cols || 2}, 1fr)`, gap: `${block.gap || 20}px` }}>
                            {(block.cells || []).map((cell: any, ci: number) => (
                              <div key={cell.id} style={{ backgroundColor: cell.bgColor || '#fff', padding: `${cell.padding || 24}px`, borderRadius: `${cell.borderRadius || 8}px`, border: `${cell.borderWidth || 1}px solid ${cell.borderColor || '#e5e7eb'}` }}>
                                {cell.imgSrc && (
                                  <img src={cell.imgSrc} alt="" className="w-full object-cover mb-4" style={{ borderRadius: '4px', maxHeight: '180px' }} />
                                )}
                                <input value={cell.title || ''} placeholder={`카드 제목 ${ci + 1}`}
                                  onChange={e => { const cells = block.cells.map((c: any) => c.id === cell.id ? { ...c, title: e.target.value } : c); upd(block.id, 'cells', cells); }}
                                  className="w-full font-black outline-none bg-transparent border-b border-transparent focus:border-orange-400 mb-2"
                                  style={{ fontSize: `${cell.titleSize || 18}px`, color: cell.titleColor || '#111827', textAlign: cell.align || 'left' }} />
                                <textarea value={cell.text || ''} placeholder={`카드 ${ci + 1} 내용`}
                                  onChange={e => { const cells = block.cells.map((c: any) => c.id === cell.id ? { ...c, text: e.target.value } : c); upd(block.id, 'cells', cells); }}
                                  ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                  className="w-full bg-transparent outline-none resize-none border border-transparent focus:border-orange-300 leading-relaxed"
                                  style={{ fontSize: `${cell.textSize || 14}px`, color: cell.textColor || '#374151', textAlign: cell.align || 'left', overflow: 'hidden', minHeight: '1.5em' }} />
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-center mt-3 gap-2">
                            {(block.cells || []).length < 4 && (
                              <button onClick={e => { e.stopPropagation(); const nc = mkCell(Date.now().toString(), (block.cells || []).length + 1); upd(block.id, 'cells', [...(block.cells || []), nc]); }}
                                className="px-3 py-1 border border-dashed border-gray-300 hover:border-black text-gray-400 hover:text-black text-xs font-bold transition-colors flex items-center gap-1">
                                <Plus className="w-3 h-3" /> 컬럼 추가
                              </button>
                            )}
                            {(block.cells || []).length > 1 && (
                              <button onClick={e => { e.stopPropagation(); const cells = (block.cells || []).slice(0, -1); upd(block.id, 'cells', cells); }}
                                className="px-3 py-1 border border-dashed border-red-200 hover:border-red-400 text-red-300 hover:text-red-500 text-xs font-bold transition-colors">
                                − 컬럼 삭제
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* FAQ */}
                      {block.type === 'faq' && (
                        <div className="px-8 max-w-3xl mx-auto w-full py-10">
                          <div className="flex items-center gap-3 mb-6">
                            <MessageSquare className="w-5 h-5 text-orange-500 shrink-0" />
                            <input value={block.title || 'FAQ'} onChange={e => upd(block.id, 'title', e.target.value)}
                              className="text-2xl font-black bg-transparent outline-none border-b-2 border-transparent focus:border-orange-500 w-full" />
                          </div>
                          <div className="border-2 border-black divide-y divide-black overflow-hidden" style={{ borderRadius: `${block.borderRadius || 0}px` }}>
                            {(block.items || []).map((item: any, idx: number) => (
                              <FaqEditorItem key={item.id} item={item} idx={idx} openBg={block.openBg} iconStyle={block.iconStyle}
                                onUpdate={(field, val) => { const items = block.items.map((it: any) => it.id === item.id ? { ...it, [field]: val } : it); upd(block.id, 'items', items); }}
                                onDelete={() => { const items = block.items.filter((it: any) => it.id !== item.id); upd(block.id, 'items', items); }}
                              />
                            ))}
                          </div>
                          <button onClick={e => { e.stopPropagation(); const items = [...(block.items || []), { id: Date.now().toString(), question: '새 질문', answer: '답변을 입력하세요.' }]; upd(block.id, 'items', items); }}
                            className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 hover:border-black text-gray-400 hover:text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> FAQ 항목 추가
                          </button>
                        </div>
                      )}

                      {/* TIMELINE */}
                      {block.type === 'timeline' && (() => {
                        const tlLayout = block.layout || 'vertical-left';
                        const tlNodes: any[] = block.nodes || [];
                        const tlActive = block.activeColor || '#f97316';
                        const tlLine = block.lineColor || '#111827';
                        const tlUpdNode = (node: any, field: string, val: string) =>
                          upd(block.id, 'nodes', tlNodes.map((n: any) => n.id === node.id ? { ...n, [field]: val } : n));
                        const tlDelNode = (nodeId: string) =>
                          upd(block.id, 'nodes', tlNodes.filter((n: any) => n.id !== nodeId));

                        const TlDot = ({ idx }: { idx: number }) => (
                          <div
                            className="w-9 h-9 rounded-full border-2 border-black flex items-center justify-center font-black text-sm shrink-0 z-10 transition-colors"
                            style={idx === 0 ? { backgroundColor: tlActive, color: '#fff', borderColor: tlActive } : { backgroundColor: '#fff', color: '#111' }}
                          >{idx + 1}</div>
                        );

                        const TlContent = ({ node, alignRight }: { node: any; alignRight?: boolean }) => (
                          <div>
                            <div className={`flex items-start gap-1 ${alignRight ? 'flex-row-reverse' : ''}`}>
                              <input value={node.title} onChange={e => tlUpdNode(node, 'title', e.target.value)}
                                className={`font-black text-base bg-transparent outline-none border-b border-transparent focus:border-orange-500 flex-1 ${alignRight ? 'text-right' : ''}`} />
                              <button onClick={e => { e.stopPropagation(); tlDelNode(node.id); }}
                                className="text-red-400 hover:text-red-600 text-[10px] font-bold shrink-0 mt-1.5">✕</button>
                            </div>
                            <textarea value={node.desc} onChange={e => tlUpdNode(node, 'desc', e.target.value)}
                              ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                              className={`text-gray-500 text-sm w-full bg-transparent outline-none mt-1.5 resize-none border border-transparent focus:border-gray-300 leading-relaxed ${alignRight ? 'text-right' : ''}`}
                              style={{ overflow: 'hidden', minHeight: '1.5em' }} />
                          </div>
                        );

                        return (
                          <div className="px-10 max-w-3xl mx-auto w-full py-10">
                            <div className="flex items-center gap-3 mb-10">
                              <Clock className="w-5 h-5 text-orange-500 shrink-0" />
                              <input value={block.title || '채용 프로세스'} onChange={e => upd(block.id, 'title', e.target.value)}
                                className="text-2xl font-black bg-transparent outline-none border-b-2 border-transparent focus:border-orange-500 w-full" />
                            </div>

                            {/* ── VERTICAL LEFT ── */}
                            {tlLayout === 'vertical-left' && (
                              <div className="relative">
                                {tlNodes.length > 1 && (
                                  <div className="absolute left-4 top-5 bottom-5 w-0.5" style={{ backgroundColor: tlLine }} />
                                )}
                                <div className="flex flex-col">
                                  {tlNodes.map((node: any, idx: number) => (
                                    <div key={node.id} className="flex gap-6 pb-10 last:pb-0">
                                      <TlDot idx={idx} />
                                      <div className="flex-1 pt-1"><TlContent node={node} /></div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ── VERTICAL CENTER (ALTERNATING) ── */}
                            {tlLayout === 'vertical-center' && (
                              <div className="relative">
                                {tlNodes.length > 1 && (
                                  <div className="absolute left-1/2 top-5 bottom-5 w-0.5 -translate-x-1/2" style={{ backgroundColor: tlLine }} />
                                )}
                                <div className="flex flex-col">
                                  {tlNodes.map((node: any, idx: number) => {
                                    const isEven = idx % 2 === 0;
                                    return (
                                      <div key={node.id} className="flex items-start gap-6 pb-10 last:pb-0">
                                        <div className="flex-1 pt-1 min-w-0">
                                          {isEven && <TlContent node={node} alignRight />}
                                        </div>
                                        <TlDot idx={idx} />
                                        <div className="flex-1 pt-1 min-w-0">
                                          {!isEven && <TlContent node={node} />}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* ── HORIZONTAL ── */}
                            {tlLayout === 'horizontal' && (
                              <div className="overflow-x-auto pb-2">
                                <div className="relative flex" style={{ minWidth: `${Math.max(tlNodes.length * 140, 300)}px` }}>
                                  {tlNodes.length > 1 && (
                                    <div className="absolute top-4 h-0.5 z-0"
                                      style={{ backgroundColor: tlLine, left: '36px', right: '36px' }} />
                                  )}
                                  {tlNodes.map((node: any, idx: number) => (
                                    <div key={node.id} className="flex-1 flex flex-col items-center gap-3 relative z-10 px-1">
                                      <TlDot idx={idx} />
                                      <div className="text-center w-full">
                                        <div className="flex items-start justify-center gap-1">
                                          <input value={node.title} onChange={e => tlUpdNode(node, 'title', e.target.value)}
                                            className="font-black text-sm bg-transparent outline-none border-b border-transparent focus:border-orange-500 text-center min-w-0 flex-1" />
                                          <button onClick={e => { e.stopPropagation(); tlDelNode(node.id); }}
                                            className="text-red-400 hover:text-red-600 text-[10px] font-bold shrink-0 mt-1">✕</button>
                                        </div>
                                        <textarea value={node.desc} onChange={e => tlUpdNode(node, 'desc', e.target.value)}
                                          ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                          className="text-gray-500 text-xs w-full bg-transparent outline-none mt-1 resize-none leading-relaxed text-center border border-transparent focus:border-gray-300"
                                          style={{ overflow: 'hidden', minHeight: '1.5em' }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <button onClick={e => { e.stopPropagation(); upd(block.id, 'nodes', [...tlNodes, { id: Date.now().toString(), title: '새 단계', desc: '설명을 입력하세요.' }]); }}
                              className="mt-4 py-2 px-4 border border-dashed border-gray-200 hover:border-black text-gray-400 hover:text-black text-xs font-bold flex items-center gap-1.5 transition-colors">
                              <Plus className="w-3 h-3" /> 단계 추가
                            </button>
                          </div>
                        );
                      })()}

                      {/* BUTTON */}
                      {block.type === 'button' && (
                        <div className="flex justify-center w-full" style={{ paddingTop: `${block.paddingY || 32}px`, paddingBottom: `${block.paddingY || 32}px`, backgroundColor: block.bgColor || 'transparent' }}>
                          <input value={block.text || '버튼 텍스트'} onChange={e => upd(block.id, 'text', e.target.value)}
                            className={`font-black border-2 border-black outline-none text-center ${block.btnSize === 's' ? 'px-6 py-2 text-xs min-w-[100px]' : block.btnSize === 'l' ? 'px-14 py-5 text-xl min-w-[240px]' : 'px-10 py-4 text-base min-w-[200px]'}`}
                            style={{
                              backgroundColor: block.btnBg || resolveThemeHex(activeTheme),
                              color: block.btnTextColor || (activeTheme === 'white' ? '#000' : '#fff'),
                              borderRadius: `${block.radius || 0}px`,
                              boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)',
                              letterSpacing: '0.02em',
                            }} />
                        </div>
                      )}

                      {/* IMAGE */}
                      {block.type === 'image' && (
                        <div className="w-full flex justify-center px-8" style={{ paddingTop: `${block.paddingY || 16}px`, paddingBottom: `${block.paddingY || 16}px`, backgroundColor: block.bgColor || 'transparent' }}>
                          {block.src ? (
                            block.href ? (
                              <a href={block.href} target={block.linkTarget || '_blank'} rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                                <img src={block.src} alt={block.alt || ''} style={{ width: `${block.width || 100}%`, borderRadius: `${block.radius || 0}px`, objectFit: block.objectFit || 'cover', maxHeight: '500px', display: 'block' }} />
                              </a>
                            ) : (
                              <img src={block.src} alt={block.alt || ''} style={{ width: `${block.width || 100}%`, borderRadius: `${block.radius || 0}px`, objectFit: block.objectFit || 'cover', maxHeight: '500px', display: 'block' }} />
                            )
                          ) : (
                            <div className="w-full h-44 bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400"
                              style={{ borderRadius: `${block.radius || 0}px` }}>
                              <ImageIcon className="w-7 h-7" />
                              <span className="text-xs font-bold">우측 패널에서 이미지 URL을 입력하세요</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* SPACER */}
                      {block.type === 'spacer' && (
                        <div className="w-full relative flex items-center justify-center border-y border-dashed border-transparent hover:border-gray-200 transition-colors group/sp"
                          style={{ height: `${block.height || 64}px`, backgroundColor: block.bgColor || 'transparent' }}>
                          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover/sp:opacity-100 transition-opacity">
                            <input type="range" min={8} max={320} step={8} value={block.height || 64}
                              onChange={e => upd(block.id, 'height', Number(e.target.value))}
                              className="w-40 accent-orange-500 cursor-ew-resize" />
                            <span className="text-xs font-bold text-gray-400 w-12">{block.height || 64}px</span>
                          </div>
                        </div>
                      )}

                      {/* DIVIDER */}
                      {block.type === 'divider' && (
                        <div className="w-full px-8" style={{ paddingTop: `${block.paddingY || 24}px`, paddingBottom: `${block.paddingY || 24}px`, backgroundColor: block.bgColor || 'transparent' }}>
                          <hr style={{ borderStyle: block.style || 'solid', borderTopWidth: `${block.thickness || 1}px`, borderColor: block.color || '#e5e7eb', width: `${block.width || 100}%`, margin: '0 auto' }} />
                        </div>
                      )}

                    </div>
                  );
                })}

                <div className="py-8 px-10">
                  <div className="w-full py-6 border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-300 text-xs font-bold">
                    <Plus className="w-3.5 h-3.5" /> 좌측 팔레트에서 위젯을 추가하세요
                  </div>
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
            onUpdate={(field, value) => upd(selectedBlock.id, field, value)}
            onDeselect={() => setSelectedBlockId(null)}
            onDelete={() => handleDeleteBlock(selectedBlock.id)}
            themeHex={themeHex}
            activeTheme={activeTheme}
          />
        ) : (
          <WorkspaceProperties
            activeTheme={activeTheme} setActiveTheme={mkConfigSetter(setActiveTheme, 'activeTheme')}
            coverImg={coverImg} setCoverImg={mkConfigSetter(setCoverImg, 'coverImg')}
            clubName={clubName} setClubName={mkConfigSetter(setClubName, 'clubName')}
            hashtag1={hashtag1} setHashtag1={mkConfigSetter(setHashtag1, 'hashtag1')}
            hashtag2={hashtag2} setHashtag2={mkConfigSetter(setHashtag2, 'hashtag2')}
            badgeText={badgeText} setBadgeText={mkConfigSetter(setBadgeText, 'badgeText')}
            showFloatingBtn={showFloatingBtn} setShowFloatingBtn={mkConfigSetter(setShowFloatingBtn, 'showFloatingBtn')}
            contentWidth={contentWidth} setContentWidth={mkConfigSetter(setContentWidth, 'contentWidth')}
            pageBgColor={pageBgColor} setPageBgColor={mkConfigSetter(setPageBgColor, 'pageBgColor')}
            globalFont={globalFont} setGlobalFont={mkConfigSetter(setGlobalFont, 'globalFont')}
            pageTitle={pageTitle} setPageTitle={mkConfigSetter(setPageTitle, 'pageTitle')}
            pageDesc={pageDesc} setPageDesc={mkConfigSetter(setPageDesc, 'pageDesc')}
          />
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-black text-white px-5 py-3 font-bold text-sm flex items-center gap-2 shadow-[4px_4px_0_0_rgba(249,115,22,0.7)]">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideDownIn { from { opacity:0; transform:translateY(-12px) scale(0.99); } to { opacity:1; transform:none; } }
        .animate-slide-down { animation: slideDownIn 0.2s cubic-bezier(0.16,1,0.3,1) forwards; }
        @keyframes wbFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes wbSlideUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
        @keyframes wbSlideIn { from { opacity:0; transform:translateX(-24px); } to { opacity:1; transform:none; } }
        .wb-anim-fadeIn { animation: wbFadeIn 0.7s ease forwards; }
        .wb-anim-slideUp { animation: wbSlideUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
        .wb-anim-slideIn { animation: wbSlideIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards; }
      ` }} />
    </div>
  );
}
