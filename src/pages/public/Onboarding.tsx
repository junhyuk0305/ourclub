import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader, CheckCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

// 로그인 / 회원가입 기본 도착지 (계정 타입 구분 없이 단일 흐름)
const DEFAULT_DEST = '/mypage';

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

type Mode = 'login' | 'signup';

export default function Onboarding() {
  const [mode, setMode] = useState<Mode>('login');
  const [forgot, setForgot] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signupSent, setSignupSent] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = mode === 'login';

  // 보호 라우트에서 넘어온 경우 원래 가려던 위치로 복귀
  const from = (location.state as { from?: { pathname: string; search?: string } } | null)?.from;
  const dest = from ? `${from.pathname}${from.search ?? ''}` : DEFAULT_DEST;

  const switchMode = () => {
    setErrorMsg('');
    setPassword('');
    setMode(isLogin ? 'signup' : 'login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!isLogin && !name.trim()) { setErrorMsg('이름을 입력해주세요.'); return; }

    setSubmitting(true);
    if (isLogin) {
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) { setErrorMsg(error); return; }
      navigate(dest);
    } else {
      const { error, needsConfirmation } = await signUp(email, password, name);
      setSubmitting(false);
      if (error) { setErrorMsg(error); return; }
      if (needsConfirmation) { setSignupSent(true); return; }
      navigate(dest);
    }
  };

  if (forgot) {
    return <ForgotPasswordScreen onBack={() => setForgot(false)} />;
  }

  if (signupSent) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <header className="p-6">
          <Link to="/" className="inline-flex items-center gap-2 font-black text-xl hover:text-orange-500 transition-colors">
            <ArrowLeft className="w-5 h-5" /> 메인으로 돌아가기
          </Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 py-10 text-center">
              <CheckCircle className="w-14 h-14 text-green-500" />
              <p className="font-black text-xl">이메일을 확인하세요</p>
              <p className="font-bold text-gray-500 text-sm">
                <span className="text-black">{email}</span>으로<br />
                인증 링크를 보냈습니다. 링크를 눌러 가입을 완료해주세요.
              </p>
              <button
                onClick={() => { setSignupSent(false); setMode('login'); setPassword(''); }}
                className="mt-4 px-8 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors"
              >
                로그인으로 돌아가기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 font-black text-xl hover:text-orange-500 transition-colors">
          <ArrowLeft className="w-5 h-5" /> 메인으로 돌아가기
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* 브랜드 + 제목 */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-4 h-4 bg-orange-500 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
              <span className="font-black text-2xl tracking-tighter">OURCLUB</span>
            </div>
            <h1 className="text-3xl font-black mb-2">{isLogin ? '로그인' : '회원가입'}</h1>
            <p className="text-gray-500 font-bold">
              {isLogin ? '다시 오신 걸 환영해요.' : 'OURCLUB 계정을 만들어보세요.'}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
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
                  className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
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
                className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-black text-sm">비밀번호</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setForgot(true)}
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
                  className="w-full border-2 border-black px-4 py-3 pr-12 font-bold outline-none focus:border-orange-500 transition-colors"
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
              className="w-full py-4 text-white font-black text-lg border-2 border-black bg-black hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader className="w-5 h-5 animate-spin" />}
              {isLogin ? '로그인' : '가입하기'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-bold">또는</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={() => signInWithGoogle(dest)}
              className="w-full py-3 border-2 border-black font-black flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors"
            >
              <GoogleIcon />
              Google로 계속하기
            </button>
          </form>

          {/* 로그인 ↔ 회원가입 전환 */}
          <p className="text-center font-bold text-sm text-gray-500 mt-6">
            {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="text-orange-500 hover:underline font-black"
            >
              {isLogin ? '회원가입' : '로그인'}
            </button>
          </p>

          {/* 기업 담당자 보조 진입 */}
          <p className="text-center font-bold text-xs text-gray-400 mt-3">
            기업 담당자이신가요?{' '}
            <Link to="/corp/dashboard" className="text-gray-500 hover:text-purple-600 underline">
              기업 센터 바로가기
            </Link>
          </p>
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
