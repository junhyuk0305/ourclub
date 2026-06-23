import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle, Loader, AlertCircle, LogIn, Lock, ChevronRight, Upload, Paperclip, X } from 'lucide-react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { Question, validateAnswer, type RecruitmentRow } from '../../types/recruitment';
import { useToast } from '../../hooks/useToast';

type Recruitment =
  Pick<RecruitmentRow,
    'id' | 'title' | 'generation' | 'deadline' | 'recruit_start_date'
    | 'description' | 'category' | 'pipeline_stages'>
  & { status: string; form_schema: Question[]; deployed_form_schema: Question[] | null };

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast, show: showToast } = useToast(3000);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: clubData, error: clubErr } = await supabase
        .from('clubs').select('id, name, slug').eq('slug', slug).single();

      if (clubErr || !clubData) {
        setLoadError('동아리를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      setClub(clubData as Club);

      let recruitQuery = supabase
        .from('recruitments')
        .select('id, title, status, generation, deadline, recruit_start_date, description, category, pipeline_stages, form_schema, deployed_form_schema');

      if (rid) {
        recruitQuery = recruitQuery.eq('id', rid).eq('club_id', clubData.id);
      } else {
        recruitQuery = recruitQuery
          .eq('club_id', clubData.id).in('status', ['진행중'])
          .order('created_at', { ascending: false }).limit(1);
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
      .from('recruitment_applications').select('id')
      .eq('recruitment_id', recruitment.id).eq('user_id', user.id)
      .maybeSingle().then(({ data }) => setAlreadyApplied(!!data));
  }, [recruitment, user]);

  const setAnswer = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  const handleSubmit = async () => {
    if (!recruitment || !user) return;

    if (!name.trim() || !phone.trim()) {
      showToast('이름과 연락처는 필수 입력 항목입니다.', false);
      return;
    }

    const nextErrors: Record<string, string> = {};
    for (const q of questions) {
      const err = validateAnswer(q, answers[q.id] ?? '');
      if (err) nextErrors[q.id] = err;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      const firstId = Object.keys(nextErrors)[0];
      document.getElementById(`q-${firstId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    const { data: existing } = await supabase
      .from('recruitment_applications').select('id')
      .eq('recruitment_id', recruitment.id).eq('user_id', user.id).maybeSingle();

    if (existing) {
      showToast('이미 지원하셨습니다.', false);
      setAlreadyApplied(true);
      setSubmitting(false);
      return;
    }

    const allAnswers: Record<string, string> = { '이름': name, '연락처': phone };
    if (portfolio.trim()) allAnswers['포트폴리오'] = portfolio;
    for (const q of questions) {
      allAnswers[q.title] = answers[q.id] ?? '';
    }

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
      showToast(`제출 중 오류가 발생했습니다: ${error.message}`, false);
      return;
    }
    setSubmitted(true);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-3">{loadError}</h2>
          <Link to={`/clubs/${slug}/recruit`} className="text-orange-500 font-bold hover:underline">← 채용 페이지로 돌아가기</Link>
        </div>
      </div>
    );
  }
  if (recruitment?.status === '임시저장') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-12 text-center max-w-md w-full">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-3">아직 공개되지 않은 공고입니다</h2>
          <p className="text-gray-600 font-bold mb-8">지원서가 아직 준비 중입니다. 잠시 후 다시 확인해주세요.</p>
          <Link to={`/clubs/${slug}/recruit`} className="px-8 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors inline-block border border-black">
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
          <Link to="/login" className="px-8 py-3 bg-orange-500 border border-black font-black hover:bg-black hover:text-white transition-colors inline-block">
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
          <p className="text-gray-700 font-bold mb-1"><span className="text-orange-500">{club?.name}</span>의</p>
          <p className="text-gray-700 font-bold mb-8">{recruitment?.title}에 지원서가 제출되었습니다.</p>
          <p className="text-sm text-gray-500 font-bold mb-8">진행 상황은 마이페이지 알림으로 안내드립니다. 감사합니다!</p>
          <Link to={`/clubs/${slug}/recruit`} className="px-8 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors inline-block border border-black">
            채용 페이지로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const questions: Question[] = Array.isArray(recruitment?.deployed_form_schema) && (recruitment.deployed_form_schema?.length ?? 0) > 0
    ? recruitment!.deployed_form_schema!
    : (recruitment?.form_schema ?? []);

  const deadline = recruitment?.deadline ? new Date(recruitment.deadline) : null;
  const startDate = recruitment?.recruit_start_date ? new Date(recruitment.recruit_start_date) : null;
  const isExpired = deadline ? deadline < new Date() : false;
  const isBeforeStart = startDate ? startDate > new Date() : false;
  const pipelineStages = recruitment?.pipeline_stages ?? ['서류접수', '면접', '최종합격'];

  return (
    <div className="bg-gray-50 min-h-screen py-12 font-sans">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-8">
          <Link to={`/clubs/${slug}/recruit`} className="inline-flex items-center gap-2 font-bold text-gray-500 hover:text-black transition-colors mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> {club?.name} 채용 페이지로 돌아가기
          </Link>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {recruitment?.category && <span className="px-2.5 py-1 bg-orange-100 border border-orange-300 text-orange-700 text-xs font-black">{recruitment.category}</span>}
            {recruitment?.generation && <span className="px-2.5 py-1 bg-gray-100 border border-gray-300 text-gray-600 text-xs font-bold">{recruitment.generation}</span>}
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{recruitment?.title}</h1>
          {deadline && (
            <p className={`text-sm font-bold mt-2 ${isExpired ? 'text-red-500' : 'text-gray-500'}`}>
              {isExpired ? '모집이 마감되었습니다' : `마감: ${deadline.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
            </p>
          )}
          {pipelineStages.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap mt-4">
              {pipelineStages.map((stage, i) => (
                <React.Fragment key={`${stage}-${i}`}>
                  <span className={`text-xs font-bold px-2.5 py-1 border ${i === pipelineStages.length - 1 ? 'bg-green-50 border-green-300 text-green-700 font-black' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    {stage}
                  </span>
                  {i < pipelineStages.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {alreadyApplied && (
          <div className="bg-blue-50 border border-blue-300 p-6 mb-6 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-blue-500 shrink-0" />
            <div>
              <p className="font-black text-blue-800">이미 지원하셨습니다.</p>
              <p className="text-blue-600 font-bold text-sm">진행 상황은 마이페이지 알림으로 안내드립니다.</p>
            </div>
          </div>
        )}

        {isBeforeStart ? (
          <div className="bg-yellow-50 border border-yellow-300 p-10 text-center">
            <Lock className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
            <h3 className="text-xl font-black text-yellow-800 mb-2">아직 모집이 시작되지 않았습니다</h3>
            <p className="text-yellow-700 font-bold">
              모집 시작: {startDate!.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ) : isExpired ? (
          <div className="bg-red-50 border border-red-300 p-10 text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-xl font-black text-red-700 mb-2">모집이 마감되었습니다</h3>
            <p className="text-red-600 font-bold">지원 기간이 종료되었습니다.</p>
          </div>
        ) : !alreadyApplied ? (
          <>
            <div className="bg-white border border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-12 mb-4">
              <h2 className="text-xl font-black border-b border-black pb-4 mb-6">기본 정보</h2>
              <div className="flex flex-col gap-6">
                <div>
                  <label className="block font-bold mb-2">이름 (실명) <span className="text-orange-500">*</span></label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50" placeholder="홍길동" />
                </div>
                <div>
                  <label className="block font-bold mb-2">연락처 <span className="text-orange-500">*</span></label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50" placeholder="010-0000-0000" />
                </div>
                <div>
                  <label className="block font-bold mb-2">포트폴리오 링크 (선택)</label>
                  <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)} className="w-full border border-black p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50" placeholder="Notion, GitHub, 개인 웹사이트 등" />
                </div>
              </div>

              {questions.length > 0 && (
                <>
                  <h2 className="text-xl font-black border-b border-black pb-4 mb-6 mt-12">추가 질문</h2>
                  <div className="flex flex-col gap-8">
                    {questions.map((q, idx) => (
                      <QuestionField
                        key={q.id}
                        index={idx}
                        question={q}
                        value={answers[q.id] ?? ''}
                        error={errors[q.id]}
                        onChange={v => setAnswer(q.id, v)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

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

      {toast && (
        <div
          className={`fixed bottom-8 right-8 z-50 px-6 py-4 border-2 font-black flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] ${
            toast.ok ? 'bg-green-500 text-white border-black' : 'bg-red-500 text-white border-black'
          }`}
        >
          {toast.ok ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function QuestionField({ index, question, value, error, onChange }: {
  index: number;
  question: Question;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const id = `q-${question.id}`;
  const inputClass = `w-full border p-4 font-bold outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all bg-gray-50 ${
    error ? 'border-red-400' : 'border-black'
  }`;

  return (
    <div id={id}>
      <label className="block font-bold mb-2">
        {index + 1}. {question.title}
        {question.required && <span className="text-orange-500 ml-1">*</span>}
      </label>
      {question.description && (
        <p className="text-sm text-gray-500 font-medium mb-2 whitespace-pre-wrap">{question.description}</p>
      )}
      <QuestionInput question={question} value={value} onChange={onChange} inputClass={inputClass} />
      {error && (
        <p className="text-red-500 text-sm font-bold mt-1.5 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </div>
  );
}

function QuestionInput({ question, value, onChange, inputClass }: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  inputClass: string;
}) {
  const t = question.type;

  if (t === 'text') {
    return <input type="text" value={value} onChange={e => onChange(e.target.value)} className={inputClass} placeholder="내용을 입력해주세요." />;
  }
  if (t === 'textarea') {
    return <textarea rows={5} value={value} onChange={e => onChange(e.target.value)} className={`${inputClass} resize-none`} placeholder="내용을 입력해주세요." />;
  }
  if (t === 'number') {
    return <input type="number" inputMode="numeric" value={value} onChange={e => onChange(e.target.value)} className={inputClass} placeholder={[question.min, question.max].filter(v => v !== undefined).join(' ~ ') || '숫자를 입력해주세요.'} />;
  }
  if (t === 'email') {
    return <input type="email" value={value} onChange={e => onChange(e.target.value)} className={inputClass} placeholder="user@domain.com" />;
  }
  if (t === 'phone') {
    return <input type="tel" value={value} onChange={e => onChange(e.target.value)} className={inputClass} placeholder="01012345678" />;
  }
  if (t === 'select' || t === 'source') {
    const options = question.options ?? [];
    return (
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const checked = value === opt;
          return (
            <label key={i} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${checked ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'}`}>
              <input
                type="radio"
                name={question.id}
                checked={checked}
                onChange={() => onChange(opt)}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="font-bold text-sm">{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }
  if (t === 'multiselect') {
    const options = question.options ?? [];
    const selected = value ? value.split(', ').filter(Boolean) : [];
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt];
      onChange(next.join(', '));
    };
    return (
      <div className="flex flex-col gap-2">
        {options.map((opt, i) => {
          const checked = selected.includes(opt);
          return (
            <label key={i} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${checked ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt)}
                className="w-4 h-4 accent-orange-500"
              />
              <span className="font-bold text-sm">{opt}</span>
            </label>
          );
        })}
      </div>
    );
  }
  if (t === 'file') {
    return <FileInput question={question} value={value} onChange={onChange} />;
  }
  if (t === 'consent') {
    const agreed = value === '동의함';
    return (
      <label className={`flex items-start gap-3 p-4 border cursor-pointer transition-colors ${agreed ? 'border-orange-500 bg-orange-50' : 'border-black bg-gray-50'}`}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => onChange(e.target.checked ? '동의함' : '')}
          className="w-4 h-4 mt-0.5 accent-orange-500 shrink-0"
        />
        <span className="text-sm font-bold leading-relaxed whitespace-pre-wrap">
          {question.consentText ?? '본 항목에 동의합니다.'}
        </span>
      </label>
    );
  }
  return null;
}

function FileInput({ question, value, onChange }: { question: Question; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    if (file.size > 10 * 1024 * 1024) {
      setError('최대 10MB까지 업로드 가능합니다.');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'bin';
    const path = `applications/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('club-pages').upload(path, file, { upsert: false });
    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('club-pages').getPublicUrl(path);
    onChange(`${file.name}|${data.publicUrl}`);
    setUploading(false);
  };

  const [fileName, fileUrl] = value.includes('|') ? value.split('|') : ['', value];

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="border border-orange-300 bg-orange-50 p-3 flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Paperclip className="w-4 h-4 text-orange-500 shrink-0" />
            {fileUrl ? (
              <a href={fileUrl} target="_blank" rel="noreferrer" className="font-bold text-sm text-orange-700 hover:underline truncate">
                {fileName || fileUrl}
              </a>
            ) : (
              <span className="font-bold text-sm text-orange-700 truncate">{fileName}</span>
            )}
          </div>
          <button onClick={() => onChange('')} className="p-1 hover:bg-orange-100 rounded shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full p-6 border-2 border-dashed border-gray-300 hover:border-orange-400 text-gray-500 hover:text-orange-500 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50 bg-gray-50"
        >
          {uploading
            ? <Loader className="w-5 h-5 animate-spin" />
            : <>
                <Upload className="w-5 h-5" />
                <span className="text-sm font-bold">클릭하여 파일 업로드</span>
                <span className="text-xs font-medium text-gray-400">
                  {question.acceptTypes ? `허용 형식: ${question.acceptTypes}` : '모든 형식 허용'} · 최대 10MB
                </span>
              </>
          }
        </button>
      )}
      {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={question.acceptTypes}
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }}
      />
    </div>
  );
}
