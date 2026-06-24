import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader, Check, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import { formatDate } from '../../../lib/format';

// ──────────────────────────────────────────
// 알림 설정 (placeholder)
// ──────────────────────────────────────────
interface NotifRow {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

function notifTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일 전`;
  return formatDate(iso);
}

export default function NotificationsSection() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) { setItems([]); setLoading(false); return; }
    const { data } = await supabase
      .from('notifications')
      .select('id, title, body, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setItems((data as NotifRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);
  // 알림은 push 구독이 없어, 탭으로 돌아왔을 때 다시 불러와 새 알림/읽음 상태를 반영
  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user?.id]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setItems(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = items.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const open = (n: NotifRow) => {
    if (!n.is_read) markRead(n.id);
    // 내부 경로만 허용 (protocol-relative '//' 및 외부 스킴 차단)
    if (n.link && n.link.startsWith('/') && !n.link.startsWith('//')) navigate(n.link);
  };

  const unread = items.filter(n => !n.is_read).length;

  return (
    <div className="bg-white border border-sand-200 rounded-card shadow-soft p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-black text-ink flex items-center gap-2">
          <Bell className="w-6 h-6 text-brand" strokeWidth={2.5} /> 알림
          {unread > 0 && (
            <span className="px-2 py-0.5 bg-brand text-white text-xs font-black rounded-full">{unread}</span>
          )}
        </h3>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs font-black text-sand-500 hover:text-ink flex items-center gap-1">
            <Check className="w-4 h-4" strokeWidth={2.5} /> 모두 읽음
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-sand-400">
          <Loader className="w-6 h-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-sand-400 gap-3">
          <Bell className="w-10 h-10" strokeWidth={2.5} />
          <p className="font-bold text-sm">아직 받은 알림이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map(n => (
            <button
              key={n.id}
              onClick={() => open(n)}
              className={`text-left flex items-start gap-4 p-4 border rounded-card transition-colors ${
                n.is_read
                  ? 'border-sand-200 bg-white hover:bg-sand-50'
                  : 'border-brand bg-brand-tint hover:bg-brand-tint/70'
              } ${n.link ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${n.is_read ? 'bg-sand-300' : 'bg-brand'}`} />
              <div className="flex-1 min-w-0">
                <p className="font-black text-sm text-ink">{n.title}</p>
                {n.body && <p className="text-xs font-bold text-sand-500 mt-1 whitespace-pre-wrap break-words">{n.body}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-sand-400">{notifTimeAgo(n.created_at)}</span>
                {n.link && <ArrowRight className="w-4 h-4 text-sand-400" strokeWidth={2.5} />}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
