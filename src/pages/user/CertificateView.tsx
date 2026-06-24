import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Award, Loader, Printer } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';

// ──────────────────────────────────────────
// 증명서 인쇄/PDF 뷰 — 부원이 마이페이지에서 새 탭으로 연다.
// 인쇄(브라우저 PDF 저장) 시 #cert-sheet 만 보이도록 print CSS 적용.
// ──────────────────────────────────────────
interface Cert {
  cert_no: string;
  title: string;
  body: string;
  recipient_name: string;
  club_name: string;
  generation: string | null;
  position: string | null;
  attendance_rate: number | null;
  issued_at: string;
}

export default function CertificateView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [cert, setCert] = useState<Cert | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from('certificates')
      .select('cert_no, title, body, recipient_name, club_name, generation, position, attendance_rate, issued_at')
      .eq('id', id)
      .maybeSingle()
      .then(({ data }) => { setCert((data as Cert) ?? null); setFetching(false); });
  }, [user, id]);

  if (fetching) {
    return <div className="min-h-screen flex items-center justify-center bg-sand-50"><Loader className="w-8 h-8 animate-spin text-sand-400" /></div>;
  }

  if (!cert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-sand-50 text-center px-6">
        <p className="font-black text-ink text-lg">증명서를 찾을 수 없습니다.</p>
        <p className="font-bold text-sand-500 text-sm">본인에게 발급된 증명서만 열람할 수 있어요.</p>
        <Link to="/mypage" className="px-6 py-2.5 btn-grad text-white rounded-ctl font-bold text-sm shadow-btn">마이페이지로</Link>
      </div>
    );
  }

  const meta = [cert.generation, cert.position].filter(Boolean).join(' · ');

  return (
    <div className="min-h-screen bg-sand-100 py-10 px-4 flex flex-col items-center gap-6">
      {/* 인쇄 시 시트만 노출 */}
      <style>{`@media print {
        body * { visibility: hidden !important; }
        #cert-sheet, #cert-sheet * { visibility: visible !important; }
        #cert-sheet { position: absolute; inset: 0; margin: 0; box-shadow: none; border: none; }
        @page { size: A4; margin: 16mm; }
      }`}</style>

      {/* 인쇄 바 (화면 전용) */}
      <div className="no-print w-full max-w-[210mm] flex justify-end">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-6 py-2.5 btn-grad text-white rounded-ctl font-bold text-sm shadow-btn hover:-translate-y-0.5 transition-all"
        >
          <Printer className="w-4 h-4" strokeWidth={2.5} /> 인쇄 / PDF 저장
        </button>
      </div>

      {/* 증명서 시트 */}
      <div
        id="cert-sheet"
        className="bg-white w-full max-w-[210mm] aspect-[1/1.414] shadow-soft-lg border border-sand-200 px-16 py-20 flex flex-col"
      >
        <div className="flex flex-col items-center text-center border-b-2 border-ink/80 pb-8">
          <span className="font-black tracking-[0.3em] text-sand-400 text-sm mb-6">OURCLUB</span>
          <h1 className="text-4xl font-black text-ink tracking-wide">{cert.title}</h1>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-10 py-12">
          <table className="w-full text-left font-bold">
            <tbody className="divide-y divide-sand-200">
              <tr><td className="py-3 w-32 text-sand-400">성명</td><td className="py-3 text-ink text-lg font-black">{cert.recipient_name}</td></tr>
              <tr><td className="py-3 text-sand-400">동아리</td><td className="py-3 text-ink">{cert.club_name}</td></tr>
              {meta && <tr><td className="py-3 text-sand-400">소속</td><td className="py-3 text-ink">{meta}</td></tr>}
              {cert.attendance_rate != null && (
                <tr><td className="py-3 text-sand-400">출석률</td><td className="py-3 text-ink">{cert.attendance_rate}%</td></tr>
              )}
            </tbody>
          </table>

          <p className="text-ink font-bold leading-loose text-center text-lg whitespace-pre-wrap px-4">
            {cert.body}
          </p>
        </div>

        <div className="text-center flex flex-col items-center gap-3 pt-8 border-t border-sand-200">
          <p className="font-black text-ink text-lg">{formatDate(cert.issued_at)}</p>
          <p className="font-black text-xl text-ink flex items-center gap-2">
            <Award className="w-5 h-5 text-brand" strokeWidth={2.5} /> {cert.club_name}
          </p>
          <p className="font-bold text-xs text-sand-400 mt-2">증명서 번호 · {cert.cert_no}</p>
        </div>
      </div>
    </div>
  );
}
