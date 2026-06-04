import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Save, Loader, CheckCircle2, AlertCircle, Eye, Image as ImageIcon, Star,
  HelpCircle, Briefcase, BookOpen, Palette, Upload, X, Plus, ChevronUp, ChevronDown,
  ToggleLeft, ToggleRight, EyeOff, Trash2,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import {
  RecruitPageSettings, SloganPosition, FAQItem,
  DEFAULT_RECRUIT_PAGE, mergeRecruitPage,
} from '../../types/recruitment';
import { useToast } from '../../hooks/useToast';

type SectionKey = 'hero' | 'recruitments' | 'story' | 'reviews' | 'faq';

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'hero',         label: '히어로 (슬로건·썸네일)', icon: <ImageIcon className="w-4 h-4" /> },
  { key: 'recruitments', label: '진행 공고 리스트',          icon: <Briefcase className="w-4 h-4" /> },
  { key: 'story',        label: '동아리 스토리',             icon: <BookOpen className="w-4 h-4" /> },
  { key: 'reviews',      label: '후기 및 평점',              icon: <Star className="w-4 h-4" /> },
  { key: 'faq',          label: 'FAQ',                       icon: <HelpCircle className="w-4 h-4" /> },
];

const SLOGAN_POSITIONS: { value: SloganPosition; label: string }[] = [
  { value: 'in-left',    label: '사진 안 / 좌' },
  { value: 'in-center',  label: '사진 안 / 중' },
  { value: 'in-right',   label: '사진 안 / 우' },
  { value: 'out-left',   label: '사진 밖 / 좌' },
  { value: 'out-center', label: '사진 밖 / 중' },
  { value: 'out-right',  label: '사진 밖 / 우' },
];

const COLOR_PRESETS = ['#F97316', '#000000', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#F59E0B'];

export default function RecruitPageBuilder() {
  const { adminClub, adminClubId } = useAdmin();
  const [settings, setSettings] = useState<RecruitPageSettings>(DEFAULT_RECRUIT_PAGE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, show: showToast } = useToast();
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');

  useEffect(() => {
    if (!adminClubId) return;
    load();
  }, [adminClubId]);

  const load = async () => {
    if (!adminClubId) return;
    setLoading(true);
    const { data } = await supabase
      .from('clubs')
      .select('recruit_page')
      .eq('id', adminClubId)
      .single();
    setSettings(mergeRecruitPage((data as { recruit_page: unknown } | null)?.recruit_page));
    setLoading(false);
  };

  const save = async () => {
    if (!adminClubId) return;
    setSaving(true);
    const { error } = await supabase
      .from('clubs')
      .update({ recruit_page: settings })
      .eq('id', adminClubId);
    setSaving(false);
    if (error) {
      showToast(`저장 실패: ${error.message}`, false);
      return;
    }
    showToast('채용 페이지가 저장되었습니다.', true);
  };

  const patch = <K extends SectionKey>(key: K, value: Partial<RecruitPageSettings[K]>) => {
    setSettings(prev => ({ ...prev, [key]: { ...prev[key], ...value } as RecruitPageSettings[K] }));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader>
        {adminClub?.slug && (
          <Link
            to={`/clubs/${adminClub.slug}/recruit?preview=1`}
            target="_blank"
            className="ml-4 px-4 py-2 border border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none text-sm font-bold flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> 미리보기
          </Link>
        )}
        <button
          onClick={save}
          disabled={saving || loading}
          className="ml-2 px-5 py-2 border border-black bg-orange-500 hover:bg-orange-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none text-sm flex items-center gap-2 font-black disabled:opacity-50"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          저장
        </button>
      </AdminHeader>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        {loading ? (
          <main className="flex-1 flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-orange-500" />
          </main>
        ) : (
          <>
            {/* 좌측 섹션 리스트 */}
            <aside className="w-72 border-r border-gray-200 bg-white flex flex-col overflow-y-auto shrink-0">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-black text-base">채용 메인 페이지</h2>
                <p className="text-xs text-gray-500 font-bold mt-1">
                  섹션을 켜고 끄거나 내용을 편집하세요.
                </p>
              </div>
              <div className="flex flex-col py-2">
                {SECTIONS.map(s => {
                  const sec = settings[s.key];
                  const isActive = activeSection === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveSection(s.key)}
                      className={`px-4 py-3 text-left border-l-4 flex items-center justify-between gap-2 transition-colors ${
                        isActive ? 'border-orange-500 bg-orange-50' : 'border-transparent hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-400'}`}>{s.icon}</span>
                        <span className={`text-sm font-black truncate ${sec.enabled ? '' : 'text-gray-400 line-through'}`}>
                          {s.label}
                        </span>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          patch(s.key, { enabled: !sec.enabled } as Partial<RecruitPageSettings[typeof s.key]>);
                        }}
                        className="shrink-0"
                        title={sec.enabled ? '끄기' : '켜기'}
                      >
                        {sec.enabled
                          ? <ToggleRight className="w-6 h-6 text-orange-500" />
                          : <ToggleLeft className="w-6 h-6 text-gray-300" />}
                      </button>
                    </button>
                  );
                })}
              </div>

              {/* 브랜드 컬러 */}
              <div className="mt-2 p-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-orange-500" />
                  <p className="font-black text-xs uppercase tracking-widest text-gray-500">대표 브랜드 컬러</p>
                </div>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {COLOR_PRESETS.map(c => (
                    <button
                      key={c}
                      onClick={() => setSettings(prev => ({ ...prev, brand_color: c }))}
                      className={`w-full aspect-square border-2 transition-all ${
                        settings.brand_color.toLowerCase() === c.toLowerCase() ? 'border-black scale-110' : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.brand_color}
                    onChange={e => setSettings(prev => ({ ...prev, brand_color: e.target.value }))}
                    className="w-10 h-10 border border-gray-300 cursor-pointer"
                  />
                  <input
                    value={settings.brand_color}
                    onChange={e => setSettings(prev => ({ ...prev, brand_color: e.target.value }))}
                    className="flex-1 p-2 border border-gray-300 font-mono text-xs outline-none focus:border-orange-500 uppercase"
                    placeholder="#F97316"
                    maxLength={7}
                  />
                </div>
              </div>
            </aside>

            {/* 우측 편집 영역 */}
            <main className="flex-1 overflow-y-auto bg-gray-50">
              <div className="max-w-2xl mx-auto p-8">
                {activeSection === 'hero' && <HeroEditor value={settings.hero} onChange={v => patch('hero', v)} clubId={adminClubId ?? ''} />}
                {activeSection === 'recruitments' && (
                  <SimpleSectionEditor
                    label="진행 공고 리스트 섹션"
                    description="현재 '진행중'인 공고들이 자동으로 표시됩니다. 섹션 제목만 편집 가능합니다."
                    title={settings.recruitments.title}
                    onTitleChange={v => patch('recruitments', { title: v })}
                  />
                )}
                {activeSection === 'story' && <StoryEditor value={settings.story} onChange={v => patch('story', v)} />}
                {activeSection === 'reviews' && (
                  <ReviewsEditor
                    title={settings.reviews.title}
                    onTitleChange={v => patch('reviews', { title: v })}
                    clubId={adminClubId ?? ''}
                  />
                )}
                {activeSection === 'faq' && <FAQEditor value={settings.faq} onChange={v => patch('faq', v)} />}
              </div>
            </main>
          </>
        )}
      </div>

      {toast && (
        <div
          className={`fixed bottom-8 right-8 z-50 px-6 py-4 border-2 font-black flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)] ${
            toast.ok ? 'bg-green-500 text-white border-black' : 'bg-red-500 text-white border-black'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon, label, description }: { icon: React.ReactNode; label: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-black flex items-center gap-2 mb-1">
        {icon} {label}
      </h2>
      <p className="text-sm text-gray-500 font-bold">{description}</p>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="font-black text-xs block mb-1.5 text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 font-bold mt-1">{hint}</p>}
    </div>
  );
}

// ── 히어로 섹션 편집기 ────────────────────────────────────────────────────
function HeroEditor({
  value,
  onChange,
  clubId,
}: {
  value: RecruitPageSettings['hero'];
  onChange: (v: Partial<RecruitPageSettings['hero']>) => void;
  clubId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const uploadThumbnail = async (file: File) => {
    setError('');
    if (file.size > 5 * 1024 * 1024) {
      setError('이미지는 최대 5MB까지 업로드 가능합니다.');
      return;
    }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${clubId || 'shared'}/recruit-hero-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('club-pages').upload(path, file, { upsert: true });
    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('club-pages').getPublicUrl(path);
    onChange({ thumbnail_url: data.publicUrl });
    setUploading(false);
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        icon={<ImageIcon className="w-6 h-6 text-orange-500" />}
        label="히어로 섹션"
        description="채용 홈 최상단에 표시되는 슬로건과 썸네일을 편집합니다."
      />

      <div className="bg-white border-2 border-black p-6 flex flex-col gap-5">
        <Field label="슬로건 (줄바꿈 가능)">
          <textarea
            value={value.slogan}
            onChange={e => onChange({ slogan: e.target.value })}
            rows={3}
            className="w-full p-3 border border-black font-black text-lg outline-none focus:border-orange-500 resize-none"
            placeholder={'함께 성장할\n인재를 찾습니다.'}
          />
        </Field>

        <Field label="썸네일 사진">
          {value.thumbnail_url ? (
            <div className="relative group">
              <img src={value.thumbnail_url} alt="히어로 썸네일" className="w-full max-h-72 object-cover border border-gray-300" />
              <button
                onClick={() => onChange({ thumbnail_url: '' })}
                className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors"
                title="삭제"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full p-12 border-2 border-dashed border-gray-300 hover:border-orange-400 text-gray-500 hover:text-orange-500 flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50 bg-gray-50"
            >
              {uploading
                ? <Loader className="w-6 h-6 animate-spin" />
                : <>
                    <Upload className="w-6 h-6" />
                    <span className="font-bold text-sm">클릭하여 이미지 업로드 (최대 5MB)</span>
                  </>
              }
            </button>
          )}
          <input
            type="text"
            value={value.thumbnail_url}
            onChange={e => onChange({ thumbnail_url: e.target.value })}
            placeholder="또는 이미지 URL 직접 입력..."
            className="w-full mt-2 p-2 border border-gray-200 font-mono text-xs outline-none focus:border-orange-500 text-gray-500"
          />
          {error && <p className="text-red-500 text-xs font-bold mt-1">{error}</p>}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) uploadThumbnail(e.target.files[0]); e.target.value = ''; }}
          />
        </Field>

        <Field label="슬로건 위치" hint="사진 위(in)에 배치할지, 사진 옆/위(out)에 배치할지 선택합니다.">
          <div className="grid grid-cols-3 gap-2">
            {SLOGAN_POSITIONS.map(p => (
              <button
                key={p.value}
                onClick={() => onChange({ slogan_position: p.value })}
                className={`p-2.5 border text-xs font-black transition-colors ${
                  value.slogan_position === p.value
                    ? 'bg-orange-500 text-white border-orange-500'
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

// ── 단순 섹션 편집기 (제목만) ─────────────────────────────────────────────
function SimpleSectionEditor({
  label, description, title, onTitleChange,
}: {
  label: string; description: string; title: string; onTitleChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeader icon={<Briefcase className="w-6 h-6 text-orange-500" />} label={label} description={description} />
      <div className="bg-white border-2 border-black p-6">
        <Field label="섹션 제목">
          <input
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500 text-sm"
          />
        </Field>
      </div>
    </div>
  );
}

// ── 스토리 섹션 편집기 ───────────────────────────────────────────────────
function StoryEditor({
  value, onChange,
}: {
  value: RecruitPageSettings['story'];
  onChange: (v: Partial<RecruitPageSettings['story']>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        icon={<BookOpen className="w-6 h-6 text-orange-500" />}
        label="동아리 스토리 섹션"
        description="발행된 스토리 포스트 중 최신 3개가 자동으로 표시됩니다."
      />
      <div className="bg-white border-2 border-black p-6 flex flex-col gap-5">
        <Field label="섹션 제목">
          <input
            value={value.title}
            onChange={e => onChange({ title: e.target.value })}
            className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500 text-sm"
          />
        </Field>
        <Field label="섹션 설명">
          <textarea
            value={value.description}
            onChange={e => onChange({ description: e.target.value })}
            rows={2}
            className="w-full p-3 border border-black font-medium outline-none focus:border-orange-500 text-sm resize-none"
          />
        </Field>
        <div className="bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 font-bold flex items-start gap-2">
          <BookOpen className="w-4 h-4 mt-0.5 shrink-0" />
          스토리는 <Link to="/admin/posts" className="underline">스토리 포스트 발행</Link> 메뉴에서 작성합니다.
        </div>
      </div>
    </div>
  );
}

// ── 후기 관리 (노출 토글) ────────────────────────────────────────────────
interface AdminReview {
  id: string;
  rating: number;
  title: string;
  body: string;
  generation: string | null;
  result: string | null;
  created_at: string;
  is_published: boolean;
  user_id: string;
  profiles?: { name: string | null } | null;
}

function ReviewsEditor({ title, onTitleChange, clubId }: { title: string; onTitleChange: (v: string) => void; clubId: string }) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'hidden'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) return;
    load();
  }, [clubId]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('club_reviews')
      .select('id, rating, title, body, generation, result, created_at, is_published, user_id, profiles(name)')
      .eq('club_id', clubId)
      .order('created_at', { ascending: false });
    setReviews((data as unknown as AdminReview[]) ?? []);
    setLoading(false);
  };

  const togglePublish = async (id: string, next: boolean) => {
    setBusyId(id);
    await supabase.from('club_reviews').update({ is_published: next }).eq('id', id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_published: next } : r));
    setBusyId(null);
  };

  const filtered = reviews.filter(r =>
    filter === 'all' ? true :
    filter === 'published' ? r.is_published :
    !r.is_published
  );

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        icon={<Star className="w-6 h-6 text-orange-500" />}
        label="후기 및 평점 섹션"
        description="섹션 제목을 편집하고, 게시된 후기를 노출·비노출 처리할 수 있습니다."
      />

      <div className="bg-white border-2 border-black p-6">
        <Field label="섹션 제목">
          <input
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500 text-sm"
          />
        </Field>
      </div>

      <div className="bg-white border-2 border-black">
        <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black bg-gray-50">
          <p className="font-black text-sm">후기 관리 ({reviews.length}건)</p>
          <div className="flex border border-black overflow-hidden text-xs font-black">
            {(['all', 'published', 'hidden'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 border-l border-black first:border-l-0 transition-colors ${
                  filter === f ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                {f === 'all' ? '전체' : f === 'published' ? '노출' : '비노출'}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader className="w-5 h-5 animate-spin text-orange-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm font-bold text-gray-400">
            {reviews.length === 0 ? '아직 등록된 후기가 없습니다.' : '조건에 맞는 후기가 없습니다.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map(r => (
              <div key={r.id} className="px-5 py-4 flex gap-4 items-start">
                <div className="shrink-0 w-12 text-center">
                  <p className="text-2xl font-black text-orange-500">{r.rating}</p>
                  <p className="text-[10px] font-bold text-gray-400">/ 5</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-black text-sm">{r.title}</span>
                    {r.generation && <span className="text-xs font-bold text-gray-500">{r.generation}</span>}
                    {r.result && (
                      <span className={`text-xs font-bold px-2 py-0.5 border ${
                        r.result === '합격' ? 'bg-green-50 border-green-300 text-green-700' :
                        r.result === '불합격' ? 'bg-gray-100 border-gray-300 text-gray-500' :
                        'bg-yellow-50 border-yellow-300 text-yellow-700'
                      }`}>
                        {r.result}
                      </span>
                    )}
                    {!r.is_published && (
                      <span className="text-xs font-black px-2 py-0.5 bg-gray-200 text-gray-600">비노출</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 font-medium line-clamp-2 mb-1">{r.body}</p>
                  <p className="text-xs text-gray-400 font-bold">
                    {r.profiles?.name ?? '익명'} · {new Date(r.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <button
                  onClick={() => togglePublish(r.id, !r.is_published)}
                  disabled={busyId === r.id}
                  className={`shrink-0 px-3 py-1.5 border-2 border-black text-xs font-black transition-colors flex items-center gap-1.5 ${
                    r.is_published ? 'bg-white hover:bg-gray-100' : 'bg-orange-500 text-black hover:bg-orange-600'
                  }`}
                >
                  {busyId === r.id ? <Loader className="w-3 h-3 animate-spin" /> :
                    r.is_published ? <><EyeOff className="w-3.5 h-3.5" /> 비노출</> : <><Eye className="w-3.5 h-3.5" /> 노출</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FAQ 편집기 ──────────────────────────────────────────────────────────
function FAQEditor({
  value, onChange,
}: {
  value: RecruitPageSettings['faq'];
  onChange: (v: Partial<RecruitPageSettings['faq']>) => void;
}) {
  const updateItem = (i: number, patch: Partial<FAQItem>) =>
    onChange({ items: value.items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  const removeItem = (i: number) =>
    onChange({ items: value.items.filter((_, idx) => idx !== i) });
  const addItem = () =>
    onChange({ items: [...value.items, { question: '', answer: '' }] });
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value.items];
    const target = i + dir;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    onChange({ items: next });
  };

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader
        icon={<HelpCircle className="w-6 h-6 text-orange-500" />}
        label="FAQ 섹션"
        description="자주 묻는 질문과 답변을 토글 형식으로 표시합니다."
      />
      <div className="bg-white border-2 border-black p-6 flex flex-col gap-5">
        <Field label="섹션 제목">
          <input
            value={value.title}
            onChange={e => onChange({ title: e.target.value })}
            className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500 text-sm"
          />
        </Field>

        <div className="flex flex-col gap-3">
          {value.items.length === 0 && (
            <div className="border-2 border-dashed border-gray-300 p-6 text-center text-gray-400 font-bold text-sm">
              아직 질문이 없습니다. 아래에서 추가하세요.
            </div>
          )}
          {value.items.map((it, i) => (
            <div key={i} className="border border-gray-300 bg-gray-50 p-3 flex gap-2">
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1 border border-gray-300 hover:bg-white disabled:opacity-30">
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button onClick={() => move(i, 1)} disabled={i === value.items.length - 1} className="p-1 border border-gray-300 hover:bg-white disabled:opacity-30">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <input
                  value={it.question}
                  onChange={e => updateItem(i, { question: e.target.value })}
                  placeholder="질문"
                  className="w-full p-2 border border-gray-300 font-black text-sm outline-none focus:border-orange-500 bg-white"
                />
                <textarea
                  value={it.answer}
                  onChange={e => updateItem(i, { answer: e.target.value })}
                  rows={3}
                  placeholder="답변"
                  className="w-full p-2 border border-gray-300 font-medium text-sm outline-none focus:border-orange-500 bg-white resize-none"
                />
              </div>
              <button onClick={() => removeItem(i)} className="p-2 self-start hover:bg-red-50 hover:text-red-500 rounded shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addItem}
          className="self-start px-4 py-2 border border-black bg-white hover:bg-orange-50 font-bold text-sm flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <Plus className="w-4 h-4" /> 질문 추가
        </button>
      </div>
    </div>
  );
}
