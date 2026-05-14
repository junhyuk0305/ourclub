import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle, Loader, AlertCircle, LogIn, Lock, ChevronRight } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

interface Question {
  id: string;
  type: 'text' | 'textarea';
  title: string;
  required: boolean;
}

interface Recruitment {
  id: string;
  title: string;
  status: string;
  generation: string | null;
  deadline: string | null;
  description: string | null;
  category: string | null;
  pipeline_stages: string[] | null;
  form_schema: Question[];
  deployed_form_schema: Question[] | null;
}

interface Club {
  id: string;
  name: string;
  slug: string;
}

export default function ClubApply() {
  const { id: slug } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const rid = searchParams.get('rid');
  const { user, profile, session } = useAuth();

  const [club, setClub] = useState<Club | null>(null);
  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: clubData, error: clubErr } = await supabase
        .from('clubs')
        .select('id, name, slug')
        .eq('slug', slug)
        .single();

      if (clubErr || !clubData) {
        setLoadError('동아리를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      setClub(clubData as Club);

      let recruitQuery = supabase
        .from('recruitments')
        .select('id, title, status, generation, deadline, description, category, pipeline_stages, form_schema, deployed_form_schema');

      if (rid) {
        recruitQuery = recruitQuery.eq('id', rid).eq('club_id', clubData.id);
      } else {
        recruitQuery = recruitQuery
          .eq('club_id', clubData.id)
          .eq('status', '진행중')
          .order('created_at', { ascending: false })
          .limit(1);
      }

      const { data: recruitData } = await recruitQuery.maybeSingle();

      if (!recruitData) {
        setLoadError('현재 진행 중인 모집이 없습니다.');
        setLoading(false);
        return;
      }
      setRecruitment(recruitData as Recruitment);
      setLoading(false);
    })();
  }, [slug, rid]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setPortfolio(profile.portfolio_url || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!recruitment || !user) return;
    supabase
      .from('recruitment_applications')
      .select('id')
      .eq('recruitment_id', recruitment.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setAlreadyApplied(!!data));
  }, [recruitment, user]);

  const handleSubmit = async () => {
    if (!recruitment || !user) return;

    if (!name.trim() || !phone.trim()) {
      alert('이름과 연락처는 필수 입력 항목입니다.');
      return;
    }

    for (const q of questions) {
      if (q.required && !answers[q.id]?.trim()) {
        alert(`'${q.title}' 항목은 필수 응답입니다.`);
        return;
      }
    }

    setSubmitting(true);

    const { data: existing } = await supabase
      .from('recruitment_applications')
      .select('id')
      .eq('recruitment_id', recruitment.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      alert('이미 지원하셨습니다.');
      setAlreadyApplied(true);
      setSubmitting(false);
      return;
    }

    const allAnswers: Record<string, string> = { '이름': name, '연락처': phone };
    if (portfolio.trim()) allAnswers['포트폴리오'] = portfolio;
    for (const q of questions) {
      allAnswers[q.title] = answers[q.id] ?? '';
    }

    // 파이프라인의 첫 번째 단계를 초기 상태로 사용
    const initialStage = recruitment.pipeline_stages?.[0] ?? '서류접수';

    const { error } = await supabase
      .from('recruitment_applications')
      .insert({
        recruitment_id: recruitment.id,
        user_id: user.id,
        answers: allAnswers,
        status: initialStage,
      });

    setSubmitting(false);
    if (error) {
      alert(`제출 중 오류가 발생했습니다: ${error.message}`);
      return;
    }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-3">{loadError}</h2>
          <Link to={`/clubs/${slug}/recruit`} className="text-orange-500 font-bold hover:underline">
            ← 채용 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 임시저장 상태: 아직 공개되지 않은 폼
  if (recruitment?.status === '임시저장') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center max-w-md w-full">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-3">아직 공개되지 않은 공고입니다</h2>
          <p className="text-gray-600 font-bold mb-8">지원서가 아직 준비 중입니다. 잠시 후 다시 확인해주세요.</p>
          <Link
            to={`/clubs/${slug}/recruit`}
            className="px-8 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors inline-block border border-black"
          >
            채용 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center max-w-md w-full">
          <LogIn className="w-12 h-12 text-orange-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-3">로그인이 필요합니다</h2>
          <p className="text-gray-600 font-bold mb-8">지원서를 작성하려면 먼저 로그인해주세요.</p>
          <Link
            to="/login"
            className="px-8 py-3 bg-orange-500 border border-black font-black hover:bg-black hover:text-white transition-colors inline-block"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center max-w-md w-full">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-3">지원 완료!</h2>
          <p className="text-gray-700 font-bold mb-1">
            <span className="text-orange-500">{club?.name}</span>의
          </p>
          <p className="text-gray-700 font-bold mb-8">{recruitment?.title}에 지원서가 제출되었습니다.</p>
          <p className="text-sm text-gray-500 font-bold mb-8">결과는 이메일로 안내드릴 예정입니다. 감사합니다!</p>
          <Link
            to={`/clubs/${slug}/recruit`}
            className="px-8 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors inline-block border border-black"
          >
            채용 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // deployed_form_schema 우선 사용 (공식 배포 버전), 없으면 form_schema
  const questions: Question[] = Array.isArray(recruitment?.deployed_form_schema) && (recruitment.deployed_form_schema?.length ?? 0) > 0
    ? recruitment!.deployed_form_schema!
    : (recruitment?.form_schema ?? []);

  const deadline = recruitment?.deadline ? new Date(recruitment.deadline) : null;
  const isExpired = deadline ? deadline < new Date() : false;
  const pipelineStages = recruitment?.pipeline_stages ?? ['서류접수', '면접', '최종합격'];

  return (
    <div className="bg-gray-50 min-h-screen py-12 font-sans">
      <div className="max-w-3xl mx-auto px-6">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            to={`/clubs/${slug}/recruit`}
            className="inline-flex items-center gap-2 font-bold text-gray-500 hover:text-black transition-colors mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {club?.name} 채용 페이지로 돌아가기
          </Link>

          {/* 배지 */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {recruitment?.category && (
              <span className="px-2.5 py-1 bg-orange-100 border border-orange-300 text-orange-700 text-xs font-black">
                {recruitment.category}
              </span>
            )}
            {recruitment?.generation && (
              <span className="px-2.5 py-1 bg-gray-100 border border-gray-300 text-gray-600 text-xs font-bold">
                {recruitment.generation}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
            {recruitment?.title}
          </h1>

          {deadline && (
            <p className={`text-sm font-bold mt-2 ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
              {isExpired
                ? '모집이 마감되었습니다'
                : `마감: ${deadline.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
            </p>
          )}

          {/* 프로세스 미리보기 */}
          {pipelineStages.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-4">
              {pipelineStages.map((stage, i) => (
                <React.Fragment key={`${stage}-${i}`}>
                  <span className={`text-xs font-bold px-2.5 py-1 border ${
                    i === pipelineStages.length - 1
                      ? 'bg-green-50 border-green-300 text-green-700 font-black'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}>
                    {stage}
                  </span>
                  {i < pipelineStages.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* 이미 지원함 */}
        {alreadyApplied && (
          <div className="bg-blue-50 border border-blue-300 p-6 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-blue-500 shrink-0" />
            <div>
              <p className="font-black text-blue-800">이미 지원하셨습니다.</p>
              <p className="text-blue-600 font-bold text-sm">결과는 이메일로 안내드립니다.</p>
            </div>
          </div>
        )}

        {/* 마감 */}
        {isExpired ? (
          <div className="bg-red-50 border border-red-300 p-10 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-xl font-black text-red-700 mb-2">모집이 마감되었습니다</h3>
            <p className="text-red-600 font-bold">지원 기간이 종료되었습니다.</p>
          </div>
        ) : !alreadyApplied ? (
          <>
            <div className="bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 mb-4">
              {/* 기본 정보 */}
              <h2 className="text-xl font-black border-b border-black pb-4 mb-6">기본 정보</h2>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block font-bold mb-2">
                    이름 (실명) <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50"
                    placeholder="홍길동"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2">
                    연락처 <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50"
                    placeholder="010-0000-0000"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-2">포트폴리오 링크 (선택)</label>
                  <input
                    type="url"
                    value={portfolio}
                    onChange={e => setPortfolio(e.target.value)}
                    className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50"
                    placeholder="Notion, GitHub, 개인 웹사이트 등"
                  />
                </div>
              </div>

              {/* 동적 질문 */}
              {questions.length > 0 && (
                <>
                  <h2 className="text-xl font-black border-b border-black pb-4 mb-6 mt-12">추가 질문</h2>
                  <div className="flex flex-col gap-8">
                    {questions.map((q, idx) => (
                      <div key={q.id}>
                        <label className="block font-bold mb-2">
                          {idx + 1}. {q.title}
                          {q.required && <span className="text-orange-500 ml-1">*</span>}
                        </label>
                        {q.type === 'text' ? (
                          <input
                            type="text"
                            value={answers[q.id] ?? ''}
                            onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50"
                            placeholder="내용을 입력해주세요."
                          />
                        ) : (
                          <textarea
                            rows={5}
                            value={answers[q.id] ?? ''}
                            onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50 resize-none"
                            placeholder="내용을 입력해주세요."
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* 제출 버튼 (sticky) */}
            <div className="flex gap-4 border-t-2 border-black p-4 bg-white sticky bottom-0 z-50">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-orange-500 border border-black py-4 font-black text-black hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting && <Loader className="w-5 h-5 animate-spin" />}
                최종 제출하기
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
