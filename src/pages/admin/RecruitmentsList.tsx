import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Loader, AlertCircle, ChevronRight, Calendar, Users, X, Save, Eye,
} from 'lucide-react';
import { AdminHeaderPortal } from './AdminLayout';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { fetchAllIn } from '../../lib/fetchAll';
import { formatDate } from '../../lib/format';
import { defaultFormSchema, deriveRecruitStatus, mergeRecruitPage, type RecruitPageSettings, type RecruitmentRow } from '../../types/recruitment';
import { useToast } from '../../hooks/useToast';

const TAGLINE_MAX = 120;

type Recruitment =
  Pick<RecruitmentRow,
    'id' | 'title' | 'generation' | 'category' | 'short_desc' | 'deadline'
    | 'created_at' | 'form_version' | 'applicant_count' | 'passed_count'>
  & { status: string; pipeline_stages: string[] };

type StatusFilter = '전체' | '진행중' | '마감' | '임시저장';

export default function RecruitmentsList() {
  const { adminClubId, adminClub } = useAdmin();
  const navigate = useNavigate();
  const { toast, show: showToast } = useToast();

  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('전체');

  // 모집 메인 페이지 설정 — 운영진이 손볼 항목은 태그라인 한 줄뿐 (구 모집 메인 페이지 제작 흡수)
  const [pageSettings, setPageSettings] = useState<RecruitPageSettings | null>(null);
  const [tagline, setTagline] = useState('');
  const [savingTagline, setSavingTagline] = useState(false);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGeneration, setNewGeneration] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newShortDesc, setNewShortDesc] = useState('');
  const [newTargets, setNewTargets] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newRegularMeeting, setNewRegularMeeting] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newHashtags, setNewHashtags] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    if (!adminClubId) return;
    load();
    (async () => {
      const { data } = await supabase.from('clubs').select('recruit_page').eq('id', adminClubId).single();
      const merged = mergeRecruitPage((data as { recruit_page: unknown } | null)?.recruit_page);
      setPageSettings(merged);
      setTagline(merged.tagline);
    })();
  }, [adminClubId]);

  const saveTagline = async () => {
    if (!adminClubId || !pageSettings) return;
    setSavingTagline(true);
    const next = { ...pageSettings, tagline: tagline.trim() };
    const { data, error } = await supabase
      .from('clubs')
      .update({ recruit_page: next })
      .eq('id', adminClubId)
      .select('id');
    setSavingTagline(false);
    if (error) { showToast(`저장 실패: ${error.message}`, false); return; }
    if (!data || data.length === 0) { showToast('저장 권한이 없거나 동아리가 선택되지 않았습니다.', false); return; }
    setPageSettings(next);
    showToast('모집 페이지 태그라인이 저장되었습니다.', true);
  };

  const load = async () => {
    if (!adminClubId) return;
    setLoading(true);
    // recruitment_with_counts view를 사용해 한 번에 집계 (Step 7)
    // view가 없으면 fallback으로 일반 테이블 + 별도 카운트 쿼리
    const { data, error } = await supabase
      .from('recruitment_with_counts')
      .select('id, title, generation, status, category, short_desc, deadline, created_at, form_version, pipeline_stages, applicant_count, passed_count')
      .eq('club_id', adminClubId)
      .order('created_at', { ascending: false });

    if (error && /recruitment_with_counts/.test(error.message)) {
      console.warn('[RecruitmentsList] view 미적용 — fallback. 마이그레이션 20260517400000 적용 필요.');
      const { data: raw } = await supabase
        .from('recruitments')
        .select('id, title, generation, status, category, short_desc, deadline, created_at, form_version, pipeline_stages')
        .eq('club_id', adminClubId)
        .order('created_at', { ascending: false });
      const recs = (raw as Omit<Recruitment, 'applicant_count' | 'passed_count'>[] | null) ?? [];
      const { data: apps } = recs.length > 0
        ? await fetchAllIn<{ recruitment_id: string }>(recs.map(r => r.id), (chunk, from, to) =>
            supabase.from('recruitment_applications').select('recruitment_id').in('recruitment_id', chunk).range(from, to))
        : { data: [] };
      const tally: Record<string, number> = {};
      ((apps as { recruitment_id: string }[] | null) ?? []).forEach(a => {
        tally[a.recruitment_id] = (tally[a.recruitment_id] ?? 0) + 1;
      });
      setRecruitments(recs.map(r => ({ ...r, applicant_count: tally[r.id] ?? 0, passed_count: 0 })));
      setLoading(false);
      return;
    }
    setRecruitments((data as Recruitment[] | null) ?? []);
    setLoading(false);
  };

  const createRecruitment = async () => {
    if (!adminClubId || !newTitle.trim()) {
      setCreateError('공고 제목은 필수입니다.');
      return;
    }
    setCreating(true);
    setCreateError('');
    const hashtags = newHashtags
      .split(/[\s,]+/)
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    const { data, error } = await supabase
      .from('recruitments')
      .insert({
        club_id: adminClubId,
        title: newTitle.trim(),
        generation: newGeneration.trim() || null,
        category: newCategory.trim() || null,
        short_desc: newShortDesc.trim() || null,
        targets: newTargets.trim() || null,
        location: newLocation.trim() || null,
        regular_meeting: newRegularMeeting.trim() || null,
        recruit_start_date: newStartDate || null,
        deadline: newDeadline || null,
        hashtags,
        form_schema: defaultFormSchema(),
        pipeline_stages: ['서류', '인터뷰', '합격'],
        form_version: 0,
        status: '임시저장',
      })
      .select()
      .single();

    setCreating(false);
    if (error || !data) {
      setCreateError(`생성 실패: ${error?.message ?? ''}`);
      return;
    }
    navigate(`/admin/recruitments/${data.id}?tab=info`);
  };

  const filtered = recruitments.filter(r => {
    if (filter !== '전체' && deriveRecruitStatus(r) !== filter) return false;
    if (search && !r.title.includes(search) && !(r.generation ?? '').includes(search)) return false;
    return true;
  });

  const totalApplicants = recruitments.reduce((s, r) => s + (r.applicant_count ?? 0), 0);
  const ongoingCount = recruitments.filter(r => deriveRecruitStatus(r) === '진행중').length;
  const closedCount = recruitments.filter(r => deriveRecruitStatus(r) === '마감').length;

  return (
    <>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8 flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-black text-ink">전체 모집</h1>
              <p className="text-sand-500 font-bold text-sm mt-1">동아리의 모든 모집 공고를 한 곳에서 관리하세요.</p>
            </div>

            {/* 모집 메인 페이지 태그라인 — 공고·후기는 자동 표시되며, 운영진이 설정할 항목은 태그라인 한 줄뿐 */}
            <div className="bg-white border border-sand-200 rounded-card shadow-soft p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="font-black text-base text-ink">모집 페이지 태그라인</h2>
                  <p className="text-xs text-sand-500 font-bold mt-0.5">모집 페이지 상단에 표시될 한 줄. 비워두면 동아리 한 줄 소개가 대신 표시됩니다.</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {adminClub?.slug && (
                    <Link
                      to={`/clubs/${adminClub.slug}/recruit?preview=1`}
                      target="_blank"
                      className="px-3 py-2 rounded-ctl border border-sand-300 bg-white hover:bg-sand-50 transition-colors text-xs font-bold flex items-center gap-1.5 text-ink"
                    >
                      <Eye className="w-3.5 h-3.5" strokeWidth={2.5} /> 미리보기
                    </Link>
                  )}
                  <button
                    onClick={saveTagline}
                    disabled={savingTagline || pageSettings === null}
                    className="px-4 py-2 rounded-ctl btn-grad text-white shadow-btn transition-all text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingTagline ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" strokeWidth={2.5} />}
                    저장
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  value={tagline}
                  onChange={e => setTagline(e.target.value.slice(0, TAGLINE_MAX))}
                  placeholder="예) 함께 성장할 동료를 찾습니다"
                  className="field flex-1 p-2.5 border border-sand-300 rounded-ctl font-bold text-sm outline-none"
                />
                <span className="text-xs font-bold text-sand-400 shrink-0">{tagline.length}/{TAGLINE_MAX}</span>
              </div>
            </div>

            {/* 요약 카드 3개 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard label="총 지원자" value={totalApplicants} icon={<Users className="w-5 h-5" strokeWidth={2.5} />} accent="bg-brand-tint text-brand" />
              <SummaryCard label="진행 중인 공고" value={ongoingCount} icon={<Calendar className="w-5 h-5" strokeWidth={2.5} />} accent="bg-ok-bg text-ok-fg" />
              <SummaryCard label="마감 공고" value={closedCount} icon={<Calendar className="w-5 h-5" strokeWidth={2.5} />} accent="bg-off-bg text-off-fg" />
            </div>

            {/* 필터 + 검색 */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex gap-1 p-1 bg-sand-100 rounded-ctl">
                {(['전체', '진행중', '마감', '임시저장'] as StatusFilter[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-4 py-2 text-sm font-bold rounded-ctl transition-all ${
                      filter === s ? 'bg-white text-ink shadow-soft' : 'text-sand-500 hover:text-ink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400" strokeWidth={2.5} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="공고 제목·기수 검색"
                  className="field pl-9 pr-4 py-2 border border-sand-300 rounded-ctl font-bold outline-none w-56 text-sm"
                />
              </div>
            </div>

            {/* 공고 리스트 (가로 바 형태) */}
            {loading ? (
              <LoadingScreen />
            ) : filtered.length === 0 ? (
              <div className="bg-white border border-dashed border-sand-300 rounded-card p-12 text-center">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-sand-300" strokeWidth={2.5} />
                <p className="font-bold text-sand-400">
                  {recruitments.length === 0 ? '아직 공고가 없습니다.' : '조건에 맞는 공고가 없습니다.'}
                </p>
                {recruitments.length === 0 && (
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="mt-4 px-4 py-2 rounded-ctl btn-grad text-white shadow-btn font-bold text-sm"
                  >
                    첫 공고 만들기
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map(r => (
                  <RecruitmentRow
                    key={r.id}
                    recruitment={r}
                    applicantCount={r.applicant_count ?? 0}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

      <AdminHeaderPortal>
        <button
          onClick={() => setShowNewModal(true)}
          className="ml-4 px-4 py-2 rounded-ctl btn-grad text-white shadow-btn hover:-translate-y-0.5 transition-all text-sm flex items-center gap-2 font-bold"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} /> 새 공고 만들기
        </button>
      </AdminHeaderPortal>

      {/* 새 공고 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4" onClick={() => setShowNewModal(false)}>
          <div className="bg-white border border-sand-200 rounded-card w-full max-w-xl shadow-soft-lg flex flex-col max-h-[92vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 btn-grad text-white flex items-center justify-between shrink-0">
              <h3 className="text-xl font-black">새 공고 만들기</h3>
              <button onClick={() => setShowNewModal(false)} className="opacity-80 hover:opacity-100 transition-opacity"><X className="w-5 h-5" strokeWidth={2.5} /></button>
            </div>
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <Field label="모집 제목 *">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="예) 25기 정기 모집"
                  className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="기수">
                  <input value={newGeneration} onChange={e => setNewGeneration(e.target.value)}
                    placeholder="예) 25기"
                    className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm" />
                </Field>
                <Field label="분야 / 카테고리">
                  <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    placeholder="예) 개발 / 기획"
                    className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm" />
                </Field>
              </div>
              <Field label="짧은 설명 (공고 카드)">
                <input value={newShortDesc} onChange={e => setNewShortDesc(e.target.value)}
                  placeholder="공고 카드에 표시될 한 줄"
                  className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm" />
              </Field>
              <Field label="모집 대상">
                <input value={newTargets} onChange={e => setNewTargets(e.target.value)}
                  placeholder="예) 대학생 누구나 / 25학번 이상"
                  className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="주요 활동지">
                  <input value={newLocation} onChange={e => setNewLocation(e.target.value)}
                    placeholder="예) 서울 신촌"
                    className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm" />
                </Field>
                <Field label="정기 활동일">
                  <input value={newRegularMeeting} onChange={e => setNewRegularMeeting(e.target.value)}
                    placeholder="예) 매주 수 19:00"
                    className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="모집 시작일시">
                  <input type="datetime-local" value={newStartDate} onChange={e => setNewStartDate(e.target.value)}
                    className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm" />
                </Field>
                <Field label="모집 마감일시">
                  <input type="datetime-local" value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
                    className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm" />
                </Field>
              </div>
              <Field label="공고 해시태그 (쉼표·공백 구분)">
                <input value={newHashtags} onChange={e => setNewHashtags(e.target.value)}
                  placeholder="#개발 #기획 #신촌"
                  className="field w-full p-2.5 border border-sand-300 rounded-ctl font-bold outline-none text-sm" />
              </Field>
              {createError && <p className="text-red-500 text-sm font-bold">{createError}</p>}
            </div>
            <div className="p-6 border-t border-sand-200 bg-sand-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowNewModal(false)}
                className="px-5 py-2 rounded-ctl border border-sand-300 font-bold text-sm bg-white text-ink hover:bg-sand-50">
                취소
              </button>
              <button
                onClick={createRecruitment}
                disabled={creating || !newTitle.trim()}
                className="px-5 py-2 rounded-ctl btn-grad text-white shadow-btn font-bold text-sm disabled:opacity-40 flex items-center gap-2"
              >
                {creating && <Loader className="w-4 h-4 animate-spin" />}
                생성 후 편집
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-card font-bold flex items-center gap-2 shadow-soft-lg ${toast.ok ? 'bg-ink text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-bold text-xs block mb-1.5 text-sand-600">{label}</label>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <div className="bg-white border border-sand-200 rounded-card shadow-soft p-5">
      <div className={`inline-flex items-center gap-2 font-bold text-sm mb-2 px-2.5 py-1 rounded-ctl ${accent}`}>
        {icon}
        {label}
      </div>
      <p className="text-3xl font-black text-ink">{value}</p>
    </div>
  );
}

function RecruitmentRow({ recruitment, applicantCount }: { recruitment: Recruitment; applicantCount: number }) {
  const derivedStatus = deriveRecruitStatus(recruitment);
  const statusStyle = derivedStatus === '진행중'
    ? 'bg-ok-bg text-ok-fg'
    : derivedStatus === '마감'
      ? 'bg-off-bg text-off-fg'
      : 'bg-warn-bg text-warn-fg';

  const deadline = recruitment.deadline ? new Date(recruitment.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;

  return (
    <Link
      to={`/admin/recruitments/${recruitment.id}?tab=applicants`}
      className="group bg-white border border-sand-200 rounded-card p-5 shadow-soft hover:shadow-soft-lg hover:-translate-y-1 transition-all flex items-center gap-5"
    >
      {/* 상태 */}
      <div className="shrink-0">
        <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-ctl ${statusStyle}`}>
          {derivedStatus}
        </span>
      </div>

      {/* 메인 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-black text-lg truncate text-ink">{recruitment.title}</h3>
          {recruitment.generation && (
            <span className="text-xs font-bold text-sand-500 shrink-0">· {recruitment.generation}</span>
          )}
        </div>
        {recruitment.short_desc && (
          <p className="text-sm text-sand-600 font-medium truncate">{recruitment.short_desc}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-sand-400 font-bold">
          {recruitment.category && <span>#{recruitment.category}</span>}
          {deadline && (
            <span>
              마감 {formatDate(deadline, 'monthDay')}
              {daysLeft !== null && derivedStatus === '진행중' && (
                <span className={`ml-1 ${daysLeft <= 3 ? 'text-bad-fg' : 'text-brand'}`}>
                  (D-{daysLeft >= 0 ? daysLeft : 0})
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* 지원자 수 */}
      <div className="shrink-0 text-right">
        <p className="text-2xl font-black text-ink">{applicantCount}</p>
        <p className="text-xs text-sand-500 font-bold">지원자</p>
      </div>

      <ChevronRight className="w-5 h-5 text-sand-300 group-hover:text-brand shrink-0" strokeWidth={2.5} />
    </Link>
  );
}
