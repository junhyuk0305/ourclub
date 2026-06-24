import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Search, CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

interface Club {
  id: string;
  name: string;
  slug: string;
  type: string;
  is_certified: boolean;
  logo_url: string | null;
  one_line_desc: string | null;
  location: string | null;
  created_at: string;
}

type Filter = 'all' | 'certified' | 'uncertified';

export default function ClubsAdmin() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('clubs')
      .select('id, name, slug, type, is_certified, logo_url, one_line_desc, location, created_at')
      .order('created_at', { ascending: false });
    setClubs((data as Club[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const toggleCert = async (club: Club) => {
    const next = !club.is_certified;
    // 인증 해제는 동아리 신뢰도에 영향 → 확인
    if (!next && !window.confirm(`'${club.name}'의 인증 배지를 해제할까요?`)) return;
    setTogglingId(club.id);
    setToast(null);
    const { error } = await supabase.from('clubs').update({ is_certified: next }).eq('id', club.id);
    setTogglingId(null);
    if (error) {
      setToast({ kind: 'error', text: `변경 실패: ${error.message}` });
      return;
    }
    setClubs(prev => prev.map(c => (c.id === club.id ? { ...c, is_certified: next } : c)));
    setToast({ kind: 'success', text: next ? `'${club.name}' 인증 완료` : `'${club.name}' 인증 해제됨` });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clubs.filter(c => {
      if (filter === 'certified' && !c.is_certified) return false;
      if (filter === 'uncertified' && c.is_certified) return false;
      if (q && !(`${c.name} ${c.type} ${c.location ?? ''}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [clubs, query, filter]);

  const certifiedCount = clubs.filter(c => c.is_certified).length;

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: `전체 ${clubs.length}` },
    { key: 'certified', label: `인증 ${certifiedCount}` },
    { key: 'uncertified', label: `미인증 ${clubs.length - certifiedCount}` },
  ];

  return (
    <>
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-ctl font-black text-sm shadow-soft-lg ${
            toast.kind === 'success' ? 'bg-ok-bg text-ok-fg' : 'bg-bad-bg text-bad-fg'
          }`}
        >
          {toast.text}
        </div>
      )}
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black text-ink mb-1">동아리 관리</h1>
          <p className="font-bold text-sand-500">전체 동아리를 조회하고 인증 배지를 관리합니다.</p>
        </div>

        {/* 검색 + 필터 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-sand-400" strokeWidth={2.5} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="동아리명·유형·지역 검색"
              className="field w-full pl-9 pr-4 py-2.5 border border-sand-300 rounded-ctl font-bold text-sm"
            />
          </div>
          <div className="flex border border-sand-200 rounded-ctl w-fit bg-sand-100 p-1 gap-1">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 font-black text-xs rounded-ctl transition-colors ${
                  filter === f.key ? 'bg-white text-ink shadow-soft' : 'text-sand-500 hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 목록 */}
        {loading ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-sand-200 rounded-card shadow-soft p-10 text-center font-bold text-sand-400 text-sm">
            조건에 맞는 동아리가 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(c => (
              <div key={c.id} className="bg-white border border-sand-200 rounded-card shadow-soft p-4 flex items-center gap-4">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.name} className="w-11 h-11 rounded-full object-cover border border-sand-200 shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-sand-100 border border-sand-200 flex items-center justify-center font-black text-ink shrink-0">
                    {c.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-ink truncate">{c.name}</span>
                    {c.is_certified && <CheckCircle className="w-4 h-4 text-brand-accent shrink-0" strokeWidth={2.5} />}
                  </div>
                  <p className="text-xs font-bold text-sand-400 truncate">
                    {c.type}{c.location ? ` · ${c.location}` : ''} · {formatDate(c.created_at, 'medium')}
                  </p>
                </div>

                <Link
                  to={`/clubs/${c.slug}`}
                  className="hidden sm:flex items-center gap-1 text-xs font-black text-sand-400 hover:text-brand shrink-0"
                >
                  보기 <ExternalLink className="w-3 h-3" strokeWidth={2.5} />
                </Link>

                <button
                  onClick={() => toggleCert(c)}
                  disabled={togglingId === c.id}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-ctl transition-colors shrink-0 disabled:opacity-50 ${
                    c.is_certified
                      ? 'bg-brand-tint text-brand border border-brand hover:bg-white'
                      : 'bg-white text-sand-600 border border-sand-300 hover:bg-sand-50'
                  }`}
                >
                  {togglingId === c.id
                    ? <Loader className="w-3.5 h-3.5 animate-spin" strokeWidth={2.5} />
                    : c.is_certified ? <CheckCircle className="w-3.5 h-3.5" strokeWidth={2.5} /> : <Circle className="w-3.5 h-3.5" strokeWidth={2.5} />}
                  {c.is_certified ? '인증됨' : '인증하기'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
