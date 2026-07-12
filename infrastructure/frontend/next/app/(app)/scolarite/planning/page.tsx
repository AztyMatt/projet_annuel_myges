"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, MapPin, Monitor, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type Mode = "ON_SITE" | "REMOTE";
type Course = { id: string; moduleId: string; groupId: string };
type Session = { id: string; courseId: string; startTime: string; endTime: string; mode: Mode; classroomId: string | null };
type Classroom = { id: string; name: string; campusId: string };

type CalendarSession = Session & { moduleName: string; groupName: string; room: string };

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const GRID_START = 8;
const ROW_HEIGHT = 56;
const MIN_BLOCK_HEIGHT = 28;

const typeConfig: Record<Mode, { bg: string; text: string; label: string; icon: typeof MapPin; filter: string }> = {
    ON_SITE: { bg: "bg-blue-100 border-blue-300", text: "text-blue-800", label: "Présentiel", icon: MapPin, filter: "bg-blue-500" },
    REMOTE: { bg: "bg-purple-100 border-purple-300", text: "text-purple-800", label: "Distanciel", icon: Monitor, filter: "bg-purple-500" },
};

function mondayOf(offset: number): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + diff + offset * 7);
    return monday;
}

function getWeekLabel(offset: number): string {
    const monday = mondayOf(offset);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    const fmt = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    return `${fmt(monday)} – ${fmt(friday)}`;
}

function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
}

export default function PlanningScolarite() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [moduleNames, setModuleNames] = useState<Record<string, string>>({});
    const [groupNames, setGroupNames] = useState<Record<string, string>>({});
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [campusNames, setCampusNames] = useState<Record<string, string>>({});
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [weekOffset, setWeekOffset] = useState(0);
    const [filters, setFilters] = useState<Record<Mode, boolean>>({ ON_SITE: true, REMOTE: true });
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Session | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Session | null>(null);
    const toast = useToast();

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const [c, m, g, rooms, camp, sess] = await Promise.all([
                api.get<Course[]>("/courses"),
                api.get<{ id: string; name: string }[]>("/modules"),
                api.get<{ id: string; name: string }[]>("/groups"),
                api.get<Classroom[]>("/classrooms"),
                api.get<{ id: string; name: string }[]>("/campuses"),
                api.get<Session[]>("/sessions"),
            ]);
            setCourses(c);
            setModuleNames(Object.fromEntries(m.map((x) => [x.id, x.name])));
            setGroupNames(Object.fromEntries(g.map((x) => [x.id, x.name])));
            setClassrooms(rooms);
            setCampusNames(Object.fromEntries(camp.map((x) => [x.id, x.name])));
            setSessions(sess);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger le planning.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const courseInfo = useMemo(() => {
        const map = new Map<string, { moduleName: string; groupName: string }>();
        for (const c of courses) {
            map.set(c.id, {
                moduleName: moduleNames[c.moduleId] ?? c.moduleId.slice(0, 8),
                groupName: groupNames[c.groupId] ?? c.groupId.slice(0, 8),
            });
        }
        return map;
    }, [courses, moduleNames, groupNames]);

    const roomLabel = (id: string | null): string => {
        if (!id) return "Distanciel";
        const room = classrooms.find((r) => r.id === id);
        if (!room) return id.slice(0, 8);
        return `${campusNames[room.campusId] ?? "?"} — ${room.name}`;
    };

    const calendarSessions = useMemo<CalendarSession[]>(
        () =>
            sessions.map((s) => ({
                ...s,
                moduleName: courseInfo.get(s.courseId)?.moduleName ?? "Cours",
                groupName: courseInfo.get(s.courseId)?.groupName ?? "",
                room: roomLabel(s.classroomId),
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sessions, courseInfo, classrooms, campusNames],
    );

    const monday = mondayOf(weekOffset);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 5);

    const visibleSessions = calendarSessions.filter((s) => {
        const start = new Date(s.startTime);
        return filters[s.mode] && start >= monday && start < friday;
    });

    const toggleFilter = (mode: Mode) => setFilters((f) => ({ ...f, [mode]: !f[mode] }));

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget.id);
        try {
            await api.delete(`/sessions/${deleteTarget.id}`);
            setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id));
            toast.success("Session supprimée.");
            setDeleteTarget(null);
            setEditing(null);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Suppression impossible.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Planning — gestion des sessions</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Situations exceptionnelles (grève, jour férié déplacé...) : modifiez la session (date/salle) ou
                    supprimez-la — il n&apos;existe pas de champ dédié pour tracer le motif dans le modèle actuel.
                </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setWeekOffset((w) => w - 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
                            Cette semaine
                        </button>
                        <button onClick={() => setWeekOffset((w) => w + 1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50">
                            <ChevronRight size={16} />
                        </button>
                        <span className="text-sm text-gray-500 ml-2">{getWeekLabel(weekOffset)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {(Object.entries(typeConfig) as [Mode, (typeof typeConfig)["ON_SITE"]][]).map(([mode, cfg]) => (
                            <button
                                key={mode}
                                onClick={() => toggleFilter(mode)}
                                className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                                    filters[mode] ? cn(cfg.bg, cfg.text, "border-transparent") : "bg-gray-50 text-gray-400 border-gray-200",
                                )}
                            >
                                <span className={cn("w-1.5 h-1.5 rounded-full", filters[mode] ? cfg.filter : "bg-gray-300")} />
                                {cfg.label}
                            </button>
                        ))}
                        <button
                            onClick={() => setShowCreate(true)}
                            disabled={courses.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E] disabled:opacity-50"
                        >
                            <Plus size={14} /> Nouvelle session
                        </button>
                    </div>
                </div>

                {loading && <p className="text-sm text-gray-400">Chargement…</p>}
                {!loading && visibleSessions.length === 0 && (
                    <p className="text-sm text-gray-400">Aucune session cette semaine.</p>
                )}

                {!loading && (
                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-[56px_repeat(5,1fr)] min-w-[700px]">
                            <div />
                            {DAYS.map((day) => (
                                <div key={day} className="text-center text-xs font-semibold text-gray-500 pb-2 border-b border-gray-100">
                                    {day}
                                </div>
                            ))}

                            <div className="relative" style={{ height: HOURS.length * ROW_HEIGHT }}>
                                {HOURS.map((h) => (
                                    <div key={h} className="text-xs text-gray-400 text-right pr-2 -translate-y-2" style={{ height: ROW_HEIGHT }}>
                                        {h}
                                    </div>
                                ))}
                            </div>

                            {DAYS.map((_, dayIndex) => (
                                <div key={dayIndex} className="relative border-l border-gray-100" style={{ height: HOURS.length * ROW_HEIGHT }}>
                                    {HOURS.map((_, i) => (
                                        <div key={i} className="border-t border-gray-50" style={{ height: ROW_HEIGHT }} />
                                    ))}

                                    {visibleSessions
                                        .filter((s) => {
                                            const d = new Date(s.startTime);
                                            const sessionDay = (d.getDay() + 6) % 7;
                                            return sessionDay === dayIndex;
                                        })
                                        .map((session) => {
                                            const cfg = typeConfig[session.mode];
                                            const Icon = cfg.icon;
                                            const start = new Date(session.startTime);
                                            const end = new Date(session.endTime);
                                            const startHour = start.getHours() + start.getMinutes() / 60;
                                            const durationHours = (end.getTime() - start.getTime()) / 3600000;
                                            const top = (startHour - GRID_START) * ROW_HEIGHT;
                                            const height = Math.max(MIN_BLOCK_HEIGHT, durationHours * ROW_HEIGHT - 4);
                                            const compact = height < 44;
                                            return (
                                                <div
                                                    key={session.id}
                                                    onClick={() => setEditing(session)}
                                                    title={`${session.moduleName} — ${session.groupName} — ${session.room}`}
                                                    className={cn(
                                                        "group absolute left-1 right-1 rounded-lg border overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
                                                        compact ? "px-1.5 py-0.5 flex items-center gap-1" : "px-2 py-1",
                                                        cfg.bg,
                                                    )}
                                                    style={{ top: top + 2, height }}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setDeleteTarget(session);
                                                        }}
                                                        className={cn(
                                                            "absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-white/60 transition-opacity",
                                                            compact && "static opacity-100 flex-shrink-0",
                                                        )}
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={11} className={cfg.text} />
                                                    </button>
                                                    <div className={cn("text-xs font-semibold leading-tight truncate min-w-0", !compact && "pr-4", cfg.text)}>
                                                        {session.moduleName}
                                                        {compact && ` · ${session.groupName}`}
                                                    </div>
                                                    {!compact && (
                                                        <>
                                                            <div className={cn("text-[11px] leading-tight truncate opacity-70", cfg.text)}>
                                                                {session.groupName}
                                                            </div>
                                                            {height > 55 && (
                                                                <div className={cn("flex items-center gap-1 text-[11px] mt-0.5 opacity-60 truncate", cfg.text)}>
                                                                    <Icon size={10} />
                                                                    {session.room}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showCreate && (
                <SessionModal
                    courses={courses}
                    courseInfo={courseInfo}
                    classrooms={classrooms}
                    campusNames={campusNames}
                    onClose={() => setShowCreate(false)}
                    onSaved={() => {
                        setShowCreate(false);
                        void refresh();
                    }}
                />
            )}
            {editing && (
                <SessionModal
                    courses={courses}
                    courseInfo={courseInfo}
                    session={editing}
                    classrooms={classrooms}
                    campusNames={campusNames}
                    onClose={() => setEditing(null)}
                    onDelete={() => setDeleteTarget(editing)}
                    onSaved={() => {
                        setEditing(null);
                        void refresh();
                    }}
                />
            )}

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Supprimer cette session ?"
                description={
                    deleteTarget
                        ? `La session du ${new Date(deleteTarget.startTime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })} sera définitivement supprimée.`
                        : ""
                }
                confirmLabel="Supprimer"
                pendingLabel="Suppression…"
                loading={deletingId === deleteTarget?.id}
                onConfirm={() => void handleDelete()}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}

function SessionModal({
    courses,
    courseInfo,
    session,
    classrooms,
    campusNames,
    onClose,
    onSaved,
    onDelete,
}: {
    courses: Course[];
    courseInfo: Map<string, { moduleName: string; groupName: string }>;
    session?: Session;
    classrooms: Classroom[];
    campusNames: Record<string, string>;
    onClose: () => void;
    onSaved: () => void;
    onDelete?: () => void;
}) {
    const [courseId, setCourseId] = useState(session?.courseId ?? courses[0]?.id ?? "");
    const [startTime, setStartTime] = useState(session ? toLocalInputValue(session.startTime) : "");
    const [endTime, setEndTime] = useState(session ? toLocalInputValue(session.endTime) : "");
    const [mode, setMode] = useState<Mode>(session?.mode ?? "ON_SITE");
    const [classroomId, setClassroomId] = useState(session?.classroomId ?? classrooms[0]?.id ?? "");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!startTime || !endTime || !courseId) return;
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
                        <label className="text-xs font-medium text-gray-700 block mb-1">Cours</label>
                        <select
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                            disabled={!!session}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white disabled:bg-gray-50 disabled:text-gray-500"
                        >
                            {courses.length === 0 && <option value="">Aucun cours</option>}
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {courseInfo.get(c.id)?.moduleName ?? c.moduleId.slice(0, 8)} — {courseInfo.get(c.id)?.groupName ?? c.groupId.slice(0, 8)}
                                </option>
                            ))}
                        </select>
                    </div>
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
                        <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            <option value="ON_SITE">Présentiel</option>
                            <option value="REMOTE">Distanciel</option>
                        </select>
                    </div>
                    {mode === "ON_SITE" && (
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Salle</label>
                            <select value={classroomId} onChange={(e) => setClassroomId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                                {classrooms.length === 0 && <option value="">Aucune salle — créez-en une dans /scolarite/campus</option>}
                                {classrooms.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {campusNames[r.campusId] ?? "?"} — {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    {session && onDelete && (
                        <button onClick={onDelete} className="p-2.5 border border-gray-200 text-red-600 rounded-xl hover:bg-red-50" title="Supprimer">
                            <Trash2 size={16} />
                        </button>
                    )}
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={submitting || !startTime || !endTime || !courseId}
                        className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        {submitting ? "Enregistrement…" : session ? "Enregistrer" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
