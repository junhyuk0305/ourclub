import { useState } from 'react';
import { X, Loader } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';

// ──────────────────────────────────────────
// 프로필 수정 모달
// ──────────────────────────────────────────
export default function EditProfileModal({ onClose }: { onClose: () => void }) {
  const { profile, user } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [major, setMajor] = useState(profile?.major ?? '');
  const [birthdate, setBirthdate] = useState<string>(profile?.birthdate ?? '');
  const [academicStatus, setAcademicStatus] = useState<string>(profile?.academic_status ?? '');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) setSkills(prev => [...prev, trimmed]);
    setSkillInput('');
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { setErrorMsg('이름을 입력해주세요.'); return; }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        university: university.trim() || null,
        major: major.trim() || null,
        birthdate: birthdate || null,
        academic_status: academicStatus || null,
        skills,
      })
      .eq('id', user.id);
    setSaving(false);
    if (error) { setErrorMsg(error.message); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm">
      <div className="bg-white border border-sand-200 rounded-card shadow-soft-lg w-full max-w-lg mx-4 p-8 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-ink">프로필 수정</h2>
          <button onClick={onClose} className="text-sand-400 hover:text-brand transition-colors">
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </div>

        {([
          { label: '이름 *', value: name, set: setName, placeholder: '홍길동' },
          { label: '전화번호', value: phone, set: setPhone, placeholder: '010-0000-0000' },
          { label: '대학교', value: university, set: setUniversity, placeholder: '○○대학교' },
          { label: '전공', value: major, set: setMajor, placeholder: '경영학과' },
        ] as { label: string; value: string; set: (v: string) => void; placeholder: string }[]).map(({ label, value, set, placeholder }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="font-black text-sm text-ink">{label}</label>
            <input
              value={value}
              onChange={e => set(e.target.value)}
              placeholder={placeholder}
              className="field border border-sand-300 rounded-ctl px-4 py-2 font-bold text-ink outline-none transition-colors placeholder:text-sand-400"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-black text-sm text-ink">생년월일</label>
            <input
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              className="field border border-sand-300 rounded-ctl px-4 py-2 font-bold text-ink outline-none transition-colors bg-white cursor-pointer"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-black text-sm text-ink">학적 상태</label>
            <select
              value={academicStatus}
              onChange={e => setAcademicStatus(e.target.value)}
              className="field border border-sand-300 rounded-ctl px-4 py-2 font-bold text-ink outline-none bg-white cursor-pointer"
            >
              <option value="">선택 안 함</option>
              <option value="재학">재학</option>
              <option value="휴학">휴학</option>
              <option value="수료">수료</option>
              <option value="졸업">졸업</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-black text-sm text-ink">스킬 태그</label>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="React, 기획, Figma…"
              className="field flex-1 border border-sand-300 rounded-ctl px-4 py-2 font-bold text-ink outline-none transition-colors placeholder:text-sand-400"
            />
            <button
              type="button"
              onClick={addSkill}
              className="px-4 py-2 btn-grad text-white rounded-ctl font-bold shadow-btn hover:-translate-y-0.5 transition-all"
            >
              추가
            </button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map(s => (
                <span key={s} className="flex items-center gap-1 px-3 py-1 bg-brand-tint text-brand-dark rounded-ctl font-bold text-sm">
                  {s}
                  <button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="hover:text-red-500">
                    <X className="w-3 h-3" strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {errorMsg && <p className="text-bad-fg font-bold text-sm">{errorMsg}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 bg-white text-ink border border-sand-300 rounded-ctl font-bold hover:bg-sand-50 transition-colors">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 btn-grad text-white rounded-ctl font-bold shadow-btn hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader className="w-4 h-4 animate-spin" />} 저장
          </button>
        </div>
      </div>
    </div>
  );
}
