import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Loader, Clock, AlertTriangle, CheckCircle, ArrowLeft, Upload, Paperclip, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';
import { useCorp } from '../../contexts/CorpContext';

type State =
  | { kind: 'loading' }
  | { kind: 'form'; editId: string | null; note: string | null }
  | { kind: 'pending'; status: string; note: string | null; createdAt: string }
  | { kind: 'rejected'; note: string | null; createdAt: string }
  | { kind: 'submitted' };

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  '검토대기': { text: '검토 대기 중', color: 'bg-warn-bg text-warn-fg' },
  '검토중':   { text: '검토 진행 중', color: 'bg-info-bg text-info-fg' },
  '보완요청': { text: '보완 요청됨', color: 'bg-bad-bg text-bad-fg' },
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
  const [agreed, setAgreed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const check = useCallback(async () => {
    if (!user) return;
    // 이미 기업 담당자면 대시보드로
    if (isCorpUser) { navigate('/corp/dashboard', { replace: true }); return; }

    // 최근 신청 1건을 상태 무관하게 조회 → 거절 포함 모든 분기 처리
    const { data: req } = await supabase
      .from('corp_registration_requests')
      .select('id, corp_name, business_number, manager_name, manager_phone, website, description, business_doc_url, status, reviewer_note, created_at, b2b_terms_agreed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
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
        setAgreed(!!req.b2b_terms_agreed_at);
        setState({ kind: 'form', editId: req.id, note: req.reviewer_note });
        return;
      }
      if (req.status === '거절') {
        // 거절: 사유 안내 후 새 신청 유도(차단하지 않음)
        setState({ kind: 'rejected', note: req.reviewer_note, createdAt: req.created_at });
        return;
      }
      if (IN_PROGRESS.includes(req.status)) {
        setState({ kind: 'pending', status: req.status, note: req.reviewer_note, createdAt: req.created_at });
        return;
      }
      // '승인' 등 그 외 상태: 승인이면 isCorpUser=true로 위에서 이미 대시보드 이동. 여기 도달은 동기화 지연 → 대기 화면.
      setState({ kind: 'pending', status: req.status, note: req.reviewer_note, createdAt: req.created_at });
      return;
    }

    // 신규 폼 — 담당자 기본값 프리필
    setManagerName(profile?.name ?? '');
    setManagerPhone(profile?.phone ?? '');
    setState({ kind: 'form', editId: null, note: null });
  }, [user, isCorpUser, profile, navigate]);

  // 거절 후 재신청 — 빈 폼으로 새로 시작
  const handleReapply = () => {
    setCorpName('');
    setBizNumber('');
    setWebsite('');
    setDescription('');
    setDocUrl('');
    setManagerName(profile?.name ?? '');
    setManagerPhone(profile?.phone ?? '');
    setAgreed(false);
    setState({ kind: 'form', editId: null, note: null });
  };

  useEffect(() => { if (!corpLoading) check(); }, [corpLoading, check]);

  const handleSubmit = async () => {
    if (!user) return;
    setErrorMsg('');
    if (!corpName.trim() || !bizNumber.trim() || !managerName.trim()) {
      setErrorMsg('기업명·사업자등록번호·담당자명은 필수입니다.');
      return;
    }
    if (!agreed) {
      setErrorMsg('B2B 거래약관 및 중개·정산 약정에 동의해야 신청할 수 있습니다.');
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
      b2b_terms_agreed_at: new Date().toISOString(),
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
    return <LoadingScreen />;
  }

  // ── 제출 완료 ──────────────────────────────────────────────
  if (state.kind === 'submitted') {
    return (
      <Shell>
        <div className="bg-white border border-sand-200 rounded-card p-8 shadow-soft flex flex-col items-center gap-4 py-10 text-center">
          <CheckCircle className="w-14 h-14 text-ok-fg" strokeWidth={2.5} />
          <p className="font-black text-2xl text-ink">기업 가입 신청이 접수됐어요</p>
          <p className="font-medium text-sand-600 text-sm">
            마스터 검토 후 결과를 알림으로 안내해 드립니다.<br />승인되면 기업 비즈니스 센터에 접근할 수 있어요.
          </p>
          <Link to="/" className="mt-4 px-8 py-3 btn-grad text-white font-bold rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all">
            메인으로 돌아가기
          </Link>
        </div>
      </Shell>
    );
  }

  // ── 심사 대기 ──────────────────────────────────────────────
  if (state.kind === 'pending') {
    const badge = STATUS_LABEL[state.status] ?? { text: state.status, color: 'bg-off-bg text-off-fg' };
    return (
      <Shell>
        <div className="bg-white border border-sand-200 rounded-card p-8 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-brand" strokeWidth={2.5} />
            <h1 className="text-2xl font-black text-ink">기업 가입 심사 중이에요</h1>
          </div>
          <div className={`rounded-ctl px-4 py-2 inline-flex items-center gap-2 font-bold text-sm mb-6 ${badge.color}`}>
            {badge.text}
          </div>
          <div className="flex justify-between border-b border-sand-200 pb-3 mb-6">
            <span className="font-medium text-sand-500 text-sm">신청 일시</span>
            <span className="font-bold text-ink">{formatDate(state.createdAt, 'medium')}</span>
          </div>
          <p className="text-sm font-medium text-sand-500 mb-6">
            검토 완료 후 결과를 알림으로 안내해 드립니다.<br />승인되면 자동으로 기업 비즈니스 센터에 접근할 수 있어요.
          </p>
          <Link to="/" className="block w-full py-4 btn-grad text-white text-center font-bold rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all">
            메인으로 돌아가기
          </Link>
        </div>
      </Shell>
    );
  }

  // ── 거절 ──────────────────────────────────────────────────
  if (state.kind === 'rejected') {
    return (
      <Shell>
        <div className="bg-white border border-sand-200 rounded-card p-8 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-8 h-8 text-bad-fg" strokeWidth={2.5} />
            <h1 className="text-2xl font-black text-ink">기업 가입이 반려됐어요</h1>
          </div>
          {state.note && (
            <div className="bg-bad-bg rounded-card p-4 mb-6">
              <p className="font-bold text-sm text-bad-fg mb-1">반려 사유</p>
              <p className="font-medium text-sm text-bad-fg whitespace-pre-line">{state.note}</p>
            </div>
          )}
          <p className="text-sm font-medium text-sand-500 mb-6">
            내용을 보완해 다시 신청할 수 있어요. (신청일 {formatDate(state.createdAt, 'medium')})
          </p>
          <button
            onClick={handleReapply}
            className="block w-full py-4 btn-grad text-white text-center font-bold rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all"
          >
            다시 신청하기
          </button>
          <Link to="/" className="block w-full mt-3 py-3 text-center font-bold text-sand-500 hover:text-ink transition-colors">
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
          <Building2 className="w-6 h-6 text-brand" strokeWidth={2.5} />
          <span className="font-black text-2xl tracking-tighter text-ink">기업 회원가입</span>
        </div>
        <p className="text-sand-600 font-medium">
          기업 정보를 등록하면 마스터 검토 후 비즈니스 센터가 열립니다.
        </p>
      </div>

      {state.kind === 'form' && state.note && (
        <div className="bg-bad-bg rounded-card p-4 mb-6">
          <p className="font-bold text-sm text-bad-fg mb-1 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" strokeWidth={2.5} /> 보완 요청
          </p>
          <p className="font-medium text-sm text-bad-fg whitespace-pre-line">{state.note}</p>
        </div>
      )}

      <div className="bg-white border border-sand-200 rounded-card p-8 shadow-soft flex flex-col gap-5">
        <Field label="기업명" required>
          <input value={corpName} onChange={e => setCorpName(e.target.value)} placeholder="(주)라운드테이블"
            className="field w-full border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink placeholder:text-sand-400 transition-colors" />
        </Field>
        <Field label="사업자등록번호" required>
          <input value={bizNumber} onChange={e => setBizNumber(e.target.value)} placeholder="000-00-00000"
            className="field w-full border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink placeholder:text-sand-400 transition-colors" />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="담당자명" required>
            <input value={managerName} onChange={e => setManagerName(e.target.value)} placeholder="홍길동"
              className="field w-full border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink placeholder:text-sand-400 transition-colors" />
          </Field>
          <Field label="담당자 연락처">
            <input value={managerPhone} onChange={e => setManagerPhone(e.target.value)} placeholder="010-0000-0000"
              className="field w-full border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink placeholder:text-sand-400 transition-colors" />
          </Field>
        </div>
        <Field label="웹사이트 (선택)">
          <input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://"
            className="field w-full border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink placeholder:text-sand-400 transition-colors" />
        </Field>
        <Field label="기업 소개 (선택)">
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="사업 분야·규모 등"
            className="field w-full border border-sand-300 rounded-ctl px-4 py-3 font-medium text-ink placeholder:text-sand-400 transition-colors resize-none" />
        </Field>
        <Field label="사업자등록증 (선택 · 최대 10MB)">
          <DocUpload userId={user!.id} value={docUrl} onChange={setDocUrl} />
        </Field>

        <label className="flex items-start gap-3 border border-sand-200 rounded-card bg-sand-50 p-4 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            className="mt-0.5 w-5 h-5 shrink-0 accent-brand"
          />
          <span className="font-medium text-sm text-sand-600 leading-relaxed">
            <Link to="/b2b-terms" target="_blank" rel="noopener noreferrer" className="text-brand font-bold underline hover:text-ink">B2B 프로젝트 거래약관</Link>
            {' 및 '}
            <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-brand font-bold underline hover:text-ink">서비스 이용약관</Link>
            을 확인했으며, 중개·정산 약정(중개수수료 등)에 동의합니다. <span className="text-brand font-bold">(필수)</span>
          </span>
        </label>

        {errorMsg && (
          <p className="text-bad-fg font-bold text-sm bg-bad-bg rounded-ctl p-3">{errorMsg}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 btn-grad text-white font-bold text-lg rounded-ctl shadow-btn hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-sand-50 flex flex-col font-sans">
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 font-black text-xl text-ink hover:text-brand transition-colors">
          <ArrowLeft className="w-5 h-5" strokeWidth={2.5} /> 메인으로 돌아가기
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
      <label className="font-bold text-sm text-ink">
        {label}{required && <span className="text-brand ml-1">*</span>}
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
        <div className="bg-brand-tint rounded-ctl p-3 flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2 min-w-0 font-bold text-sm text-brand-dark truncate">
            <Paperclip className="w-4 h-4 shrink-0" strokeWidth={2.5} /> 첨부됨
          </span>
          <button onClick={() => onChange('')} className="p-1 hover:bg-white rounded-ctl shrink-0"><X className="w-4 h-4" strokeWidth={2.5} /></button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full p-5 border border-dashed border-sand-300 rounded-ctl hover:border-brand text-sand-500 hover:text-brand flex flex-col items-center gap-1 transition-colors disabled:opacity-50 bg-sand-50"
        >
          {uploading ? <Loader className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" strokeWidth={2.5} /><span className="text-sm font-bold">클릭하여 업로드</span></>}
        </button>
      )}
      {error && <p className="text-bad-fg text-sm font-bold">{error}</p>}
      <input ref={inputRef} type="file" className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }} />
    </div>
  );
}
