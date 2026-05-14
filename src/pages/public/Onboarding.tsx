import React, { useState } from 'react';
import { ArrowLeft, User, Tent, Building2, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

type Mode = 'select' | 'login' | 'signup' | 'forgot';
type UserType = 'student' | 'club';

const USER_TYPE_META = {
  student: {
    label: '일반 학생 계정',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    focusBorder: 'focus:border-orange-500',
    submitBg: 'bg-black hover:bg-orange-500 hover:text-black',
    Icon: User,
    dest: '/mypage',
  },
  club: {
    label: '동아리 운영진 계정',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    focusBorder: 'focus:border-orange-500',
    submitBg: 'bg-orange-500 hover:bg-black hover:text-white',
    Icon: Tent,
    dest: '/club-setup',
  },
} as const;

export default function Onboarding() {
  const [mode, setMode] = useState<Mode>('select');
  const [userType, setUserType] = useState<UserType>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const meta = USER_TYPE_META[userType];

  const reset = () => {
    setEmail(''); setPassword(''); setName('');
    setErrorMsg(''); setShowPw(false);
  };

  const openAs = (type: UserType, initialMode: Mode) => {
    reset();
    setUserType(type);
    setMode(initialMode);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) { setErrorMsg(error); return; }
    navigate(meta.dest);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErrorMsg('이름을 입력해주세요.'); return; }
    setSubmitting(true);
    setErrorMsg('');
    const { error } = await signUp(email, password, name);
    setSubmitting(false);
    if (error) { setErrorMsg(error); return; }
    navigate(meta.dest);
  };

  // ── 비밀번호 찾기 화면 ─────────────────────────────────────
  if (mode === 'forgot') {
    return <ForgotPasswordScreen onBack={() => setMode('login')} />;
  }

  // ── 로그인/회원가입 폼 ──────────────────────────────────────
  if (mode === 'login' || mode === 'signup') {
    const isLogin = mode === 'login';
    const { Icon } = meta;

    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="p-6">
          <button
            onClick={() => { reset(); setMode('select'); }}
            className="inline-flex items-center gap-2 font-black text-xl hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> 돌아가기
          </button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <div className={`w-16 h-16 ${meta.iconBg} border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`w-8 h-8 ${meta.iconColor}`} />
              </div>
              <h1 className="text-3xl font-black mb-2">{isLogin ? '로그인' : '회원가입'}</h1>
              <p className="text-gray-500 font-bold">{meta.label}</p>
            </div>

            <form
              onSubmit={isLogin ? handleSignIn : handleSignUp}
              className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-4"
            >
              {!isLogin && (
                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm">이름</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="홍길동"
                    required
                    className={`border-2 border-black px-4 py-3 font-bold outline-none ${meta.focusBorder} transition-colors`}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="font-black text-sm">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@university.ac.kr"
                  required
                  className={`border-2 border-black px-4 py-3 font-bold outline-none ${meta.focusBorder} transition-colors`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-black text-sm">비밀번호</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors"
                    >
                      비밀번호를 잊으셨나요?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="6자 이상"
                    required
                    minLength={6}
                    className={`w-full border-2 border-black px-4 py-3 pr-12 font-bold outline-none ${meta.focusBorder} transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <p className="text-red-600 font-bold text-sm border border-red-300 bg-red-50 p-3">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 text-white font-black text-lg border-2 border-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${meta.submitBg}`}
              >
                {submitting && <Loader className="w-5 h-5 animate-spin" />}
                {isLogin ? '로그인' : '가입하기'}
              </button>

              <p className="text-center font-bold text-sm text-gray-500">
                {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
                <button
                  type="button"
                  onClick={() => { reset(); setMode(isLogin ? 'signup' : 'login'); }}
                  className="text-orange-500 hover:underline font-black"
                >
                  {isLogin ? '회원가입' : '로그인'}
                </button>
              </p>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-bold">또는</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <button
                type="button"
                onClick={() => signInWithGoogle(meta.dest)}
                className="w-full py-3 border-2 border-black font-black flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon />
                Google로 계속하기
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── 역할 선택 화면 ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 font-black text-xl hover:text-orange-500 transition-colors">
          <ArrowLeft className="w-5 h-5" /> 메인으로 돌아가기
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">OURCLUB에서<br />진짜 커리어를 시작하세요.</h1>
          <p className="text-xl font-bold text-gray-500">당신의 역할에 맞는 회원가입 방식을 선택해주세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full">
          {/* 일반 학생 */}
          <div
            onClick={() => openAs('student', 'login')}
            className="group bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 rounded-full border-4 border-black flex items-center justify-center mb-6 bg-blue-100 group-hover:bg-blue-200 transition-colors">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-black mb-4">일반 학생</h2>
            <p className="font-bold text-gray-500 mb-8 flex-1">동아리에 지원하고,<br />실무 경험을 쌓아보세요.</p>
            <div className="w-full py-4 bg-yellow-400 border-2 border-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-y-1 transition-all text-center">
              이메일로 시작하기
            </div>
          </div>

          {/* 동아리 운영진 */}
          <div
            onClick={() => openAs('club', 'signup')}
            className="group bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center text-center"
          >
            <div className="w-24 h-24 rounded-full border-4 border-black flex items-center justify-center mb-6 bg-orange-100 group-hover:bg-orange-200 transition-colors">
              <Tent className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-3xl font-black mb-4">동아리 운영진</h2>
            <p className="font-bold text-gray-500 mb-8 flex-1">우리 동아리 프로필을 만들고,<br />B2B 프로젝트를 수주하세요.</p>
            <div className="w-full py-4 bg-orange-500 border-2 border-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-y-1 transition-all text-center">
              동아리 운영진으로 가입
            </div>
          </div>

          {/* 기업 담당자 */}
          <div className="group bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-black flex items-center justify-center mb-6 bg-purple-100 group-hover:bg-purple-200 transition-colors">
              <Building2 className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-black mb-4">기업 담당자</h2>
            <p className="font-bold text-gray-500 mb-8 flex-1">검증된 대학생 팀에게<br />프로젝트를 의뢰하고 인재를 발굴하세요.</p>
            <Link
              to="/corp/dashboard"
              onClick={e => e.stopPropagation()}
              className="w-full py-4 bg-black text-white border-2 border-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] group-hover:text-purple-400 group-hover:-translate-y-1 transition-all block text-center"
            >
              기업 회원가입
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 w-full max-w-xs">
            <div className="flex-1 h-px bg-gray-300" />
            <span className="text-sm text-gray-400 font-bold">또는</span>
            <div className="flex-1 h-px bg-gray-300" />
          </div>
          <button
            onClick={() => signInWithGoogle('/mypage')}
            className="flex items-center gap-3 px-8 py-3 border-2 border-black font-black hover:bg-gray-50 transition-colors"
          >
            <GoogleIcon />
            Google로 간편 로그인
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 비밀번호 찾기 화면 ─────────────────────────────────────────
function ForgotPasswordScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/mypage`,
    });
    setSubmitting(false);
    if (error) { setErrorMsg(error.message); return; }
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="p-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 font-black text-xl hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> 돌아가기
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-black mb-2">비밀번호 찾기</h1>
            <p className="text-gray-500 font-bold">가입한 이메일로 재설정 링크를 보내드립니다.</p>
          </div>

          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            {sent ? (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <CheckCircle className="w-14 h-14 text-green-500" />
                <p className="font-black text-xl">이메일을 확인하세요</p>
                <p className="font-bold text-gray-500 text-sm">
                  <span className="text-black">{email}</span>으로<br />
                  비밀번호 재설정 링크를 발송했습니다.
                </p>
                <button
                  onClick={onBack}
                  className="mt-4 px-8 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors"
                >
                  로그인으로 돌아가기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm">이메일</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="가입할 때 사용한 이메일"
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
                  disabled={submitting}
                  className="w-full py-4 bg-black text-white font-black text-lg border-2 border-black hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader className="w-5 h-5 animate-spin" />}
                  재설정 링크 보내기
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
