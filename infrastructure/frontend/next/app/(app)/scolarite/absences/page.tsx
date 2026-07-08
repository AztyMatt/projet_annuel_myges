"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type Status = "PENDING" | "VALIDATED" | "REJECTED";
type Absence = { id: string; studentId: string; sessionId: string; reason: string; status: Status; declaredAt: string };
type Row = Absence & { sessionDate: Date | null; hasJustification: boolean };

const statusConfig: Record<Status, { label: string; className: string; icon: typeof Clock }> = {
    PENDING: { label: "En attente", className: "bg-orange-100 text-orange-700", icon: Clock },
    VALIDATED: { label: "Validée", className: "bg-green-100 text-green-700", icon: CheckCircle },
    REJECTED: { label: "Rejetée", className: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AbsencesScolarite() {
    const [rows, setRows] = useState<Row[]>([]);
    const [statusFilter, setStatusFilter] = useState<Status | "all">("PENDING");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const absences = await api.get<Absence[]>("/absences");
            const resolved = await Promise.all(
                absences.map(async (a) => {
                    const session = await api.get<{ startTime: string }>(`/sessions/${a.sessionId}`).catch(() => null);
                    const justifications = await api.get<unknown[]>(`/file-justifications/absence/${a.id}`).catch(() => []);
                    return { ...a, sessionDate: session ? new Date(session.startTime) : null, hasJustification: justifications.length > 0 };
                }),
            );
            setRows(resolved.sort((a, b) => new Date(b.declaredAt).getTime() - new Date(a.declaredAt).getTime()));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les absences.");
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
            setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: decision === "validate" ? "VALIDATED" : "REJECTED" } : r)));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Action impossible.");
        } finally {
            setProcessingId(null);
        }
    };

    const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Validation des absences</h2>
                <p className="text-sm text-gray-500 mt-1">Les noms d&apos;étudiants ne sont pas encore disponibles côté backend.</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">Statut :</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Status | "all")} className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                    <option value="PENDING">En attente</option>
                    <option value="VALIDATED">Validées</option>
                    <option value="REJECTED">Rejetées</option>
                    <option value="all">Toutes</option>
                </select>
            </div>

            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                {["Étudiant", "Session", "Motif", "Justificatif", "Statut", "Actions"].map((h) => (
                                    <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((r) => {
                                const s = statusConfig[r.status];
                                const SIcon = s.icon;
                                return (
                                    <tr key={r.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-3 font-medium text-gray-900">Étudiant #{r.studentId.slice(0, 8)}</td>
                                        <td className="px-5 py-3 text-gray-500">{r.sessionDate ? r.sessionDate.toLocaleDateString("fr-FR") : "—"}</td>
                                        <td className="px-5 py-3 text-gray-700">{r.reason}</td>
                                        <td className="px-5 py-3">
                                            {r.hasJustification ? (
                                                <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Paperclip size={11} /> Déposé</span>
                                            ) : (
                                                <span className="text-xs text-gray-400">Aucun</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={cn("flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium", s.className)}>
                                                <SIcon size={11} /> {s.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            {r.status === "PENDING" && (
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => void handleDecision(r.id, "validate")} disabled={processingId === r.id} className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                                                        Valider
                                                    </button>
                                                    <button onClick={() => void handleDecision(r.id, "reject")} disabled={processingId === r.id} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 border border-red-200 font-medium disabled:opacity-50">
                                                        Rejeter
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-400">Aucune absence.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
