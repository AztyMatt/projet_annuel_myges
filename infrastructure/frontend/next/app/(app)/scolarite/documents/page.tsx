"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type FileDocumentStatus = "PENDING" | "VALID" | "EXPIRED";
type FileDocument = { id: string; fileId: string; studentId: string; status: FileDocumentStatus };
type Row = FileDocument & { fileName: string; uploadedAt: string };
type ExpiringDoc = { id: string; studentId: string; type: string; expiration: string };

const statusConfig: Record<FileDocumentStatus, { label: string; tone: StatusTone; icon: typeof Clock }> = {
    PENDING: { label: "En attente", tone: "orange", icon: Clock },
    VALID: { label: "Valide", tone: "green", icon: CheckCircle },
    EXPIRED: { label: "Expiré", tone: "red", icon: AlertTriangle },
};

export default function DocumentsScolarite() {
    const [pending, setPending] = useState<Row[]>([]);
    const [expiring, setExpiring] = useState<ExpiringDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
    const toast = useToast();

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const fileDocuments = await api.get<FileDocument[]>("/file-documents");
            const rows = await Promise.all(
                fileDocuments
                    .filter((d) => d.status === "PENDING")
                    .map(async (d) => {
                        const file = await api.get<{ originalName: string; uploadedAt: string }>(`/files/${d.fileId}`);
                        return { ...d, fileName: file.originalName, uploadedAt: file.uploadedAt };
                    }),
            );
            setPending(rows);

            const administratives = await api.get<{ id: string; fileDocumentId: string; type: string; expiration: string | null }[]>(
                "/document-administratives",
            );
            const fileDocumentById = new Map(fileDocuments.map((d) => [d.id, d]));
            const now = Date.now();
            setExpiring(
                administratives
                    .filter((a) => a.expiration && new Date(a.expiration).getTime() < now)
                    .map((a) => ({
                        id: a.id,
                        studentId: fileDocumentById.get(a.fileDocumentId)?.studentId ?? "?",
                        type: a.type,
                        expiration: a.expiration!,
                    })),
            );
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les documents.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const handleValidate = async (id: string) => {
        setProcessingId(id);
        try {
            await api.post(`/file-documents/${id}/validate`);
            setPending((prev) => prev.filter((r) => r.id !== id));
            toast.success("Document validé.");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Action impossible.");
        } finally {
            setProcessingId(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setProcessingId(deleteTarget.id);
        try {
            await api.delete(`/file-documents/${deleteTarget.id}`);
            setPending((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            toast.success("Document supprimé.");
            setDeleteTarget(null);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Suppression impossible.");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Suivi documentaire</h2>
                <p className="text-sm text-gray-500 mt-1">Les noms d&apos;étudiants ne sont pas encore disponibles côté backend.</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="p-5 border-b border-gray-50">
                            <h3 className="font-bold text-sm text-gray-900">En attente de validation</h3>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    {["Étudiant", "Fichier", "Déposé le", "Statut", "Actions"].map((h) => (
                                        <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pending.map((r) => {
                                    const s = statusConfig[r.status];
                                    const SIcon = s.icon;
                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3 font-medium text-gray-900">Étudiant #{r.studentId.slice(0, 8)}</td>
                                            <td className="px-5 py-3 text-gray-700">{r.fileName}</td>
                                            <td className="px-5 py-3 text-gray-500">{new Date(r.uploadedAt).toLocaleDateString("fr-FR")}</td>
                                            <td className="px-5 py-3">
                                                <StatusBadge tone={s.tone} icon={SIcon}>{s.label}</StatusBadge>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => void handleValidate(r.id)} disabled={processingId === r.id} className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium disabled:opacity-50">
                                                        Valider
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(r)} disabled={processingId === r.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50">
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {pending.length === 0 && (
                                    <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Aucun document en attente.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="p-5 border-b border-gray-50">
                            <h3 className="font-bold text-sm text-gray-900">Documents administratifs expirés</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {expiring.map((e) => (
                                <div key={e.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                                    <span className="flex-1 font-medium text-gray-900">Étudiant #{e.studentId.slice(0, 8)}</span>
                                    <span className="text-gray-600">{e.type}</span>
                                    <span className="text-xs text-red-600">Expiré le {new Date(e.expiration).toLocaleDateString("fr-FR")}</span>
                                </div>
                            ))}
                            {expiring.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">Aucun document expiré.</p>}
                        </div>
                    </div>
                </>
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Supprimer ce document ?"
                description={`Le document « ${deleteTarget?.fileName ?? ""} » sera définitivement supprimé.`}
                confirmLabel="Supprimer"
                pendingLabel="Suppression…"
                loading={processingId === deleteTarget?.id}
                onConfirm={() => void handleDelete()}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
