"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  Bell, Trophy, AlertTriangle, CheckCircle2, Zap, Globe,
  Mail, DollarSign, Users, Mountain, Loader2, Trash2,
} from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string;
  read: boolean;
  createdAt: string;
};

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  system: { icon: Mountain, color: "text-[#f5a623]" },
  new_lead: { icon: Users, color: "text-emerald-400" },
  milestone: { icon: Trophy, color: "text-[#f5a623]" },
  warning: { icon: AlertTriangle, color: "text-amber-400" },
  success: { icon: CheckCircle2, color: "text-emerald-400" },
  revenue: { icon: DollarSign, color: "text-emerald-400" },
  campaign: { icon: Zap, color: "text-[#f5a623]" },
  site: { icon: Globe, color: "text-[#e07850]" },
  email: { icon: Mail, color: "text-blue-400" },
};

export default function NotificationsPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (isLoaded && !isSignedIn) router.replace("/sign-in"); }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/notifications")
      .then(r => r.json() as Promise<{ ok: boolean; notifications?: Notification[] }>)
      .then(d => { if (d.ok) setNotifications(d.notifications ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isSignedIn]);

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function clearAll() {
    await fetch("/api/notifications/clear", { method: "POST" }).catch(() => {});
    setNotifications([]);
  }

  if (!isLoaded || !isSignedIn) return null;

  const unread = notifications.filter(n => !n.read).length;

  return (
    <main className="min-h-screen bg-t-bg text-t-text">
      <AppNav />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-20">
        <div className="pt-8 pb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Notifications</h1>
            {unread > 0 && <p className="text-xs text-t-text-faint">{unread} unread</p>}
          </div>
          <div className="flex gap-2">
            {unread > 0 && (
              <button onClick={() => void markAllRead()} className="text-xs text-t-text-faint hover:text-t-text-muted transition">
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button onClick={() => void clearAll()} className="text-xs text-t-text-faint hover:text-red-400 transition">
                Clear all
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 text-t-text-faint animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-t-border bg-t-bg-raised p-8 text-center">
            <Bell className="w-8 h-8 text-t-text-faint mx-auto mb-3" />
            <p className="text-sm font-bold text-t-text-muted">No notifications yet</p>
            <p className="text-xs text-t-text-faint mt-1">Build a business and notifications will start appearing here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const typeInfo = TYPE_ICONS[n.type] ?? TYPE_ICONS.system;
              const Icon = typeInfo.icon;
              const timeAgo = getTimeAgo(n.createdAt);

              return (
                <Link key={n.id} href={n.href || "#"}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition hover:bg-t-bg-raised ${
                    n.read ? "border-t-border" : "border-[#f5a623]/15 bg-[#f5a623]/[0.02]"
                  }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.read ? "bg-t-bg-card" : "bg-[#f5a623]/10"}`}>
                    <Icon className={`w-4 h-4 ${n.read ? "text-t-text-faint" : typeInfo.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${n.read ? "text-t-text-muted" : "text-t-text"}`}>{n.title}</p>
                    <p className="text-xs text-t-text-faint mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-t-text-faint mt-1">{timeAgo}</p>
                  </div>
                  {!n.read && <div className="w-2 h-2 rounded-full bg-[#f5a623] shrink-0 mt-2" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}
