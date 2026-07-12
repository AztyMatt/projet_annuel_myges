"use client";

import { useEffect, useState } from "react";
import { UserCog, Lock, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

type SecurityUser = { id: string; lockedUntil: string | null; passwordExpired: boolean };

type AuditLogEntry = {
    id: string;
    action: string;
    entityName: string;
    entityId: string;
    createdAt: string;
};

async function loadKpis() {
    const [{ users: securityUsers }, students, instructors, admins] = await Promise.all([
        api.get<{ users: SecurityUser[] }>("/admin/security/users"),
        api.get<{ userId: string }[]>("/students"),
        api.get<{ userId: string }[]>("/instructors"),
        api.get<{ userId: string }[]>("/admins"),
    ]);
    const knownUserIds = new Set([...students, ...instructors, ...admins].map((r) => r.userId));

    return {
        pendingRole: securityUsers.filter((u) => !knownUserIds.has(u.id)).length,
        locked: securityUsers.filter((u) => u.lockedUntil && new Date(u.lockedUntil) > new Date()).length,
        passwordExpired: securityUsers.filter((u) => u.passwordExpired).length,
    };
}

export default function DashboardSuperAdmin() {
    const [kpis, setKpis] = useState<{ pendingRole: number; locked: number; passwordExpired: number } | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const [kpiData, logs] = await Promise.all([loadKpis(), api.get<AuditLogEntry[]>("/audit-logs")]);
                setKpis(kpiData);
                setAuditLogs(
                    [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8),
                );
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger le tableau de bord.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Super Administration</h2>
                <p className="text-gray-500 text-sm mt-1 capitalize">
                    {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && kpis && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Link
                            href="/superadmin/gestion"
                            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
                                <UserCog size={18} className="text-gray-600" />
                            </div>
                            <div className="text-2xl font-black text-gray-900">{kpis.pendingRole}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Comptes en attente d&apos;attribution de rôle</div>
                        </Link>
                        <Link
                            href="/superadmin/gestion"
                            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                        >
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                                <Lock size={18} className="text-red-600" />
                            </div>
                            <div className="text-2xl font-black text-gray-900">{kpis.locked}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Comptes verrouillés</div>
                        </Link>
                        <Link
                            href="/superadmin/gestion"
                            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                        >
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                                <AlertTriangle size={18} className="text-orange-600" />
                            </div>
                            <div className="text-2xl font-black text-gray-900">{kpis.passwordExpired}</div>
                            <div className="text-xs text-gray-500 mt-0.5">Mots de passe expirés</div>
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between p-5 border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <Clock size={16} className="text-gray-500" />
                                <h3 className="font-bold text-gray-900 text-sm">Derniers événements d&apos;audit</h3>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {auditLogs.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">Aucun événement.</p>}
                            {auditLogs.map((log) => (
                                <div key={log.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-800">{log.action}</span>
                                        <span className="text-sm text-gray-500"> — {log.entityName}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 flex-shrink-0">
                                        {new Date(log.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
