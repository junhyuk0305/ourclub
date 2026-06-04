import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, CheckCircle, Loader,
  Upload, FileText, X, Shield,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';

const CLUB_TYPES = ['IT/개발', '마케팅/기획', '창업', '문화/예술', '사회공헌', '스포츠', '기타'];

const STEPS = [
  { n: 1, label: '기본 정보' },
  { n: 2, label: '안전 서류' },
  { n: 3, label: '안전 설문' },
];

// ── 파일 업로드 필드 ────────────────────────────────────────────
interface UploadedFile { name: string; path: string }

interface FileFieldProps {
  label: string;
  hint: string;
  accept: string;
  value: UploadedFile | null;
  uploading: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}

function FileField({ label, hint, accept, value, uploading, onUpload, onRemove }: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await onUpload(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="font-black text-sm">
        {label} <span className="text-orange-500">*</span>
      </label>
      <p className="text-xs font-bold text-gray-400 mb-1">{hint}</p>

      {value ? (
        <div className="flex items-center gap-3 border-2 border-black bg-green-50 px-4 py-3">
          <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="font-bold text-sm flex-1 truncate">{value.name}</span>
          <button type="button" onClick={onRemove} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 border-2 border-dashed border-black px-4 py-4 font-bold text-sm hover:bg-orange-50 hover:border-orange-500 transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? '업로드 중...' : '파일 선택'}
        </button>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  );
}

// ── Yes/No 선택 버튼 ────────────────────────────────────────────
function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-3">
      {[true, false].map(v => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-3 font-black border-2 transition-colors ${
            value === v
              ? 'bg-black text-white border-black'
              : 'bg-white text-black border-black hover:bg-gray-100'
          }`}
        >
          {v ? '예' : '아니오'}
        </button>
      ))}
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────
export default function ClubRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [pageState, setPageState] = useState<'form' | 'success'>('form');
  // 보완요청 건 재제출 모드 (해당 신청서 id를 담으면 UPDATE 모드)
  const [editId, setEditId] = useState<string | null>(null);

  // Step 1
  const [clubName, setClubName] = useState('');
  const [clubType, setClubType] = useState('');
  const [oneLineDesc, setOneLineDesc] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');

  // Step 2 - 서류
  const [registrationDoc, setRegistrationDoc] = useState<UploadedFile | null>(null);
  const [activityDoc, setActivityDoc] = useState<UploadedFile | null>(null);
  const [memberListDoc, setMemberListDoc] = useState<UploadedFile | null>(null);
  const [representativeId, setRepresentativeId] = useState<UploadedFile | null>(null);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Step 3 - 설문
  const [memberCount, setMemberCount] = useState('');
  const [hasRegularMeeting, setHasRegularMeeting] = useState<boolean | null>(null);
  const [meetingLocation, setMeetingLocation] = useState('');
  const [hasMembershipFee, setHasMembershipFee] = useState<boolean | null>(null);
  const [membershipFeeAmount, setMembershipFeeAmount] = useState('');
  const [hasAccidentHistory, setHasAccidentHistory] = useState<boolean | null>(null);
  const [accidentDescription, setAccidentDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── 보완요청 건이 있으면 불러와 재제출 모드로 ────────────────
  useEffect(() => {
    if (!user) return;
    supabase
      .from('club_registration_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', '보완요청')
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setEditId(data.id);
        setClubName(data.club_name ?? '');
        setClubType(data.club_type ?? '');
        setOneLineDesc(data.one_line_desc ?? '');
        setDescription(data.description ?? '');
        setLocation(data.location ?? '');
        if (data.registration_doc_url) setRegistrationDoc({ name: '기존 제출 파일', path: data.registration_doc_url });
        if (data.activity_doc_url) setActivityDoc({ name: '기존 제출 파일', path: data.activity_doc_url });
        if (data.member_list_doc_url) setMemberListDoc({ name: '기존 제출 파일', path: data.member_list_doc_url });
        if (data.representative_id_url) setRepresentativeId({ name: '기존 제출 파일', path: data.representative_id_url });
        if (data.member_count != null) setMemberCount(String(data.member_count));
        setHasRegularMeeting(data.has_regular_meeting);
        setMeetingLocation(data.meeting_location ?? '');
        setHasMembershipFee(data.has_membership_fee);
        if (data.membership_fee_amount != null) setMembershipFeeAmount(String(data.membership_fee_amount));
        setHasAccidentHistory(data.has_accident_history);
        setAccidentDescription(data.accident_description ?? '');
      });
  }, [user]);

  // ── 파일 업로드 ──────────────────────────────────────────────
  const uploadFile = async (file: File, fieldKey: string): Promise<string> => {
    const ext = file.name.split('.').pop() ?? 'bin';
    const path = `${user!.id}/${fieldKey}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('certification-docs')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  };

  const makeUploader = (
    fieldKey: string,
    setter: (v: UploadedFile | null) => void,
  ) => async (file: File) => {
    setUploadingField(fieldKey);
    setErrorMsg('');
    try {
      const path = await uploadFile(file, fieldKey);
      setter({ name: file.name, path });
    } catch {
      setErrorMsg('파일 업로드에 실패했어요. 다시 시도해주세요.');
    }
    setUploadingField(null);
  };

  // ── 단계별 유효성 검사 ───────────────────────────────────────
  const validateStep1 = () => {
    if (!clubName.trim()) return '동아리 이름을 입력해주세요.';
    if (!clubType) return '동아리 유형을 선택해주세요.';
    if (!oneLineDesc.trim()) return '한 줄 소개를 입력해주세요.';
    return null;
  };

  const validateStep2 = () => {
    if (!registrationDoc) return '동아리 등록증을 첨부해주세요.';
    if (!activityDoc) return '활동 내역 자료를 첨부해주세요.';
    if (!memberListDoc) return '회원 명단을 첨부해주세요.';
    if (!representativeId) return '대표자 신분증 사본을 첨부해주세요.';
    return null;
  };

  const validateStep3 = () => {
    if (!memberCount || Number(memberCount) < 1) return '회원 수를 입력해주세요.';
    if (hasRegularMeeting === null) return '정기 모임 여부를 선택해주세요.';
    if (hasRegularMeeting && !meetingLocation.trim()) return '활동 장소를 입력해주세요.';
    if (hasMembershipFee === null) return '회비 여부를 선택해주세요.';
    if (hasAccidentHistory === null) return '안전 사고 이력 여부를 선택해주세요.';
    if (hasAccidentHistory && !accidentDescription.trim()) return '사고 이력 상세 내용을 입력해주세요.';
    return null;
  };

  const goNext = () => {
    setErrorMsg('');
    const err = step === 1 ? validateStep1() : validateStep2();
    if (err) { setErrorMsg(err); return; }
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    setErrorMsg('');
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  // ── 최종 제출 ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep3();
    if (err) { setErrorMsg(err); return; }

    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      club_name: clubName.trim(),
      club_type: clubType,
      one_line_desc: oneLineDesc.trim(),
      description: description.trim() || null,
      location: location.trim() || null,
      registration_doc_url: registrationDoc!.path,
      activity_doc_url: activityDoc!.path,
      member_list_doc_url: memberListDoc!.path,
      representative_id_url: representativeId!.path,
      member_count: Number(memberCount),
      has_regular_meeting: hasRegularMeeting,
      meeting_location: hasRegularMeeting ? meetingLocation.trim() : null,
      has_membership_fee: hasMembershipFee,
      membership_fee_amount: hasMembershipFee ? Number(membershipFeeAmount) || null : null,
      has_accident_history: hasAccidentHistory,
      accident_description: hasAccidentHistory ? accidentDescription.trim() : null,
    };

    // 재제출(보완요청 건): 상태를 검토대기로 되돌리고 심사 메모 초기화
    const { error } = editId
      ? await supabase
          .from('club_registration_requests')
          .update({ ...payload, status: '검토대기', reviewer_note: null, reviewed_at: null })
          .eq('id', editId)
      : await supabase
          .from('club_registration_requests')
          .insert({ user_id: user!.id, ...payload });

    setSubmitting(false);

    if (error) {
      setErrorMsg('제출 중 오류가 발생했어요. 다시 시도해주세요.');
      return;
    }

    setPageState('success');
  };

  // ── 완료 화면 ────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-lg">
          <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-center">
            <div className="w-16 h-16 bg-orange-100 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-black mb-3">{editId ? '재제출 완료!' : '등록 신청 완료!'}</h1>
            <p className="font-bold text-gray-500 mb-2">
              <span className="text-black font-black">{clubName}</span> {editId ? '보완 내용이 다시 접수됐어요.' : '등록 신청이 접수됐어요.'}
            </p>
            <p className="text-sm font-bold text-gray-400 mb-2">
              안전 인증 심사는 보통 <span className="text-black font-black">2~3주</span> 소요돼요.
            </p>
            <p className="text-sm font-bold text-gray-400 mb-8">
              심사 결과는 알림으로 안내되며, 승인 시 오렌지 배찌와 함께 운영 페이지가 열려요.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/"
                className="block w-full py-4 bg-black text-white font-black border-2 border-black hover:bg-orange-500 hover:text-black transition-colors"
              >
                메인으로 돌아가기
              </Link>
              <Link
                to="/clubs"
                className="block w-full py-4 bg-white text-black font-black border-2 border-black hover:bg-gray-100 transition-colors"
              >
                동아리 둘러보기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 폼 ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="p-6 max-w-2xl mx-auto w-full">
        <Link
          to="/club-setup"
          className="inline-flex items-center gap-2 font-black text-xl hover:text-orange-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> 돌아가기
        </Link>
      </header>

      <div className="flex-1 flex flex-col items-center px-6 pb-12">
        <div className="w-full max-w-2xl">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-black mb-2">{editId ? '보완 후 재제출' : '새 동아리 등록'}</h1>
            <p className="font-bold text-gray-500">
              {editId
                ? '담당자 요청 사항을 반영해 수정한 뒤 다시 제출해주세요.'
                : '안전 인증 심사를 통과하면 오렌지 배찌와 모든 운영 기능이 열려요.'}
            </p>
          </div>

          {/* 스텝 인디케이터 */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.n}>
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 border-4 border-black flex items-center justify-center font-black text-lg transition-colors ${
                    step > s.n ? 'bg-orange-500 text-white' : step === s.n ? 'bg-black text-white' : 'bg-white text-black'
                  }`}>
                    {step > s.n ? <CheckCircle className="w-5 h-5" /> : s.n}
                  </div>
                  <span className={`mt-1 text-xs font-black ${step === s.n ? 'text-black' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 border-t-4 border-dashed mb-5 transition-colors ${step > s.n ? 'border-orange-500' : 'border-gray-300'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {/* ── Step 1: 기본 정보 ─────────────────────────────── */}
            {step === 1 && (
              <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-5">
                <h2 className="font-black text-lg border-b-2 border-black pb-3">동아리 기본 정보</h2>

                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm">동아리 이름 <span className="text-orange-500">*</span></label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={e => setClubName(e.target.value)}
                    placeholder="예: 데브허슬러"
                    maxLength={50}
                    className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm">동아리 유형 <span className="text-orange-500">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CLUB_TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setClubType(t)}
                        className={`py-2 px-3 text-sm font-black border-2 transition-colors ${
                          clubType === t ? 'bg-black text-white border-black' : 'bg-white border-black hover:bg-gray-100'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm">
                    한 줄 소개 <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={oneLineDesc}
                    onChange={e => setOneLineDesc(e.target.value)}
                    placeholder="동아리를 한 문장으로 소개해주세요"
                    maxLength={60}
                    className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
                  />
                  <span className="text-xs font-bold text-gray-400 text-right">{oneLineDesc.length}/60</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm">동아리 소개 <span className="text-gray-400 font-bold">(선택)</span></label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="동아리의 활동, 목표, 분위기 등을 자유롭게 소개해주세요."
                    rows={4}
                    maxLength={500}
                    className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                  <span className="text-xs font-bold text-gray-400 text-right">{description.length}/500</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm">활동 지역 <span className="text-gray-400 font-bold">(선택)</span></label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="예: 서울 관악구, 부산 금정구"
                    maxLength={50}
                    className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* ── Step 2: 안전 서류 ─────────────────────────────── */}
            {step === 2 && (
              <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-5">
                <div className="border-b-2 border-black pb-3">
                  <h2 className="font-black text-lg">안전 인증 서류</h2>
                  <p className="text-sm font-bold text-gray-400 mt-1">
                    PDF, 이미지(JPG/PNG), 엑셀 파일을 첨부해주세요. 각 파일은 10MB 이하.
                  </p>
                </div>

                <FileField
                  label="동아리 등록증"
                  hint="학교 또는 기관에서 발급한 동아리 등록 확인 서류"
                  accept=".pdf,.jpg,.jpeg,.png"
                  value={registrationDoc}
                  uploading={uploadingField === 'registration'}
                  onUpload={makeUploader('registration', setRegistrationDoc)}
                  onRemove={() => setRegistrationDoc(null)}
                />

                <FileField
                  label="활동 내역 자료"
                  hint="최근 3개월 이상의 정기 활동 기록 (날짜·내용·참가 인원 포함)"
                  accept=".pdf,.jpg,.jpeg,.png"
                  value={activityDoc}
                  uploading={uploadingField === 'activity'}
                  onUpload={makeUploader('activity', setActivityDoc)}
                  onRemove={() => setActivityDoc(null)}
                />

                <FileField
                  label="회원 명단"
                  hint="현재 구성원 명단 (이름·소속 학교·역할 포함, 5인 이상)"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                  value={memberListDoc}
                  uploading={uploadingField === 'member_list'}
                  onUpload={makeUploader('member_list', setMemberListDoc)}
                  onRemove={() => setMemberListDoc(null)}
                />

                <FileField
                  label="대표자 신분증 사본"
                  hint="주민등록번호 뒷자리는 마스킹 처리 후 제출해주세요"
                  accept=".jpg,.jpeg,.png,.pdf"
                  value={representativeId}
                  uploading={uploadingField === 'representative_id'}
                  onUpload={makeUploader('representative_id', setRepresentativeId)}
                  onRemove={() => setRepresentativeId(null)}
                />

                <div className="bg-orange-50 border-2 border-orange-300 p-3 text-xs font-bold text-orange-700">
                  제출된 서류는 안전 인증 심사 목적으로만 사용되며, 심사 완료 후 안전하게 폐기됩니다.
                </div>
              </div>
            )}

            {/* ── Step 3: 안전 설문 ─────────────────────────────── */}
            {step === 3 && (
              <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-5">
                <div className="border-b-2 border-black pb-3">
                  <h2 className="font-black text-lg">안전 설문조사</h2>
                  <p className="text-sm font-bold text-gray-400 mt-1">
                    모든 항목에 솔직하게 답변해주세요.
                  </p>
                </div>

                {/* 회원 수 */}
                <div className="flex flex-col gap-1">
                  <label className="font-black text-sm">현재 회원 수 <span className="text-orange-500">*</span></label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={memberCount}
                      onChange={e => setMemberCount(e.target.value)}
                      placeholder="0"
                      min={1}
                      max={9999}
                      className="w-32 border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
                    />
                    <span className="font-black text-gray-500">명</span>
                  </div>
                </div>

                {/* 정기 모임 */}
                <div className="flex flex-col gap-2">
                  <label className="font-black text-sm">정기 모임을 진행하나요? <span className="text-orange-500">*</span></label>
                  <YesNo value={hasRegularMeeting} onChange={setHasRegularMeeting} />
                  {hasRegularMeeting && (
                    <input
                      type="text"
                      value={meetingLocation}
                      onChange={e => setMeetingLocation(e.target.value)}
                      placeholder="주요 활동 장소 (예: 서울대학교 공학관 101호)"
                      maxLength={100}
                      className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
                    />
                  )}
                </div>

                {/* 회비 */}
                <div className="flex flex-col gap-2">
                  <label className="font-black text-sm">회비를 받고 있나요? <span className="text-orange-500">*</span></label>
                  <YesNo value={hasMembershipFee} onChange={setHasMembershipFee} />
                  {hasMembershipFee && (
                    <div className="flex items-center gap-2">
                      <span className="font-black text-gray-500">월</span>
                      <input
                        type="number"
                        value={membershipFeeAmount}
                        onChange={e => setMembershipFeeAmount(e.target.value)}
                        placeholder="0"
                        min={0}
                        className="w-36 border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors"
                      />
                      <span className="font-black text-gray-500">원</span>
                    </div>
                  )}
                </div>

                {/* 사고 이력 */}
                <div className="flex flex-col gap-2">
                  <label className="font-black text-sm">
                    과거 안전 사고 이력이 있나요? <span className="text-orange-500">*</span>
                  </label>
                  <YesNo value={hasAccidentHistory} onChange={setHasAccidentHistory} />
                  {hasAccidentHistory && (
                    <textarea
                      value={accidentDescription}
                      onChange={e => setAccidentDescription(e.target.value)}
                      placeholder="사고 일시, 내용, 조치 결과를 구체적으로 설명해주세요."
                      rows={4}
                      maxLength={500}
                      className="border-2 border-black px-4 py-3 font-bold outline-none focus:border-orange-500 transition-colors resize-none"
                    />
                  )}
                </div>
              </div>
            )}

            {/* 에러 */}
            {errorMsg && (
              <p className="mt-4 text-red-600 font-bold text-sm border-2 border-red-300 bg-red-50 px-4 py-3">
                {errorMsg}
              </p>
            )}

            {/* 네비게이션 */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 py-4 bg-white font-black border-2 border-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> 이전
                </button>
              )}
              {step < 3 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={uploadingField !== null}
                  className="flex-1 py-4 bg-black text-white font-black border-2 border-black hover:bg-orange-500 hover:text-black transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  다음 <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-4 bg-orange-500 text-black font-black border-2 border-black hover:bg-black hover:text-orange-500 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader className="w-5 h-5 animate-spin" />}
                  <Shield className="w-5 h-5" />
                  {editId ? '보완 내용 재제출' : '안전 인증 신청 제출'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
