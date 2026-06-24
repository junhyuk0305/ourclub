import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Search, BadgeCheck, ExternalLink, Inbox } from 'lucide-react';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

interface ScoutClub {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  logo_url: string | null;
  one_line_desc: string | null;
  location: string | null;
  current_generation: string | null;
}

export default function CorpScouts() {
  const [clubs, setClubs] = useState<ScoutClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('clubs')
        .select('id, name, slug, type, logo_url, one_line_desc, location, current_generation')
        .eq('is_certified', true)
        .order('name', { ascending: true });
      setClubs((data as ScoutClub[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clubs;
    return clubs.filter(c =>
      [c.name, c.type, c.one_line_desc, c.location]
        .filter(Boolean)
        .some(v => (v as string).toLowerCase().includes(q))
    );
  }, [clubs, query]);

  return (
    <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-4xl font-black text-ink mb-2">관심 동아리 풀 (Scouting)</h2>
                <p className="text-sand-500 font-bold">인증된 동아리를 탐색하고 페이지를 살펴보세요.</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="동아리명, 유형, 지역 검색"
                  className="field pl-10 pr-4 py-3 border border-sand-300 rounded-ctl font-bold outline-none bg-white"
                />
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-sand-400" strokeWidth={2.5} />
              </div>
            </div>

            {loading ? (
              <LoadingScreen />
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-sand-400 gap-3">
                <Inbox className="w-12 h-12" strokeWidth={2.5} />
                <p className="font-bold">{query ? '검색 결과가 없습니다.' : '아직 인증된 동아리가 없습니다.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filtered.map(club => (
                  <div
                    key={club.id}
                    className="bg-white border border-sand-200 rounded-card shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all flex flex-col"
                  >
                    <div className="p-6 border-b border-sand-200 flex justify-between items-start">
                      <div className="w-16 h-16 border border-sand-200 rounded-ctl bg-brand-tint flex items-center justify-center font-black text-3xl text-brand overflow-hidden">
                        {club.logo_url
                          ? <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                          : club.name.charAt(0)}
                      </div>
                      <div className="bg-brand-tint px-2 py-1 rounded-ctl flex items-center gap-1 font-bold text-xs text-brand">
                        <BadgeCheck className="w-4 h-4" strokeWidth={2.5} /> 인증
                      </div>
                    </div>
                    <div className="p-6 flex-1">
                      <h3 className="text-2xl font-black text-ink mb-2">{club.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {club.type && (
                          <span className="bg-sand-100 text-sand-600 font-bold text-xs px-2 py-1 rounded-ctl">{club.type}</span>
                        )}
                        {club.location && (
                          <span className="bg-sand-100 text-sand-600 font-bold text-xs px-2 py-1 rounded-ctl">{club.location}</span>
                        )}
                        {club.current_generation && (
                          <span className="bg-sand-100 text-sand-600 font-bold text-xs px-2 py-1 rounded-ctl">{club.current_generation}</span>
                        )}
                      </div>
                      <p className="text-sand-600 font-bold text-sm">{club.one_line_desc ?? '소개가 아직 없습니다.'}</p>
                    </div>
                    <div className="p-6 pt-0">
                      <a
                        href={`/clubs/${club.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 bg-white text-ink border border-sand-300 rounded-ctl font-bold hover:bg-sand-50 transition-colors flex items-center justify-center gap-2 group"
                      >
                        <ExternalLink className="w-4 h-4 group-hover:text-brand" strokeWidth={2.5} /> <span>동아리 페이지 보기</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
  );
}
