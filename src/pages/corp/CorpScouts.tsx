import React, { useEffect, useMemo, useState } from 'react';
import { CorpHeader } from '../../components/corp/CorpHeader';
import { CorpSidebar } from '../../components/corp/CorpSidebar';
import { supabase } from '../../lib/supabaseClient';
import { Search, BadgeCheck, ExternalLink, Loader, Inbox } from 'lucide-react';

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
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <CorpHeader />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <CorpSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-4xl font-black mb-2">관심 동아리 풀 (Scouting)</h2>
                <p className="text-gray-500 font-bold">인증된 동아리를 탐색하고 페이지를 살펴보세요.</p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="동아리명, 유형, 지역 검색"
                  className="pl-10 pr-4 py-3 border-2 border-black font-black outline-none focus:border-purple-600 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-32 text-gray-400">
                <Loader className="w-6 h-6 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-3">
                <Inbox className="w-12 h-12" />
                <p className="font-bold">{query ? '검색 결과가 없습니다.' : '아직 인증된 동아리가 없습니다.'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filtered.map(club => (
                  <div
                    key={club.id}
                    className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(168,85,247,1)] hover:-translate-y-1 transition-all flex flex-col"
                  >
                    <div className="p-6 border-b border-black flex justify-between items-start">
                      <div className="w-16 h-16 border-2 border-black bg-purple-100 flex items-center justify-center font-black text-3xl text-purple-600 overflow-hidden">
                        {club.logo_url
                          ? <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                          : club.name.charAt(0)}
                      </div>
                      <div className="bg-purple-50 border border-purple-200 px-2 py-1 rounded flex items-center gap-1 font-bold text-xs text-purple-700">
                        <BadgeCheck className="w-4 h-4" /> 인증
                      </div>
                    </div>
                    <div className="p-6 flex-1">
                      <h3 className="text-2xl font-black mb-2">{club.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {club.type && (
                          <span className="bg-gray-100 text-gray-600 border border-gray-300 font-bold text-xs px-2 py-1">{club.type}</span>
                        )}
                        {club.location && (
                          <span className="bg-gray-100 text-gray-600 border border-gray-300 font-bold text-xs px-2 py-1">{club.location}</span>
                        )}
                        {club.current_generation && (
                          <span className="bg-gray-100 text-gray-600 border border-gray-300 font-bold text-xs px-2 py-1">{club.current_generation}</span>
                        )}
                      </div>
                      <p className="text-gray-600 font-bold text-sm">{club.one_line_desc ?? '소개가 아직 없습니다.'}</p>
                    </div>
                    <div className="p-6 pt-0">
                      <a
                        href={`/clubs/${club.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 bg-white border-2 border-black font-black hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2 group"
                      >
                        <ExternalLink className="w-4 h-4 group-hover:text-purple-400" /> <span>동아리 페이지 보기</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
