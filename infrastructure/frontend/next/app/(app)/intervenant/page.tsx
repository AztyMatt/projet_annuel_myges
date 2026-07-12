"use client";

import { useEffect, useState } from "react";
import { Users, BookOpen, Clock, ChevronRight, MapPin, Monitor, FileCheck } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type TodaySession = {
    id: string;
    moduleName: string;
    groupName: string;
    studentCount: number;
    room: string;
    mode: "ON_SITE" | "REMOTE";
    startTime: Date;
    endTime: Date;
};

type UpcomingAssessment = { id: string; title: string; moduleName: string; dueDate: Date };

async function loadDashboardData() {
    const courses = await api.get<{ id: string; moduleId: string; groupId: string }[]>("/courses/mine");
    const moduleCache = new Map<string, string>();
    const groupCache = new Map<string, { name: string; studentCount: number }>();

    const todaySessions: TodaySession[] = [];
    const upcomingAssessments: UpcomingAssessment[] = [];
    let submittedFiles = 0;
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

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

        const sessions = await api.get<
            { id: string; startTime: string; endTime: string; mode: "ON_SITE" | "REMOTE"; classroomId: string | null }[]
        >(`/courses/${course.id}/sessions`);
        for (const s of sessions) {
            const startTime = new Date(s.startTime);
            if (startTime >= todayStart && startTime < todayEnd) {
                todaySessions.push({
                    id: s.id,
                    moduleName,
                    groupName: group.name,
                    studentCount: group.studentCount,
                    room: s.mode === "ON_SITE" ? "Sur site" : "Distanciel",
                    mode: s.mode,
                    startTime,
                    endTime: new Date(s.endTime),
                });
            }
        }

        const assessments = await api.get<{ id: string; title: string; dueDate: string; isPublished: boolean }[]>(
            `/courses/${course.id}/assessments`,
        );
        for (const a of assessments) {
            if (a.isPublished && new Date(a.dueDate) >= now) {
                upcomingAssessments.push({ id: a.id, title: a.title, moduleName, dueDate: new Date(a.dueDate) });
            }
            const files = await api.get<unknown[]>(`/file-assessments/assessment/${a.id}`);
            submittedFiles += files.length;
        }
    }

    return {
        todaySessions: todaySessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
        upcomingAssessments: upcomingAssessments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()).slice(0, 5),
        moduleCount: moduleCache.size,
        studentCount: Array.from(groupCache.values()).reduce((acc, g) => acc + g.studentCount, 0),
        submittedFiles,
    };
}

export default function DashboardIntervenant() {
    const [data, setData] = useState<Awaited<ReturnType<typeof loadDashboardData>> | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const refresh = async () => {
            setLoading(true);
            setError("");
            try {
                setData(await loadDashboardData());
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger le tableau de bord.");
            } finally {
                setLoading(false);
            }
        };
        void refresh();
    }, []);

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
                <p className="text-gray-500 text-sm mt-1 capitalize">
                    {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && data && (
                <>
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        {[
                            { label: "Cours aujourd'hui", value: data.todaySessions.length, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
                            { label: "Modules actifs", value: data.moduleCount, icon: BookOpen, color: "text-green-600", bg: "bg-green-50" },
                            { label: "Étudiants", value: data.studentCount, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
                            { label: "Rendus reçus", value: data.submittedFiles, icon: FileCheck, color: "text-orange-600", bg: "bg-orange-50" },
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

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between p-5 border-b border-gray-50">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-gray-500" />
                                    <h3 className="font-bold text-gray-900 text-sm">Cours du jour</h3>
                                </div>
                                <Link href="/intervenant/planning" className="text-xs text-blue-600 flex items-center gap-1 font-medium">
                                    Planning complet <ChevronRight size={12} />
                                </Link>
                            </div>
                            <div className="p-5 space-y-3">
                                {data.todaySessions.length === 0 && <p className="text-sm text-gray-400">Aucun cours aujourd&apos;hui.</p>}
                                {data.todaySessions.map((c) => (
                                    <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="text-right w-24 flex-shrink-0">
                                            <div className="text-xs font-bold text-gray-700">
                                                {c.startTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}–
                                                {c.endTime.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                            </div>
                                        </div>
                                        <div className={cn("w-1 h-10 rounded-full flex-shrink-0", c.mode === "REMOTE" ? "bg-purple-500" : "bg-blue-500")} />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-gray-900">{c.moduleName}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                <Users size={11} />
                                                <span>
                                                    {c.groupName} · {c.studentCount} étudiants
                                                </span>
                                                <span>·</span>
                                                {c.mode === "REMOTE" ? <Monitor size={11} /> : <MapPin size={11} />}
                                                <span>{c.room}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between p-5 border-b border-gray-50">
                                <div className="flex items-center gap-2">
                                    <FileCheck size={16} className="text-gray-500" />
                                    <h3 className="font-bold text-gray-900 text-sm">Prochaines échéances</h3>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                {data.upcomingAssessments.length === 0 && (
                                    <p className="text-sm text-gray-400">Aucune évaluation à venir.</p>
                                )}
                                {data.upcomingAssessments.map((a) => (
                                    <div key={a.id} className="flex items-center justify-between">
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-800 truncate">{a.title}</div>
                                            <div className="text-xs text-gray-400">{a.moduleName}</div>
                                        </div>
                                        <span className="text-xs text-gray-500 flex-shrink-0">
                                            {a.dueDate.toLocaleDateString("fr-FR")}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="px-5 pb-5">
                                <Link href="/intervenant/supports" className="flex items-center justify-center gap-1.5 text-xs text-blue-600 font-medium hover:underline">
                                    Gérer les supports <ChevronRight size={12} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
