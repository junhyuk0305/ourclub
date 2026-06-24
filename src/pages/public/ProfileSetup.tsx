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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-orange-100 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-black mb-2">프로필을 완성해주세요</h1>
          <p className="text-gray-500 font-bold">
            동아리 지원·활동에 필요한 정보예요. 한 번만 입력하면 됩니다.
          </p>
          {(location.state as { from?: unknown } | null)?.from && (
            <p className="mt-3 inline-block bg-orange-100 border border-orange-300 text-orange-700 font-bold text-xs px-3 py-1.5">
              이어서 진행하려면 먼저 프로필을 완성해주세요. 완료하면 가던 곳으로 돌아갑니다.
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <label className="font-black text-sm">대학교 *</label>
            <input
              value={university}
              onChange={e => setUniversity(e.target.value)}
              placeholder="○○대학교"
              required
              className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-black text-sm">전공 *</label>
            <input
              value={major}
              onChange={e => setMajor(e.target.value)}
              placeholder="경영학과"
              required
              className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-black text-sm">학적 상태 *</label>
              <select
                value={academicStatus}
                onChange={e => setAcademicStatus(e.target.value)}
                required
                className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 bg-white cursor-pointer"
              >
                <option value="" disabled>선택</option>
                <option value="재학">재학</option>
                <option value="휴학">휴학</option>
                <option value="수료">수료</option>
                <option value="졸업">졸업</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-black text-sm">생년월일 *</label>
              <input
                type="date"
                value={birthdate}
                onChange={e => setBirthdate(e.target.value)}
                required
                className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors bg-white cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-black text-sm">전화번호 *</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              required
              className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          {errorMsg && (
            <p className="text-red-600 font-bold text-sm border border-red-300 bg-red-50 p-3">
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-4 text-white font-black text-lg border-2 border-black bg-black hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader className="w-5 h-5 animate-spin" />}
            시작하기
          </button>

          <button
            type="button"
            onClick={() => signOut()}
            className="text-center font-bold text-xs text-gray-400 hover:text-orange-500 transition-colors"
          >
            다른 계정으로 로그인
          </button>
        </form>
      </div>
    </div>
  );
}
