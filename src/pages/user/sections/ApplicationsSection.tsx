import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { formatDate } from '../../../lib/format';

export default function ApplicationsSection() {
  const { user } = useAuth();
  const [apps, setApps] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('recruitment_applications')
      .select(`
        id, status, submitted_at,
        recruitments ( title, clubs ( name, slug ) )
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .then(({ data }) => { setApps(data ?? []); setFetching(false); });
  }, [user]);

  const statusStyle: Record<string, string> = {
    '서류제출': 'bg-orange-200',
    '서류합격': 'bg-blue-200',
    '면접예정': 'bg-yellow-200',
    '최종합격': 'bg-green-200',
    '불합격':   'bg-gray-200',
  };

  return (
    <div className="border border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <h3 className="text-2xl font-black mb-6 flex items-center gap-2">
        <FileText className="w-6 h-6 text-orange-500" /> 지원 내역
      </h3>
      {fetching ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-gray-400" /></div>
      ) : apps.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-bold border-2 border-dashed border-gray-300 flex flex-col items-center gap-4">
          <p>아직 지원한 동아리가 없습니다.</p>
          <Link
            to="/clubs"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white font-black text-sm border border-black hover:bg-orange-500 hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          >
            동아리 탐색하러 가기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {apps.map(app => {
            const recruit = app.recruitments as any;
            const club = recruit?.clubs;
            const body = (
              <>
                <div className="text-xs font-bold text-gray-400 mb-1">
                  {formatDate(app.submitted_at)} 지원
                </div>
                <div className="font-black text-base truncate">
                  {club?.name ?? '—'}
                </div>
                <div className="font-bold text-sm text-gray-500 truncate mt-0.5">
                  {recruit?.title ?? '—'}
                </div>
              </>
            );
            return (
              <div key={app.id} className="p-5 border border-black bg-white flex items-center justify-between gap-4 hover:bg-orange-50 transition-colors">
                {club?.slug ? (
                  <Link to={`/clubs/${club.slug}/recruit`} className="min-w-0 group">{body}</Link>
                ) : (
                  <div className="min-w-0">{body}</div>
                )}
                <span className={`shrink-0 px-3 py-1.5 border border-black font-bold text-xs ${statusStyle[app.status] ?? 'bg-gray-100'}`}>
                  {app.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
