import React, { useEffect, useRef, useState } from 'react';
import { Save, AlertCircle, Loader, Check, X, ShieldCheck, Upload, Trash2, Award } from 'lucide-react';
import { AdminHeaderPortal } from './AdminLayout';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAll } from '../../lib/fetchAll';
import CertificateIssueModal from '../../components/admin/CertificateIssueModal';

export default function SettingsAdmin() {
  const { adminClub, adminClubId, refreshClub } = useAdmin();
  const [showHandover, setShowHandover] = useState(false);
  const [showCert, setShowCert] = useState(false);

  const [logoUrl, setLogoUrl]         = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

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
    setLogoUrl(adminClub.logo_url ?? null);
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (logoInputRef.current) logoInputRef.current.value = '';
    if (!file || !adminClubId) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      showToast('JPG, PNG, GIF, WEBP 형식만 업로드할 수 있습니다.', false);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('이미지는 5MB 이하만 업로드할 수 있습니다.', false);
      return;
    }

    setUploadingLogo(true);
    const ext = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() ?? 'jpg' : 'jpg';
    const path = `${adminClubId}/logo-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('club-pages')
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setUploadingLogo(false);
      showToast('업로드 실패: ' + uploadError.message, false);
      return;
    }
    const { data: urlData } = supabase.storage.from('club-pages').getPublicUrl(path);
    setLogoUrl(urlData?.publicUrl ?? null);
    setUploadingLogo(false);
    showToast('대표사진이 업로드되었습니다. 저장을 눌러 반영하세요.');
  };

  const handleSave = async () => {
    if (!adminClubId || !name.trim() || !slug.trim()) {
      showToast('동아리명과 URL ID는 필수입니다.', false);
      return;
    }
    if (!type.trim()) {
      showToast('동아리 유형을 선택해주세요.', false);
      return;
    }
    if (!oneLineDesc.trim()) {
      showToast('한 줄 소개를 입력해주세요.', false);
      return;
    }
    if (!description.trim()) {
      showToast('상세 소개를 입력해주세요.', false);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('clubs')
      .update({
        logo_url:      logoUrl,
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
    <>
        <main className="flex-1 bg-sand-50 p-8 overflow-y-auto">
          <div className="max-w-4xl flex flex-col gap-8 pb-20">
            <div>
              <h2 className="text-4xl font-black text-ink mb-2">동아리 환경 설정</h2>
              <p className="text-sand-500 font-medium">기본 정보, SNS 링크, 운영 설정을 관리합니다.</p>
            </div>

            {/* 기본 정보 */}
            <section className="bg-white border border-sand-200 rounded-card p-8 shadow-soft">
              <h3 className="text-2xl font-black text-ink mb-6 pb-2 border-b border-sand-200">기본 정보</h3>
              <div className="flex flex-col gap-6">

                {/* 대표사진 */}
                <div>
                  <label className="block font-black text-ink mb-2">대표사진</label>
                  <p className="text-xs font-medium text-sand-400 mb-3">동아리 찾기 목록과 링크 공유 미리보기에 노출됩니다. (JPG/PNG/GIF/WEBP, 5MB 이하)</p>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 border border-sand-200 rounded-card bg-sand-100 shrink-0 overflow-hidden flex items-center justify-center">
                      {logoUrl ? (
                        <img src={logoUrl} alt="대표사진 미리보기" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-black text-sand-300">{name ? name[0] : '?'}</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={uploadingLogo}
                        className="px-4 py-2.5 border border-sand-300 rounded-ctl bg-white font-bold text-sm hover:bg-sand-50 flex items-center gap-2 disabled:opacity-50"
                      >
                        {uploadingLogo ? <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <Upload className="w-4 h-4" strokeWidth={2.5} />}
                        {logoUrl ? '사진 변경' : '사진 업로드'}
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl(null)}
                          className="px-4 py-2 rounded-ctl text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={2.5} /> 사진 제거
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* URL */}
                <div>
                  <label className="block font-black text-ink mb-2">동아리 URL ID</label>
                  <div className="flex items-center">
                    <span className="bg-sand-100 border border-r-0 border-sand-300 rounded-l-ctl px-4 py-3 font-medium text-sand-500 shrink-0">
                      ourclub-univ.com/clubs/
                    </span>
                    <input
                      value={slug}
                      onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="field flex-1 p-3 border border-sand-300 rounded-r-ctl font-bold"
                      placeholder="my-club"
                    />
                  </div>
                  <p className="text-xs font-medium text-sand-400 mt-1">영문 소문자, 숫자, 하이픈만 사용 가능</p>
                </div>

                {/* 동아리명 */}
                <Field label="동아리명 *">
                  <input value={name} onChange={e => setName(e.target.value)}
                    className={inputCls} placeholder="마제스티 (Majesty)" />
                </Field>

                {/* 유형 */}
                <Field label="동아리 유형 *">
                  <select value={type} onChange={e => setType(e.target.value)}
                    className={inputCls + ' cursor-pointer'}>
                    <option>연합 동아리</option>
                    <option>교내 동아리</option>
                    <option>학회/프로젝트팀</option>
                  </select>
                </Field>

                {/* 한 줄 소개 */}
                <Field label="한 줄 소개 *">
                  <input value={oneLineDesc} onChange={e => setOneLineDesc(e.target.value)}
                    className={inputCls} placeholder="기업이 검증한 NO.1 실무 마케팅 동아리" maxLength={60} />
                  <p className="text-xs font-medium text-sand-400 mt-1">{oneLineDesc.length}/60자</p>
                </Field>

                {/* 상세 소개 */}
                <Field label="상세 소개 *">
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
            <section className="bg-white border border-sand-200 rounded-card p-8 shadow-soft">
              <h3 className="text-2xl font-black text-ink mb-6 pb-2 border-b border-sand-200">SNS / 외부 링크</h3>
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

            {/* 활동 증명서 */}
            <section className="bg-white border border-sand-200 rounded-card p-8 shadow-soft">
              <h3 className="text-2xl font-black text-ink mb-2 flex items-center gap-2">
                <Award className="w-6 h-6 text-brand" strokeWidth={2.5} /> 활동 증명서
              </h3>
              <p className="font-medium text-sand-500 mb-6">
                제목과 본문을 입력하면, 출석률 기준을 넘은 부원에게 공식 증명서를 발급합니다.
                부원은 마이페이지에서 PDF로 내려받을 수 있어요.
              </p>
              <button
                onClick={() => setShowCert(true)}
                disabled={!adminClubId}
                className="px-6 py-3 rounded-ctl bg-brand text-white font-black shadow-btn hover:-translate-y-px transition-all flex items-center gap-2 disabled:opacity-40"
              >
                <Award className="w-4 h-4" strokeWidth={2.5} /> 증명서 발급하기
              </button>
            </section>

            {/* Danger Zone */}
            <section className="border border-red-500 rounded-card p-8 bg-red-50">
              <h3 className="text-2xl font-black text-red-600 mb-2 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" strokeWidth={2.5} /> Danger Zone
              </h3>
              <p className="font-medium text-red-800 mb-6">
                운영진 권한을 다른 사용자(다음 기수 회장 등)에게 이양할 수 있습니다. 권한 이양 후에는 관리자 접근이 불가능합니다.
              </p>
              <button
                onClick={() => setShowHandover(true)}
                disabled={!adminClubId}
                className="px-6 py-3 border border-red-500 rounded-ctl text-red-600 font-black hover:bg-red-500 hover:text-white transition-colors bg-white disabled:opacity-40"
              >
                Super Admin 권한 양도하기 (Handover)
              </button>
            </section>
          </div>
        </main>

      <AdminHeaderPortal>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-4 px-6 py-2 rounded-ctl bg-brand text-white font-black shadow-btn hover:-translate-y-px transition-all text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <Save className="w-4 h-4" strokeWidth={2.5} />}
          변경사항 저장
        </button>
      </AdminHeaderPortal>

      {/* 토스트 */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-card font-bold flex items-center gap-3 shadow-soft-lg ${toast.ok ? 'bg-ink text-white' : 'bg-red-600 text-white'}`}>
          {toast.ok ? <Check className="w-4 h-4 text-ok-fg" strokeWidth={2.5} /> : <AlertCircle className="w-4 h-4" strokeWidth={2.5} />}
          {toast.msg}
        </div>
      )}

      {showHandover && adminClubId && (
        <HandoverModal clubId={adminClubId} clubName={name} onClose={() => setShowHandover(false)} />
      )}

      {showCert && adminClubId && (
        <CertificateIssueModal
          clubId={adminClubId}
          clubName={name}
          onClose={() => setShowCert(false)}
          onIssued={count => showToast(`${count}명에게 증명서를 발급했습니다.`)}
        />
      )}
    </>
  );
}

// ──────────────────────────────────────────
// 운영진 권한 양도(Handover) 모달
// ──────────────────────────────────────────
interface HandoverCandidate {
  user_id: string;
  role: string;
  display_name: string | null;
  profiles: { name: string | null } | null;
}

function HandoverModal({ clubId, clubName, onClose }: { clubId: string; clubName: string; onClose: () => void }) {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<HandoverCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetId, setTargetId] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [handing, setHanding] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await fetchAll<any>((from, to) => supabase
        .from('club_members')
        .select('user_id, role, display_name, profiles(name)')
        .eq('club_id', clubId)
        .eq('status', '활동중')
        .not('user_id', 'is', null)
        .range(from, to));
      const rows = ((data as unknown as HandoverCandidate[]) ?? []).filter(m => m.user_id !== user?.id);
      setCandidates(rows);
      setLoading(false);
    })();
  }, [clubId, user?.id]);

  const candName = (m: HandoverCandidate) => m.profiles?.name ?? m.display_name ?? '이름 미상';

  const handover = async () => {
    if (!targetId) { setError('양도할 구성원을 선택하세요.'); return; }
    if (confirmText.trim() !== '양도') { setError('확인란에 "양도"를 정확히 입력하세요.'); return; }
    setHanding(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('handover_club_admin', {
      p_club_id: clubId,
      p_to_user_id: targetId,
    });
    if (rpcError) { setHanding(false); setError(rpcError.message); return; }
    // 본인은 더 이상 운영진이 아님 → 컨텍스트 재초기화를 위해 전체 리로드
    window.location.href = '/mypage';
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white border border-sand-200 rounded-card w-full max-w-lg shadow-soft-lg flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-sand-200 bg-red-50 rounded-t-card flex justify-between items-center shrink-0">
          <h3 className="text-xl font-black flex items-center gap-2 text-red-600">
            <ShieldCheck className="w-5 h-5" strokeWidth={2.5} /> 운영진 권한 양도
          </h3>
          <button onClick={onClose}><X className="w-5 h-5" strokeWidth={2.5} /></button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto">
          <p className="text-sm font-medium text-sand-600">
            <strong className="text-ink">{clubName}</strong>의 운영 권한을 다른 활동중 구성원에게 넘깁니다.
            양도하면 <strong className="text-red-600">본인은 부원으로 내려가며 관리자 페이지에 접근할 수 없습니다.</strong>
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-sand-400"><Loader className="w-6 h-6 animate-spin" strokeWidth={2.5} /></div>
          ) : candidates.length === 0 ? (
            <div className="border border-sand-200 rounded-card bg-sand-50 p-4 text-sm font-medium text-sand-500">
              양도할 수 있는 활동중 구성원이 없습니다. 먼저 구성원을 추가하세요.
            </div>
          ) : (
            <div>
              <label className="font-black text-xs block mb-1.5 text-sand-600">양도 대상</label>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold text-sm bg-white"
              >
                <option value="" disabled>구성원 선택...</option>
                {candidates.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {candName(m)}{m.role === '운영진' ? ' (현재 운영진)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {candidates.length > 0 && (
            <div>
              <label className="font-black text-xs block mb-1.5 text-sand-600">
                확인을 위해 <span className="text-red-600">양도</span> 를 입력하세요
              </label>
              <input
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                placeholder="양도"
                className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold text-sm"
              />
            </div>
          )}

          {error && <p className="text-sm font-bold text-red-600">{error}</p>}
        </div>

        <div className="p-6 border-t border-sand-200 bg-sand-50 rounded-b-card flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 border border-sand-300 rounded-ctl font-bold bg-white hover:bg-sand-50 text-sm">취소</button>
          <button
            onClick={handover}
            disabled={handing || candidates.length === 0}
            className="px-6 py-2.5 rounded-ctl bg-red-600 text-white font-black hover:bg-red-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-40"
          >
            {handing ? <Loader className="w-4 h-4 animate-spin" strokeWidth={2.5} /> : <ShieldCheck className="w-4 h-4" strokeWidth={2.5} />}
            권한 양도하기
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'field w-full p-3 border border-sand-300 rounded-ctl font-bold transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-black text-sm text-ink">{label}</label>
      {children}
    </div>
  );
}
