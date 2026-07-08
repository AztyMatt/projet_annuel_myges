"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, CheckCircle, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type Program = { id: string; name: string; code: string };
type ModuleStat = {
    moduleId: string;
    moduleName: string;
    coefficient: number;
    gradeIds: string[];
    values: number[];
    lockedCount: number;
};

// Une note (Grade) n'est reliée à un module qu'indirectement (assessment / session-exam / manual-notation) —
// voir la même logique documentée sur /etudiant/notes.
async function resolveGradeModuleId(
    gradeId: string,
    courseModuleCache: Map<string, string>,
): Promise<string | null> {
    const resolveModuleIdForCourse = async (courseId: string) => {
        if (!courseModuleCache.has(courseId)) {
            const course = await api.get<{ moduleId: string }>(`/courses/${courseId}`);
            courseModuleCache.set(courseId, course.moduleId);
        }
        return courseModuleCache.get(courseId)!;
    };

    const [assessmentLinks, examLinks, manualLinks] = await Promise.all([
        api.get<{ assessmentId: string }[]>(`/grade-assessments/grade/${gradeId}`),
        api.get<{ sessionExamId: string }[]>(`/grade-session-exams/grade/${gradeId}`),
        api.get<{ gradeManualId: string }[]>(`/grade-manual-notations/grade/${gradeId}`),
    ]);

    if (assessmentLinks[0]) {
        const assessment = await api.get<{ courseId: string }>(`/assessments/${assessmentLinks[0].assessmentId}`);
        return resolveModuleIdForCourse(assessment.courseId);
    }
    if (examLinks[0]) {
        const sessionExam = await api.get<{ sessionId: string }>(`/session-exams/${examLinks[0].sessionExamId}`);
        const session = await api.get<{ courseId: string }>(`/sessions/${sessionExam.sessionId}`);
        return resolveModuleIdForCourse(session.courseId);
    }
    if (manualLinks[0]) {
        const manual = await api.get<{ moduleId: string }>(`/manual-notations/${manualLinks[0].gradeManualId}`);
        return manual.moduleId;
    }
    return null;
}

async function loadModuleStats(programId: string): Promise<ModuleStat[]> {
    const [programModules, grades] = await Promise.all([
        api.get<{ moduleId: string; coefficient: number }[]>(`/program-modules/program/${programId}`),
        api.get<{ id: string; value: number; isLocked: boolean }[]>("/grades"),
    ]);

    const moduleNameCache = new Map<string, string>();
    const courseModuleCache = new Map<string, string>();
    const stats = new Map<string, ModuleStat>();

    for (const pm of programModules) {
        if (!moduleNameCache.has(pm.moduleId)) {
            const moduleData = await api.get<{ name: string }>(`/modules/${pm.moduleId}`);
            moduleNameCache.set(pm.moduleId, moduleData.name);
        }
        stats.set(pm.moduleId, {
            moduleId: pm.moduleId,
            moduleName: moduleNameCache.get(pm.moduleId)!,
            coefficient: pm.coefficient,
            gradeIds: [],
            values: [],
            lockedCount: 0,
        });
    }

    for (const grade of grades) {
        const moduleId = await resolveGradeModuleId(grade.id, courseModuleCache);
        const stat = moduleId ? stats.get(moduleId) : undefined;
        if (!stat) continue;
        stat.gradeIds.push(grade.id);
        stat.values.push(grade.value);
        if (grade.isLocked) stat.lockedCount += 1;
    }

    return Array.from(stats.values()).sort((a, b) => a.moduleName.localeCompare(b.moduleName));
}

export default function NotesScolarite() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [programId, setProgramId] = useState<string>("");
    const [stats, setStats] = useState<ModuleStat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lockingId, setLockingId] = useState<string | null>(null);

    useEffect(() => {
        api
            .get<Program[]>("/programs")
            .then((list) => {
                setPrograms(list);
                if (list[0]) setProgramId(list[0].id);
            })
            .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger les filières."));
    }, []);

    useEffect(() => {
        if (!programId) return;
        const refresh = async () => {
            setLoading(true);
            setError("");
            try {
                setStats(await loadModuleStats(programId));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les notes.");
            } finally {
                setLoading(false);
            }
        };
        void refresh();
    }, [programId]);

    const moduleCount = useMemo(() => stats.filter((m) => m.values.length > 0).length, [stats]);
    const frozenCount = useMemo(() => stats.filter((m) => m.gradeIds.length > 0 && m.lockedCount === m.gradeIds.length).length, [stats]);

    const handleFreezeModule = async (stat: ModuleStat) => {
        setLockingId(stat.moduleId);
        try {
            await Promise.all(stat.gradeIds.map((id) => api.post(`/grades/${id}/lock`)));
            setStats((prev) =>
                prev.map((m) => (m.moduleId === stat.moduleId ? { ...m, lockedCount: m.gradeIds.length } : m)),
            );
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Le gel des notes a échoué.");
        } finally {
            setLockingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                        <TrendingUp size={18} className="text-blue-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">
                        {moduleCount}/{stats.length}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">Modules avec notes</div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                        <CheckCircle size={18} className="text-green-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{stats.reduce((a, m) => a + m.values.length, 0)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Notes saisies</div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                        <Lock size={18} className="text-purple-600" />
                    </div>
                    <div className="text-2xl font-black text-gray-900">{frozenCount}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Modules gelés</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 p-5 border-b border-gray-50 flex-wrap">
                    {programs.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setProgramId(p.id)}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                                programId === p.id ? "bg-[#001944] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                            )}
                        >
                            {p.name}
                        </button>
                    ))}
                    {programs.length === 0 && !loading && <span className="text-sm text-gray-400">Aucune filière.</span>}
                </div>

                {loading && <p className="p-5 text-sm text-gray-400">Chargement…</p>}

                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    {["Module", "Coef.", "Moy.", "Min / Max", "Notes saisies", "Statut", "Action"].map((h) => (
                                        <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {stats.map((m) => {
                                    const avg = m.values.length > 0 ? Math.round((m.values.reduce((a, v) => a + v, 0) / m.values.length) * 100) / 100 : null;
                                    const min = m.values.length > 0 ? Math.min(...m.values) : null;
                                    const max = m.values.length > 0 ? Math.max(...m.values) : null;
                                    const frozen = m.gradeIds.length > 0 && m.lockedCount === m.gradeIds.length;
                                    return (
                                        <tr key={m.moduleId} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3 font-semibold text-gray-900 text-sm">{m.moduleName}</td>
                                            <td className="px-5 py-3 text-gray-700">{m.coefficient}</td>
                                            <td className="px-5 py-3 font-bold text-gray-900">{avg !== null ? `${avg}/20` : "—"}</td>
                                            <td className="px-5 py-3 text-xs text-gray-500">{min !== null ? `${min} / ${max}` : "—"}</td>
                                            <td className="px-5 py-3 text-xs text-gray-500">{m.values.length}</td>
                                            <td className="px-5 py-3">
                                                {frozen ? (
                                                    <span className="flex items-center gap-1 text-xs font-medium text-purple-600">
                                                        <Lock size={11} /> Gelé
                                                    </span>
                                                ) : m.values.length > 0 ? (
                                                    <span className="flex items-center gap-1 text-xs font-medium text-orange-500">En cours</span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Aucune note</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3">
                                                {!frozen && m.values.length > 0 && (
                                                    <button
                                                        onClick={() => void handleFreezeModule(m)}
                                                        disabled={lockingId === m.moduleId}
                                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 border border-purple-200 disabled:opacity-50"
                                                    >
                                                        <Lock size={11} /> {lockingId === m.moduleId ? "Gel…" : "Geler"}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {stats.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">Aucun module.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}
