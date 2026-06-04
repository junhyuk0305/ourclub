import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LabelList } from 'recharts';
import { Users, Search, Award, Loader, UserPlus, X, Check, Save, Info, Bell, CheckCircle, XCircle, AlertTriangle, Filter, Settings, Trash2, Eye, EyeOff, Plus, Download, GraduationCap, ChevronDown, Archive } from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { useAdmin } from '../../contexts/AdminContext';
import { supabase } from '../../lib/supabaseClient';
import { formatDate } from '../../lib/format';
import { downloadExcel } from '../../lib/excel';

type MemberStatus = '활동중' | '수료' | '탈퇴' | '활동정지';

interface Member {
  id: string;
  role: '운영진' | '부원';
  generation: string | null;
  position: string | null;
  role_function: string | null;
  status: MemberStatus;
  joined_at: string;
  display_name: string | null;
  display_university: string | null;
  profiles: { name: string; email: string; major: string | null; university: string | null; academic_status: string | null } | null;
  attendanceRate?: number | null;
}

const memberName = (m: Member): string => m.profiles?.name ?? m.display_name ?? '—';
const memberUniversity = (m: Member): string => m.profiles?.university ?? m.display_university ?? '';

type MemberDraft = Partial<Pick<Member, 'role' | 'status' | 'generation' | 'position' | 'role_function'>>;

type Tab = 'active-gen' | 'all-members' | 'join-requests';

interface CustomField {
  id: string;
  name: string;
  display_order: number;
}

interface JoinRequest {
  id: string;
  user_id: string;
  role_title: string | null;
  intro: string | null;
  status: string;
  created_at: string;
  profiles: { name: string; email: string; university: string | null; major: string | null } | null;
}

const STATUS_BADGE: Record<MemberStatus, string> = {
  '활동중':  'bg-green-100 text-green-700 border-green-300',
  '수료':    'bg-blue-100 text-blue-700 border-blue-300',
  '탈퇴':    'bg-gray-100 text-gray-500 border-gray-300',
  '활동정지': 'bg-red-100 text-red-700 border-red-300',
};

export default function MembersAdmin() {
  const { adminClubId } = useAdmin();
  const [activeTab, setActiveTab] = useState<Tab>('active-gen');
  const [members, setMembers] = useState<Member[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, MemberDraft>>({});
  const [bulkSaving, setBulkSaving] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({});
  const [openFilterCol, setOpenFilterCol] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, Record<string, string>>>({});
  const [customDrafts, setCustomDrafts] = useState<Record<string, Record<string, string>>>({});
  const [hiddenCustomCols, setHiddenCustomCols] = useState<Set<string>>(new Set());
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // 기수 관리
  const [generations, setGenerations] = useState<string[]>([]);
  const [currentGeneration, setCurrentGeneration] = useState<string | null>(null);
  const [showGenManager, setShowGenManager] = useState(false);
  const [genPickerOpen, setGenPickerOpen] = useState(false);
  const [showCloseGenModal, setShowCloseGenModal] = useState(false);
  const [closingGen, setClosingGen] = useState(false);

  // 합류 신청 탭
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [joinFetching, setJoinFetching] = useState(false);
  const [joinProcessing, setJoinProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!adminClubId) return;
    loadMembers(adminClubId);
    loadJoinRequests(adminClubId);
    loadCustomFields(adminClubId);
    loadGenerations(adminClubId);
    try {
      const raw = localStorage.getItem(`members-hidden-cols-${adminClubId}`);
      if (raw) setHiddenCustomCols(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, [adminClubId]);

  const loadGenerations = async (clubId: string) => {
    const { data } = await supabase
      .from('clubs')
      .select('generations, current_generation')
      .eq('id', clubId)
      .maybeSingle();
    setGenerations((data?.generations ?? []) as string[]);
    setCurrentGeneration((data?.current_generation ?? null) as string | null);
  };

  const updateClubGenerations = async (
    nextGenerations: string[],
    nextCurrent: string | null,
  ) => {
    if (!adminClubId) return { error: null as null | string };
    const { error } = await supabase
      .from('clubs')
      .update({ generations: nextGenerations, current_generation: nextCurrent })
      .eq('id', adminClubId);
    if (error) return { error: error.message };
    setGenerations(nextGenerations);
    setCurrentGeneration(nextCurrent);
    return { error: null };
  };

  const handleCloseCurrentGen = async () => {
    if (!adminClubId || !currentGeneration) return;
    setClosingGen(true);
    const { data: updated, error } = await supabase
      .from('club_members')
      .update({ status: '수료' })
      .eq('club_id', adminClubId)
      .eq('generation', currentGeneration)
      .eq('status', '활동중')
      .select('id');
    if (error) {
      setClosingGen(false);
      showToast(`기수 마감 실패: ${error.message}`);
      return;
    }
    await updateClubGenerations(generations, null);
    await loadMembers(adminClubId);
    setClosingGen(false);
    setShowCloseGenModal(false);
    showToast(`${currentGeneration} 부원 ${updated?.length ?? 0}명을 수료 처리했습니다.`);
  };

  const persistHiddenCols = (next: Set<string>) => {
    setHiddenCustomCols(next);
    if (adminClubId) {
      localStorage.setItem(`members-hidden-cols-${adminClubId}`, JSON.stringify(Array.from(next)));
    }
  };

  const loadCustomFields = async (clubId: string) => {
    const { data: fields } = await supabase
      .from('club_custom_fields')
      .select('id, name, display_order')
      .eq('club_id', clubId)
      .order('display_order', { ascending: true });
    const list = (fields ?? []) as CustomField[];
    setCustomFields(list);

    if (list.length > 0) {
      const { data: values } = await supabase
        .from('club_member_custom_values')
        .select('member_id, field_id, value')
        .in('field_id', list.map(f => f.id));
      const map: Record<string, Record<string, string>> = {};
      (values ?? []).forEach((v: { member_id: string; field_id: string; value: string | null }) => {
        if (!map[v.member_id]) map[v.member_id] = {};
        map[v.member_id][v.field_id] = v.value ?? '';
      });
      setCustomValues(map);
    } else {
      setCustomValues({});
    }
  };

  useEffect(() => {
    setSelectedIds(new Set());
    setColFilters({});
  }, [activeTab]);

  useEffect(() => {
    if (!openFilterCol) return;
    const handler = () => setOpenFilterCol(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [openFilterCol]);

  useEffect(() => {
    if (!genPickerOpen) return;
    const handler = () => setGenPickerOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [genPickerOpen]);

  const loadMembers = async (clubId: string) => {
    setFetching(true);
    const { data } = await supabase
      .from('club_members')
      .select('id, role, generation, position, role_function, status, joined_at, display_name, display_university, profiles(name, email, major, university, academic_status)')
      .eq('club_id', clubId)
      .order('joined_at', { ascending: true });

    const members = (data as unknown as Member[]) ?? [];
    const withRates = await Promise.all(
      members.map(async m => {
        const { data: atts } = await supabase
          .from('attendances')
          .select('status')
          .eq('member_id', m.id);
        const total = atts?.length ?? 0;
        const attended = atts?.filter(a => a.status === '출석').length ?? 0;
        return { ...m, attendanceRate: total > 0 ? Math.round(attended / total * 100) : null };
      })
    );
    setMembers(withRates);
    setDrafts({});
    setFetching(false);
  };

  const loadJoinRequests = async (clubId: string) => {
    setJoinFetching(true);
    const { data } = await supabase
      .from('club_join_requests')
      .select('id, user_id, role_title, intro, status, created_at, profiles(name, email, university, major)')
      .eq('club_id', clubId)
      .eq('status', '대기중')
      .order('created_at', { ascending: true });
    setJoinRequests((data as unknown as JoinRequest[]) ?? []);
    setJoinFetching(false);
  };

  const handleJoinDecision = async (req: JoinRequest, decision: '승인' | '거절') => {
    if (!adminClubId) return;
    setJoinProcessing(prev => ({ ...prev, [req.id]: true }));

    if (decision === '승인') {
      await supabase.from('club_members').insert({
        user_id: req.user_id,
        club_id: adminClubId,
        role: '운영진',
        status: '활동중',
        position: req.role_title ?? null,
      });
    }

    await supabase
      .from('club_join_requests')
      .update({ status: decision, reviewed_at: new Date().toISOString() })
      .eq('id', req.id);

    setJoinProcessing(prev => ({ ...prev, [req.id]: false }));
    showToast(decision === '승인' ? `${req.profiles?.name}님이 운영진으로 추가됐습니다.` : '거절 처리됐습니다.');
    loadJoinRequests(adminClubId);
    if (decision === '승인') loadMembers(adminClubId);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const setDraft = (id: string, patch: MemberDraft) => {
    setDrafts(prev => ({ ...prev, [id]: { ...(prev[id] ?? {}), ...patch } }));
  };

  const hasDraft = (id: string) => {
    const d = drafts[id];
    if (d && Object.keys(d).length > 0) return true;
    const cd = customDrafts[id];
    if (cd && Object.keys(cd).length > 0) return true;
    return false;
  };

  const getCustomVal = (memberId: string, fieldId: string): string => {
    const draft = customDrafts[memberId]?.[fieldId];
    if (draft !== undefined) return draft;
    return customValues[memberId]?.[fieldId] ?? '';
  };

  const setCustomDraft = (memberId: string, fieldId: string, value: string) => {
    setCustomDrafts(prev => {
      const next = { ...prev };
      const original = customValues[memberId]?.[fieldId] ?? '';
      const rowDrafts = { ...(next[memberId] ?? {}) };
      if (value === original) {
        delete rowDrafts[fieldId];
      } else {
        rowDrafts[fieldId] = value;
      }
      if (Object.keys(rowDrafts).length === 0) delete next[memberId];
      else next[memberId] = rowDrafts;
      return next;
    });
  };

  const saveAll = async () => {
    const memberIds = Object.keys(drafts);
    const customRowIds = Object.keys(customDrafts);
    if (memberIds.length === 0 && customRowIds.length === 0) return;
    setBulkSaving(true);

    const memberOps = memberIds.map(id =>
      supabase.from('club_members').update(drafts[id]).eq('id', id)
    );

    const customOps: Promise<{ error: unknown }>[] = [];
    customRowIds.forEach(memberId => {
      Object.entries(customDrafts[memberId]).forEach(([fieldId, value]) => {
        if (value === '') {
          customOps.push(
            supabase.from('club_member_custom_values')
              .delete()
              .eq('member_id', memberId)
              .eq('field_id', fieldId) as unknown as Promise<{ error: unknown }>
          );
        } else {
          customOps.push(
            supabase.from('club_member_custom_values')
              .upsert({ member_id: memberId, field_id: fieldId, value }, { onConflict: 'member_id,field_id' }) as unknown as Promise<{ error: unknown }>
          );
        }
      });
    });

    const results = await Promise.all([...memberOps, ...customOps]);
    const failed = results.filter(r => (r as { error?: unknown }).error).length;
    setBulkSaving(false);
    setShowSaveModal(false);
    if (failed > 0) {
      showToast(`${failed}건 저장 실패. 다시 시도해주세요.`);
      return;
    }
    setMembers(prev => prev.map(m => drafts[m.id] ? { ...m, ...drafts[m.id] } : m));
    // 커스텀 값을 새로 반영
    setCustomValues(prev => {
      const next = { ...prev };
      customRowIds.forEach(memberId => {
        const row = { ...(next[memberId] ?? {}) };
        Object.entries(customDrafts[memberId]).forEach(([fieldId, value]) => {
          if (value === '') delete row[fieldId];
          else row[fieldId] = value;
        });
        if (Object.keys(row).length === 0) delete next[memberId];
        else next[memberId] = row;
      });
      return next;
    });
    setDrafts({});
    setCustomDrafts({});
    showToast(`저장되었습니다.`);
  };

  const addCustomField = async (name: string) => {
    if (!adminClubId || !name.trim()) return;
    const order = customFields.length;
    const { error } = await supabase
      .from('club_custom_fields')
      .insert({ club_id: adminClubId, name: name.trim(), display_order: order });
    if (error) {
      showToast(error.code === '23505' ? '같은 이름의 필드가 이미 있습니다.' : '필드 추가에 실패했습니다.');
      return;
    }
    await loadCustomFields(adminClubId);
    showToast('필드가 추가되었습니다.');
  };

  const deleteCustomField = async (fieldId: string) => {
    if (!adminClubId) return;
    const { error } = await supabase.from('club_custom_fields').delete().eq('id', fieldId);
    if (error) { showToast('필드 삭제에 실패했습니다.'); return; }
    // 해당 필드의 drafts/hidden 정리
    setCustomDrafts(prev => {
      const next: typeof prev = {};
      Object.entries(prev).forEach(([memberId, fieldDrafts]) => {
        const remaining = { ...fieldDrafts };
        delete remaining[fieldId];
        if (Object.keys(remaining).length > 0) next[memberId] = remaining;
      });
      return next;
    });
    if (hiddenCustomCols.has(fieldId)) {
      const next = new Set(hiddenCustomCols);
      next.delete(fieldId);
      persistHiddenCols(next);
    }
    await loadCustomFields(adminClubId);
    showToast('필드가 삭제되었습니다.');
  };

  const handleExportExcel = async () => {
    const rows = filtered.map(m => {
      const base: Record<string, string | number | null | undefined> = {
        '이름': memberName(m),
        '학교': memberUniversity(m),
        '기수': m.generation ?? '',
        '출석률': m.attendanceRate != null ? `${m.attendanceRate}%` : '',
        '상태': m.status,
      };
      customFields.forEach(f => {
        base[f.name] = customValues[m.id]?.[f.id] ?? '';
      });
      return base;
    });
    await downloadExcel(rows, '부원명단', '부원');
    showToast(`${rows.length}명의 명단을 다운로드했습니다.`);
  };

  const toggleCustomColVisibility = (fieldId: string) => {
    const next = new Set(hiddenCustomCols);
    if (next.has(fieldId)) next.delete(fieldId);
    else next.add(fieldId);
    persistHiddenCols(next);
  };

  const getVal = <K extends keyof MemberDraft>(m: Member, key: K): string => {
    const draft = drafts[m.id];
    if (draft && key in draft) return (draft[key] as string) ?? '';
    return (m[key] as string) ?? '';
  };

  const matchesSearch = (m: Member) =>
    !search ||
    memberName(m).includes(search) ||
    memberUniversity(m).includes(search);
  const matchesTab = (m: Member) => {
    if (activeTab !== 'active-gen') return true;
    if (m.status !== '활동중') return false;
    if (!currentGeneration) return true;
    return m.generation === currentGeneration;
  };
  const matchesColFilters = (m: Member) => {
    for (const [col, vals] of Object.entries(colFilters)) {
      if (!vals || vals.size === 0) continue;
      const v = ((m as unknown) as Record<string, unknown>)[col];
      const display = v == null || v === '' ? '(미지정)' : String(v);
      if (!vals.has(display)) return false;
    }
    return true;
  };
  const filtered = members.filter(m => matchesTab(m) && matchesSearch(m) && matchesColFilters(m));

  const uniqueValues = (col: keyof Member): string[] => {
    const pool = members.filter(matchesTab);
    const set = new Set<string>();
    pool.forEach(m => {
      const v = m[col];
      set.add(v == null || v === '' ? '(미지정)' : String(v));
    });
    return Array.from(set).sort();
  };

  const toggleColFilter = (col: string, value: string) => {
    setColFilters(prev => {
      const next = { ...prev };
      const set = new Set(next[col] ?? []);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      if (set.size === 0) delete next[col];
      else next[col] = set;
      return next;
    });
  };

  const clearColFilter = (col: string) => {
    setColFilters(prev => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
  };

  const draftMemberIds = new Set([
    ...Object.keys(drafts),
    ...Object.keys(customDrafts),
  ]);
  const draftCount = draftMemberIds.size;
  const visibleCustomFields = customFields.filter(f => !hiddenCustomCols.has(f.id));

  const chartData = useMemo(() => {
    const byGen = new Map<string, number[]>();
    members.forEach(m => {
      if (!m.generation || m.attendanceRate == null) return;
      if (!byGen.has(m.generation)) byGen.set(m.generation, []);
      byGen.get(m.generation)!.push(m.attendanceRate);
    });
    return Array.from(byGen.entries())
      .map(([generation, rates]) => ({
        generation,
        avg: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length),
        count: rates.length,
      }))
      .sort((a, b) => a.generation.localeCompare(b.generation));
  }, [members]);
  const selectedCount = selectedIds.size;
  const allVisibleChecked = filtered.length > 0 && filtered.every(m => selectedIds.has(m.id));

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (allVisibleChecked) {
        const next = new Set(prev);
        filtered.forEach(m => next.delete(m.id));
        return next;
      }
      const next = new Set(prev);
      filtered.forEach(m => next.add(m.id));
      return next;
    });
  };

  const applyBulk = (patch: MemberDraft) => {
    setDrafts(prev => {
      const next = { ...prev };
      selectedIds.forEach(id => {
        next[id] = { ...(next[id] ?? {}), ...patch };
      });
      return next;
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-black bg-white flex flex-col p-4 overflow-y-auto shrink-0">
          <AdminSidebar />
        </aside>

        <main className="flex-1 bg-gray-100 p-8 overflow-y-auto">
          <div className="max-w-5xl flex flex-col gap-6">
            <div className="flex justify-between items-end border-b border-black pb-6">
              <div>
                <h2 className="text-4xl font-black mb-2">부원 명단 관리</h2>
                <p className="text-gray-500 font-bold">동아리 멤버 현황 및 역할/상태를 관리합니다.</p>
              </div>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-2 border border-black font-black bg-orange-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-px active:translate-y-1 active:shadow-none flex items-center gap-2"
              >
                <UserPlus className="w-5 h-5" /> 구성원 추가
              </button>
            </div>

            {/* 현재 활동 기수 배너 */}
            <div className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-orange-500" />
                <span className="font-black text-sm">현재 활동 기수</span>
              </div>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setGenPickerOpen(v => !v); }}
                  className="px-3 py-1.5 border-2 border-black font-black text-sm flex items-center gap-1 bg-white hover:bg-gray-100 min-w-[100px] justify-between"
                >
                  {currentGeneration ?? '미지정'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {genPickerOpen && (
                  <div
                    className="absolute top-full left-0 mt-1 z-20 bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] min-w-[140px] max-h-60 overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                  >
                    {generations.length === 0 ? (
                      <p className="px-3 py-2 text-xs font-bold text-gray-400">먼저 [기수 관리]에서 기수를 추가하세요.</p>
                    ) : (
                      <>
                        <button
                          onClick={async () => {
                            const r = await updateClubGenerations(generations, null);
                            setGenPickerOpen(false);
                            if (r.error) showToast(`변경 실패: ${r.error}`);
                          }}
                          className="block w-full text-left px-3 py-2 text-xs font-bold hover:bg-gray-50 border-b border-gray-200 text-gray-500"
                        >
                          (미지정)
                        </button>
                        {generations.map(g => (
                          <button
                            key={g}
                            onClick={async () => {
                              const r = await updateClubGenerations(generations, g);
                              setGenPickerOpen(false);
                              if (r.error) showToast(`변경 실패: ${r.error}`);
                            }}
                            className={`block w-full text-left px-3 py-2 text-sm font-bold hover:bg-orange-50 ${g === currentGeneration ? 'bg-orange-100' : ''}`}
                          >
                            {g}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowCloseGenModal(true)}
                disabled={!currentGeneration}
                className="px-3 py-1.5 border-2 border-black bg-white hover:bg-red-50 font-black text-xs flex items-center gap-1 disabled:opacity-40"
                title="현재 기수의 활동중 부원을 모두 '수료' 처리합니다."
              >
                <Archive className="w-3 h-3" /> 기수 마감
              </button>
              <button
                onClick={() => setShowGenManager(true)}
                className="ml-auto px-3 py-1.5 border-2 border-black bg-white hover:bg-gray-100 font-black text-xs flex items-center gap-1"
              >
                <Settings className="w-3 h-3" /> 기수 목록 관리
              </button>
            </div>

            {/* 탭 */}
            <div className="flex gap-0 border-2 border-black w-fit">
              <button
                onClick={() => setActiveTab('active-gen')}
                className={`px-5 py-2.5 font-black text-sm border-r-2 border-black transition-colors flex items-center gap-2 ${
                  activeTab === 'active-gen' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" /> 현재 활동 기수
              </button>
              <button
                onClick={() => setActiveTab('all-members')}
                className={`px-5 py-2.5 font-black text-sm border-r-2 border-black transition-colors flex items-center gap-2 ${
                  activeTab === 'all-members' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" /> 전체 명단 및 이전 기수
              </button>
              <button
                onClick={() => setActiveTab('join-requests')}
                className={`px-5 py-2.5 font-black text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'join-requests' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'
                }`}
              >
                <Bell className="w-4 h-4" />
                합류 신청
                {joinRequests.length > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 font-black rounded-full">
                    {joinRequests.length}
                  </span>
                )}
              </button>
            </div>

            {/* ── 합류 신청 탭 ───────────────────────────────────── */}
            {activeTab === 'join-requests' && (
              <div className="flex flex-col gap-3">
                {joinFetching ? (
                  <div className="flex justify-center py-16">
                    <Loader className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                ) : joinRequests.length === 0 ? (
                  <div className="bg-white border border-black p-12 text-center">
                    <Bell className="w-10 h-10 mx-auto text-gray-200 mb-3" />
                    <p className="font-bold text-gray-400">대기 중인 합류 신청이 없습니다.</p>
                  </div>
                ) : (
                  joinRequests.map(req => (
                    <div key={req.id} className="bg-white border border-black p-5 flex flex-col gap-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-lg">{req.profiles?.name ?? '—'}</p>
                          <p className="text-sm font-bold text-gray-400">{req.profiles?.email}</p>
                          {(req.profiles?.university || req.profiles?.major) && (
                            <p className="text-sm font-bold text-gray-400">
                              {[req.profiles.university, req.profiles.major].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {req.role_title && (
                            <span className="inline-block border-2 border-black px-2 py-0.5 text-xs font-black mb-1">
                              희망 직책: {req.role_title}
                            </span>
                          )}
                          <p className="text-xs font-bold text-gray-400">
                            {formatDate(req.created_at)}
                          </p>
                        </div>
                      </div>

                      {req.intro && (
                        <div className="bg-gray-50 border border-gray-200 px-4 py-3 text-sm font-bold text-gray-600 whitespace-pre-line">
                          {req.intro}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleJoinDecision(req, '거절')}
                          disabled={joinProcessing[req.id]}
                          className="flex-1 py-2.5 border-2 border-black font-black text-sm hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
                        >
                          {joinProcessing[req.id] ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                          거절
                        </button>
                        <button
                          onClick={() => handleJoinDecision(req, '승인')}
                          disabled={joinProcessing[req.id]}
                          className="flex-1 py-2.5 bg-orange-500 border-2 border-black font-black text-sm hover:bg-black hover:text-orange-500 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                        >
                          {joinProcessing[req.id] ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                          승인 (운영진 등록)
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── 부원 명단 탭 (현재 활동 기수 / 전체 명단) ───────── */}
            {(activeTab === 'active-gen' || activeTab === 'all-members') && <>
            {selectedCount > 0 ? (
              <div className="flex justify-between items-center bg-orange-500 border-2 border-black p-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm">
                    <strong>{selectedCount}명</strong> 선택됨
                  </span>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs font-black underline hover:no-underline"
                  >
                    선택 취소
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value=""
                    onChange={e => {
                      if (!e.target.value) return;
                      applyBulk({ status: e.target.value as MemberStatus });
                      e.target.value = '';
                    }}
                    className="px-3 py-1.5 border-2 border-black bg-white font-black text-xs cursor-pointer outline-none"
                  >
                    <option value="">상태 변경 ▾</option>
                    {(['활동중','수료','탈퇴','활동정지'] as MemberStatus[]).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                {activeTab === 'active-gen' ? (
                  <div className="flex items-center gap-2 px-4 py-2 border border-black bg-black text-white font-black">
                    <Users className="w-4 h-4" />
                    활동중 <span className="bg-white text-black px-2 py-0.5 rounded-full text-xs">{members.filter(m => m.status === '활동중').length}명</span>
                  </div>
                ) : (
                  <div className="flex items-stretch border border-black bg-black text-white font-black">
                    <div className="flex items-center gap-2 px-4 py-2 border-r border-white/30">
                      <Users className="w-4 h-4" />
                      전체 <span className="bg-white text-black px-2 py-0.5 rounded-full text-xs">{members.length}명</span>
                    </div>
                    {(['활동중','수료','탈퇴','활동정지'] as MemberStatus[]).map(s => {
                      const cnt = members.filter(m => m.status === s).length;
                      return (
                        <div key={s} className="flex items-center gap-1.5 px-3 py-2 border-r border-white/30 last:border-r-0 text-xs">
                          {s} <span className="bg-white text-black px-1.5 py-0.5 rounded-full">{cnt}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="이름 또는 학과 검색"
                      className="pl-9 pr-4 py-2 border border-black outline-none focus:border-orange-500 font-bold"
                    />
                  </div>
                  <button
                    onClick={handleExportExcel}
                    disabled={filtered.length === 0}
                    title="엑셀 다운로드 (현재 필터링 결과)"
                    className="px-3 py-2 border border-black bg-white hover:bg-gray-100 font-black text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" /> 엑셀
                  </button>
                  <button
                    onClick={() => setShowColumnSettings(true)}
                    title="항목 설정"
                    className="p-2 border border-black bg-white hover:bg-gray-100 font-black"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {draftCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-orange-50 border border-orange-200 text-orange-700 font-bold text-sm">
                <Info className="w-4 h-4 shrink-0" />
                <span>변경된 행은 주황색으로 표시됩니다. 하단의 <strong>저장</strong> 버튼을 눌러 모두 한번에 확정하세요.</span>
              </div>
            )}

            <div className="bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              {fetching ? (
                <div className="flex justify-center py-16"><Loader className="w-8 h-8 animate-spin text-orange-500" /></div>
              ) : members.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-16 text-center">
                  <div className="w-16 h-16 border-2 border-dashed border-gray-200 flex items-center justify-center">
                    <Users className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 font-bold">아직 등록된 부원이 없습니다.</p>
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white font-black text-sm border border-black hover:bg-orange-500 hover:text-black transition-colors shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <UserPlus className="w-4 h-4" /> 첫 구성원 추가하기
                  </button>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-black text-sm">
                      <th className="p-4 font-black w-10">
                        <input
                          type="checkbox"
                          checked={allVisibleChecked}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                          aria-label="전체 선택"
                        />
                      </th>
                      <th className="p-4 font-black">이름</th>
                      <th className="p-4 font-black">학교</th>
                      <ColumnHeaderFilter label="기수" col="generation" colFilters={colFilters} openFilterCol={openFilterCol} setOpenFilterCol={setOpenFilterCol} uniqueValues={uniqueValues} toggleColFilter={toggleColFilter} clearColFilter={clearColFilter} />
                      <th className="p-4 font-black">출석률</th>
                      <ColumnHeaderFilter label="상태" col="status" colFilters={colFilters} openFilterCol={openFilterCol} setOpenFilterCol={setOpenFilterCol} uniqueValues={uniqueValues} toggleColFilter={toggleColFilter} clearColFilter={clearColFilter} />
                      {visibleCustomFields.map(f => (
                        <th key={f.id} className="p-4 font-black">{f.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6 + visibleCustomFields.length} className="p-8 text-center text-gray-500 font-bold">표시할 부원이 없습니다.</td></tr>
                    ) : filtered.map(m => {
                      const isDirty = hasDraft(m.id);
                      const isSelected = selectedIds.has(m.id);
                      return (
                        <tr key={m.id} className={`transition-colors ${isSelected ? 'bg-orange-100' : isDirty ? 'bg-orange-50' : 'hover:bg-gray-50'}`}>
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(m.id)}
                              className="w-4 h-4 accent-orange-500 cursor-pointer"
                              aria-label={`${memberName(m)} 선택`}
                            />
                          </td>
                          <td className="p-4 font-black text-lg">
                            {memberName(m)}
                            {m.role === '운영진' && <Award className="w-4 h-4 inline-block ml-1 text-orange-500" />}
                            {!m.profiles && (
                              <span className="ml-2 px-1.5 py-0.5 bg-gray-100 border border-gray-300 font-bold text-[10px] align-middle text-gray-500">
                                계정 미연결
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-bold text-sm">
                            {memberUniversity(m) || <span className="text-gray-300 font-bold">—</span>}
                          </td>
                          <td className="p-4">
                            <select
                              value={getVal(m, 'generation')}
                              onChange={e => setDraft(m.id, { generation: e.target.value || null })}
                              className="w-24 border border-gray-300 p-1 text-sm font-bold outline-none focus:border-orange-500 bg-white cursor-pointer"
                            >
                              <option value="">—</option>
                              {generations.map(g => <option key={g} value={g}>{g}</option>)}
                              {/* 목록에 없는 기존 값도 표시 */}
                              {getVal(m, 'generation') && !generations.includes(getVal(m, 'generation')) && (
                                <option value={getVal(m, 'generation')}>{getVal(m, 'generation')} (목록 외)</option>
                              )}
                            </select>
                          </td>
                          <td className="p-4">
                            {m.attendanceRate != null ? (
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-2.5 bg-gray-200 border border-gray-300">
                                  <div className="h-full bg-orange-500" style={{ width: `${m.attendanceRate}%` }} />
                                </div>
                                <span className="font-black text-sm">{m.attendanceRate}%</span>
                              </div>
                            ) : <span className="text-gray-400 text-sm font-bold">—</span>}
                          </td>
                          <td className="p-4">
                            <select
                              value={(drafts[m.id]?.status ?? m.status) as string}
                              onChange={e => setDraft(m.id, { status: e.target.value as MemberStatus })}
                              className={`border text-xs font-bold p-1.5 outline-none cursor-pointer ${STATUS_BADGE[(drafts[m.id]?.status ?? m.status) as MemberStatus]}`}
                            >
                              {(['활동중', '수료', '탈퇴', '활동정지'] as MemberStatus[]).map(s => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                          {visibleCustomFields.map(f => (
                            <td key={f.id} className="p-4">
                              <input
                                value={getCustomVal(m.id, f.id)}
                                onChange={e => setCustomDraft(m.id, f.id, e.target.value)}
                                className="w-28 border border-gray-300 p-1 text-sm font-bold outline-none focus:border-orange-500"
                                placeholder="—"
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {chartData.length > 0 && (
              <div className="bg-white border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-5">
                <h3 className="font-black text-sm mb-3 flex items-center gap-2">
                  📊 기수별 평균 출석률
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                    <XAxis dataKey="generation" tick={{ fontWeight: 700, fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => [`${value}%`, '평균 출석률']}
                      labelFormatter={(label: string) => `${label} (${chartData.find(d => d.generation === label)?.count}명)`}
                    />
                    <Bar dataKey="avg" fill="#f97316">
                      <LabelList dataKey="avg" position="top" formatter={(v: number) => `${v}%`} style={{ fontWeight: 700, fontSize: 11 }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            </>}

          </div>
        </main>
      </div>

      {showInviteModal && (
        <InviteModal
          clubId={adminClubId!}
          generations={generations}
          defaultGeneration={currentGeneration ?? ''}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => { showToast('부원이 추가되었습니다.'); if (adminClubId) loadMembers(adminClubId); }}
        />
      )}

      {showGenManager && (
        <GenManagerModal
          generations={generations}
          currentGeneration={currentGeneration}
          onClose={() => setShowGenManager(false)}
          onUpdate={async (next) => {
            const nextCurrent = currentGeneration && !next.includes(currentGeneration) ? null : currentGeneration;
            const r = await updateClubGenerations(next, nextCurrent);
            if (r.error) showToast(`저장 실패: ${r.error}`);
            else showToast('기수 목록이 저장되었습니다.');
            return r;
          }}
        />
      )}

      {showCloseGenModal && currentGeneration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-7 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <Archive className="w-7 h-7 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-2xl font-black mb-1">기수 마감</h2>
                <p className="text-gray-600 font-bold text-sm">
                  <strong className="text-black">{currentGeneration}</strong> 의 활동중 부원
                  ({members.filter(m => m.status === '활동중' && m.generation === currentGeneration).length}명)을
                  모두 <strong className="text-black">수료</strong> 상태로 변경합니다.<br />
                  마감 후에는 현재 활동 기수가 비워집니다.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseGenModal(false)}
                disabled={closingGen}
                className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleCloseCurrentGen}
                disabled={closingGen}
                className="flex-1 py-3 bg-orange-500 text-black border-2 border-black font-black hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {closingGen && <Loader className="w-4 h-4 animate-spin" />}
                마감하기
              </button>
            </div>
          </div>
        </div>
      )}

      {showColumnSettings && (
        <ColumnSettingsModal
          fields={customFields}
          hiddenCols={hiddenCustomCols}
          onAdd={addCustomField}
          onDelete={deleteCustomField}
          onToggleVisibility={toggleCustomColVisibility}
          onClose={() => setShowColumnSettings(false)}
        />
      )}

      {/* 하단 고정 저장 바 (drafts 있을 때만) */}
      {draftCount > 0 && (activeTab === 'active-gen' || activeTab === 'all-members') && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-orange-500 border-2 border-black px-6 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4">
          <span className="font-black text-sm">
            <strong>{draftCount}명</strong>의 변경사항이 있습니다
          </span>
          <button
            onClick={() => {
              setDrafts({});
              setCustomDrafts({});
              showToast('변경사항을 취소했습니다.');
            }}
            className="px-3 py-1.5 border-2 border-black bg-white font-black text-xs hover:bg-gray-100"
          >
            취소
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={bulkSaving}
            className="px-4 py-1.5 bg-black text-white font-black text-xs border-2 border-black hover:bg-gray-800 disabled:opacity-50 flex items-center gap-1"
          >
            {bulkSaving ? <Loader className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            저장
          </button>
        </div>
      )}

      {/* 일괄 저장 확인 모달 */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8 flex flex-col gap-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-7 h-7 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-2xl font-black mb-1">변경사항 저장</h2>
                <p className="text-gray-600 font-bold text-sm">
                  총 <strong className="text-black">{draftCount}명</strong>의 회원 정보가 변경되었습니다.<br />
                  정말로 저장하시겠습니까?
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                disabled={bulkSaving}
                className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={saveAll}
                disabled={bulkSaving}
                className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {bulkSaving && <Loader className="w-4 h-4 animate-spin" />}
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 z-50 bg-black text-white px-6 py-4 border border-white font-bold flex items-center gap-2 shadow-[4px_4px_0px_0px_rgba(249,115,22,0.5)]">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}
    </div>
  );
}

interface ColumnHeaderFilterProps {
  label: string;
  col: keyof Member;
  colFilters: Record<string, Set<string>>;
  openFilterCol: string | null;
  setOpenFilterCol: (v: string | null) => void;
  uniqueValues: (col: keyof Member) => string[];
  toggleColFilter: (col: string, value: string) => void;
  clearColFilter: (col: string) => void;
}

function ColumnHeaderFilter({
  label, col, colFilters, openFilterCol, setOpenFilterCol,
  uniqueValues, toggleColFilter, clearColFilter,
}: ColumnHeaderFilterProps) {
  const active = colFilters[col as string];
  const isActive = active && active.size > 0;
  const isOpen = openFilterCol === col;
  return (
    <th className="p-4 font-black relative">
      <div className="flex items-center gap-1">
        {label}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpenFilterCol(isOpen ? null : (col as string));
          }}
          className={`p-0.5 hover:bg-gray-200 ${isActive ? 'text-orange-500' : 'text-gray-400'}`}
          aria-label={`${label} 필터`}
        >
          <Filter className="w-3 h-3" />
        </button>
      </div>
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-1 bg-white border-2 border-black z-20 p-2 min-w-[140px] max-h-60 overflow-y-auto shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-sans text-left normal-case"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-1 pb-1 border-b border-gray-200">
            <span className="text-xs font-black">필터</span>
            {isActive && (
              <button
                onClick={() => clearColFilter(col as string)}
                className="text-xs text-orange-500 font-black hover:underline"
              >
                초기화
              </button>
            )}
          </div>
          {(() => {
            const values = uniqueValues(col);
            if (values.length === 0) return <p className="text-xs font-bold text-gray-400 py-1">값 없음</p>;
            return values.map(v => (
              <label key={v} className="flex items-center gap-1.5 py-0.5 cursor-pointer text-xs font-bold hover:bg-gray-50 px-1">
                <input
                  type="checkbox"
                  checked={active?.has(v) ?? false}
                  onChange={() => toggleColFilter(col as string, v)}
                  className="w-3 h-3 accent-orange-500"
                />
                {v}
              </label>
            ));
          })()}
        </div>
      )}
    </th>
  );
}

interface ColumnSettingsModalProps {
  fields: CustomField[];
  hiddenCols: Set<string>;
  onAdd: (name: string) => Promise<void>;
  onDelete: (fieldId: string) => Promise<void>;
  onToggleVisibility: (fieldId: string) => void;
  onClose: () => void;
}

function ColumnSettingsModal({ fields, hiddenCols, onAdd, onDelete, onToggleVisibility, onClose }: ColumnSettingsModalProps) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CustomField | null>(null);

  const submit = async () => {
    if (!newName.trim() || adding) return;
    setAdding(true);
    await onAdd(newName);
    setNewName('');
    setAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-7 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <Settings className="w-5 h-5" /> 항목 설정
            </h2>
            <p className="text-xs font-bold text-gray-500 mt-1">동아리 고유 항목을 추가하거나 숨길 수 있습니다.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        {/* 기본 항목 안내 */}
        <div className="bg-gray-50 border border-gray-200 p-3 text-xs font-bold text-gray-500">
          기본 항목(이름, 학교, 기수, 출석률, 상태)은 항상 표시됩니다.
        </div>

        {/* 추가 항목 */}
        <div className="flex flex-col gap-2">
          <label className="font-black text-sm">운영진 추가 항목</label>
          {fields.length === 0 ? (
            <p className="text-xs font-bold text-gray-400 py-2">아직 추가된 항목이 없습니다.</p>
          ) : (
            <div className="flex flex-col border-2 border-black">
              {fields.map(f => {
                const hidden = hiddenCols.has(f.id);
                return (
                  <div key={f.id} className="flex items-center justify-between px-3 py-2 border-b border-gray-200 last:border-b-0">
                    <span className={`font-bold text-sm ${hidden ? 'text-gray-400 line-through' : ''}`}>{f.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleVisibility(f.id)}
                        title={hidden ? '표시' : '숨기기'}
                        className="p-1.5 hover:bg-gray-100 text-gray-500 hover:text-black"
                      >
                        {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setDeleteTarget(f)}
                        title="삭제"
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 새 항목 추가 */}
        <div className="flex flex-col gap-1">
          <label className="font-black text-sm">새 항목 추가</label>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              placeholder="예: MBTI, 회비 납부, 포트폴리오 등"
              className="flex-1 p-2 border-2 border-black font-bold text-sm outline-none focus:border-orange-500"
            />
            <button
              onClick={submit}
              disabled={!newName.trim() || adding}
              className="px-3 py-2 bg-black text-white border-2 border-black font-black text-xs hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center gap-1"
            >
              {adding ? <Loader className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              추가
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="py-2.5 border-2 border-black font-black hover:bg-gray-100 text-sm"
        >
          닫기
        </button>

        {deleteTarget && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-lg font-black">항목 삭제</h3>
                  <p className="text-sm font-bold text-gray-600 mt-1">
                    <strong className="text-black">"{deleteTarget.name}"</strong> 항목과 모든 부원의 해당 값이 삭제됩니다.<br />
                    되돌릴 수 없습니다.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-2 border-2 border-black font-black text-sm hover:bg-gray-100"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    await onDelete(deleteTarget.id);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 py-2 bg-red-500 text-white border-2 border-black font-black text-sm hover:bg-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InviteModal({
  clubId, generations, defaultGeneration, onClose, onSuccess,
}: {
  clubId: string;
  generations: string[];
  defaultGeneration: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [mode, setMode] = useState<'email' | 'manual'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [university, setUniversity] = useState('');
  const [generation, setGeneration] = useState(defaultGeneration);
  const [role, setRole] = useState<'부원' | '운영진'>('부원');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async () => {
    setError('');
    if (mode === 'email') {
      if (!email.trim()) return;
      setLoading(true);
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim())
        .maybeSingle();
      if (!profile) { setError('해당 이메일로 가입된 계정을 찾을 수 없습니다.'); setLoading(false); return; }

      const { error: insertErr } = await supabase
        .from('club_members')
        .insert({ club_id: clubId, user_id: profile.id, role, generation: generation.trim() || null, status: '활동중' });
      setLoading(false);
      if (insertErr?.code === '23505') { setError('이미 등록된 구성원입니다.'); return; }
      if (insertErr) { setError(insertErr.message); return; }
      onSuccess(); onClose();
      return;
    }

    // manual mode — 계정 없이 추가
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    setLoading(true);
    const { error: insertErr } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id: null,
        role,
        generation: generation.trim() || null,
        status: '활동중',
        display_name: name.trim(),
        display_university: university.trim() || null,
      });
    setLoading(false);
    if (insertErr) { setError(insertErr.message); return; }
    onSuccess(); onClose();
  };

  const canSubmit = mode === 'email' ? !!email.trim() : !!name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-8 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">구성원 추가</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex border-2 border-black">
          <button
            type="button"
            onClick={() => { setMode('email'); setError(''); }}
            className={`flex-1 py-2 font-black text-sm border-r-2 border-black ${mode === 'email' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
          >
            이메일 초대
          </button>
          <button
            type="button"
            onClick={() => { setMode('manual'); setError(''); }}
            className={`flex-1 py-2 font-black text-sm ${mode === 'manual' ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'}`}
          >
            계정 없이 추가
          </button>
        </div>

        <p className="text-gray-500 font-bold text-sm">
          {mode === 'email'
            ? 'OURCLUB에 가입된 계정을 이메일로 검색해 부원 또는 운영진으로 추가합니다.'
            : '아직 OURCLUB 계정이 없는 사람도 명단에 등록할 수 있습니다.'}
        </p>

        <div className="flex flex-col gap-4">
          {mode === 'email' ? (
            <div className="flex flex-col gap-1">
              <label className="font-black text-sm">이메일 *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="gildong@university.ac.kr"
                className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-black text-sm">이름 *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동"
                  className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-black text-sm">학교</label>
                <input value={university} onChange={e => setUniversity(e.target.value)} placeholder="OO대학교"
                  className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500" />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="font-black text-sm">기수</label>
              <select value={generation} onChange={e => setGeneration(e.target.value)}
                className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500 bg-white cursor-pointer">
                <option value="">선택 안 함</option>
                {generations.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-black text-sm">역할</label>
              <select value={role} onChange={e => setRole(e.target.value as '부원' | '운영진')}
                className="w-full p-3 border border-black font-bold outline-none focus:border-orange-500 bg-white cursor-pointer">
                <option>부원</option>
                <option>운영진</option>
              </select>
            </div>
          </div>
          {role === '운영진' && (
            <p className="text-xs font-bold text-orange-600">
              운영진은 워크스페이스(모집·부원·홈페이지) 관리 권한을 갖습니다.
            </p>
          )}
        </div>
        {error && <p className="text-red-600 font-bold text-sm">{error}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border-2 border-black font-black hover:bg-gray-100">취소</button>
          <button onClick={handleInvite} disabled={loading || !canSubmit}
            className="flex-1 py-3 bg-black text-white font-black hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader className="w-4 h-4 animate-spin" />} 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}

interface GenManagerModalProps {
  generations: string[];
  currentGeneration: string | null;
  onUpdate: (next: string[]) => Promise<{ error: string | null }>;
  onClose: () => void;
}

function GenManagerModal({ generations, currentGeneration, onUpdate, onClose }: GenManagerModalProps) {
  const [list, setList] = useState<string[]>(generations);
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [error, setError] = useState('');

  const addLabel = () => {
    const v = newLabel.trim();
    if (!v) return;
    if (list.includes(v)) { setError('이미 존재하는 기수입니다.'); return; }
    setList([...list, v]);
    setNewLabel('');
    setError('');
  };

  const removeAt = (idx: number) => {
    const target = list[idx];
    if (target === currentGeneration) {
      if (!window.confirm(`${target}는 현재 활동 기수로 지정되어 있습니다. 그래도 삭제하시겠습니까?`)) return;
    }
    setList(list.filter((_, i) => i !== idx));
  };

  const commitEdit = (idx: number) => {
    const v = editingValue.trim();
    if (!v) { setEditingIdx(null); return; }
    if (list.some((g, i) => i !== idx && g === v)) {
      setError('이미 존재하는 기수입니다.');
      return;
    }
    setList(list.map((g, i) => i === idx ? v : g));
    setEditingIdx(null);
    setError('');
  };

  const save = async () => {
    setSaving(true);
    const r = await onUpdate(list);
    setSaving(false);
    if (!r.error) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] w-full max-w-md mx-4 p-7 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2">
              <GraduationCap className="w-5 h-5" /> 기수 목록 관리
            </h2>
            <p className="text-xs font-bold text-gray-500 mt-1">동아리에서 사용할 기수 라벨을 자유롭게 추가/수정/삭제하세요.</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-black text-sm">기수 목록</label>
          {list.length === 0 ? (
            <p className="text-xs font-bold text-gray-400 py-2">아직 등록된 기수가 없습니다.</p>
          ) : (
            <div className="flex flex-col border-2 border-black">
              {list.map((g, idx) => (
                <div key={`${g}-${idx}`} className="flex items-center justify-between px-3 py-2 border-b border-gray-200 last:border-b-0">
                  {editingIdx === idx ? (
                    <input
                      autoFocus
                      value={editingValue}
                      onChange={e => setEditingValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commitEdit(idx); }
                        if (e.key === 'Escape') { setEditingIdx(null); setError(''); }
                      }}
                      onBlur={() => commitEdit(idx)}
                      className="flex-1 p-1 border border-orange-500 font-bold text-sm outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => { setEditingIdx(idx); setEditingValue(g); setError(''); }}
                      className="flex-1 text-left font-bold text-sm hover:text-orange-500"
                    >
                      {g}
                      {g === currentGeneration && (
                        <span className="ml-2 px-1.5 py-0.5 bg-orange-100 border border-orange-300 text-orange-700 font-black text-[10px]">
                          현재
                        </span>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => removeAt(idx)}
                    title="삭제"
                    className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-black text-sm">새 기수 추가</label>
          <div className="flex gap-2">
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLabel(); } }}
              placeholder="예: 14기, 2026-봄"
              className="flex-1 p-2 border-2 border-black font-bold text-sm outline-none focus:border-orange-500"
            />
            <button
              onClick={addLabel}
              disabled={!newLabel.trim()}
              className="px-3 py-2 bg-black text-white border-2 border-black font-black text-xs hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>
          {error && <p className="text-red-600 font-bold text-xs">{error}</p>}
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 border-2 border-black font-black text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 bg-black text-white border-2 border-black font-black text-sm hover:bg-orange-500 hover:text-black disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader className="w-3 h-3 animate-spin" />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
