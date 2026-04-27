import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Type, FileUp, GripVertical, Trash2, CheckCircle2, Loader, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabaseClient';

interface Question {
  id: string;
  type: 'text' | 'textarea' | 'file';
  title: string;
  required: boolean;
}

interface Recruitment {
  id: string;
  title: string;
  generation: string | null;
  status: string;
  deadline: string | null;
  form_schema: Question[];
}

export default function FormBuilder() {
  const { adminClub, adminClubId } = useAdmin();

  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // 새 모집 생성 모달
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newGeneration, setNewGeneration] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!adminClubId) return;
    loadRecruitment(adminClubId);
  }, [adminClubId]);

  const loadRecruitment = async (clubId: string) => {
    setFetching(true);
    const { data } = await supabase
      .from('recruitments')
      .select('id, title, generation, status, deadline, form_schema')
      .eq('club_id', clubId)
      .neq('status', '마감')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setRecruitment(data as Recruitment);
      setQuestions(Array.isArray(data.form_schema) ? (data.form_schema as Question[]) : []);
    }
    setFetching(false);
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!recruitment) return;
    setSaving(true);
    const { error } = await supabase
      .from('recruitments')
      .update({ form_schema: questions })
      .eq('id', recruitment.id);
    setSaving(false);
    if (error) { showToast(`저장 실패: ${error.message}`, false); return; }
    showToast('지원서 양식이 저장되었습니다!');
  };

  const handleCreateRecruitment = async () => {
    if (!adminClubId || !newTitle.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('recruitments')
      .insert({
        club_id: adminClubId,
        title: newTitle.trim(),
        generation: newGeneration.trim() || null,
        deadline: newDeadline || null,
        form_schema: questions,
        status: '준비중',
      })
      .select()
      .single();
    setCreating(false);
    if (error) { showToast(`생성 실패: ${error.message}`, false); return; }
    setRecruitment(data as Recruitment);
    setShowNewModal(false);
    showToast('새 모집이 생성되었습니다.');
  };

  const addQuestion = (type: 'text' | 'textarea' | 'file') => {
    setQuestions(prev => [...prev, { id: Date.now().toString(), type, title: '새로운 질문', required: false }]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: string, value: unknown) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <header className="h-14 border-b border-black bg-white flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/admin/dashboard" className="p-2 hover:bg-gray-100 transition-colors rounded-full border border-transparent hover:border-black">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-black text-lg tracking-tight">운영진 워크스페이스</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-bold">
          현재 관리 중인 동아리:
          <span className="text-orange-500">{adminClub?.name ?? '—'}</span>
          {recruitment && (
            <Link
              to={`/clubs/${adminClub?.slug ?? ''}/apply`}
              target="_blank"
              className="ml-2 px-4 py-2 border border-black bg-white hover:bg-gray-100 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none text-xs"
            >
              라이브 프리뷰
            </Link>
          )}
          <button
            onClick={recruitment ? handleSave : () => setShowNewModal(true)}
            disabled={saving}
            className="ml-2 px-6 py-2 border border-black bg-orange-500 font-black hover:bg-orange-600 transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-px text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader className="w-4 h-4 animate-spin" />}
            {recruitment ? '저장 및 배포' : '새 모집 만들기'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 flex items-start justify-center overflow-y-auto p-8">
          {fetching ? (
            <div className="flex items-center justify-center h-full">
              <Loader className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="w-full max-w-4xl flex flex-col gap-8 mb-12">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-4xl font-black mb-2">지원서 폼 빌더</h2>
                  {recruitment ? (
                    <p className="text-gray-500 font-bold">
                      {recruitment.title} {recruitment.generation && `· ${recruitment.generation}`}
                      <span className={`ml-2 px-2 py-0.5 text-xs border font-black ${recruitment.status === '모집중' ? 'bg-green-100 border-green-400 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-500'}`}>
                        {recruitment.status}
                      </span>
                    </p>
                  ) : (
                    <p className="text-gray-500 font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      진행 중인 모집이 없습니다. 새 모집을 만들어주세요.
                    </p>
                  )}
                </div>
                {recruitment && (
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="px-4 py-2 border border-black bg-white font-bold text-sm hover:bg-gray-100 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <Plus className="w-4 h-4" /> 새 모집 기수 만들기
                  </button>
                )}
              </div>

              {/* 질문 목록 */}
              <div className="flex flex-col gap-6">
                {questions.map(q => (
                  <div key={q.id} className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex group hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="w-12 border-r-2 border-black flex items-center justify-center cursor-move bg-gray-50 hover:bg-orange-100 transition-colors">
                      <GripVertical className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="p-8 flex-1 flex flex-col gap-4 relative">
                      <button onClick={() => removeQuestion(q.id)} className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors rounded">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                        <input
                          value={q.title}
                          onChange={e => updateQuestion(q.id, 'title', e.target.value)}
                          className="text-2xl font-black outline-none border-b-2 border-transparent focus:border-orange-500 flex-1 bg-transparent"
                        />
                        <label className="flex items-center gap-2 font-bold cursor-pointer shrink-0">
                          <input
                            type="checkbox"
                            checked={q.required}
                            onChange={e => updateQuestion(q.id, 'required', e.target.checked)}
                            className="w-4 h-4 cursor-pointer accent-orange-500"
                          />
                          필수 응답
                        </label>
                      </div>
                      <div className="bg-gray-50 border border-dashed border-gray-300 mt-2 pointer-events-none p-4">
                        {q.type === 'text' && <input placeholder="단답형 텍스트 입력 영역 (미리보기)" className="w-full p-3 bg-white border border-gray-200 text-gray-400" readOnly />}
                        {q.type === 'textarea' && <textarea rows={4} placeholder="장문형 텍스트 입력 영역 (미리보기)" className="w-full p-3 bg-white border border-gray-200 text-gray-400 resize-none" readOnly />}
                        {q.type === 'file' && (
                          <div className="border border-gray-300 bg-white p-6 flex flex-col items-center justify-center gap-2 text-gray-400">
                            <FileUp className="w-8 h-8" />
                            <span>지원자가 여기에 파일을 업로드합니다</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 질문 추가 버튼 */}
              <div className="grid grid-cols-3 gap-4 mt-4">
                {([['text', '단답형 텍스트 추가'], ['textarea', '장문형 텍스트 추가'], ['file', '파일 업로드 추가']] as const).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() => addQuestion(type)}
                    className="py-6 bg-white border-2 border-black border-dashed font-black text-gray-500 hover:bg-orange-50 hover:text-black hover:border-solid transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    {type === 'file' ? <FileUp className="w-6 h-6" /> : <Type className="w-6 h-6" />}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 새 모집 생성 모달 */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8 flex flex-col gap-5">
            <h2 className="text-2xl font-black">새 모집 만들기</h2>
            <div className="flex flex-col gap-4">
              <Field label="모집 제목 *">
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="마제스티 14기 신입 부원 모집" className={inp} />
              </Field>
              <Field label="기수">
                <input value={newGeneration} onChange={e => setNewGeneration(e.target.value)}
                  placeholder="14기" className={inp} />
              </Field>
              <Field label="모집 마감일">
                <input type="datetime-local" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} className={inp} />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowNewModal(false)} className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100">취소</button>
              <button
                onClick={handleCreateRecruitment}
                disabled={creating || !newTitle.trim()}
                className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <Loader className="w-4 h-4 animate-spin" />}
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className={`fixed bottom-8 right-8 z-[70] px-6 py-4 border-2 border-black font-black flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${toast.ok ? 'bg-orange-500 text-white' : 'bg-red-600 text-white'}`}>
          <CheckCircle2 className="w-5 h-5" />
          {toast.msg}
        </div>
      )}
    </div>
  );
}

const inp = 'w-full p-3 border border-black font-bold outline-none focus:border-orange-500 transition-colors';
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-black text-sm">{label}</label>
      {children}
    </div>
  );
}
