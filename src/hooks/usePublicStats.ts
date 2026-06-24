import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// 공개 영역(홈·푸터·B2B 라운지)에서 노출하는 실집계 수치.
// 익명 SELECT가 허용된 clubs / b2b_projects 만 사용한다. (b2b_applications는 RLS로 차단됨)
export interface PublicStats {
  clubs: number;             // 등록(운영 중) 동아리 수
  certifiedClubs: number;    // 인증(오렌지 뱃지) 동아리 수
  completedProjects: number; // 완료된 B2B 협업 프로젝트 수
}

export function usePublicStats(): PublicStats | null {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [clubs, certified, done] = await Promise.all([
        supabase.from('clubs').select('*', { count: 'exact', head: true }),
        supabase.from('clubs').select('*', { count: 'exact', head: true }).eq('is_certified', true),
        supabase.from('b2b_projects').select('*', { count: 'exact', head: true }).eq('status', '완료'),
      ]);
      if (!alive) return;
      setStats({
        clubs: clubs.count ?? 0,
        certifiedClubs: certified.count ?? 0,
        completedProjects: done.count ?? 0,
      });
    })();
    return () => { alive = false; };
  }, []);

  return stats;
}
