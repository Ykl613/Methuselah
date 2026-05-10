"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const supabase = createClient();

  // On mount: only fetch the unread COUNT (super fast, no payload)
  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true })
        .eq("user_id", userId).eq("is_read", false);
      setUnreadCount(count || 0);
    };
    fetchCount();

    // Subscribe to changes - real-time updates of count
    const channel = supabase.channel("notif").on("postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      () => fetchCount()
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  // Lazy load: only fetch full list when user clicks the bell
  const handleOpen = async () => {
    const newOpen = !open;
    setOpen(newOpen);
    if (newOpen && !loaded) {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", userId)
        .order("created_at", { ascending: false }).limit(20);
      setItems((data as Notification[]) || []);
      setLoaded(true);
    }
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setItems(items.map(i => ({ ...i, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="relative">
      <button onClick={handleOpen}
        className="relative w-10 h-10 bg-white border border-border rounded-ios hover:bg-bg-elevated flex items-center justify-center transition-all active:scale-95">
        <i className="ti ti-bell text-[20px] text-text-primary" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red text-white text-[10px] font-bold rounded-full border-2 border-white min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-ios-lg shadow-xl border border-border overflow-hidden z-50">
          <div className="px-4 py-3.5 border-b border-border flex justify-between items-center">
            <span className="text-[15px] font-semibold tracking-[-0.2px]">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[12px] text-accent font-semibold">Mark all read</button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!loaded && (
              <div className="p-8 text-center">
                <div className="text-[12px] text-text-muted">Loading...</div>
              </div>
            )}
            {loaded && items.length === 0 && (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-bg-elevated rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="ti ti-bell-off text-[20px] text-text-subtle" aria-hidden />
                </div>
                <div className="text-[13px] text-text-muted">No notifications yet</div>
              </div>
            )}
            {items.map((n) => (
              <div key={n.id} className={`px-4 py-3 border-b border-border last:border-0 flex gap-3 ${!n.is_read ? "bg-accent-soft/30" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-text-primary font-semibold">{n.title}</div>
                  {n.body && <div className="text-[12px] text-text-secondary mt-0.5">{n.body}</div>}
                  <div className="text-[11px] text-text-muted mt-1">{new Date(n.created_at).toLocaleString()}</div>
                </div>
                {!n.is_read && <div className="w-2 h-2 bg-accent rounded-full mt-1.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
