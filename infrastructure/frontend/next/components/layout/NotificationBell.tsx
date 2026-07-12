"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

type Notification = {
    id: string;
    type: string;
    title: string;
    body: string;
    entityName: string | null;
    entityId: string | null;
    isRead: boolean;
    createdAt: string;
};

const POLL_INTERVAL_MS = 30000;

function formatRelativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return `il y a ${diffMin} min`;
    const diffHours = Math.round(diffMin / 60);
    if (diffHours < 24) return `il y a ${diffHours} h`;
    const diffDays = Math.round(diffHours / 24);
    return `il y a ${diffDays} j`;
}

export function NotificationBell() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const refreshUnreadCount = async () => {
        try {
            const { count } = await api.get<{ count: number }>("/notifications/mine/unread-count");
            setUnreadCount(count);
        } catch {
            // best-effort : on ne bloque pas l'UI si le polling échoue une fois
        }
    };

    useEffect(() => {
        void refreshUnreadCount();
        const interval = setInterval(() => void refreshUnreadCount(), POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOpen = async () => {
        const next = !open;
        setOpen(next);
        if (next) {
            setLoading(true);
            try {
                setNotifications(await api.get<Notification[]>("/notifications/mine"));
            } finally {
                setLoading(false);
            }
        }
    };

    const handleMarkAsRead = async (id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
        try {
            await api.post(`/notifications/${id}/read`);
        } catch {
            void refreshUnreadCount();
        }
    };

    const handleMarkAllAsRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            await api.post("/notifications/read-all");
        } catch {
            void refreshUnreadCount();
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => void toggleOpen()}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
                <Bell size={17} className="text-gray-600" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-semibold leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-40 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                        <h3 className="font-bold text-sm text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => void handleMarkAllAsRead()}
                                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                            >
                                <CheckCheck size={12} /> Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
                        {loading && <p className="p-4 text-sm text-gray-400">Chargement…</p>}
                        {!loading && notifications.length === 0 && (
                            <p className="p-4 text-sm text-gray-400">Aucune notification.</p>
                        )}
                        {!loading &&
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={cn("flex items-start gap-2 px-4 py-3", !n.isRead && "bg-blue-50/50")}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-900">{n.title}</div>
                                        <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</div>
                                        <div className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</div>
                                    </div>
                                    {!n.isRead && (
                                        <button
                                            onClick={() => void handleMarkAsRead(n.id)}
                                            title="Marquer comme lu"
                                            className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg text-blue-600 hover:bg-blue-100"
                                        >
                                            <Check size={13} />
                                        </button>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
