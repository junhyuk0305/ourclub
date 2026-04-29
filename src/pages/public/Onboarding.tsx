import React, { useState } from 'react';
import { ArrowLeft, User, Tent, Building2, Eye, EyeOff, Loader } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type Mode = 'select' | 'login' | 'signup';

export default function Onboarding() {
  const [mode, setMode] = useState<Mode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const reset = () => {
    setEmail(''); setPassword(''); setName('');
    setErrorMsg(''); setShowPw(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) { setErrorMsg(error); return; }
    navigate('/mypage');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErrorMsg('이름을 입력해주세요.'); return; }
    setSubmitting(true);
    setErrorMsg('');
    const { error } = await signUp(email, password, name);
    setSubmitting(false);
    if (error) { setErrorMsg(error); return; }
    navigate('/mypage');
  };

  if (mode === 'login' || mode === 'signup') {
    const isLogin = mode === 'login';
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
              <div className="w-16 h-16 bg-blue-100 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-black mb-2">{isLogin ? '로그인' : '회원가입'}</h1>
              <p className="text-gray-500 font-bold">일반 학생 계정</p>
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
                <label className="font-black text-sm">비밀번호</label>
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
                className="w-full py-4 bg-black text-white font-black text-lg border-2 border-black hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 역할 선택 화면
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
            onClick={() => setMode('login')}
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
          <div className="group bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-black flex items-center justify-center mb-6 bg-orange-100 group-hover:bg-orange-200 transition-colors">
              <Tent className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-3xl font-black mb-4">동아리 운영진</h2>
            <p className="font-bold text-gray-500 mb-8 flex-1">우리 동아리 프로필을 만들고,<br />B2B 프로젝트를 수주하세요.</p>
            <Link to="/admin/dashboard" className="w-full py-4 bg-orange-500 border-2 border-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-none group-hover:translate-y-1 transition-all block text-center">
              동아리 인증하고 시작
            </Link>
          </div>

          {/* 기업 담당자 */}
          <div className="group bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] hover:-translate-y-2 transition-all cursor-pointer flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full border-4 border-black flex items-center justify-center mb-6 bg-purple-100 group-hover:bg-purple-200 transition-colors">
              <Building2 className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-black mb-4">기업 담당자</h2>
            <p className="font-bold text-gray-500 mb-8 flex-1">검증된 대학생 팀에게<br />프로젝트를 의뢰하고 인재를 발굴하세요.</p>
            <Link to="/corp/dashboard" className="w-full py-4 bg-black text-white border-2 border-black font-black text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[4px_4px_0px_0px_rgba(168,85,247,1)] group-hover:text-purple-400 group-hover:-translate-y-1 transition-all block text-center">
              기업 회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
