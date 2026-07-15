"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle, XCircle, Clock, Upload, Download, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

type Status = "PENDING" | "VALIDATED" | "REJECTED";

type AbsenceRow = {
    id: string;
    date: Date;
    moduleName: string;
    reason: string;
    status: Status;
    hasJustification: boolean;
    justificationFileId?: string;
};

type SessionOption = { id: string; moduleName: string; date: Date };

const statusConfig: Record<Status, { label: string; tone: StatusTone; icon: typeof Clock }> = {
    PENDING: { label: "En attente de validation", tone: "orange", icon: Clock },
    VALIDATED: { label: "Validée", tone: "green", icon: CheckCircle },
    REJECTED: { label: "Rejetée", tone: "red", icon: XCircle },
};

async function loadStudentCourseSessions(): Promise<SessionOption[]> {
    const student = await api.get<{ id: string }>("/students/me");
    const studentGroups = await api.get<{ groupId: string }[]>(`/student-groups/student/${student.id}`);
    const moduleCache = new Map<string, string>();
    const options: SessionOption[] = [];

    for (const sg of studentGroups) {
        const courses = await api.get<{ id: string; moduleId: string }[]>(`/groups/${sg.groupId}/courses`);
        for (const course of courses) {
            if (!moduleCache.has(course.moduleId)) {
                const moduleData = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
                moduleCache.set(course.moduleId, moduleData.name);
            }
            const moduleName = moduleCache.get(course.moduleId)!;
            const sessions = await api.get<{ id: string; startTime: string }[]>(`/courses/${course.id}/sessions`);
            sessions.forEach((s) => options.push({ id: s.id, moduleName, date: new Date(s.startTime) }));
        }
    }

    return options.sort((a, b) => b.date.getTime() - a.date.getTime());
}

async function loadAbsences(sessionOptions: SessionOption[]): Promise<AbsenceRow[]> {
    const sessionById = new Map(sessionOptions.map((s) => [s.id, s]));
    const absences = await api.get<{ id: string; sessionId: string; reason: string; status: Status }[]>("/absences/mine");

    return Promise.all(
        absences.map(async (a) => {
            const justifications = await api
                .get<{ fileId: string }[]>(`/file-justifications/absence/${a.id}`)
                .catch(() => []);
            const session = sessionById.get(a.sessionId);
            return {
                id: a.id,
                date: session?.date ?? new Date(0),
                moduleName: session?.moduleName ?? "Module inconnu",
                reason: a.reason,
                status: a.status,
                hasJustification: justifications.length > 0,
                justificationFileId: justifications[0]?.fileId,
            };
        }),
    );
}

export default function AbsencesEtudiant() {
    const [absences, setAbsences] = useState<AbsenceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<Status | "all">("all");
    const [justifyTarget, setJustifyTarget] = useState<AbsenceRow | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const sessions = await loadStudentCourseSessions();
            setAbsences(await loadAbsences(sessions));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les absences.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const total = absences.length;
    const validated = absences.filter((a) => a.status === "VALIDATED").length;
    const rejected = absences.filter((a) => a.status === "REJECTED").length;
    const pending = absences.filter((a) => a.status === "PENDING").length;

    const filtered = selectedStatus === "all" ? absences : absences.filter((a) => a.status === selectedStatus);

    return (
        <div className="space-y-6 max-w-4xl">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 text-blue-900 text-sm rounded-xl p-4">
                <Info size={18} className="flex-shrink-0 mt-0.5" />
                <p>
                    Les absences sont enregistrées par votre intervenant ou l&apos;administration lors des cours.
                    Vous pouvez déposer un justificatif pour chaque absence en attente de validation.
                </p>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total absences", value: total, icon: AlertCircle, color: "text-gray-600", bg: "bg-gray-100" },
                    { label: "Validées", value: validated, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Rejetées", value: rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
                    { label: "En attente", value: pending, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
                ].map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                                <Icon size={18} className={s.color} />
                            </div>
                            <div className="text-2xl font-black text-gray-900">{s.value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between p-5 border-b border-gray-50">
                    <h3 className="font-bold text-sm text-gray-900">Mes absences</h3>
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value as Status | "all")}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-gray-50 text-gray-600"
                    >
                        <option value="all">Toutes</option>
                        <option value="PENDING">En attente</option>
                        <option value="VALIDATED">Validées</option>
                        <option value="REJECTED">Rejetées</option>
                    </select>
                </div>

                {loading && <p className="p-5 text-sm text-gray-400">Chargement…</p>}
                {!loading && filtered.length === 0 && (
                    <p className="p-5 text-sm text-gray-400">Aucune absence enregistrée.</p>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="text-left font-semibold text-gray-400 text-xs px-5 pb-3 pt-3">Date</th>
                                    <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Module</th>
                                    <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Motif</th>
                                    <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Justificatif</th>
                                    <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Statut</th>
                                    <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((a) => {
                                    const s = statusConfig[a.status];
                                    const SIcon = s.icon;
                                    const canJustify = a.status === "PENDING" && !a.hasJustification;
                                    return (
                                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3 font-medium text-gray-800">
                                                {a.date.toLocaleDateString("fr-FR")}
                                            </td>
                                            <td className="px-3 py-3 text-gray-700">{a.moduleName}</td>
                                            <td className="px-3 py-3 text-gray-700">{a.reason}</td>
                                            <td className="px-3 py-3">
                                                {a.hasJustification ? (
                                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                        <CheckCircle size={12} /> Déposé
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                                                        <XCircle size={12} /> Manquant
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <StatusBadge tone={s.tone} icon={SIcon}>{s.label}</StatusBadge>
                                            </td>
                                            <td className="px-3 py-3">
                                                {canJustify && (
                                                    <button
                                                        onClick={() => setJustifyTarget(a)}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#001944] bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                    >
                                                        <Upload size={12} /> Déposer
                                                    </button>
                                                )}
                                                {a.hasJustification && a.justificationFileId && (
                                                    <a
                                                        href={`/api/files/${a.justificationFileId}/download`}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors"
                                                    >
                                                        <Download size={12} /> Télécharger
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {justifyTarget && (
                <JustifyModal
                    absence={justifyTarget}
                    onClose={() => setJustifyTarget(null)}
                    onSubmitted={() => {
                        setJustifyTarget(null);
                        void refresh();
                    }}
                />
            )}
        </div>
    );
}

function JustifyModal({
    absence,
    onClose,
    onSubmitted,
}: {
    absence: AbsenceRow;
    onClose: () => void;
    onSubmitted: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            setError("Choisissez un fichier (PDF, JPG ou PNG).");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const uploaded = await api.upload<{ id: string }>("/files/upload", file);
            await api.post("/file-justifications", { absenceId: absence.id, fileId: uploaded.id });
            onSubmitted();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Le dépôt du justificatif a échoué.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Déposer un justificatif</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">{absence.moduleName}</span>
                        {" — "}
                        {absence.date.toLocaleDateString("fr-FR")}
                    </p>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Fichier justificatif</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                            className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#001944] hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG ou PNG — 25 Mo max.</p>
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Envoi…" : "Envoyer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
