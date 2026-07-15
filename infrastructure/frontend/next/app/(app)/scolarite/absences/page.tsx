"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Paperclip, Trash2, Eye } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { buildStudentNameMap, formatStudentName } from "@/lib/user-names";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Status = "PENDING" | "VALIDATED" | "REJECTED";
type Absence = { id: string; studentId: string; sessionId: string; reason: string; status: Status; declaredAt: string };
type Row = Absence & { sessionDate: Date | null; justificationFileId: string | null };

const statusConfig: Record<Status, { label: string; tone: StatusTone; icon: typeof Clock }> = {
    PENDING: { label: "En attente", tone: "orange", icon: Clock },
    VALIDATED: { label: "Validée", tone: "green", icon: CheckCircle },
    REJECTED: { label: "Rejetée", tone: "red", icon: XCircle },
};

export default function AbsencesScolarite() {
    const [rows, setRows] = useState<Row[]>([]);
    const [studentNames, setStudentNames] = useState<Record<string, string>>({});
    const [statusFilter, setStatusFilter] = useState<Status | "all">("PENDING");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
    const [deleting, setDeleting] = useState(false);
    const toast = useToast();

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const absences = await api.get<Absence[]>("/absences");
            const resolved = await Promise.all(
                absences.map(async (a) => {
                    const session = await api.get<{ startTime: string }>(`/sessions/${a.sessionId}`).catch(() => null);
                    const justifications = await api.get<{ fileId: string }[]>(`/file-justifications/absence/${a.id}`).catch(() => []);
                    return { ...a, sessionDate: session ? new Date(session.startTime) : null, justificationFileId: justifications[0]?.fileId ?? null };
                }),
            );
            setRows(resolved.sort((a, b) => new Date(b.declaredAt).getTime() - new Date(a.declaredAt).getTime()));
            void buildStudentNameMap(resolved.map((r) => r.studentId)).then(setStudentNames);
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
            toast.success(decision === "validate" ? "Absence validée." : "Absence rejetée.");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Action impossible.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/absences/${deleteTarget.id}`);
            setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            toast.success("Absence supprimée.");
            setDeleteTarget(null);
        } catch (e) {
            toast.error(
                e instanceof ApiError
                    ? e.message
                    : "Suppression impossible.",
            );
        } finally {
            setDeleting(false);
        }
    };

    const filtered = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Validation des absences</h2>
                <p className="text-sm text-gray-500 mt-1">Valider ou rejeter les déclarations d&apos;absence des étudiants.</p>
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
                                        <td className="px-5 py-3 font-medium text-gray-900">
                                            {formatStudentName(r.studentId, studentNames)}
                                        </td>
                                        <td className="px-5 py-3 text-gray-500">{r.sessionDate ? r.sessionDate.toLocaleDateString("fr-FR") : "—"}</td>
                                        <td className="px-5 py-3 text-gray-700">{r.reason}</td>
                                        <td className="px-5 py-3">
                                            {r.justificationFileId ? (
                                                <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Paperclip size={11} /> Déposé</span>
                                            ) : (
                                                <span className="text-xs text-gray-400">Aucun</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <StatusBadge tone={s.tone} icon={SIcon}>{s.label}</StatusBadge>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {r.justificationFileId && (
                                                    <a
                                                        href={`/api/files/${r.justificationFileId}/download`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1 px-2.5 py-1 text-gray-600 text-xs rounded-lg hover:bg-gray-100 font-medium"
                                                    >
                                                        <Eye size={13} /> Vérifier
                                                    </a>
                                                )}
                                                {r.status === "PENDING" && (
                                                    <>
                                                        <button onClick={() => void handleDecision(r.id, "validate")} disabled={processingId === r.id} className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                                                            Valider
                                                        </button>
                                                        <button onClick={() => void handleDecision(r.id, "reject")} disabled={processingId === r.id} className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 border border-red-200 font-medium disabled:opacity-50">
                                                            Rejeter
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setDeleteTarget(r)}
                                                    disabled={processingId === r.id}
                                                    title="Supprimer"
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
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

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Supprimer cette absence ?"
                description={
                    deleteTarget
                        ? `L'absence de ${formatStudentName(deleteTarget.studentId, studentNames)} (${deleteTarget.reason}) sera définitivement supprimée, ainsi que son justificatif éventuel. Cette action est irréversible.`
                        : ""
                }
                confirmLabel="Supprimer"
                pendingLabel="Suppression…"
                loading={deleting}
                onConfirm={() => void handleDelete()}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
