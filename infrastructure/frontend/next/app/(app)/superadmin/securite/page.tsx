"use client";

import { Fragment, useMemo, useState, useEffect } from "react";
import { ChevronDown, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

type AuditLogAction = "CREATE" | "UPDATE" | "DELETE" | "VALIDATE" | "REJECT" | "FREEZE" | "LOGIN" | "OTHER";

type AuditLogValue = Record<string, unknown> | null;

type AuditLog = {
    id: string;
    userId: string;
    action: AuditLogAction;
    entityName: string;
    entityId: string;
    oldValue: AuditLogValue;
    newValue: AuditLogValue;
    createdAt: string;
};

const actionConfig: Record<AuditLogAction, StatusTone> = {
    CREATE: "green",
    UPDATE: "blue",
    DELETE: "red",
    VALIDATE: "emerald",
    REJECT: "orange",
    FREEZE: "purple",
    LOGIN: "gray",
    OTHER: "gray",
};

const PAGE_SIZE = 20;

export default function SecuriteSuperAdmin() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [names, setNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const [userFilter, setUserFilter] = useState("");
    const [entityFilter, setEntityFilter] = useState("");
    const [actionFilter, setActionFilter] = useState<AuditLogAction | "all">("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    useEffect(() => {
        const refresh = async () => {
            setLoading(true);
            setError("");
            try {
                const data = await api.get<AuditLog[]>("/audit-logs");
                setLogs(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

                const uniqueUserIds = Array.from(new Set(data.map((log) => log.userId)));
                const resolved = await Promise.all(
                    uniqueUserIds.map(async (userId) => {
                        const name = await api
                            .get<{ firstname: string; lastname: string }>(`/users/${userId}`)
                            .then((u) => `${u.firstname} ${u.lastname}`)
                            .catch(() => null);
                        return [userId, name] as const;
                    }),
                );
                setNames(Object.fromEntries(resolved.filter((entry): entry is [string, string] => entry[1] !== null)));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger l'audit-log.");
            } finally {
                setLoading(false);
            }
        };
        void refresh();
    }, []);

    const filtered = useMemo(() => {
        return logs.filter((log) => {
            if (userFilter) {
                const needle = userFilter.toLowerCase();
                const matchesId = log.userId.toLowerCase().includes(needle);
                const matchesName = (names[log.userId] ?? "").toLowerCase().includes(needle);
                if (!matchesId && !matchesName) return false;
            }
            if (entityFilter && !log.entityName.toLowerCase().includes(entityFilter.toLowerCase())) return false;
            if (actionFilter !== "all" && log.action !== actionFilter) return false;
            const createdAt = new Date(log.createdAt);
            if (dateFrom && createdAt < new Date(dateFrom)) return false;
            if (dateTo && createdAt > new Date(`${dateTo}T23:59:59`)) return false;
            return true;
        });
    }, [logs, names, userFilter, entityFilter, actionFilter, dateFrom, dateTo]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const resetFilters = () => {
        setUserFilter("");
        setEntityFilter("");
        setActionFilter("all");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    return (
        <div className="space-y-6 max-w-6xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Sécurité — Audit et traçabilité</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Consultation seule des événements consignés (§3.8).
                </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <div>
                        <label className="text-xs font-medium text-gray-500">Utilisateur</label>
                        <input
                            type="text"
                            value={userFilter}
                            onChange={(e) => { setUserFilter(e.target.value); setPage(1); }}
                            placeholder="nom ou uuid…"
                            className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Entité</label>
                        <input
                            type="text"
                            value={entityFilter}
                            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
                            placeholder="grade, absence…"
                            className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Action</label>
                        <select
                            value={actionFilter}
                            onChange={(e) => { setActionFilter(e.target.value as AuditLogAction | "all"); setPage(1); }}
                            className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="all">Toutes</option>
                            {(Object.keys(actionConfig) as AuditLogAction[]).map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500">Du</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500">Au</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                                className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <button
                            onClick={resetFilters}
                            className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                        >
                            Réinitialiser
                        </button>
                    </div>
                </div>
            </div>

            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    {["", "Date", "Utilisateur", "Action", "Entité"].map((h) => (
                                        <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paged.map((log) => (
                                    <Fragment key={log.id}>
                                        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                                            <td className="px-5 py-3 text-gray-400 w-6">
                                                {expandedId === log.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                                            </td>
                                            <td className="px-5 py-3 text-gray-700">
                                                {names[log.userId] ?? `Utilisateur #${log.userId.slice(0, 8)}`}
                                            </td>
                                            <td className="px-5 py-3">
                                                <StatusBadge tone={actionConfig[log.action]}>{log.action}</StatusBadge>
                                            </td>
                                            <td className="px-5 py-3 text-gray-700">
                                                {log.entityName} <span className="text-gray-400">#{log.entityId.slice(0, 8)}</span>
                                            </td>
                                        </tr>
                                        {expandedId === log.id && (
                                            <tr>
                                                <td colSpan={5} className="px-5 pb-4 pt-0 bg-gray-50/50">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="text-xs font-semibold text-gray-500 mb-1">Avant</div>
                                                            <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-700">
                                                                {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : "—"}
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-gray-500 mb-1">Après</div>
                                                            <pre className="text-xs bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-700">
                                                                {log.newValue ? JSON.stringify(log.newValue, null, 2) : "—"}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                                {paged.length === 0 && (
                                    <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Aucun événement trouvé.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {filtered.length > 0 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 text-xs text-gray-500">
                            <span>{filtered.length} événement{filtered.length > 1 ? "s" : ""} · page {page}/{totalPages}</span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                                >
                                    <ChevronRightIcon size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
