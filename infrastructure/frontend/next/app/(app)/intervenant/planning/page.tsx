"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Users, MapPin, Monitor, X, UserX, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type Mode = "ON_SITE" | "REMOTE";

type CalendarSession = {
    id: string;
    courseId: string;
    groupId: string;
    moduleName: string;
    groupName: string;
    studentCount: number;
    room: string;
    mode: Mode;
    startTime: Date;
    endTime: Date;
};

type GroupStudent = { studentId: string; name: string };

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const GRID_START = 8;
const ROW_HEIGHT = 56;
const MIN_BLOCK_HEIGHT = 28;

const typeConfig: Record<Mode, { bg: string; text: string; label: string; icon: typeof MapPin }> = {
    ON_SITE: { bg: "bg-emerald-100 border-emerald-300", text: "text-emerald-800", label: "Présentiel", icon: MapPin },
    REMOTE: { bg: "bg-purple-100 border-purple-300", text: "text-purple-800", label: "Distanciel", icon: Monitor },
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
    return `Semaine du ${fmt(monday)} au ${fmt(friday)}`;
}

async function loadInstructorSessions(): Promise<CalendarSession[]> {
    const courses = await api.get<{ id: string; moduleId: string; groupId: string }[]>("/courses/mine");
    const moduleCache = new Map<string, string>();
    const groupCache = new Map<string, { name: string; studentCount: number }>();
    const classroomCache = new Map<string, string>();
    const campusCache = new Map<string, string>();
    const sessions: CalendarSession[] = [];

    for (const course of courses) {
        if (!moduleCache.has(course.moduleId)) {
            const moduleData = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
            moduleCache.set(course.moduleId, moduleData.name);
        }
        if (!groupCache.has(course.groupId)) {
            const [group, students] = await Promise.all([
                api.get<{ name: string }>(`/groups/${course.groupId}`),
                api.get<unknown[]>(`/groups/${course.groupId}/students`),
            ]);
            groupCache.set(course.groupId, { name: group.name, studentCount: students.length });
        }
        const moduleName = moduleCache.get(course.moduleId)!;
        const group = groupCache.get(course.groupId)!;

        const courseSessions = await api.get<
            { id: string; startTime: string; endTime: string; mode: Mode; classroomId: string | null }[]
        >(`/courses/${course.id}/sessions`);

        for (const session of courseSessions) {
            let room = "Distanciel";
            if (session.mode === "ON_SITE" && session.classroomId) {
                if (!classroomCache.has(session.classroomId)) {
                    const classroom = await api.get<{ name: string; campusId: string }>(`/classrooms/${session.classroomId}`);
                    if (!campusCache.has(classroom.campusId)) {
                        const campus = await api.get<{ name: string }>(`/campuses/${classroom.campusId}`);
                        campusCache.set(classroom.campusId, campus.name);
                    }
                    classroomCache.set(session.classroomId, `${campusCache.get(classroom.campusId)} — ${classroom.name}`);
                }
                room = classroomCache.get(session.classroomId)!;
            }
            sessions.push({
                id: session.id,
                courseId: course.id,
                groupId: course.groupId,
                moduleName,
                groupName: group.name,
                studentCount: group.studentCount,
                room,
                mode: session.mode,
                startTime: new Date(session.startTime),
                endTime: new Date(session.endTime),
            });
        }
    }

    return sessions;
}

async function loadGroupStudents(groupId: string): Promise<GroupStudent[]> {
    const links = await api.get<{ studentId: string }[]>(`/groups/${groupId}/students`);
    return Promise.all(
        links.map(async ({ studentId }) => {
            const student = await api.get<{ userId: string }>(`/students/${studentId}`);
            const user = await api.get<{ firstname: string; lastname: string }>(`/users/${student.userId}`);
            return { studentId, name: `${user.firstname} ${user.lastname}` };
        }),
    );
}

export default function PlanningIntervenant() {
    const [weekOffset, setWeekOffset] = useState(0);
    const [sessions, setSessions] = useState<CalendarSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedSession, setSelectedSession] = useState<CalendarSession | null>(null);

    useEffect(() => {
        const refresh = async () => {
            setLoading(true);
            setError("");
            try {
                setSessions(await loadInstructorSessions());
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger le planning.");
            } finally {
                setLoading(false);
            }
        };
        void refresh();
    }, []);

    const monday = useMemo(() => mondayOf(weekOffset), [weekOffset]);

    const visibleSessions = useMemo(() => {
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 5);
        return sessions
            .filter((s) => s.startTime >= monday && s.startTime < friday)
            .map((s) => ({ ...s, dayIndex: Math.floor((s.startTime.getTime() - monday.getTime()) / 86400000) }));
    }, [sessions, monday]);

    const totalHours = visibleSessions.reduce(
        (acc, s) => acc + (s.endTime.getTime() - s.startTime.getTime()) / 3600000,
        0,
    );

    return (
        <div className="space-y-5 max-w-7xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mon planning</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{getWeekLabel(weekOffset)}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100 text-sm">
                        <span className="font-bold text-emerald-600">{Math.round(totalHours)}h</span>
                        <span className="text-gray-500 ml-1">cette semaine</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setWeekOffset((w) => w - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setWeekOffset(0)}
                            className="px-3 h-8 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                            Cette semaine
                        </button>
                        <button
                            onClick={() => setWeekOffset((w) => w + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <p className="text-xs text-gray-500">
                Cliquez sur une session pour enregistrer les absences du groupe.
            </p>

            <div className="flex items-center gap-4 text-xs text-gray-500">
                {(Object.entries(typeConfig) as [Mode, (typeof typeConfig)["ON_SITE"]][]).map(([mode, cfg]) => (
                    <div key={mode} className="flex items-center gap-1.5">
                        <div className={cn("w-3 h-3 rounded-sm border", cfg.bg)} />
                        <span>{cfg.label}</span>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
                    <div className="border-r border-gray-100" />
                    {DAYS.map((day) => (
                        <div key={day} className="text-center py-3 border-r border-gray-100 last:border-r-0">
                            <span className="text-sm font-semibold text-gray-700">{day}</span>
                        </div>
                    ))}
                </div>

                <div
                    className="relative grid"
                    style={{ gridTemplateColumns: "56px repeat(5, 1fr)", height: `${HOURS.length * ROW_HEIGHT}px` }}
                >
                    <div className="border-r border-gray-100">
                        {HOURS.map((h) => (
                            <div
                                key={h}
                                className="border-b border-gray-50 flex items-start justify-end pr-2 pt-1"
                                style={{ height: `${ROW_HEIGHT}px` }}
                            >
                                <span className="text-xs text-gray-400 font-mono">{h}</span>
                            </div>
                        ))}
                    </div>

                    {DAYS.map((_, dayIndex) => (
                        <div key={dayIndex} className="relative border-r border-gray-100 last:border-r-0">
                            {HOURS.map((_, hi) => (
                                <div key={hi} className="border-b border-gray-50" style={{ height: `${ROW_HEIGHT}px` }} />
                            ))}
                            {visibleSessions
                                .filter((s) => s.dayIndex === dayIndex)
                                .map((session) => {
                                    const cfg = typeConfig[session.mode];
                                    const Icon = cfg.icon;
                                    const startHour = session.startTime.getHours() + session.startTime.getMinutes() / 60;
                                    const durationHours =
                                        (session.endTime.getTime() - session.startTime.getTime()) / 3600000;
                                    const top = (startHour - GRID_START) * ROW_HEIGHT;
                                    const height = Math.max(MIN_BLOCK_HEIGHT, durationHours * ROW_HEIGHT - 4);
                                    const compact = height < 40;
                                    return (
                                        <div
                                            key={session.id}
                                            onClick={() => setSelectedSession(session)}
                                            title={`${session.moduleName} — ${session.groupName} · ${session.studentCount} étudiants — ${session.room}`}
                                            className={cn(
                                                "absolute left-1 right-1 rounded-lg border overflow-hidden cursor-pointer hover:shadow-md transition-shadow",
                                                compact ? "px-1.5 py-0.5 flex items-center gap-1" : "px-2 py-1",
                                                cfg.bg,
                                            )}
                                            style={{ top: top + 2, height }}
                                        >
                                            <div className={cn("text-xs font-semibold leading-tight truncate min-w-0", cfg.text)}>
                                                {session.moduleName}
                                            </div>
                                            {compact ? (
                                                <span className={cn("text-[10px] truncate opacity-60 flex-shrink-0", cfg.text)}>
                                                    · {session.room}
                                                </span>
                                            ) : (
                                                <>
                                                    <div className={cn("flex items-center gap-1 text-xs mt-0.5 opacity-60 truncate", cfg.text)}>
                                                        <Icon size={10} />
                                                        {session.room}
                                                    </div>
                                                    {height > 60 && (
                                                        <div className={cn("flex items-center gap-1 text-xs mt-0.5 opacity-70", cfg.text)}>
                                                            <Users size={10} />
                                                            {session.groupName} · {session.studentCount} étudiants
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

            {loading && <p className="text-sm text-gray-400">Chargement…</p>}
            {!loading && !error && visibleSessions.length === 0 && (
                <p className="text-sm text-gray-400">Aucune session cette semaine.</p>
            )}

            {selectedSession && (
                <SessionAbsenceModal
                    session={selectedSession}
                    onClose={() => setSelectedSession(null)}
                />
            )}
        </div>
    );
}

function SessionAbsenceModal({ session, onClose }: { session: CalendarSession; onClose: () => void }) {
    const [students, setStudents] = useState<GroupStudent[]>([]);
    const [absentIds, setAbsentIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [markingId, setMarkingId] = useState<string | null>(null);
    const [error, setError] = useState("");

    const sessionStarted = session.startTime <= new Date();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError("");
            try {
                const [groupStudents, absences] = await Promise.all([
                    loadGroupStudents(session.groupId),
                    api.get<{ studentId: string }[]>(`/sessions/${session.id}/absences`),
                ]);
                setStudents(groupStudents.sort((a, b) => a.name.localeCompare(b.name, "fr")));
                setAbsentIds(new Set(absences.map((a) => a.studentId)));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les présences.");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, [session.groupId, session.id]);

    const markAbsent = async (studentId: string) => {
        if (absentIds.has(studentId)) return;
        setMarkingId(studentId);
        setError("");
        try {
            await api.post("/absences", {
                studentId,
                sessionId: session.id,
                reason: "Absent à la session",
            });
            setAbsentIds((prev) => new Set([...prev, studentId]));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Enregistrement impossible.");
        } finally {
            setMarkingId(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h3 className="font-bold text-gray-900">{session.moduleName}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {session.groupName} — {session.startTime.toLocaleDateString("fr-FR")}{" "}
                            {session.startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-3">
                    {!sessionStarted && (
                        <p className="text-xs text-orange-700 bg-orange-50 border border-orange-100 rounded-lg p-3">
                            La session n&apos;a pas encore commencé. Les absences ne peuvent être enregistrées qu&apos;une fois le cours démarré.
                        </p>
                    )}
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

                    {loading && <p className="text-sm text-gray-400">Chargement des étudiants…</p>}

                    {!loading && students.length === 0 && (
                        <p className="text-sm text-gray-400">Aucun étudiant dans ce groupe.</p>
                    )}

                    {!loading &&
                        students.map((student) => {
                            const isAbsent = absentIds.has(student.studentId);
                            const isMarking = markingId === student.studentId;
                            return (
                                <div
                                    key={student.studentId}
                                    className="flex items-center justify-between py-2.5 px-3 rounded-xl border border-gray-100"
                                >
                                    <span className="text-sm font-medium text-gray-800">{student.name}</span>
                                    {isAbsent ? (
                                        <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">
                                            <UserX size={13} /> Absent
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => void markAbsent(student.studentId)}
                                            disabled={!sessionStarted || isMarking}
                                            className="flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                        >
                                            {isMarking ? (
                                                "Enregistrement…"
                                            ) : (
                                                <>
                                                    <UserX size={13} /> Marquer absent
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                </div>

                <div className="p-6 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] transition-colors flex items-center justify-center gap-2"
                    >
                        <Check size={16} /> Terminer
                    </button>
                </div>
            </div>
        </div>
    );
}
