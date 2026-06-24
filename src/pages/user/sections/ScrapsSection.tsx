import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Loader, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';

// ──────────────────────────────────────────
// Phase 6: 스크랩 탭
// ──────────────────────────────────────────
export default function ScrapsSection() {
  const { user } = useAuth();
  const [scraps, setScraps] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('bookmarks')
      .select('id, target_id, created_at')
      .eq('user_id', user.id)
      .eq('target_type', 'CLUB')
      .order('created_at', { ascending: false })
      .then(async ({ data: bookmarks }) => {
        if (!bookmarks || bookmarks.length === 0) {
          setScraps([]); setFetching(false); return;
        }
        const ids = bookmarks.map(b => b.target_id);
        const { data: clubs } = await supabase
          .from('clubs')
          .select('id, name, slug, one_line_desc, type')
          .in('id', ids);
        const clubMap = Object.fromEntries((clubs ?? []).map(c => [c.id, c]));
        setScraps(bookmarks.map(b => ({ ...b, club: clubMap[b.target_id] })));
        setFetching(false);
      });
  }, [user]);

  const handleRemove = async (bookmarkId: string) => {
    await supabase.from('bookmarks').delete().eq('id', bookmarkId);
    setScraps(prev => prev.filter(s => s.id !== bookmarkId));
  };

  return (
    <div className="bg-white border border-sand-200 rounded-card shadow-soft p-8">
      <h3 className="text-2xl font-black text-ink mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 text-brand" strokeWidth={2.5} /> 스크랩 (관심 동아리)
      </h3>
      {fetching ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-sand-400" /></div>
      ) : scraps.length === 0 ? (
        <div className="text-center py-12 text-sand-500 font-bold border border-dashed border-sand-300 rounded-card flex flex-col items-center gap-4">
          <p>아직 스크랩한 동아리가 없습니다.</p>
          <Link
            to="/clubs"
            className="inline-flex items-center gap-2 px-6 py-2.5 btn-grad text-white rounded-ctl font-bold text-sm shadow-btn hover:-translate-y-0.5 transition-all"
          >
            관심 동아리 찾아보기 <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {scraps.map(s => (
            <div key={s.id} className="p-4 border border-sand-200 rounded-card bg-sand-50 flex items-center justify-between">
              {s.club ? (
                <Link to={`/clubs/${s.club.slug}`} className="min-w-0 group">
                  <div className="font-black text-lg text-ink truncate group-hover:text-brand transition-colors">{s.club.name}</div>
                  <div className="text-sm font-bold text-sand-500 truncate">
                    {s.club.type} {s.club.one_line_desc ? `· ${s.club.one_line_desc}` : ''}
                  </div>
                </Link>
              ) : (
                <div className="min-w-0">
                  <div className="font-black text-lg text-sand-400">삭제된 동아리</div>
                </div>
              )}
              <button
                onClick={() => handleRemove(s.id)}
                className="text-sand-400 hover:text-red-500 transition-colors p-2 rounded-ctl border border-transparent hover:bg-red-50 shrink-0"
                title="스크랩 삭제"
              >
                <X className="w-5 h-5" strokeWidth={2.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
