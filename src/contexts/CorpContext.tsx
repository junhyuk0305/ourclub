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

        console.log("CorpContext: Attempting to fetch corporation for user ID:", user.id, "isMaster:", isMaster);

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
            console.log("CorpContext: Master user initialized with corporation:", data[0].name);
          } else {
            setCorporation(null);
            console.log("CorpContext: No corporations found for master user");
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
            setCorporation(data.corporations as Corporation);
            console.log("CorpContext: Corporation found:", (data.corporations as Corporation).name);
          } else {
            setCorporation(null);
            console.log("CorpContext: No corporation found for user ID:", user.id);
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
  }, [user, isMaster]);

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
