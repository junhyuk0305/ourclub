import React, { useEffect, useState } from 'react';
import { Save, AlertCircle, Loader, Check } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';

export default function SettingsAdmin() {
  const { adminClub, adminClubId, refreshClub } = useAdmin();

  const [slug, setSlug]               = useState('');
  const [name, setName]               = useState('');
  const [type, setType]               = useState('연합 동아리');
  const [oneLineDesc, setOneLineDesc] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation]       = useState('');
  const [recruitFee, setRecruitFee]   = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [notionUrl, setNotionUrl]     = useState('');
  const [kakaoUrl, setKakaoUrl]       = useState('');

  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState<{ msg: string; ok: boolean } | null>(null);

  // adminClub 로드 시 폼 초기화
  useEffect(() => {
    if (!adminClub) return;
    setSlug(adminClub.slug ?? '');
    setName(adminClub.name ?? '');
    setType(adminClub.type ?? '연합 동아리');
    setOneLineDesc(adminClub.one_line_desc ?? '');
    setDescription(adminClub.description ?? '');
    setLocation(adminClub.location ?? '');
    setRecruitFee(adminClub.recruit_fee != null ? String(adminClub.recruit_fee) : '');
    setInstagramUrl(adminClub.instagram_url ?? '');
    setNotionUrl(adminClub.notion_url ?? '');
    setKakaoUrl(adminClub.kakao_url ?? '');
  }, [adminClub]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!adminClubId || !name.trim() || !slug.trim()) {
      showToast('동아리명과 URL ID는 필수입니다.', false);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('clubs')
      .update({
        slug:          slug.trim(),
        name:          name.trim(),
        type,
        one_line_desc: oneLineDesc.trim() || null,
        description:   description.trim() || null,
        location:      location.trim() || null,
        recruit_fee:   recruitFee ? parseInt(recruitFee, 10) : null,
        instagram_url: instagramUrl.trim() || null,
        notion_url:    notionUrl.trim() || null,
        kakao_url:     kakaoUrl.trim() || null,
      })
      .eq('id', adminClubId);
    setSaving(false);

    if (error) { showToast(`저장 실패: ${error.message}`, false); return; }
    await refreshClub();
    showToast('변경사항이 저장되었습니다.');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-4 px-6 py-2 border border-black bg-orange-500 font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-px active:shadow-none active:translate-y-1 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          변경사항 저장
        </button>
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-4xl flex flex-col gap-8 pb-20">
            <div>
              <h2 className="text-4xl font-black mb-2">동아리 환경 설정</h2>
              <p className="text-gray-500 font-bold">기본 정보, SNS 링크, 운영 설정을 관리합니다.</p>
            </div>

            {/* 기본 정보 */}
            <section className="bg-white border-2 border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black mb-6 pb-2 border-b-2 border-black">기본 정보</h3>
              <div className="flex flex-col gap-6">

                {/* URL */}
                <div>
                  <label className="block font-black mb-2">동아리 URL ID</label>
                  <div className="flex items-center">
                    <span className="bg-gray-100 border border-r-0 border-black px-4 py-3 font-bold text-gray-500 shrink-0">
                      ourclub.io/clubs/
                    </span>
                    <input
                      value={slug}
                      onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 p-3 border border-black font-bold outline-none focus:border-orange-500"
                      placeholder="my-club"
                    />
                  </div>
                  <p className="text-xs font-bold text-gray-400 mt-1">영문 소문자, 숫자, 하이픈만 사용 가능</p>
                </div>

                {/* 동아리명 */}
                <Field label="동아리명 *">
                  <input value={name} onChange={e => setName(e.target.value)}
                    className={inputCls} placeholder="마제스티 (Majesty)" />
                </Field>

                {/* 유형 */}
                <Field label="동아리 유형">
                  <select value={type} onChange={e => setType(e.target.value)}
                    className={inputCls + ' cursor-pointer bg-white'}>
                    <option>연합 동아리</option>
                    <option>교내 동아리</option>
                    <option>학회/프로젝트팀</option>
                  </select>
                </Field>

                {/* 한 줄 소개 */}
                <Field label="한 줄 소개">
                  <input value={oneLineDesc} onChange={e => setOneLineDesc(e.target.value)}
                    className={inputCls} placeholder="기업이 검증한 NO.1 실무 마케팅 동아리" maxLength={60} />
                  <p className="text-xs font-bold text-gray-400 mt-1">{oneLineDesc.length}/60자</p>
                </Field>

                {/* 상세 소개 */}
                <Field label="상세 소개">
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    rows={4} className={inputCls + ' resize-none'}
                    placeholder="동아리 소개, 활동 내용 등을 자유롭게 작성해주세요." />
                </Field>

                <div className="grid grid-cols-2 gap-6">
                  {/* 활동 장소 */}
                  <Field label="활동 장소">
                    <input value={location} onChange={e => setLocation(e.target.value)}
                      className={inputCls} placeholder="매주 토요일 신촌 세미나룸" />
                  </Field>

                  {/* 회비 */}
                  <Field label="회비 (원)">
                    <input type="number" value={recruitFee} onChange={e => setRecruitFee(e.target.value)}
                      className={inputCls} placeholder="40000" min={0} />
                  </Field>
                </div>
              </div>
            </section>

            {/* SNS 링크 */}
            <section className="bg-white border-2 border-black p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black mb-6 pb-2 border-b-2 border-black">SNS / 외부 링크</h3>
              <div className="flex flex-col gap-6">
                <Field label="인스타그램">
                  <input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)}
                    className={inputCls} placeholder="https://instagram.com/..." />
                </Field>
                <Field label="노션 / 소개 페이지">
                  <input value={notionUrl} onChange={e => setNotionUrl(e.target.value)}
                    className={inputCls} placeholder="https://notion.so/..." />
                </Field>
                <Field label="카카오 오픈채팅">
                  <input value={kakaoUrl} onChange={e => setKakaoUrl(e.target.value)}
                    className={inputCls} placeholder="https://open.kakao.com/o/..." />
                </Field>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="border-2 border-red-500 p-8 bg-red-50">
              <h3 className="text-2xl font-black text-red-600 mb-2 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" /> Danger Zone
              </h3>
              <p className="font-bold text-red-800 mb-6">
                운영진 권한을 다른 사용자(다음 기수 회장 등)에게 이양할 수 있습니다. 권한 이양 후에는 관리자 접근이 불가능합니다.
              </p>
              <button className="px-6 py-3 border-2 border-red-500 text-red-600 font-black hover:bg-red-500 hover:text-white transition-colors bg-white">
                Super Admin 권한 양도하기 (Handover)
              </button>
            </section>
          </div>
        </main>
      </div>

      {/* 토스트 */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 border font-bold flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${toast.ok ? 'bg-black text-white border-white' : 'bg-red-600 text-white border-red-800'}`}>
          {toast.ok ? <Check className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const inputCls = 'w-full p-3 border border-black font-bold outline-none focus:border-orange-500 transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-black text-sm">{label}</label>
      {children}
    </div>
  );
}
