import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Users, Loader, AlertCircle, Clock, Briefcase, X, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { MarkdownViewer } from '../../components/ui/MarkdownViewer';

interface Club {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo_url: string | null;
  one_line_desc: string | null;
  theme_color: string;
  is_certified: boolean;
}

interface Recruitment {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  short_desc: string | null;
  generation: string | null;
  deadline: string | null;
  pipeline_stages: string[] | null;
  max_applicants: number | null;
}

export default function ClubRecruit() {
  const { id: slug } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [recruitments, setRecruitments] = useState<Recruitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jdModal, setJdModal] = useState<Recruitment | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);

      const { data: clubData, error: clubErr } = await supabase
        .from('clubs')
        .select('id, name, slug, type, logo_url, one_line_desc, theme_color, is_certified')
        .eq('slug', slug)
        .single();

      if (clubErr || !clubData) {
        setError('동아리를 찾을 수 없습니다.');
        setLoading(false);
        return;
      }
      setClub(clubData as Club);

      // '진행중' + (구버전 호환) '모집중' 모두 조회
      const { data: recruitData } = await supabase
        .from('recruitments')
        .select('id, title, category, description, short_desc, generation, deadline, pipeline_stages, max_applicants')
        .eq('club_id', clubData.id)
        .in('status', ['진행중', '모집중'])
        .order('created_at', { ascending: false })
        .limit(3);

      setRecruitments((recruitData as Recruitment[]) ?? []);
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-3">{error ?? '페이지를 찾을 수 없습니다.'}</h2>
          <Link to="/clubs" className="text-orange-500 font-bold hover:underline">← 동아리 목록으로</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* 상단 클럽 헤더바 */}
      <div className="bg-black text-white border-b-4 border-orange-500">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            to={`/clubs/${slug}`}
            className="p-2 hover:bg-white/10 rounded transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {club.logo_url ? (
            <img
              src={club.logo_url}
              alt={club.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-white shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center font-black text-black shrink-0">
              {club.name[0]}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="font-black text-base leading-tight truncate">{club.name}</h1>
            <p className="text-xs text-gray-400 font-bold">{club.type}</p>
          </div>

          {club.is_certified && (
            <span className="ml-auto shrink-0 text-xs font-black bg-orange-500 text-black px-3 py-1 border border-orange-400">
              ✓ 인증 동아리
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* 히어로 섹션 */}
        <div className="mb-14">
          <p className="text-orange-500 font-black text-xs mb-3 tracking-[0.2em] uppercase">
            Careers at {club.name}
          </p>
          <h2 className="text-4xl md:text-5xl font-black mb-5 leading-tight tracking-tight">
            함께 성장할<br />인재를 찾습니다.
          </h2>
          {club.one_line_desc && (
            <p className="text-gray-600 font-bold text-lg max-w-2xl leading-relaxed">
              {club.one_line_desc}
            </p>
          )}
        </div>

        {/* 채용 공고 섹션 */}
        {recruitments.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-300 p-16 text-center">
            <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-gray-400 mb-2">
              현재 진행 중인 모집이 없습니다
            </h3>
            <p className="text-gray-400 font-bold text-sm">
              새로운 채용 공고가 올라오면 이 페이지에서 확인하실 수 있습니다.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-xs font-black text-gray-500 tracking-widest uppercase">
                진행 중인 채용 공고 · {recruitments.length}개
              </p>
              <p className="text-xs text-gray-400 font-bold">최대 3개 동시 진행</p>
            </div>

            <div className="flex flex-col gap-5">
              {recruitments.map(r => (
                <RecruitCard key={r.id} recruitment={r} slug={slug!} onOpenJD={() => setJdModal(r)} />
              ))}
            </div>
          </>
        )}

        {/* 하단 */}
        <div className="mt-16 pt-8 border-t border-gray-200 flex items-center justify-between flex-wrap gap-4">
          <Link
            to={`/clubs/${slug}`}
            className="text-gray-500 font-bold hover:text-black transition-colors flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> {club.name} 소개 보기
          </Link>
          <p className="text-xs text-gray-400 font-bold">
            Powered by OurClub
          </p>
        </div>
      </div>

      {/* 직무 소개 모달 (JD Modal) */}
      {jdModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setJdModal(null)}
        >
          <div
            className="bg-white border-2 border-black w-full max-w-4xl max-h-[92vh] flex flex-col shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
            onClick={e => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="px-8 py-5 border-b-2 border-black bg-gray-50 flex items-start justify-between gap-4 shrink-0">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {jdModal.category && (
                    <span className="px-2.5 py-1 bg-orange-100 border border-orange-300 text-orange-700 text-xs font-black">
                      {jdModal.category}
                    </span>
                  )}
                  {jdModal.generation && (
                    <span className="px-2.5 py-1 bg-gray-100 border border-gray-300 text-gray-600 text-xs font-bold">
                      {jdModal.generation}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-black leading-tight">{jdModal.title}</h2>
                {jdModal.deadline && (
                  <p className="text-sm font-bold text-gray-500 mt-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {(() => {
                      const d = new Date(jdModal.deadline);
                      const daysLeft = Math.ceil((d.getTime() - Date.now()) / 86400000);
                      return daysLeft <= 0 ? '마감됨' : daysLeft === 0 ? '오늘 마감' : `D-${daysLeft} · ${d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`;
                    })()}
                  </p>
                )}
              </div>
              <button onClick={() => setJdModal(null)} className="p-1 hover:bg-gray-200 rounded shrink-0 mt-0.5">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 모집 요강 내용 */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
              {jdModal.description ? (
                <MarkdownViewer content={jdModal.description} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-10 h-10 text-gray-200 mb-3" />
                  <p className="text-gray-400 font-bold text-sm">
                    상세 모집 요강이 등록되지 않았습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 내부 프로세스 블라인드 안내 */}
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-200 shrink-0">
              <p className="text-xs text-gray-400 font-bold text-center">
                내부 평가 프로세스는 공개되지 않으며, 결과는 개별 연락드립니다.
              </p>
            </div>

            {/* 하단 액션 */}
            <div className="px-8 py-5 border-t-2 border-black bg-white flex gap-3 shrink-0">
              <button
                onClick={() => setJdModal(null)}
                className="px-6 py-3 border-2 border-black font-black hover:bg-gray-100 transition-colors text-sm"
              >
                닫기
              </button>
              <button
                onClick={() => { setJdModal(null); navigate(`/clubs/${slug}/apply?rid=${jdModal.id}`); }}
                className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black transition-colors flex items-center justify-center gap-2 text-sm border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none"
              >
                지원폼 작성하기 <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 채용 공고 카드 ──────────────────────────────────────────────────────
function RecruitCard({ recruitment: r, slug, onOpenJD }: { recruitment: Recruitment; slug: string; onOpenJD: () => void }) {
  const deadline = r.deadline ? new Date(r.deadline) : null;
  const daysLeft = deadline
    ? Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const isExpired = daysLeft !== null && daysLeft < 0;
  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

  const stages: string[] = Array.isArray(r.pipeline_stages) && r.pipeline_stages.length > 0
    ? r.pipeline_stages
    : ['서류접수', '면접', '최종합격'];

  return (
    <div className={`bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group ${
      isExpired ? 'opacity-60' : 'hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5'
    }`}>
      <div className="p-7 flex flex-col md:flex-row md:items-start gap-6">

        {/* 왼쪽: 공고 정보 */}
        <div className="flex-1 min-w-0">
          {/* 배지 */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {r.category && (
              <span className="px-2.5 py-1 bg-orange-100 border border-orange-300 text-orange-700 text-xs font-black">
                {r.category}
              </span>
            )}
            {r.generation && (
              <span className="px-2.5 py-1 bg-gray-100 border border-gray-300 text-gray-600 text-xs font-bold">
                {r.generation}
              </span>
            )}
            {isUrgent && !isExpired && (
              <span className="px-2.5 py-1 bg-red-100 border border-red-300 text-red-700 text-xs font-black animate-pulse">
                D-{daysLeft}
              </span>
            )}
            {isExpired && (
              <span className="px-2.5 py-1 bg-gray-200 border border-gray-300 text-gray-500 text-xs font-black">
                마감됨
              </span>
            )}
          </div>

          {/* 제목 */}
          <h3 className={`text-2xl font-black mb-2 leading-tight transition-colors ${
            isExpired ? '' : 'group-hover:text-orange-500'
          }`}>
            {r.title}
          </h3>

          {r.short_desc && (
            <p className="text-gray-500 font-bold text-sm mb-4 leading-relaxed line-clamp-2">
              {r.short_desc}
            </p>
          )}

          {/* 파이프라인 단계 미리보기 */}
          <div className="flex items-center gap-1.5 flex-wrap mt-3">
            {stages.map((stage, i) => (
              <React.Fragment key={`${stage}-${i}`}>
                <span className={`text-xs font-bold px-2 py-1 border ${
                  i === stages.length - 1
                    ? 'bg-green-50 border-green-300 text-green-700 font-black'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}>
                  {stage}
                </span>
                {i < stages.length - 1 && (
                  <ChevronRight className="w-3 h-3 text-gray-300 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 오른쪽: 마감일 + CTA */}
        <div className="shrink-0 flex flex-col gap-3 md:items-end md:w-44">
          {/* 마감일 */}
          <div className={`flex items-center gap-1.5 font-bold text-sm ${
            isExpired ? 'text-gray-400' : isUrgent ? 'text-red-600' : 'text-gray-500'
          }`}>
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {isExpired
                ? '마감됨'
                : deadline
                  ? daysLeft === 0
                    ? '오늘 마감'
                    : `D-${daysLeft} · ${deadline.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
                  : '상시 모집'}
            </span>
          </div>

          {r.max_applicants && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
              <Users className="w-4 h-4 shrink-0" />
              <span>모집 {r.max_applicants}명</span>
            </div>
          )}

          {/* 지원 버튼 */}
          {isExpired ? (
            <button
              disabled
              className="px-5 py-2.5 bg-gray-200 text-gray-400 font-black border-2 border-gray-300 text-sm cursor-not-allowed"
            >
              마감됨
            </button>
          ) : (
            <button
              onClick={onOpenJD}
              className="px-5 py-2.5 bg-black text-white font-black border-2 border-black hover:bg-orange-500 hover:text-black transition-colors flex items-center gap-2 text-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-none"
            >
              공고 보기 <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
