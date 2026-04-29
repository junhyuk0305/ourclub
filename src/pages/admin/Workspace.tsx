import React, { useState, useEffect, useRef } from 'react';
import { Type, Image as ImageIcon, CheckSquare, Plus, Layout, ArrowLeft, Briefcase, Users, Calendar, MapPin, AlignLeft, Loader, Check, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { WorkspaceProperties } from '../../components/admin/WorkspaceProperties';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';

const DEFAULT_BLOCKS: any[] = [
  {
    id: '1', type: 'statGrid',
    s1Title: '진행된 기업 프로젝트', s1Val: '12건',
    s2Title: '회원 수 (누적 기수)', s2Val: '240명 (13기)',
    s3Title: '투명 회비 공개', s3Val: '100% 보장'
  },
  { id: '2', type: 'spacer', height: 80 },
  {
    id: '3', type: 'introText',
    title: '우리는 시장의 반응을 확인하는\n진짜 마케터들의 집단입니다.',
    content: '실무를 갈망하는 열정적인 기획자, 마케터들이 모인 연합 동아리입니다.'
  },
  { id: '4', type: 'spacer', height: 80 },
  {
    id: '5', type: 'splitGrid',
    listTitle: '활동 장소 및 회비',
    listItems: '📍 정규 세션: 매주 토요일 신촌\n💸 회비: 40,000원\n👥 모집 인원: 20명 내외',
    ctaTitle: '지원하기',
    ctaSub: '열정 있는 예비 실무자들의 지원을 기다립니다.',
    ctaBtn: '지원서 작성하러 가기'
  },
  { id: '6', type: 'spacer', height: 80 },
  { id: '7', type: 'gallery', title: '실무 포트폴리오 갤러리' }
];

export default function Workspace() {
  const { adminClub, adminClubId } = useAdmin();

  const [activeTheme, setActiveTheme] = useState('orange-500');
  const [coverImg, setCoverImg] = useState('https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80');
  const [clubName, setClubName] = useState('');
  const [hashtag1, setHashtag1] = useState('기획');
  const [hashtag2, setHashtag2] = useState('마케팅');
  const [badgeText, setBadgeText] = useState('안전 검증 100% 완료');
  const [showFloatingBtn, setShowFloatingBtn] = useState(true);
  const [blocks, setBlocks] = useState<any[]>(DEFAULT_BLOCKS);

  const [pageId, setPageId] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [toast, setToast] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // init clubName from adminClub
  useEffect(() => {
    if (adminClub?.name) setClubName(adminClub.name);
  }, [adminClub]);

  // load page data
  useEffect(() => {
    if (!adminClubId) return;
    loadPage(adminClubId);
  }, [adminClubId]);

  const loadPage = async (clubId: string) => {
    setFetching(true);
    const { data } = await supabase
      .from('club_pages')
      .select('id, blocks, published_at')
      .eq('club_id', clubId)
      .maybeSingle();

    if (data) {
      setPageId(data.id);
      setIsPublished(!!data.published_at);
      const saved = data.blocks as any;
      if (saved && saved.config) {
        const cfg = saved.config;
        if (cfg.activeTheme) setActiveTheme(cfg.activeTheme);
        if (cfg.coverImg) setCoverImg(cfg.coverImg);
        if (cfg.clubName) setClubName(cfg.clubName);
        if (cfg.hashtag1 !== undefined) setHashtag1(cfg.hashtag1);
        if (cfg.hashtag2 !== undefined) setHashtag2(cfg.hashtag2);
        if (cfg.badgeText !== undefined) setBadgeText(cfg.badgeText);
        if (cfg.showFloatingBtn !== undefined) setShowFloatingBtn(cfg.showFloatingBtn);
      }
      if (saved && Array.isArray(saved.blocks)) setBlocks(saved.blocks);
    }
    setFetching(false);
  };

  // helper to build payload
  const buildPayload = (
    currentBlocks: any[],
    cfg: { activeTheme: string; coverImg: string; clubName: string; hashtag1: string; hashtag2: string; badgeText: string; showFloatingBtn: boolean }
  ) => ({ blocks: currentBlocks, config: cfg });

  // auto-save debounce
  const triggerAutoSave = (updatedBlocks: any[], cfg?: any) => {
    setSaveStatus('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveToDb(updatedBlocks, cfg);
    }, 5000);
  };

  const saveToDb = async (
    currentBlocks: any[],
    cfgOverride?: any
  ) => {
    if (!adminClubId) return;
    setSaveStatus('saving');
    const cfg = cfgOverride ?? {
      activeTheme, coverImg, clubName, hashtag1, hashtag2, badgeText, showFloatingBtn
    };
    const payload = buildPayload(currentBlocks, cfg);

    if (pageId) {
      await supabase.from('club_pages').update({ blocks: payload, updated_at: new Date().toISOString() }).eq('id', pageId);
    } else {
      const { data } = await supabase
        .from('club_pages')
        .insert({ club_id: adminClubId, blocks: payload })
        .select()
        .single();
      if (data) setPageId(data.id);
    }
    setSaveStatus('saved');
  };

  const handlePublish = async () => {
    if (!adminClubId) return;
    setSaveStatus('saving');
    const cfg = { activeTheme, coverImg, clubName, hashtag1, hashtag2, badgeText, showFloatingBtn };
    const payload = buildPayload(blocks, cfg);
    const publishedAt = isPublished ? null : new Date().toISOString();

    if (pageId) {
      await supabase.from('club_pages').update({ blocks: payload, published_at: publishedAt }).eq('id', pageId);
    } else {
      const { data } = await supabase
        .from('club_pages')
        .insert({ club_id: adminClubId, blocks: payload, published_at: publishedAt })
        .select().single();
      if (data) setPageId(data.id);
    }
    setIsPublished(!isPublished);
    setSaveStatus('saved');
    showToast(isPublished ? '비공개로 전환되었습니다.' : '홈페이지가 발행되었습니다!');
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleAddBlock = (type: string) => {
    let newBlock: any = { id: Date.now().toString(), type };
    if (type === 'text') newBlock = { ...newBlock, title: '새 텍스트 블록', content: '내용을 입력하세요' };
    if (type === 'introText') newBlock = { ...newBlock, title: '강조할 제목을 입력하세요', content: '상세 소개 내용을 입력하세요' };
    if (type === 'button') newBlock = { ...newBlock, content: '버튼 텍스트' };
    if (type === 'spacer') newBlock = { ...newBlock, height: 60 };
    if (type === 'grid3') newBlock = { ...newBlock, col1: '텍스트 1', col2: '텍스트 2', col3: '텍스트 3' };
    if (type === 'statGrid') newBlock = { ...newBlock, s1Title: '항목1', s1Val: '0건', s2Title: '항목2', s2Val: '0명', s3Title: '항목3', s3Val: '0%' };
    if (type === 'splitGrid') newBlock = { ...newBlock, listTitle: '정보', listItems: '설명', ctaTitle: '지원하기', ctaSub: '설명', ctaBtn: '버튼명' };
    if (type === 'dday') newBlock = { ...newBlock, title: '모집 마감까지', content: '기간 입력' };
    if (type === 'gallery') newBlock = { ...newBlock, title: '포트폴리오 갤러리' };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  const handleUpdateBlock = (id: string, field: string, value: any) => {
    const updated = blocks.map(b => b.id === id ? { ...b, [field]: value } : b);
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  const handleDeleteBlock = (id: string) => {
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    triggerAutoSave(updated);
  };

  // wrap config setters to also trigger save
  const mkConfigSetter = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: string) =>
    (val: T) => {
      setter(val);
      const cfg = { activeTheme, coverImg, clubName, hashtag1, hashtag2, badgeText, showFloatingBtn, [key]: val };
      triggerAutoSave(blocks, cfg);
    };

  const themes: Record<string, string> = {
    'orange-500': 'bg-orange-500',
    'black': 'bg-black',
    'white': 'bg-white',
  };
  const getThemeText = (t: string) => t === 'white' ? 'text-black' : 'text-white';

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Top Bar */}
      <header className="h-14 border-b border-black bg-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 transition-colors rounded-full border border-transparent hover:border-black">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-lg tracking-tight">1-Page 웹빌더</h1>
          <div className="text-xs font-bold text-gray-400 flex items-center gap-1">
            {saveStatus === 'saving' && <><Loader className="w-3 h-3 animate-spin" /> 저장 중...</>}
            {saveStatus === 'saved' && <><Check className="w-3 h-3 text-green-500" /> 저장됨</>}
            {saveStatus === 'unsaved' && '변경사항 있음'}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to={`/clubs/${adminClub?.slug ?? ''}`}
            target="_blank"
            className="px-4 py-2 border border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-px text-sm font-bold"
          >
            라이브 프리뷰
          </Link>
          <button
            onClick={handlePublish}
            className={`px-6 py-2 font-black border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-px active:shadow-none active:translate-y-1 transition-all text-sm flex items-center gap-2 ${isPublished ? 'bg-gray-700 text-white hover:bg-red-600' : 'bg-orange-500 text-black'}`}
          >
            <Globe className="w-4 h-4" />
            {isPublished ? '발행 취소' : '저장 및 발행'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />

          <h2 className="font-black mb-4 px-2 pt-6 border-t border-gray-200 mt-2">빌더 요소</h2>
          <div className="flex flex-col gap-2 mb-8">
            <button onClick={() => handleAddBlock('introText')} className="p-3 border border-gray-200 rounded text-left hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 group bg-white">
              <AlignLeft className="w-5 h-5 text-gray-400 group-hover:text-black" />
              <span className="font-bold text-sm">소개 인트로 블록</span>
            </button>
            <button onClick={() => handleAddBlock('text')} className="p-3 border border-gray-200 rounded text-left hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 group bg-white">
              <Type className="w-5 h-5 text-gray-400 group-hover:text-black" />
              <span className="font-bold text-sm">일반 텍스트</span>
            </button>
            <button onClick={() => handleAddBlock('grid3')} className="p-3 border border-gray-200 rounded text-left hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 group bg-white">
              <Layout className="w-5 h-5 text-gray-400 group-hover:text-black" />
              <span className="font-bold text-sm">3-단 다목적 그리드</span>
            </button>
            <button onClick={() => handleAddBlock('button')} className="p-3 border border-gray-200 rounded text-left hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 group bg-white">
              <CheckSquare className="w-5 h-5 text-gray-400 group-hover:text-black" />
              <span className="font-bold text-sm">액션 버튼 (CTA)</span>
            </button>
            <button onClick={() => handleAddBlock('image')} className="p-3 border border-gray-200 rounded text-left hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 group bg-white">
              <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-black" />
              <span className="font-bold text-sm">이미지 멀티 슬라이드</span>
            </button>
            <button onClick={() => handleAddBlock('spacer')} className="p-3 border border-gray-200 rounded text-left hover:border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 group bg-white">
              <div className="w-5 h-5 flex flex-col justify-between items-center py-1"><div className="w-4 h-px bg-gray-400 group-hover:bg-black" /><div className="w-4 h-px bg-gray-400 group-hover:bg-black" /></div>
              <span className="font-bold text-sm">여백 조절기 (Spacer)</span>
            </button>
          </div>

          <h2 className="font-black mb-4 px-2">동아리 특화 위젯</h2>
          <div className="flex flex-col gap-2">
            <button onClick={() => handleAddBlock('statGrid')} className="p-3 border border-black bg-orange-50 text-left hover:bg-orange-100 transition-all flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black text-sm text-orange-600">3-단 통계 그리드</span>
            </button>
            <button onClick={() => handleAddBlock('splitGrid')} className="p-3 border border-black bg-orange-50 text-left hover:bg-orange-100 transition-all flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black text-sm text-orange-600">안내+지원 2-단 그리드</span>
            </button>
            <button onClick={() => handleAddBlock('gallery')} className="p-3 border border-black bg-orange-50 text-left hover:bg-orange-100 transition-all flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black text-sm text-orange-600">수주 프로젝트 갤러리</span>
            </button>
            <button onClick={() => handleAddBlock('dday')} className="p-3 border border-black bg-orange-50 text-left hover:bg-orange-100 transition-all flex items-center gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="font-black text-sm text-orange-600">D-Day 모집 타이머</span>
            </button>
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 bg-gray-100 flex flex-col items-center overflow-y-auto p-4 sm:p-8 relative min-h-0">
          {fetching ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
          <div className="w-full max-w-4xl bg-white border border-black shadow-2xl min-h-[800px] flex flex-col relative shrink-0 overflow-hidden">

            {/* Hero */}
            <div className="h-[50vh] bg-gray-900 border-b border-black relative">
              <img src={coverImg} alt="Cover" className="w-full h-full object-cover opacity-70 grayscale mix-blend-overlay" />
              <div className="absolute top-0 w-full p-6 md:p-10 z-20">
                <div className="inline-flex items-center gap-2 font-black text-white px-4 py-2 bg-black/50 backdrop-blur-md border border-white opacity-70 text-sm w-max">
                  <ArrowLeft className="w-4 h-4" /> 동아리 목록으로 돌아가기
                </div>
              </div>
              <div className="absolute bottom-0 w-full p-6 md:p-12 z-20 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-between items-end h-full">
                <div className="mt-auto">
                  <div className="flex gap-2 mb-4">
                    {hashtag1 && <span className="px-3 py-1 font-bold text-sm bg-white text-black">#{hashtag1}</span>}
                    {hashtag2 && <span className="px-3 py-1 font-bold text-sm bg-white text-black">#{hashtag2}</span>}
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-2">{clubName || adminClub?.name}</h1>
                  <p className="text-xl md:text-2xl font-bold text-gray-300">{adminClub?.one_line_desc ?? ''}</p>
                </div>
                {badgeText && (
                  <div className={`hidden md:block px-6 py-3 font-black text-lg border-2 border-black transform rotate-3 shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] mb-8 ${themes[activeTheme]} ${getThemeText(activeTheme)}`}>
                    {badgeText}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full border-b-2 border-black bg-white sticky top-0 z-40 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.1)]">
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="font-bold text-lg hidden md:flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-500" /> 지원 기간 표시 영역
                </div>
                <div className="px-10 py-3 text-lg font-black border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-gray-200 text-gray-500">
                  지원하기 영역
                </div>
              </div>
            </div>

            {/* Blocks */}
            <div className="flex-1 flex flex-col relative z-10 bg-white">
              <div className="flex flex-col flex-1 min-h-[400px]">
                {blocks.length === 0 ? (
                  <div className="text-center text-gray-400 font-bold py-10">위젯을 추가해주세요</div>
                ) : blocks.map((block) => (
                  <div key={block.id} className={`relative group cursor-pointer hover:shadow-[inset_0_0_0_4px_rgba(249,115,22,0.3)] hover:z-30 transition-all animate-slide-down ${block.type === 'spacer' ? '!p-0' : 'p-0'}`}>
                    <div className="absolute top-2 right-2 flex gap-1 z-30 transform scale-0 group-hover:scale-100 transition-transform origin-top-right">
                      <button onClick={() => handleDeleteBlock(block.id)} className="bg-red-500 text-white font-bold p-1 text-xs px-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-px active:shadow-none transition-all">삭제 [X]</button>
                    </div>

                    {block.type === 'introText' && (
                      <div className="max-w-3xl mx-auto px-6 text-center py-6">
                        <span className="font-black text-gray-300 text-xs tracking-widest absolute top-2 left-6 uppercase">소개 인트로 블록</span>
                        <textarea value={block.title} onChange={(e) => handleUpdateBlock(block.id, 'title', e.target.value)} className="text-3xl md:text-4xl font-black mb-8 leading-tight outline-none border border-transparent hover:border-gray-200 focus:border-orange-500 bg-transparent w-full resize-none text-center" rows={2} />
                        <textarea value={block.content} onChange={(e) => handleUpdateBlock(block.id, 'content', e.target.value)} className="text-lg font-medium text-gray-600 leading-relaxed outline-none border border-transparent hover:border-gray-200 focus:border-orange-500 bg-transparent w-full resize-none text-left md:text-center" rows={4} />
                      </div>
                    )}

                    {block.type === 'statGrid' && (
                      <div className="w-full bg-gray-50 border-y border-black">
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black w-full">
                          {[1, 2, 3].map(num => (
                            <div key={num} className="p-10 flex flex-col items-center justify-center text-center bg-white group/stat hover:bg-orange-50 transition-colors">
                              {num === 1 && <Briefcase className="w-10 h-10 mb-4 text-orange-500" />}
                              {num === 2 && <Users className="w-10 h-10 mb-4 text-orange-500" />}
                              {num === 3 && <Calendar className="w-10 h-10 mb-4 text-orange-500" />}
                              <input className="text-sm font-bold text-gray-400 mb-1 tracking-widest uppercase text-center outline-none bg-transparent hover:bg-white focus:bg-white w-full" value={block[`s${num}Title`] as string} onChange={e => handleUpdateBlock(block.id, `s${num}Title`, e.target.value)} />
                              <input className={`text-3xl font-black text-center outline-none bg-transparent hover:bg-white focus:bg-white w-full ${num === 3 ? 'text-orange-500' : ''}`} value={block[`s${num}Val`] as string} onChange={e => handleUpdateBlock(block.id, `s${num}Val`, e.target.value)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {block.type === 'splitGrid' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 max-w-7xl mx-auto w-full py-6">
                        <div className="bg-black text-white p-12 border border-black flex flex-col justify-center relative overflow-hidden">
                          <div className="absolute -top-10 -right-10 p-4 opacity-10"><MapPin className="w-48 h-48" /></div>
                          <input value={block.listTitle} onChange={e => handleUpdateBlock(block.id, 'listTitle', e.target.value)} className="text-2xl font-black mb-6 z-10 bg-transparent outline-none border-b border-transparent focus:border-white w-full" />
                          <textarea value={block.listItems} onChange={e => handleUpdateBlock(block.id, 'listItems', e.target.value)} className="font-bold text-gray-300 z-10 bg-transparent outline-none border border-transparent focus:border-gray-700 w-full resize-none leading-loose" rows={4} />
                        </div>
                        <div className={`p-10 md:p-12 border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between ${themes[activeTheme] || 'bg-orange-500'} ${getThemeText(activeTheme)}`}>
                          <div>
                            <input value={block.ctaTitle} onChange={e => handleUpdateBlock(block.id, 'ctaTitle', e.target.value)} className={`text-3xl font-black mb-4 bg-transparent outline-none border-b border-transparent w-full ${activeTheme === 'black' ? 'focus:border-white' : 'focus:border-black'}`} />
                            <input value={block.ctaSub} onChange={e => handleUpdateBlock(block.id, 'ctaSub', e.target.value)} className={`font-bold opacity-80 mb-8 bg-transparent outline-none w-full border-transparent border-b ${activeTheme === 'black' ? 'focus:border-white' : 'focus:border-black'}`} />
                          </div>
                          <div className={`font-black py-5 px-6 border-2 flex justify-between items-center ${activeTheme === 'black' ? 'bg-white text-black border-white' : 'bg-white text-black border-black'}`}>
                            <input value={block.ctaBtn} onChange={e => handleUpdateBlock(block.id, 'ctaBtn', e.target.value)} className="bg-transparent outline-none w-full pointer-events-none text-xl" />
                            <ArrowLeft className="w-6 h-6 rotate-180" />
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === 'text' && (
                      <div className="px-6 max-w-7xl mx-auto w-full p-4">
                        <span className="font-black text-gray-500 mb-2 select-none text-xs tracking-widest uppercase">TEXT BLOCK</span>
                        <input type="text" value={block.title} onChange={(e) => handleUpdateBlock(block.id, 'title', e.target.value)} className="text-2xl font-black mb-2 outline-none border-b border-transparent focus:border-orange-500 bg-transparent w-full" />
                        <textarea value={block.content} onChange={(e) => handleUpdateBlock(block.id, 'content', e.target.value)} className="font-bold text-gray-600 outline-none border border-transparent focus:border-orange-500 bg-transparent w-full resize-none" rows={3} />
                      </div>
                    )}

                    {block.type === 'grid3' && (
                      <div className="px-6 max-w-7xl mx-auto w-full p-4">
                        <span className="font-black text-gray-500 mb-4 block select-none text-xs tracking-widest uppercase">3-COLUMN GRID</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="border border-black p-6 bg-gray-50 hover:bg-orange-50 transition-colors">
                              <textarea className="w-full bg-transparent outline-none font-bold resize-none h-full min-h-[100px]" placeholder={`그리드 항목 ${i}`} value={block[`col${i}`] as string || ''} onChange={(e) => handleUpdateBlock(block.id, `col${i}`, e.target.value)} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {block.type === 'button' && (
                      <div className="flex justify-center w-full my-4 py-6">
                        <button className={`px-8 py-4 font-black border border-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${themes[activeTheme] || 'bg-orange-500'} ${getThemeText(activeTheme)}`}>
                          <input value={block.content} onChange={(e) => handleUpdateBlock(block.id, 'content', e.target.value)} className="bg-transparent outline-none text-center w-full font-black min-w-[200px]" />
                        </button>
                      </div>
                    )}

                    {block.type === 'image' && (
                      <div className="w-full h-40 bg-gray-200 border border-gray-300 flex items-center justify-center font-bold text-gray-400 my-6">
                        이미지 슬라이드 영역 (에디터 전용 미리보기)
                      </div>
                    )}

                    {block.type === 'dday' && (
                      <div className={`w-full p-16 border-y border-black flex flex-col items-center justify-center text-center my-6 ${themes[activeTheme] || 'bg-orange-500'} ${getThemeText(activeTheme)}`}>
                        <span className="font-black text-xs tracking-widest absolute top-2 left-6 uppercase opacity-50">D-DAY WIDGET</span>
                        <input value={block.title} onChange={e => handleUpdateBlock(block.id, 'title', e.target.value)} className="text-xl font-bold mb-2 opacity-90 text-center bg-transparent outline-none border-b border-transparent focus:border-white/50 w-full" placeholder="모집 마감까지" />
                        <div className="text-7xl md:text-8xl font-black tracking-tighter mb-6 drop-shadow-md">D-14</div>
                        <input value={block.content} onChange={e => handleUpdateBlock(block.id, 'content', e.target.value)} className="font-bold bg-black text-white px-6 py-2 text-center outline-none min-w-[280px]" placeholder="기간 입력" />
                      </div>
                    )}

                    {block.type === 'gallery' && (
                      <div className="px-6 max-w-7xl mx-auto w-full py-6">
                        <input value={block.title} onChange={e => handleUpdateBlock(block.id, 'title', e.target.value)} className="text-3xl font-black mb-10 w-full bg-transparent outline-none border-b-2 border-transparent focus:border-orange-500" />
                        <div className="flex overflow-hidden gap-6 pb-4">
                          <div className="min-w-[300px] border border-black bg-white group/pic hover:-translate-y-1 transition-transform">
                            <div className="h-48 bg-gray-200 border-b border-black select-none flex items-center justify-center overflow-hidden">
                              <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=400&q=80" alt="portfolio" className="w-full h-full object-cover grayscale mix-blend-multiply group-hover/pic:grayscale-0 transition-all" />
                            </div>
                            <div className="p-4 bg-gray-50 text-black text-sm font-bold group-hover/pic:bg-orange-100 transition-colors">A사 앱 기획안 도출 프로젝트</div>
                          </div>
                          <div className="min-w-[300px] border border-black bg-white opacity-50">
                            <div className="h-48 bg-gray-200 border-b border-black select-none flex items-center justify-center font-bold text-gray-500">동아리 갤러리와 연동됨</div>
                            <div className="p-4 bg-gray-50 text-gray-500 text-sm font-bold">자동으로 가져옵니다</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {block.type === 'spacer' && (
                      <div style={{ height: `${block.height || 60}px` }} className="w-full relative flex items-center justify-center group/spacer border-y border-transparent hover:border-gray-200 border-dashed hover:border-solid hover:bg-orange-500/5">
                        <input type="range" min="20" max="200" step="10" value={block.height || 60} onChange={(e) => handleUpdateBlock(block.id, 'height', parseInt(e.target.value))} className="absolute w-1/2 opacity-0 group-hover/spacer:opacity-100 z-10 cursor-ew-resize accent-orange-500 transition-opacity" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white text-xs font-bold px-2 py-1 opacity-0 group-hover/spacer:opacity-100 pointer-events-none">{block.height || 60}px 여백</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="px-6 py-12">
                <button className="w-full py-8 border-2 border-dashed border-gray-300 hover:border-black hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-400 hover:text-black font-bold transition-colors">
                  <Plus className="w-5 h-5" /> 좌측 메뉴에서 위젯을 클릭하여 추가하세요
                </button>
              </div>
            </div>
          </div>
          )}

          {showFloatingBtn && (
            <div className="sticky bottom-8 self-end mr-4 sm:mr-8 z-50 pointer-events-none max-w-4xl w-full flex justify-end -mt-20">
              <button className={`pointer-events-auto px-6 py-4 font-black border-2 border-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-1 transition-all flex items-center gap-2 ${themes[activeTheme]} ${getThemeText(activeTheme)}`}>
                지원하기 <ArrowLeft className="w-5 h-5" style={{ transform: 'rotate(135deg)' }} />
              </button>
            </div>
          )}
        </main>

        {/* Right Panel: Properties */}
        <WorkspaceProperties
          activeTheme={activeTheme} setActiveTheme={mkConfigSetter(setActiveTheme, 'activeTheme')}
          coverImg={coverImg} setCoverImg={mkConfigSetter(setCoverImg, 'coverImg')}
          clubName={clubName} setClubName={mkConfigSetter(setClubName, 'clubName')}
          hashtag1={hashtag1} setHashtag1={mkConfigSetter(setHashtag1, 'hashtag1')}
          hashtag2={hashtag2} setHashtag2={mkConfigSetter(setHashtag2, 'hashtag2')}
          badgeText={badgeText} setBadgeText={mkConfigSetter(setBadgeText, 'badgeText')}
          showFloatingBtn={showFloatingBtn} setShowFloatingBtn={mkConfigSetter(setShowFloatingBtn, 'showFloatingBtn')}
        />
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-black text-white px-6 py-4 border border-white font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.5)]">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDownIn {
          0% { opacity: 0; transform: translateY(-20px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-slide-down {
          animation: slideDownIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}
