import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Loader, Clock, AlertTriangle, CheckCircle, ArrowLeft, Upload, Paperclip, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { useAuth } from '../../contexts/AuthContext';
import { useCorp } from '../../contexts/CorpContext';

type State =
  | { kind: 'loading' }
  | { kind: 'form'; editId: string | null; note: string | null }
  | { kind: 'pending'; status: string; note: string | null; createdAt: string }
  | { kind: 'submitted' };

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  '검토대기': { text: '검토 대기 중', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  '검토중':   { text: '검토 진행 중', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  '보완요청': { text: '보완 요청됨', color: 'bg-red-100 text-red-800 border-red-300' },
};

const IN_PROGRESS = ['검토대기', '검토중', '보완요청'];

export default function CorpRegister() {
  const { user, profile } = useAuth();
  const { isCorpUser, loading: corpLoading } = useCorp();
  const navigate = useNavigate();

  const [state, setState] = useState<State>({ kind: 'loading' });

  // 폼 필드
  const [corpName, setCorpName] = useState('');
  const [bizNumber, setBizNumber] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerPhone, setManagerPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [docUrl, setDocUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const check = useCallback(async () => {
    if (!user) return;
    // 이미 기업 담당자면 대시보드로
    if (isCorpUser) { navigate('/corp/dashboard', { replace: true }); return; }

    const { data: req } = await supabase
      .from('corp_registration_requests')
      .select('id, corp_name, business_number, manager_name, manager_phone, website, description, business_doc_url, status, reviewer_note, created_at')
      .eq('user_id', user.id)
      .in('status', IN_PROGRESS)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (req) {
      if (req.status === '보완요청') {
        // 재제출: 기존 값 프리필
        setCorpName(req.corp_name ?? '');
        setBizNumber(req.business_number ?? '');
        setManagerName(req.manager_name ?? '');
        setManagerPhone(req.manager_phone ?? '');
        setWebsite(req.website ?? '');
        setDescription(req.description ?? '');
        setDocUrl(req.business_doc_url ?? '');
        setState({ kind: 'form', editId: req.id, note: req.reviewer_note });
        return;
      }
      setState({ kind: 'pending', status: req.status, note: req.reviewer_note, createdAt: req.created_at });
      return;
    }

    // 신규 폼 — 담당자 기본값 프리필
    setManagerName(profile?.name ?? '');
    setManagerPhone(profile?.phone ?? '');
    setState({ kind: 'form', editId: null, note: null });
  }, [user, isCorpUser, profile, navigate]);

  useEffect(() => { if (!corpLoading) check(); }, [corpLoading, check]);

  const handleSubmit = async () => {
    if (!user) return;
    setErrorMsg('');
    if (!corpName.trim() || !bizNumber.trim() || !managerName.trim()) {
      setErrorMsg('기업명·사업자등록번호·담당자명은 필수입니다.');
      return;
    }
    setSubmitting(true);

    const payload = {
      corp_name: corpName.trim(),
      business_number: bizNumber.trim(),
      manager_name: managerName.trim(),
      manager_phone: managerPhone.trim() || null,
      website: website.trim() || null,
      description: description.trim() || null,
      business_doc_url: docUrl || null,
    };

    const editId = state.kind === 'form' ? state.editId : null;
    const { error } = editId
      ? await supabase
          .from('corp_registration_requests')
          .update({ ...payload, status: '검토대기' })
          .eq('id', editId)
      : await supabase
          .from('corp_registration_requests')
          .insert({ user_id: user.id, ...payload });

    setSubmitting(false);
    if (error) { setErrorMsg('제출 실패: ' + error.message); return; }
    setState({ kind: 'submitted' });
  };

  // ── 로딩 ──────────────────────────────────────────────────
  if (state.kind === 'loading' || corpLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  // ── 제출 완료 ──────────────────────────────────────────────
  if (state.kind === 'submitted') {
    return (
      <Shell>
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle className="w-14 h-14 text-green-500" />
          <p className="font-black text-2xl">기업 가입 신청이 접수됐어요</p>
          <p className="font-bold text-gray-500 text-sm">
            마스터 검토 후 결과를 알림으로 안내해 드립니다.<br />승인되면 기업 비즈니스 센터에 접근할 수 있어요.
          </p>
          <Link to="/" className="mt-4 px-8 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors">
            메인으로 돌아가기
          </Link>
        </div>
      </Shell>
    );
  }

  // ── 심사 대기 ──────────────────────────────────────────────
  if (state.kind === 'pending') {
    const badge = STATUS_LABEL[state.status] ?? { text: state.status, color: 'bg-gray-100 text-gray-800 border-gray-300' };
    return (
      <Shell>
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-orange-500" />
            <h1 className="text-2xl font-black">기업 가입 심사 중이에요</h1>
          </div>
          <div className={`border-2 px-4 py-2 inline-flex items-center gap-2 font-black text-sm mb-6 ${badge.color}`}>
            {badge.text}
          </div>
          <div className="flex justify-between border-b-2 border-dashed border-gray-200 pb-3 mb-6">
            <span className="font-bold text-gray-500 text-sm">신청 일시</span>
            <span className="font-black">{formatDate(state.createdAt, 'medium')}</span>
          </div>
          <p className="text-sm font-bold text-gray-500 mb-6">
            검토 완료 후 결과를 알림으로 안내해 드립니다.<br />승인되면 자동으로 기업 비즈니스 센터에 접근할 수 있어요.
          </p>
          <Link to="/" className="block w-full py-4 bg-black text-white text-center font-black border-2 border-black hover:bg-orange-500 hover:text-black transition-colors">
            메인으로 돌아가기
          </Link>
        </div>
      </Shell>
    );
  }

  // ── 신청 폼 (신규 / 보완요청 재제출) ──────────────────────
  return (
    <Shell>
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <Building2 className="w-6 h-6 text-purple-600" />
          <span className="font-black text-2xl tracking-tighter">기업 회원가입</span>
        </div>
        <p className="text-gray-500 font-bold">
          기업 정보를 등록하면 마스터 검토 후 비즈니스 센터가 열립니다.
        </p>
      </div>

      {state.kind === 'form' && state.note && (
        <div className="bg-red-50 border-2 border-red-300 p-4 mb-6">
          <p className="font-black text-sm text-red-700 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" /> 보완 요청
          </p>
          <p className="font-bold text-sm text-red-600 whitespace-pre-line">{state.note}</p>
        </div>
      )}

      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-5">
        <Field label="기업명" required>
          <input value={corpName} onChange={e => setCorpName(e.target.value)} placeholder="(주)라운드테이블"
            className="w-full border-2 border-black px-4 py-3 font-bold outline-none focus:border-purple-500 transition-colors" />
        </Field>
        <Field label="사업자등록번호" required>
          <input value={bizNumber} onChange={e => setBizNumber(e.target.value)} placeholder="000-00-00000"
            className="w-full border-2 border-black px-4 py-3 font-bold outline-none focus:border-purple-500 transition-colors" />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="담당자명" required>
            <input value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="홍길동"
              className="w-full border-2 border-black px-4 py-3 font-bold outline-none focus:border-purple-500 transition-colors" />
          </Field>
          <Field label="담당자 연락처">
            <input value={managerPhone} onChange={e => setManagerPhone(e.target.value)} placeholder="010-0000-0000"
              className="w-full border-2 border-black px-4 py-3 font-bold outline-none focus:border-purple-500 transition-colors" />
          </Field>
        </div>
        <Field label="웹사이트 (선택)">
          <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://"
            className="w-full border-2 border-black px-4 py-3 font-bold outline-none focus:border-purple-500 transition-colors" />
        </Field>
        <Field label="기업 소개 (선택)">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="사업 분야·규모 등"
            className="w-full border-2 border-black px-4 py-3 font-bold outline-none focus:border-purple-500 transition-colors resize-none" />
        </Field>
        <Field label="사업자등록증 (선택 · 최대 10MB)">
          <DocUpload userId={user!.id} value={docUrl} onChange={setDocUrl} />
        </Field>

        {errorMsg && (
          <p className="text-red-600 font-bold text-sm border border-red-300 bg-red-50 p-3">{errorMsg}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-purple-600 text-white font-black text-lg border-2 border-black hover:bg-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {submitting && <Loader className="w-5 h-5 animate-spin" />}
          {state.kind === 'form' && state.editId ? '수정하고 다시 제출' : '가입 신청하기'}
        </button>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 font-black text-xl hover:text-purple-600 transition-colors">
          <ArrowLeft className="w-5 h-5" /> 메인으로 돌아가기
        </Link>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-16">
        <div className="w-full max-w-lg">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-black text-sm">
        {label}{required && <span className="text-purple-600 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function DocUpload({ userId, value, onChange }: { userId: string; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    if (file.size > 10 * 1024 * 1024) { setError('최대 10MB까지 업로드 가능합니다.'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${userId}/corp_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('certification-docs').upload(path, file, { upsert: false });
    setUploading(false);
    if (upErr) { setError(upErr.message); return; }
    onChange(path);
  };

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="border-2 border-purple-300 bg-purple-50 p-3 flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2 min-w-0 font-bold text-sm text-purple-700 truncate">
            <Paperclip className="w-4 h-4 shrink-0" /> 첨부됨
          </span>
          <button onClick={() => onChange('')} className="p-1 hover:bg-purple-100 rounded shrink-0"><X className="w-4 h-4" /></button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full p-5 border-2 border-dashed border-gray-300 hover:border-purple-400 text-gray-500 hover:text-purple-600 flex flex-col items-center gap-1 transition-colors disabled:opacity-50 bg-gray-50"
        >
          {uploading ? <Loader className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /><span className="text-sm font-bold">클릭하여 업로드</span></>}
        </button>
      )}
      {error && <p className="text-red-500 text-sm font-bold">{error}</p>}
      <input ref={inputRef} type="file" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}
