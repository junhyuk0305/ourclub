import React, { useState } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Loader, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const DEFAULT_DEST = '/mypage';

export default function ProfileSetup() {
  const { user, profile, isProfileComplete, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [university, setUniversity] = useState(profile?.university ?? '');
  const [major, setMajor] = useState(profile?.major ?? '');
  const [academicStatus, setAcademicStatus] = useState(profile?.academic_status ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [birthdate, setBirthdate] = useState(profile?.birthdate ?? '');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 이미 완성한 사용자는 진입 불가 (원래 가려던 곳으로)
  if (isProfileComplete) {
    const from = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search ?? ''}` : DEFAULT_DEST} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!university.trim() || !major.trim() || !academicStatus || !phone.trim() || !birthdate) {
      setErrorMsg('모든 항목을 입력해주세요.');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    const { error } = await supabase
      .from('profiles')
      .update({
        university: university.trim(),
        major: major.trim(),
        academic_status: academicStatus,
        phone: phone.trim(),
        birthdate,
      })
      .eq('id', user.id);

    if (error) { setSaving(false); setErrorMsg(error.message); return; }

    await refreshProfile();
    setSaving(false);

    const from = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;
    navigate(from ? `${from.pathname}${from.search ?? ''}` : DEFAULT_DEST, { replace: true });
  };

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-brand-tint rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-brand" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-black text-ink mb-2">프로필을 완성해주세요</h1>
          <p className="text-sand-600 font-medium">
            동아리 지원·활동에 필요한 정보예요. 한 번만 입력하면 됩니다.
          </p>
          {(location.state as { from?: unknown } | null)?.from && (
            <p className="mt-3 inline-block bg-brand-tint text-brand-dark font-bold text-xs px-3 py-1.5 rounded-ctl">
              이어서 진행하려면 먼저 프로필을 완성해주세요. 완료하면 가던 곳으로 돌아갑니다.
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-sand-200 rounded-card p-8 shadow-soft flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label className="font-bold text-sm text-ink">대학교 *</label>
            <input
              value={university}
              onChange={e => setUniversity(e.target.value)}
              placeholder="○○대학교"
              required
              className="field border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink placeholder:text-sand-400 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-sm text-ink">전공 *</label>
            <input
              value={major}
              onChange={e => setMajor(e.target.value)}
              placeholder="경영학과"
              required
              className="field border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink placeholder:text-sand-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-sm text-ink">학적 상태 *</label>
              <select
                value={academicStatus}
                onChange={e => setAcademicStatus(e.target.value)}
                required
                className="field border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink bg-white cursor-pointer"
              >
                <option value="" disabled>선택</option>
                <option value="재학">재학</option>
                <option value="휴학">휴학</option>
                <option value="수료">수료</option>
                <option value="졸업">졸업</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-bold text-sm text-ink">생년월일 *</label>
              <input
                type="date"
                value={birthdate}
                onChange={e => setBirthdate(e.target.value)}
                required
                className="field border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink transition-colors bg-white cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-bold text-sm text-ink">전화번호 *</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              required
              className="field border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink placeholder:text-sand-400 transition-colors"
            />
          </div>

          {errorMsg && (
            <p className="text-bad-fg font-bold text-sm bg-bad-bg rounded-ctl p-3">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 btn-grad text-white font-bold text-lg rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader className="w-5 h-5 animate-spin" />}
            시작하기
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="text-center font-medium text-xs text-sand-400 hover:text-brand transition-colors"
          >
            다른 계정으로 로그인
          </button>
        </form>
      </div>
    </div>
  );
}
