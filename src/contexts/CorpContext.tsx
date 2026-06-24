import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export interface Corporation {
  id: string;
  name: string;
  business_number: string | null;
  credit_balance: number;
}

interface CorpContextValue {
  corporation: Corporation | null;
  corpId: string | null;
  isCorpUser: boolean;
  loading: boolean;
}

const CorpContext = createContext<CorpContextValue | null>(null);

export function CorpProvider({ children }: { children: React.ReactNode }) {
  const { user, isMaster } = useAuth();
  const [corporation, setCorporation] = useState<Corporation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCorp = async () => {
      try {
        if (!user) {
          setLoading(false);
          setCorporation(null);
          return;
        }

        if (isMaster) {
          // 마스터 계정: 모든 기업 조회, 첫 번째 기업으로 초기화
          const { data, error } = await supabase
            .from('corporations')
            .select('*')
            .limit(1);

          if (error) {
            console.error("CorpContext: Error fetching first corporation for master:", error.message);
            setLoading(false);
            return;
          }

          if (data && data.length > 0) {
            setCorporation(data[0] as Corporation);
          } else {
            setCorporation(null);
          }
        } else {
          // 일반 기업담당자: 본인이 속한 기업 조회
          const { data, error } = await supabase
            .from('corp_members')
            .select('corporations(*)')
            .eq('user_id', user.id)
            .limit(1)
            .maybeSingle();

          if (error) {
            console.error("CorpContext: Error fetching corporation:", error.message);
          }

          if (data && data.corporations) {
            setCorporation(data.corporations as unknown as Corporation);
          } else {
            setCorporation(null);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("CorpContext: Exception fetching corporation:", err);
        setCorporation(null);
        setLoading(false);
      }
    };

    fetchCorp();
    // user?.id 기준 비교: TOKEN_REFRESHED·포커스 복귀로 user 객체 참조만 바뀔 때 재실행 방지
    // (AdminContext 와 동일 패턴 — 미적용 시 자동저장/포커스 시 컨텍스트가 churn 되어 화면이 새로고침되는 체감)
  }, [user?.id, isMaster]);

  return (
    <CorpContext.Provider value={{
      corporation,
      corpId: corporation?.id ?? null,
      isCorpUser: !!corporation,
      loading,
    }}>
      {children}
    </CorpContext.Provider>
  );
}

export function useCorp() {
  const ctx = useContext(CorpContext);
  if (!ctx) throw new Error('useCorp must be used within a CorpProvider');
  return ctx;
}
