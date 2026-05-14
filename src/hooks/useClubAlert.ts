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
      setActive(false);
    } else {
      await supabase
        .from('club_alerts')
        .upsert({ user_id: user.id, club_id: clubId });
      setActive(true);
    }
    setLoading(false);
    return 'toggled';
  };

  return { active, toggle, loading };
}
