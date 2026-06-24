import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, Loader, ArrowRight, Download } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { formatDate } from '../../../lib/format';

// ──────────────────────────────────────────
// 활동 증명 탭 — 운영진이 발급한 공식 증명서 목록 + PDF 다운로드
// ──────────────────────────────────────────
interface CertRow {
  id: string;
  cert_no: string;
  title: string;
  club_name: string;
  issued_at: string;
}

export default function CertificatesSection() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CertRow[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('certificates')
      .select('id, cert_no, title, club_name, issued_at')
      .eq('recipient_user_id', user.id)
      .order('issued_at', { ascending: false })
      .then(({ data }) => { setRows((data ?? []) as CertRow[]); setFetching(false); });
  }, [user]);

  return (
    <div className="bg-white border border-sand-200 rounded-card shadow-soft p-8">
      <h3 className="text-2xl font-black text-ink mb-6 flex items-center gap-2">
        <Award className="w-6 h-6 text-brand" strokeWidth={2.5} /> 활동 증명
      </h3>
      {fetching ? (
        <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-sand-400" /></div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-sand-500 font-bold border border-dashed border-sand-300 rounded-card flex flex-col items-center gap-4">
          <p>아직 발급받은 증명서가 없습니다.</p>
          <Link
            to="/clubs"
            className="inline-flex items-center gap-2 px-6 py-2.5 btn-grad text-white rounded-ctl font-bold text-sm shadow-btn hover:-translate-y-0.5 transition-all"
          >
            동아리 탐색하러 가기 <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map(c => (
            <div key={c.id} className="p-5 bg-white border border-sand-200 rounded-card flex items-center justify-between gap-4 hover:bg-sand-50 transition-colors">
              <div className="min-w-0">
                <div className="text-xs font-bold text-sand-400 mb-1">
                  {formatDate(c.issued_at)} 발급 · {c.cert_no}
                </div>
                <div className="font-black text-base text-ink truncate">{c.title}</div>
                <div className="font-bold text-sm text-sand-500 truncate mt-0.5">{c.club_name}</div>
              </div>
              <a
                href={`/certificate/${c.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 btn-grad text-white rounded-ctl font-bold text-sm shadow-btn hover:-translate-y-0.5 transition-all"
              >
                <Download className="w-4 h-4" strokeWidth={2.5} /> PDF 다운로드
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
