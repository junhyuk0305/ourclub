import React, { useEffect, useState } from 'react';
import { Plus, X, ArrowUp, ArrowDown, Loader, Save, CheckCircle2, AlertCircle, GitBranch, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { useToast } from '../../../hooks/useToast';

interface Props {
  recruitmentId: string;
  pipelineStages: string[];
  onUpdate: (stages: string[]) => void;
}

const DEFAULT_STAGES = ['서류', '인터뷰', '합격'];

export function PipelineTab({ recruitmentId, pipelineStages, onUpdate }: Props) {
  const [stages, setStages] = useState<string[]>(pipelineStages.length > 0 ? pipelineStages : DEFAULT_STAGES);
  const [newStage, setNewStage] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast, show: showToast } = useToast();

  useEffect(() => {
    setStages(pipelineStages.length > 0 ? pipelineStages : DEFAULT_STAGES);
  }, [recruitmentId]);

  const updateStage = (idx: number, val: string) => {
    setStages(prev => prev.map((s, i) => (i === idx ? val : s)));
  };

  const addStage = () => {
    if (!newStage.trim()) return;
    setStages(prev => [...prev, newStage.trim()]);
    setNewStage('');
  };

  const removeStage = (idx: number) => {
    if (stages.length <= 1) {
      showToast('최소 1개 단계가 필요합니다.', false);
      return;
    }
    setStages(prev => prev.filter((_, i) => i !== idx));
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= stages.length) return;
    setStages(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const resetToDefault = () => {
    setStages(DEFAULT_STAGES);
  };

  const save = async () => {
    const cleaned = stages.map(s => s.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      showToast('최소 1개 단계가 필요합니다.', false);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('recruitments')
      .update({ pipeline_stages: cleaned })
      .eq('id', recruitmentId);
    setSaving(false);
    if (error) {
      showToast(`저장 실패: ${error.message}`, false);
      return;
    }
    onUpdate(cleaned);
    showToast('프로세스가 저장되었습니다.', true);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto flex flex-col gap-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-ink flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-brand" strokeWidth={2.5} />
            모집 프로세스
          </h2>
          <p className="text-sm text-sand-500 font-bold mt-1">
            지원자가 거치게 될 단계를 정의합니다. 기본값: 서류 - 인터뷰 - 합격
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2.5 rounded-ctl btn-grad text-white shadow-btn hover:-translate-y-0.5 transition-all font-bold text-sm flex items-center gap-2 disabled:opacity-40"
        >
          {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" strokeWidth={2.5} />}
          저장
        </button>
      </div>

      {/* 미리보기 */}
      <div className="bg-white border border-sand-200 rounded-card shadow-soft p-5">
        <p className="font-black text-xs text-sand-500 uppercase tracking-widest mb-3">미리보기</p>
        <div className="flex items-center gap-1 flex-wrap">
          {stages.map((s, i) => (
            <React.Fragment key={`prev-${i}`}>
              <span
                className={`inline-block px-3 py-1.5 text-sm font-bold rounded-ctl ${
                  i === stages.length - 1 ? 'bg-ok-bg text-ok-fg' : 'bg-sand-100 text-sand-600'
                }`}
              >
                {s || '(빈 단계)'}
              </span>
              {i < stages.length - 1 && <ChevronRight className="w-4 h-4 text-sand-300" strokeWidth={2.5} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 단계 편집 */}
      <div className="bg-white border border-sand-200 rounded-card shadow-soft p-6 flex flex-col gap-3">
        <h3 className="font-black text-base text-ink">단계 편집</h3>
        {stages.map((stage, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-xs font-black bg-sand-100 text-sand-600 px-2 py-1 rounded-ctl w-7 text-center">{idx + 1}</span>
            <input
              value={stage}
              onChange={e => updateStage(idx, e.target.value)}
              className="field flex-1 border border-sand-300 rounded-ctl p-2.5 font-bold outline-none text-sm"
              placeholder="단계 이름"
            />
            <button
              onClick={() => move(idx, idx - 1)}
              disabled={idx === 0}
              className="p-2 rounded-ctl border border-sand-300 text-sand-600 hover:bg-sand-50 disabled:opacity-30 disabled:cursor-not-allowed"
              title="위로"
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => move(idx, idx + 1)}
              disabled={idx === stages.length - 1}
              className="p-2 rounded-ctl border border-sand-300 text-sand-600 hover:bg-sand-50 disabled:opacity-30 disabled:cursor-not-allowed"
              title="아래로"
            >
              <ArrowDown className="w-4 h-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => removeStage(idx)}
              className="p-2 rounded-ctl border border-sand-300 text-sand-600 hover:bg-red-50 hover:text-red-500"
              title="삭제"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        ))}
        <div className="flex gap-2 pt-3 border-t border-sand-200">
          <input
            value={newStage}
            onChange={e => setNewStage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addStage()}
            placeholder="새 단계 이름"
            className="field flex-1 border border-sand-300 rounded-ctl p-2.5 font-bold outline-none text-sm"
          />
          <button
            onClick={addStage}
            disabled={!newStage.trim()}
            className="px-4 py-2 rounded-ctl btn-grad text-white shadow-btn font-bold text-sm disabled:opacity-50 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> 추가
          </button>
        </div>
        <button
          onClick={resetToDefault}
          className="self-start text-xs font-bold text-sand-500 hover:text-brand underline mt-2"
        >
          기본값으로 초기화 (서류 - 인터뷰 - 합격)
        </button>
      </div>

      {toast && (
        <div
          className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-card font-bold flex items-center gap-3 shadow-soft-lg ${
            toast.ok ? 'bg-ink text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.ok ? <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} /> : <AlertCircle className="w-5 h-5" strokeWidth={2.5} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
