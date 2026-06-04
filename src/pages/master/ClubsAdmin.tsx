import React, { useEffect, useMemo, useState } from 'react';
import { Loader, Search, CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { MasterLayout } from './MasterLayout';

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

  const load = async () => {
    const { data } = await supabase
      .from('clubs')
      .select('id, name, slug, type, is_certified, logo_url, one_line_desc, location, created_at')
      .order('created_at', { ascending: false });
    setClubs((data as Club[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleCert = async (club: Club) => {
    setTogglingId(club.id);
    const next = !club.is_certified;
    const { error } = await supabase.from('clubs').update({ is_certified: next }).eq('id', club.id);
    setTogglingId(null);
    if (!error) {
      setClubs(prev => prev.map(c => (c.id === club.id ? { ...c, is_certified: next } : c)));
    }
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
    <MasterLayout>
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-black mb-1">동아리 관리</h1>
          <p className="font-bold text-gray-500">전체 동아리를 조회하고 인증 배지를 관리합니다.</p>
        </div>

        {/* 검색 + 필터 */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="동아리명·유형·지역 검색"
              className="w-full pl-9 pr-4 py-2.5 border-2 border-black font-bold text-sm outline-none focus:border-orange-500"
            />
          </div>
          <div className="flex border-2 border-black w-fit bg-white">
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-2 font-black text-xs border-r-2 border-black last:border-r-0 transition-colors ${
                  filter === f.key ? 'bg-black text-white' : 'hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border-2 border-black p-10 text-center font-bold text-gray-400 text-sm">
            조건에 맞는 동아리가 없습니다.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(c => (
              <div key={c.id} className="bg-white border-2 border-black p-4 flex items-center gap-4">
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.name} className="w-11 h-11 rounded-full object-cover border-2 border-black shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gray-200 border-2 border-black flex items-center justify-center font-black shrink-0">
                    {c.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black truncate">{c.name}</span>
                    {c.is_certified && <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />}
                  </div>
                  <p className="text-xs font-bold text-gray-400 truncate">
                    {c.type}{c.location ? ` · ${c.location}` : ''} · {formatDate(c.created_at, 'medium')}
                  </p>
                </div>

                <Link
                  to={`/clubs/${c.slug}`}
                  className="hidden sm:flex items-center gap-1 text-xs font-black text-gray-400 hover:text-orange-500 shrink-0"
                >
                  보기 <ExternalLink className="w-3 h-3" />
                </Link>

                <button
                  onClick={() => toggleCert(c)}
                  disabled={togglingId === c.id}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black border-2 border-black transition-colors shrink-0 disabled:opacity-50 ${
                    c.is_certified
                      ? 'bg-orange-500 text-black hover:bg-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {togglingId === c.id
                    ? <Loader className="w-3.5 h-3.5 animate-spin" />
                    : c.is_certified ? <CheckCircle className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  {c.is_certified ? '인증됨' : '인증하기'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MasterLayout>
  );
}
