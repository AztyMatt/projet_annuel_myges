"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type Course = { id: string; moduleId: string; groupId: string };
type Session = { id: string; courseId: string; startTime: string; endTime: string; mode: "ON_SITE" | "REMOTE"; classroomId: string | null };
type Classroom = { id: string; name: string };

export default function PlanningScolarite() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [moduleNames, setModuleNames] = useState<Record<string, string>>({});
    const [groupNames, setGroupNames] = useState<Record<string, string>>({});
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [courseId, setCourseId] = useState("");
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Session | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const [c, m, g, rooms] = await Promise.all([
                    api.get<Course[]>("/courses"),
                    api.get<{ id: string; name: string }[]>("/modules"),
                    api.get<{ id: string; name: string }[]>("/groups"),
                    api.get<Classroom[]>("/classrooms"),
                ]);
                setCourses(c);
                setModuleNames(Object.fromEntries(m.map((x) => [x.id, x.name])));
                setGroupNames(Object.fromEntries(g.map((x) => [x.id, x.name])));
                setClassrooms(rooms);
                if (c[0]) setCourseId(c[0].id);
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les cours.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const refreshSessions = async (cid: string) => {
        if (!cid) return;
        setLoadingSessions(true);
        try {
            const list = await api.get<Session[]>(`/courses/${cid}/sessions`);
            setSessions(list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les sessions.");
        } finally {
            setLoadingSessions(false);
        }
    };

    useEffect(() => {
        void refreshSessions(courseId);
    }, [courseId]);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await api.delete(`/sessions/${id}`);
            setSessions((prev) => prev.filter((s) => s.id !== id));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Suppression impossible.");
        } finally {
            setDeletingId(null);
        }
    };

    const classroomName = (id: string | null) => (id ? classrooms.find((r) => r.id === id)?.name ?? id.slice(0, 8) : "Distanciel");

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Planning — gestion des sessions</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Situations exceptionnelles (grève, jour férié déplacé...) : modifiez la session (date/salle) ou
                    supprimez-la — il n&apos;existe pas de champ dédié pour tracer le motif dans le modèle actuel.
                </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-wrap items-end gap-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Cours</label>
                        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white min-w-[240px]">
                            {courses.length === 0 && <option value="">Aucun cours</option>}
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {moduleNames[c.moduleId] ?? c.moduleId.slice(0, 8)} — {groupNames[c.groupId] ?? c.groupId.slice(0, 8)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        disabled={!courseId}
                        className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        <Plus size={14} /> Nouvelle session
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {loadingSessions && <p className="p-5 text-sm text-gray-400">Chargement…</p>}
                {!loadingSessions && sessions.length === 0 && <p className="p-5 text-sm text-gray-400">Aucune session pour ce cours.</p>}
                {!loadingSessions && sessions.length > 0 && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                {["Début", "Fin", "Mode", "Salle", ""].map((h) => (
                                    <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {sessions.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 text-gray-800">{new Date(s.startTime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</td>
                                    <td className="px-5 py-3 text-gray-800">{new Date(s.endTime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</td>
                                    <td className="px-5 py-3 text-gray-700">{s.mode === "ON_SITE" ? "Présentiel" : "Distanciel"}</td>
                                    <td className="px-5 py-3 text-gray-700">{classroomName(s.classroomId)}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => setEditing(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                <Pencil size={13} />
                                            </button>
                                            <button
                                                onClick={() => void handleDelete(s.id)}
                                                disabled={deletingId === s.id}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showCreate && (
                <SessionModal
                    courseId={courseId}
                    classrooms={classrooms}
                    onClose={() => setShowCreate(false)}
                    onSaved={() => { setShowCreate(false); void refreshSessions(courseId); }}
                />
            )}
            {editing && (
                <SessionModal
                    courseId={courseId}
                    session={editing}
                    classrooms={classrooms}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); void refreshSessions(courseId); }}
                />
            )}
        </div>
    );
}

function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

function SessionModal({
    courseId,
    session,
    classrooms,
    onClose,
    onSaved,
}: {
    courseId: string;
    session?: Session;
    classrooms: Classroom[];
    onClose: () => void;
    onSaved: () => void;
}) {
    const [startTime, setStartTime] = useState(session ? toLocalInputValue(session.startTime) : "");
    const [endTime, setEndTime] = useState(session ? toLocalInputValue(session.endTime) : "");
    const [mode, setMode] = useState<"ON_SITE" | "REMOTE">(session?.mode ?? "ON_SITE");
    const [classroomId, setClassroomId] = useState(session?.classroomId ?? classrooms[0]?.id ?? "");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!startTime || !endTime) return;
        setSubmitting(true);
        setError("");
        try {
            const body = {
                courseId,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                mode,
                classroomId: mode === "ON_SITE" ? classroomId : null,
            };
            if (session) await api.patch(`/sessions/${session.id}`, body);
            else await api.post("/sessions", body);
            onSaved();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Enregistrement impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">{session ? "Modifier la session" : "Nouvelle session"}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Début</label>
                        <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Fin</label>
                        <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Mode</label>
                        <select value={mode} onChange={(e) => setMode(e.target.value as "ON_SITE" | "REMOTE")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            <option value="ON_SITE">Présentiel</option>
                            <option value="REMOTE">Distanciel</option>
                        </select>
                    </div>
                    {mode === "ON_SITE" && (
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Salle</label>
                            <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                                {classrooms.length === 0 && <option value="">Aucune salle — créez-en une dans /scolarite/campus</option>}
                                {classrooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    )}
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={submitting || !startTime || !endTime}
                        className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        {submitting ? "Enregistrement…" : session ? "Enregistrer" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
