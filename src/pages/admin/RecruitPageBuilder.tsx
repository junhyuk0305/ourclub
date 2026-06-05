import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Loader, Eye, Info } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { RecruitPageSettings, DEFAULT_RECRUIT_PAGE, mergeRecruitPage } from '../../types/recruitment';
import { useToast } from '../../hooks/useToast';

const TAGLINE_MAX = 120;

export default function RecruitPageBuilder() {
  const { adminClub, adminClubId } = useAdmin();
  const [settings, setSettings] = useState<RecruitPageSettings>(DEFAULT_RECRUIT_PAGE);
  const [tagline, setTagline] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, show: showToast } = useToast();

  useEffect(() => {
    if (!adminClubId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('clubs').select('recruit_page').eq('id', adminClubId).single();
      const merged = mergeRecruitPage((data as { recruit_page: unknown } | null)?.recruit_page);
      setSettings(merged);
      setTagline(merged.tagline);
      setLoading(false);
    })();
  }, [adminClubId]);

  const save = async () => {
    if (!adminClubId) return;
    setSaving(true);
    // recruit_page JSONB 유지하되 tagline만 갱신
    const next = { ...settings, tagline: tagline.trim() };
    const { data, error } = await supabase
      .from('clubs')
      .update({ recruit_page: next })
      .eq('id', adminClubId)
      .select('id');
    setSaving(false);
    if (error) { showToast(`저장 실패: ${error.message}`, false); return; }
    if (!data || data.length === 0) {
      showToast('저장 권한이 없거나 동아리가 선택되지 않았습니다.', false);
      return;
    }
    setSettings(next);
    showToast('채용 페이지가 저장되었습니다.', true);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader>
        {adminClub?.slug && (
          <Link
            to={`/clubs/${adminClub.slug}/recruit?preview=1`}
            target="_blank"
            className="ml-4 px-4 py-2 border border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none text-sm font-bold flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> 미리보기
          </Link>
        )}
        <button
          onClick={save}
          disabled={saving || loading}
          className="ml-2 px-5 py-2 border border-black bg-orange-500 hover:bg-orange-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none text-sm flex items-center gap-2 font-black disabled:opacity-50"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          저장
        </button>
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-3xl font-black mb-2">채용 메인 페이지</h2>
              <p className="text-gray-500 font-bold text-sm">
                채용 페이지는 모든 동아리 공통 레이아웃(프로필 · 공고 · 게시물 · 후기)으로 표준화되어 별도 편집이 필요 없습니다.
                운영진이 설정할 항목은 <strong className="text-black">태그라인 한 줄</strong>뿐입니다.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
            ) : (
              <>
                <div className="bg-blue-50 border border-blue-200 p-4 flex gap-2.5 text-sm font-bold text-blue-800">
                  <Info className="w-5 h-5 shrink-0" />
                  <p>
                    브랜드·스토리 표현은 <strong>소개 1-Page</strong>가 담당하고, 채용 페이지는 신뢰·전환에 집중합니다.
                    공고·게시물·후기는 자동으로 표시됩니다.
                  </p>
                </div>

                <div className="bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-sm">태그라인</label>
                    <span className="text-xs font-bold text-gray-400">{tagline.length}/{TAGLINE_MAX}</span>
                  </div>
                  <textarea
                    value={tagline}
                    onChange={e => setTagline(e.target.value.slice(0, TAGLINE_MAX))}
                    rows={2}
                    placeholder="채용 페이지 상단에 표시될 한 줄 소개 (예: 함께 성장할 동료를 찾습니다)"
                    className="w-full p-3 border-2 border-black font-bold text-sm outline-none focus:border-orange-500 resize-none"
                  />
                  <p className="text-xs font-bold text-gray-400">
                    비워두면 동아리 한 줄 소개가 대신 표시됩니다.
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 border font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] ${toast.ok ? 'bg-black text-white border-white' : 'bg-red-500 text-white border-black'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
