"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Users, MapPin, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type Mode = "ON_SITE" | "REMOTE";

type CalendarSession = {
    id: string;
    moduleName: string;
    groupName: string;
    studentCount: number;
    room: string;
    mode: Mode;
    startTime: Date;
    endTime: Date;
};

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

export default function PlanningIntervenant() {
    const [weekOffset, setWeekOffset] = useState(0);
    const [sessions, setSessions] = useState<CalendarSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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
        </div>
    );
}
