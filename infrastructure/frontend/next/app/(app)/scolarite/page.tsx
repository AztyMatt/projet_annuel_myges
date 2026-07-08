"use client";

import { useEffect, useState } from "react";
import { Users, AlertTriangle, FileText, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type PendingAbsence = { id: string; studentId: string; reason: string; sessionDate: Date | null };

async function loadPendingAbsences(): Promise<PendingAbsence[]> {
    const absences = await api.get<{ id: string; studentId: string; sessionId: string; reason: string; status: string }[]>(
        "/absences",
    );
    const pending = absences.filter((a) => a.status === "PENDING");

    return Promise.all(
        pending.map(async (a) => {
            const session = await api.get<{ startTime: string }>(`/sessions/${a.sessionId}`).catch(() => null);
            return {
                id: a.id,
                studentId: a.studentId,
                reason: a.reason,
                sessionDate: session ? new Date(session.startTime) : null,
            };
        }),
    );
}

export default function DashboardScolarite() {
    const [pendingAbsences, setPendingAbsences] = useState<PendingAbsence[]>([]);
    const [documentIssues, setDocumentIssues] = useState(0);
    const [expiringContracts, setExpiringContracts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const [absences, fileDocuments, contracts] = await Promise.all([
                loadPendingAbsences(),
                api.get<{ status: string }[]>("/file-documents"),
                api.get<{ endDate: string }[]>("/document-apprenticeship-contracts"),
            ]);
            setPendingAbsences(absences);
            setDocumentIssues(fileDocuments.filter((d) => d.status !== "VALID").length);
            const in30Days = Date.now() + 30 * 24 * 60 * 60 * 1000;
            setExpiringContracts(contracts.filter((c) => new Date(c.endDate).getTime() <= in30Days).length);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger le tableau de bord.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const handleDecision = async (id: string, decision: "validate" | "reject") => {
        setProcessingId(id);
        try {
            await api.post(`/absences/${id}/${decision}`);
            setPendingAbsences((prev) => prev.filter((a) => a.id !== id));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Action impossible.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Tableau de bord — Scolarité</h2>
                <p className="text-gray-500 text-sm mt-1 capitalize">
                    {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                        <Clock size={18} className="text-orange-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{pendingAbsences.length}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Absences en attente de validation</div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                        <AlertTriangle size={18} className="text-red-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{documentIssues}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Documents manquants/expirés</div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                        <Users size={18} className="text-purple-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{expiringContracts}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Contrats d&apos;alternance expirant sous 30 jours</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">Absences en attente de validation</h3>
                </div>
                <div className="p-5">
                    {loading && <p className="text-sm text-gray-400">Chargement…</p>}
                    {!loading && pendingAbsences.length === 0 && (
                        <p className="text-sm text-gray-400">Aucune absence en attente.</p>
                    )}
                    {!loading && pendingAbsences.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left font-semibold text-gray-500 text-xs pb-2 pr-4">Étudiant</th>
                                        <th className="text-left font-semibold text-gray-500 text-xs pb-2 pr-4">Session</th>
                                        <th className="text-left font-semibold text-gray-500 text-xs pb-2 pr-4">Motif</th>
                                        <th className="text-left font-semibold text-gray-500 text-xs pb-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pendingAbsences.map((a) => (
                                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-3 pr-4 font-medium text-gray-900">
                                                Étudiant #{a.studentId.slice(0, 8)}
                                            </td>
                                            <td className="py-3 pr-4 text-gray-500">
                                                {a.sessionDate ? a.sessionDate.toLocaleDateString("fr-FR") : "—"}
                                            </td>
                                            <td className="py-3 pr-4 text-gray-700">{a.reason}</td>
                                            <td className="py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => void handleDecision(a.id, "validate")}
                                                        disabled={processingId === a.id}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                                                    >
                                                        <CheckCircle size={11} /> Valider
                                                    </button>
                                                    <button
                                                        onClick={() => void handleDecision(a.id, "reject")}
                                                        disabled={processingId === a.id}
                                                        className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 border border-red-200 font-medium disabled:opacity-50"
                                                    >
                                                        <XCircle size={11} /> Rejeter
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                    { label: "Gestion des étudiants", href: "/scolarite/etudiants", icon: Users },
                    { label: "Notes & jurys", href: "/scolarite/notes", icon: FileText },
                    { label: "Messagerie", href: "/messagerie", icon: ChevronRight },
                ].map((l) => {
                    const Icon = l.icon;
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                        >
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center bg-orange-50")}>
                                <Icon size={16} className="text-orange-600" />
                            </div>
                            <span className="font-medium text-sm text-gray-800">{l.label}</span>
                            <ChevronRight size={14} className="text-gray-400 ml-auto" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
