"use client";

import { useEffect, useState } from "react";
import { BookOpen, Calendar, Clock, AlertCircle, FileText, ChevronRight, MapPin, Monitor } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type NextCourse = { moduleName: string; room: string; mode: "ON_SITE" | "REMOTE"; startTime: Date; endTime: Date };
type RecentGrade = { id: string; moduleName: string; label: string; value: number };

async function loadNextCourse(): Promise<NextCourse | null> {
    const student = await api.get<{ id: string }>("/students/me");
    const studentGroups = await api.get<{ groupId: string }[]>(`/student-groups/student/${student.id}`);
    const moduleCache = new Map<string, string>();
    const classroomCache = new Map<string, string>();

    let next: NextCourse | null = null;
    const now = new Date();

    for (const sg of studentGroups) {
        const courses = await api.get<{ id: string; moduleId: string }[]>(`/groups/${sg.groupId}/courses`);
        for (const course of courses) {
            if (!moduleCache.has(course.moduleId)) {
                const moduleData = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
                moduleCache.set(course.moduleId, moduleData.name);
            }
            const sessions = await api.get<
                { startTime: string; endTime: string; mode: "ON_SITE" | "REMOTE"; classroomId: string | null }[]
            >(`/courses/${course.id}/sessions`);

            for (const s of sessions) {
                const startTime = new Date(s.startTime);
                if (startTime < now) continue;
                if (next && startTime >= next.startTime) continue;

                let room = "Distanciel";
                if (s.mode === "ON_SITE" && s.classroomId) {
                    if (!classroomCache.has(s.classroomId)) {
                        const classroom = await api.get<{ name: string }>(`/classrooms/${s.classroomId}`);
                        classroomCache.set(s.classroomId, classroom.name);
                    }
                    room = classroomCache.get(s.classroomId)!;
                }
                next = { moduleName: moduleCache.get(course.moduleId)!, room, mode: s.mode, startTime, endTime: new Date(s.endTime) };
            }
        }
    }

    return next;
}

async function loadRecentGrades(): Promise<RecentGrade[]> {
    const grades = await api.get<{ id: string; value: number; enteredAt: string }[]>("/grades/mine");
    const sorted = [...grades].sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime()).slice(0, 4);

    const courseModuleCache = new Map<string, string>();
    const moduleNameCache = new Map<string, string>();

    const resolveModuleName = async (moduleId: string) => {
        if (!moduleNameCache.has(moduleId)) {
            const moduleData = await api.get<{ name: string }>(`/modules/${moduleId}`);
            moduleNameCache.set(moduleId, moduleData.name);
        }
        return moduleNameCache.get(moduleId)!;
    };
    const resolveModuleIdForCourse = async (courseId: string) => {
        if (!courseModuleCache.has(courseId)) {
            const course = await api.get<{ moduleId: string }>(`/courses/${courseId}`);
            courseModuleCache.set(courseId, course.moduleId);
        }
        return courseModuleCache.get(courseId)!;
    };

    const resolved: RecentGrade[] = [];
    for (const grade of sorted) {
        const [assessmentLinks, examLinks, manualLinks] = await Promise.all([
            api.get<{ assessmentId: string }[]>(`/grade-assessments/grade/${grade.id}`),
            api.get<{ sessionExamId: string }[]>(`/grade-session-exams/grade/${grade.id}`),
            api.get<{ gradeManualId: string }[]>(`/grade-manual-notations/grade/${grade.id}`),
        ]);

        if (assessmentLinks[0]) {
            const assessment = await api.get<{ courseId: string; title: string }>(`/assessments/${assessmentLinks[0].assessmentId}`);
            const moduleId = await resolveModuleIdForCourse(assessment.courseId);
            resolved.push({ id: grade.id, moduleName: await resolveModuleName(moduleId), label: assessment.title, value: grade.value });
        } else if (examLinks[0]) {
            const sessionExam = await api.get<{ sessionId: string; type: "WRITTEN" | "DEFENSE" }>(`/session-exams/${examLinks[0].sessionExamId}`);
            const session = await api.get<{ courseId: string }>(`/sessions/${sessionExam.sessionId}`);
            const moduleId = await resolveModuleIdForCourse(session.courseId);
            resolved.push({
                id: grade.id,
                moduleName: await resolveModuleName(moduleId),
                label: sessionExam.type === "WRITTEN" ? "Examen écrit" : "Soutenance",
                value: grade.value,
            });
        } else if (manualLinks[0]) {
            const manual = await api.get<{ moduleId: string; name: string }>(`/manual-notations/${manualLinks[0].gradeManualId}`);
            resolved.push({ id: grade.id, moduleName: await resolveModuleName(manual.moduleId), label: manual.name, value: grade.value });
        }
    }
    return resolved;
}

export default function DashboardEtudiant() {
    const [nextCourse, setNextCourse] = useState<NextCourse | null>(null);
    const [recentGrades, setRecentGrades] = useState<RecentGrade[]>([]);
    const [pendingAbsences, setPendingAbsences] = useState(0);
    const [documentIssues, setDocumentIssues] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const [next, grades, absences, student] = await Promise.all([
                    loadNextCourse(),
                    loadRecentGrades(),
                    api.get<{ status: string }[]>("/absences/mine"),
                    api.get<{ id: string }>("/students/me"),
                ]);
                setNextCourse(next);
                setRecentGrades(grades);
                setPendingAbsences(absences.filter((a) => a.status === "PENDING").length);

                const fileDocuments = await api.get<{ status: string }[]>(`/file-documents/student/${student.id}`);
                setDocumentIssues(fileDocuments.filter((d) => d.status !== "VALID").length);
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger le tableau de bord.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

    return (
        <div className="space-y-6 max-w-7xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Tableau de bord</h2>
                <p className="text-gray-500 text-sm mt-1 capitalize">{today}</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && !error && (
                <>
                    {/* KPI cards */}
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                                <Calendar size={18} className="text-blue-600" />
                            </div>
                            {nextCourse ? (
                                <>
                                    <div className="text-sm font-bold text-gray-900">{nextCourse.moduleName}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {nextCourse.startTime.toLocaleString("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" })} —{" "}
                                        {nextCourse.room}
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-gray-400">Aucun cours à venir</div>
                            )}
                            <div className="text-xs text-gray-500 mt-2">Prochain cours</div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                                <AlertCircle size={18} className="text-orange-600" />
                            </div>
                            <span className="text-2xl font-black text-gray-900">{pendingAbsences}</span>
                            <div className="text-xs text-gray-500 mt-0.5">Absences en attente</div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                                <FileText size={18} className="text-red-600" />
                            </div>
                            <span className="text-2xl font-black text-gray-900">{documentIssues}</span>
                            <div className="text-xs text-gray-500 mt-0.5">Documents à régulariser</div>
                        </div>

                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                                <BookOpen size={18} className="text-purple-600" />
                            </div>
                            <span className="text-2xl font-black text-gray-900">{recentGrades.length}</span>
                            <div className="text-xs text-gray-500 mt-0.5">Nouvelles notes</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between p-5 border-b border-gray-50">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-gray-500" />
                                    <h3 className="font-bold text-gray-900 text-sm">Prochain cours</h3>
                                </div>
                                <Link href="/etudiant/planning" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                                    Voir le planning <ChevronRight size={12} />
                                </Link>
                            </div>
                            <div className="p-5">
                                {nextCourse ? (
                                    <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-sm text-gray-900">{nextCourse.moduleName}</div>
                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                <span>
                                                    {nextCourse.startTime.toLocaleString("fr-FR", {
                                                        weekday: "long",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </span>
                                                <span>·</span>
                                                <span className="flex items-center gap-1">
                                                    {nextCourse.mode === "REMOTE" ? <Monitor size={11} /> : <MapPin size={11} />}
                                                    {nextCourse.room}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400">Aucun cours planifié à venir.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between p-5 border-b border-gray-50">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={16} className="text-gray-500" />
                                    <h3 className="font-bold text-gray-900 text-sm">Dernières notes</h3>
                                </div>
                                <Link href="/etudiant/notes" className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium">
                                    Tout voir <ChevronRight size={12} />
                                </Link>
                            </div>
                            <div className="p-5 space-y-3">
                                {recentGrades.length === 0 && <p className="text-sm text-gray-400">Aucune note récente.</p>}
                                {recentGrades.map((g) => (
                                    <div key={g.id} className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-800 truncate">{g.moduleName}</div>
                                            <div className="text-xs text-gray-400">{g.label}</div>
                                        </div>
                                        <span className="font-bold text-gray-900 text-sm flex-shrink-0">{g.value}/20</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Quick links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: "Mon planning", href: "/etudiant/planning", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Mes notes", href: "/etudiant/notes", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Mes absences", href: "/etudiant/absences", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "Mes documents", href: "/etudiant/documents", icon: FileText, color: "text-green-600", bg: "bg-green-50" },
                ].map((link) => {
                    const Icon = link.icon;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group"
                        >
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", link.bg)}>
                                <Icon size={16} className={link.color} />
                            </div>
                            <span className="font-medium text-sm text-gray-800 group-hover:text-gray-900">{link.label}</span>
                            <ChevronRight size={14} className="text-gray-400 ml-auto" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
