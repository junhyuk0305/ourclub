import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';

export function useClubAlert(clubId: string | null | undefined) {
  const { user } = useAuth();
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !clubId) { setActive(false); return; }
    supabase
      .from('club_alerts')
      .select('id')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .maybeSingle()
      .then(({ data }) => setActive(!!data));
  }, [user?.id, clubId]);

  const toggle = async (): Promise<'login_required' | 'toggled'> => {
    if (!user) return 'login_required';
    if (!clubId || loading) return 'toggled';

    setLoading(true);
    if (active) {
      await supabase
        .from('club_alerts')
        .delete()
        .eq('user_id', user.id)
        .eq('club_id', clubId);
      // 마이페이지 스크랩에서도 함께 제거
      await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('target_type', 'CLUB')
        .eq('target_id', clubId);
      setActive(false);
    } else {
      await supabase
        .from('club_alerts')
        .upsert({ user_id: user.id, club_id: clubId });
      // 마이페이지 스크랩에 추가 (중복 방지: 기존 항목 없을 때만 insert)
      const { data: existing } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_type', 'CLUB')
        .eq('target_id', clubId)
        .maybeSingle();
      if (!existing) {
        await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, target_type: 'CLUB', target_id: clubId });
      }
      setActive(true);
    }
    setLoading(false);
    return 'toggled';
  };

  return { active, toggle, loading };
}
