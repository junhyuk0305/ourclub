import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Search, X, CheckCircle, Loader, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface ClubResult {
  id: string;
  name: string;
  type: string;
  logo_url: string | null;
  is_certified: boolean;
}

type PageState = 'form' | 'success';

export default function ClubJoin() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ClubResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [roleTitle, setRoleTitle] = useState('');
  const [intro, setIntro] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pageState, setPageState] = useState<PageState>('form');

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // 검색어 디바운스 처리
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); setShowDropdown(false); return; }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from('clubs')
        .select('id, name, type, logo_url, is_certified')
        .ilike('name', `%${query}%`)
        .limit(8);
      setResults(data ?? []);
      setShowDropdown(true);
      setSearching(false);
    }, 300);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const selectClub = (club: ClubResult) => {
    setSelectedClub(club);
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    setErrorMsg('');
  };

  const clearClub = () => {
    setSelectedClub(null);
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedClub) return;
    if (!roleTitle.trim()) { setErrorMsg('희망 직책을 입력해주세요.'); return; }
    if (!intro.trim()) { setErrorMsg('한 줄 소개를 입력해주세요.'); return; }

    setSubmitting(true);
    setErrorMsg('');

    const { error } = await supabase.from('club_join_requests').insert({
      user_id: user.id,
      club_id: selectedClub.id,
      role_title: roleTitle.trim(),
      intro: intro.trim(),
    });

    setSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        setErrorMsg('이미 이 동아리에 합류 신청한 이력이 있어요.');
      } else {
        setErrorMsg('신청 중 오류가 발생했어요. 다시 시도해주세요.');
      }
      return;
    }

    setPageState('success');
  };

  // ── 완료 화면 ────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md">
          <div className="bg-white border border-sand-200 rounded-card p-8 shadow-soft text-center">
            <div className="w-16 h-16 bg-ok-bg rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-ok-fg" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-black text-ink mb-3">합류 신청 완료!</h1>
            <p className="font-bold text-sand-600 mb-2">
              <span className="text-ink font-black">{selectedClub?.name}</span> 운영진에게<br />
              신청서가 전달됐어요.
            </p>
            <p className="text-sm font-bold text-sand-500 mb-8">
              승인되면 동아리 관리 페이지에 접근할 수 있어요.
            </p>
            <Link
              to="/"
              className="block w-full py-4 btn-grad text-white font-black rounded-ctl shadow-btn hover:shadow-soft-lg transition-shadow"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── 신청 폼 ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
      <header className="p-6 max-w-2xl mx-auto w-full">
        <Link
          to="/club-setup"
          className="inline-flex items-center gap-2 font-black text-xl text-ink hover:text-brand transition-colors"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} /> 돌아가기
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 pb-12">
        <div className="w-full max-w-2xl">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-ink mb-2">기존 동아리 합류</h1>
            <p className="font-bold text-sand-600">
              동아리를 검색하고 운영진 합류를 신청해요.<br />
              해당 동아리 운영진의 승인이 필요해요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* 동아리 검색 */}
            <div className="bg-white border border-sand-200 rounded-card p-6 shadow-soft">
              <h2 className="font-black text-lg text-ink mb-4">1. 동아리 선택</h2>

              {selectedClub ? (
                <div className="flex items-center gap-4 border border-brand rounded-ctl p-4 bg-brand-tint">
                  {selectedClub.logo_url ? (
                    <img src={selectedClub.logo_url} alt={selectedClub.name} className="w-12 h-12 rounded-ctl border border-sand-200 object-cover" />
                  ) : (
                    <div className="w-12 h-12 thumb-grad rounded-ctl flex items-center justify-center font-black text-lg text-ink">
                      {selectedClub.name[0]}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-ink">{selectedClub.name}</span>
                      {selectedClub.is_certified && (
                        <span className="bg-brand text-white text-xs font-black px-2 py-0.5 rounded-md">인증</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-sand-500">{selectedClub.type}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearClub}
                    className="p-1 text-sand-400 hover:text-bad-fg transition-colors"
                  >
                    <X className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div ref={searchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sand-400" strokeWidth={2.5} />
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      onFocus={() => results.length > 0 && setShowDropdown(true)}
                      placeholder="동아리 이름을 입력하세요"
                      className="field w-full border border-sand-300 rounded-ctl pl-10 pr-4 py-3 font-bold text-ink placeholder:text-sand-400 transition-colors"
                    />
                    {searching && (
                      <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-brand" strokeWidth={2.5} />
                    )}
                  </div>

                  {showDropdown && results.length > 0 && (
                    <ul className="absolute z-10 w-full border border-sand-200 rounded-card bg-white shadow-soft max-h-60 overflow-y-auto mt-1">
                      {results.map(club => (
                        <li key={club.id}>
                          <button
                            type="button"
                            onClick={() => selectClub(club)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-tint transition-colors text-left border-b border-sand-100 last:border-0"
                          >
                            {club.logo_url ? (
                              <img src={club.logo_url} alt={club.name} className="w-9 h-9 rounded-ctl border border-sand-200 object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-9 h-9 bg-sand-100 rounded-ctl flex items-center justify-center font-black text-ink flex-shrink-0">
                                {club.name[0]}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-ink truncate">{club.name}</span>
                                {club.is_certified && (
                                  <Shield className="w-3.5 h-3.5 text-brand flex-shrink-0" strokeWidth={2.5} />
                                )}
                              </div>
                              <span className="text-xs font-bold text-sand-500">{club.type}</span>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {showDropdown && !searching && results.length === 0 && query.trim() && (
                    <div className="absolute z-10 w-full border border-sand-200 rounded-card bg-white px-4 py-3 text-sm font-bold text-sand-500 mt-1">
                      검색 결과가 없어요.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 신청 정보 */}
            <div className={`bg-white border border-sand-200 rounded-card p-6 shadow-soft transition-opacity ${selectedClub ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <h2 className="font-black text-lg text-ink mb-4">2. 신청 정보 입력</h2>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm text-ink">
                    희망 직책 <span className="text-brand">*</span>
                  </label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                    placeholder="예: 기획팀장, 디자이너, 개발자"
                    maxLength={30}
                    className="field border border-sand-300 rounded-ctl px-4 py-3 font-bold text-ink placeholder:text-sand-400 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm text-ink">
                    한 줄 소개 <span className="text-brand">*</span>
                  </label>
                  <textarea
                    value={intro}
                    onChange={e => setIntro(e.target.value)}
                    placeholder="운영진으로 합류하려는 이유와 기여할 수 있는 점을 간단히 적어주세요."
                    maxLength={200}
                    rows={4}
                    className="field border border-sand-300 rounded-ctl px-4 py-3 font-bold text-ink placeholder:text-sand-400 transition-colors resize-none"
                  />
                  <span className="text-xs font-bold text-sand-400 text-right">{intro.length}/200</span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <p className="text-bad-fg font-bold text-sm bg-bad-bg rounded-ctl px-4 py-3">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedClub}
              className="w-full py-4 btn-grad text-white font-black text-lg rounded-ctl shadow-btn hover:shadow-soft-lg transition-shadow disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {submitting && <Loader className="w-5 h-5 animate-spin" strokeWidth={2.5} />}
              합류 신청하기
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
