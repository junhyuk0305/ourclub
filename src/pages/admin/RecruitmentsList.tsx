import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Loader, AlertCircle, ChevronRight, Calendar, Users, X,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { defaultFormSchema } from '../../types/recruitment';

interface Recruitment {
  id: string;
  title: string;
  generation: string | null;
  status: string;
  category: string | null;
  short_desc: string | null;
  deadline: string | null;
  created_at: string;
  form_version: number;
  pipeline_stages: string[];
  applicant_count: number;
  passed_count: number;
}

type StatusFilter = '전체' | '진행중' | '마감' | '임시저장';

export default function RecruitmentsList() {
  const { adminClubId } = useAdmin();
  const navigate = useNavigate();

  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('전체');

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
  }, [adminClubId]);

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
        ? await supabase.from('recruitment_applications').select('recruitment_id').in('recruitment_id', recs.map(r => r.id))
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
    if (filter !== '전체' && r.status !== filter) return false;
    if (search && !r.title.includes(search) && !(r.generation ?? '').includes(search)) return false;
    return true;
  });

  const totalApplicants = recruitments.reduce((s, r) => s + (r.applicant_count ?? 0), 0);
  const ongoingCount = recruitments.filter(r => r.status === '진행중').length;
  const closedCount = recruitments.filter(r => r.status === '마감').length;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader>
        <button
          onClick={() => setShowNewModal(true)}
          className="ml-4 px-4 py-2 border border-black bg-orange-500 hover:bg-orange-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none text-sm flex items-center gap-2 font-black"
        >
          <Plus className="w-4 h-4" /> 새 공고 만들기
        </button>
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8 flex flex-col gap-6">
            <div>
              <h1 className="text-3xl font-black">전체 채용</h1>
              <p className="text-gray-500 font-bold text-sm mt-1">동아리의 모든 채용 공고를 한 곳에서 관리하세요.</p>
            </div>

            {/* 요약 카드 3개 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SummaryCard label="총 지원자" value={totalApplicants} icon={<Users className="w-5 h-5" />} accent="bg-orange-50 border-orange-300" />
              <SummaryCard label="진행 중인 공고" value={ongoingCount} icon={<Calendar className="w-5 h-5" />} accent="bg-green-50 border-green-300" />
              <SummaryCard label="마감 공고" value={closedCount} icon={<Calendar className="w-5 h-5" />} accent="bg-gray-50 border-gray-300" />
            </div>

            {/* 필터 + 검색 */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {(['전체', '진행중', '마감', '임시저장'] as StatusFilter[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-4 py-2 text-sm font-black border-l border-black first:border-l-0 transition-colors ${
                      filter === s ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="공고 제목·기수 검색"
                  className="pl-9 pr-4 py-2 border border-black font-bold outline-none focus:border-orange-500 w-56 text-sm"
                />
              </div>
            </div>

            {/* 공고 리스트 (가로 바 형태) */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-orange-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-gray-300 p-12 text-center">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-bold text-gray-400">
                  {recruitments.length === 0 ? '아직 공고가 없습니다.' : '조건에 맞는 공고가 없습니다.'}
                </p>
                {recruitments.length === 0 && (
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="mt-4 px-4 py-2 bg-orange-500 text-white font-black text-sm hover:bg-orange-600"
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
      </div>

      {/* 새 공고 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowNewModal(false)}>
          <div className="bg-white border-2 border-black w-full max-w-xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col max-h-[92vh]" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-black bg-gray-50 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-black">새 공고 만들기</h3>
              <button onClick={() => setShowNewModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <Field label="채용 제목 *">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="예) 25기 정기 모집"
                  className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="기수">
                  <input value={newGeneration} onChange={e => setNewGeneration(e.target.value)}
                    placeholder="예) 25기"
                    className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
                </Field>
                <Field label="분야 / 카테고리">
                  <input value={newCategory} onChange={e => setNewCategory(e.target.value)}
                    placeholder="예) 개발 / 기획"
                    className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
                </Field>
              </div>
              <Field label="짧은 설명 (공고 카드)">
                <input value={newShortDesc} onChange={e => setNewShortDesc(e.target.value)}
                  placeholder="공고 카드에 표시될 한 줄"
                  className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
              </Field>
              <Field label="모집 대상">
                <input value={newTargets} onChange={e => setNewTargets(e.target.value)}
                  placeholder="예) 대학생 누구나 / 25학번 이상"
                  className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="주요 활동지">
                  <input value={newLocation} onChange={e => setNewLocation(e.target.value)}
                    placeholder="예) 서울 신촌"
                    className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
                </Field>
                <Field label="정기 활동일">
                  <input value={newRegularMeeting} onChange={e => setNewRegularMeeting(e.target.value)}
                    placeholder="예) 매주 수 19:00"
                    className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="모집 시작일시">
                  <input type="datetime-local" value={newStartDate} onChange={e => setNewStartDate(e.target.value)}
                    className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
                </Field>
                <Field label="모집 마감일시">
                  <input type="datetime-local" value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
                    className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
                </Field>
              </div>
              <Field label="공고 해시태그 (쉼표·공백 구분)">
                <input value={newHashtags} onChange={e => setNewHashtags(e.target.value)}
                  placeholder="#개발 #기획 #신촌"
                  className="w-full p-2.5 border border-black font-bold outline-none focus:border-orange-500 text-sm" />
              </Field>
              {createError && <p className="text-red-500 text-sm font-bold">{createError}</p>}
            </div>
            <div className="p-6 border-t border-black bg-gray-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowNewModal(false)}
                className="px-5 py-2 border border-black font-bold text-sm bg-white hover:bg-gray-100">
                취소
              </button>
              <button
                onClick={createRecruitment}
                disabled={creating || !newTitle.trim()}
                className="px-5 py-2 bg-black text-white font-black text-sm hover:bg-orange-500 hover:text-black disabled:opacity-40 flex items-center gap-2"
              >
                {creating && <Loader className="w-4 h-4 animate-spin" />}
                생성 후 편집
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="font-black text-xs block mb-1.5 text-gray-700">{label}</label>
      {children}
    </div>
  );
}

function SummaryCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <div className={`border-2 p-5 ${accent}`}>
      <div className="flex items-center gap-2 text-gray-600 font-bold text-sm mb-2">
        {icon}
        {label}
      </div>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

function RecruitmentRow({ recruitment, applicantCount }: { recruitment: Recruitment; applicantCount: number }) {
  const statusStyle = recruitment.status === '진행중'
    ? 'bg-green-100 border-green-400 text-green-700'
    : recruitment.status === '마감'
      ? 'bg-gray-100 border-gray-300 text-gray-700'
      : 'bg-yellow-100 border-yellow-400 text-yellow-700';

  const deadline = recruitment.deadline ? new Date(recruitment.deadline) : null;
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400000) : null;

  return (
    <Link
      to={`/admin/recruitments/${recruitment.id}?tab=applicants`}
      className="group bg-white border-2 border-black p-5 hover:bg-orange-50 transition-colors shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 flex items-center gap-5"
    >
      {/* 상태 */}
      <div className="shrink-0">
        <span className={`inline-block px-3 py-1.5 text-xs font-black border ${statusStyle}`}>
          {recruitment.status}
        </span>
      </div>

      {/* 메인 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-black text-lg truncate">{recruitment.title}</h3>
          {recruitment.generation && (
            <span className="text-xs font-bold text-gray-500 shrink-0">· {recruitment.generation}</span>
          )}
        </div>
        {recruitment.short_desc && (
          <p className="text-sm text-gray-600 font-medium truncate">{recruitment.short_desc}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 font-bold">
          {recruitment.category && <span>#{recruitment.category}</span>}
          {deadline && (
            <span>
              마감 {formatDate(deadline, 'monthDay')}
              {daysLeft !== null && recruitment.status === '진행중' && (
                <span className={`ml-1 ${daysLeft <= 3 ? 'text-red-500' : 'text-orange-500'}`}>
                  (D-{daysLeft >= 0 ? daysLeft : 0})
                </span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* 지원자 수 */}
      <div className="shrink-0 text-right">
        <p className="text-2xl font-black">{applicantCount}</p>
        <p className="text-xs text-gray-500 font-bold">지원자</p>
      </div>

      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 shrink-0" />
    </Link>
  );
}
