"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Gift, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { formatDateTime, formatCurrency, maskName } from "@/lib/utils";

interface NotificationRow {
  id: string;
  chain_depth: number;
  position: number;
  commission_type: "joining_bonus" | "profit_share";
  is_read: boolean;
  created_at: string;
  source_user?: { full_name: string | null; email: string } | null;
  commission_record?: { commission_earned: number } | null;
}

export default function NotificationsBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("commission_notifications")
        .select(
          "*, source_user:users!commission_notifications_source_user_id_fkey(full_name, email), commission_record:commission_records(commission_earned)"
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        logger.error("Failed to load notifications", { error });
        setLoading(false);
        return;
      }
      setNotifications((data as any) ?? []);
      setLoading(false);
    };
    load();
  }, [userId]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleOpen = async () => {
    const willOpen = !open;
    setOpen(willOpen);

    if (willOpen && unreadCount > 0) {
      const supabase = createClient();
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      await supabase.from("commission_notifications").update({ is_read: true }).in("id", unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const positionLabel = (p: number) => (p === 1 ? "Nearest" : `${p}${["", "st", "nd", "rd"][p] ?? "th"}`);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-text-muted hover:text-gold"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 max-h-[400px] w-80 overflow-y-auto rounded-lg border border-white/10 bg-slate-surface p-2 shadow-glass">
          <p className="px-2 py-1.5 text-xs font-semibold text-text-primary">Notifications</p>
          {loading && <p className="px-2 py-4 text-center text-xs text-text-muted">Loading...</p>}
          {!loading && notifications.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-text-muted">No notifications yet.</p>
          )}
          {notifications.map((n) => (
            <div key={n.id} className="rounded-md px-2 py-2.5 hover:bg-white/5">
              <div className="flex items-start gap-2">
                {n.commission_type === "joining_bonus" ? (
                  <Gift className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                ) : (
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                )}
                <div className="flex-1">
                  <p className="text-xs text-text-primary/90">
                    <span className="font-medium">
                      {n.source_user?.full_name ? maskName(n.source_user.full_name) : "A referral"}
                    </span>{" "}
                    triggered a {n.commission_type === "joining_bonus" ? "joining bonus" : "profit share"} ,
                    you earned{" "}
                    <span className="text-gold">
                      {n.commission_record ? formatCurrency(n.commission_record.commission_earned) : ""}
                    </span>{" "}
                    as the {positionLabel(n.position)} position in this {n.chain_depth}-layer chain.
                  </p>
                  <p className="mt-1 text-[10px] text-text-muted">{formatDateTime(n.created_at)}</p>
                </div>
              </div>
            </div>
          ))}
          {notifications.length > 0 && (
            <Link
              href="/dashboard/earnings"
              onClick={() => setOpen(false)}
              className="mt-1 block rounded-md px-2 py-2 text-center text-xs text-gold hover:bg-white/5"
            >
              View all earnings →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
