"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, XCircle, Clock, Plus, X } from "lucide-react";
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
};

type SessionOption = { id: string; moduleName: string; date: Date };

const statusConfig: Record<Status, { label: string; tone: StatusTone; icon: typeof Clock }> = {
    PENDING: { label: "En attente", tone: "orange", icon: Clock },
    VALIDATED: { label: "Justifiée", tone: "green", icon: CheckCircle },
    REJECTED: { label: "Non justifiée", tone: "red", icon: XCircle },
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
                .get<{ id: string }[]>(`/file-justifications/absence/${a.id}`)
                .catch(() => []);
            const session = sessionById.get(a.sessionId);
            return {
                id: a.id,
                date: session?.date ?? new Date(0),
                moduleName: session?.moduleName ?? "Module inconnu",
                reason: a.reason,
                status: a.status,
                hasJustification: justifications.length > 0,
            };
        }),
    );
}

export default function AbsencesEtudiant() {
    const [sessionOptions, setSessionOptions] = useState<SessionOption[]>([]);
    const [absences, setAbsences] = useState<AbsenceRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<Status | "all">("all");

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const sessions = await loadStudentCourseSessions();
            setSessionOptions(sessions);
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

            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total absences", value: total, icon: AlertCircle, color: "text-gray-600", bg: "bg-gray-100" },
                    { label: "Justifiées", value: validated, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Non justifiées", value: rejected, icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
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
                    <h3 className="font-bold text-sm text-gray-900">Historique des absences</h3>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as Status | "all")}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-gray-50 text-gray-600"
                        >
                            <option value="all">Toutes</option>
                            <option value="PENDING">En attente</option>
                            <option value="VALIDATED">Justifiées</option>
                            <option value="REJECTED">Non justifiées</option>
                        </select>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001944] text-white text-xs font-semibold rounded-lg hover:bg-[#002C6E] transition-colors"
                        >
                            <Plus size={13} /> Déclarer
                        </button>
                    </div>
                </div>

                {loading && <p className="p-5 text-sm text-gray-400">Chargement…</p>}
                {!loading && filtered.length === 0 && (
                    <p className="p-5 text-sm text-gray-400">Aucune absence.</p>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((a) => {
                                    const s = statusConfig[a.status];
                                    const SIcon = s.icon;
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
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <DeclareModal
                    sessionOptions={sessionOptions}
                    onClose={() => setShowModal(false)}
                    onDeclared={() => {
                        setShowModal(false);
                        void refresh();
                    }}
                />
            )}
        </div>
    );
}

function DeclareModal({
    sessionOptions,
    onClose,
    onDeclared,
}: {
    sessionOptions: SessionOption[];
    onClose: () => void;
    onDeclared: () => void;
}) {
    const [sessionId, setSessionId] = useState(sessionOptions[0]?.id ?? "");
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!sessionId || !reason.trim()) return;
        setSubmitting(true);
        setError("");
        try {
            const student = await api.get<{ id: string }>("/students/me");
            await api.post("/absences", { studentId: student.id, sessionId, reason: reason.trim() });
            onDeclared();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Déclaration impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Déclarer une absence</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Session concernée</label>
                        <select
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                        >
                            {sessionOptions.length === 0 && <option value="">Aucune session disponible</option>}
                            {sessionOptions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.moduleName} — {s.date.toLocaleDateString("fr-FR")}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Motif</label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex : Maladie, Convocation…"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                    </div>
                    <p className="text-xs text-gray-400">
                        Le dépôt de justificatif sera disponible une fois l&apos;upload de fichiers implémenté côté
                        backend (voir CLAUDE.md). Vous pourrez l&apos;ajouter depuis cette page ensuite.
                    </p>
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
                        disabled={submitting || !sessionId || !reason.trim()}
                        className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] transition-colors disabled:opacity-50"
                    >
                        {submitting ? "Envoi…" : "Soumettre"}
                    </button>
                </div>
            </div>
        </div>
    );
}
