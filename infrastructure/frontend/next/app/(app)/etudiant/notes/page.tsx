"use client";

import { useEffect, useState } from "react";
import { TrendingUp, ChevronDown, ChevronUp, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type ResolvedGrade = { id: string; value: number; isLocked: boolean; label: string };
type ModuleGroup = { moduleId: string; moduleName: string; coefficient: number; grades: ResolvedGrade[]; average: number };

const mentionConfig: Record<string, { label: string; className: string }> = {
    TB: { label: "Très Bien", className: "bg-green-100 text-green-700" },
    B: { label: "Bien", className: "bg-blue-100 text-blue-700" },
    AB: { label: "Assez Bien", className: "bg-sky-100 text-sky-700" },
    P: { label: "Passable", className: "bg-gray-100 text-gray-700" },
    F: { label: "Insuffisant", className: "bg-red-100 text-red-700" },
};

function mentionOf(average: number): string {
    if (average >= 16) return "TB";
    if (average >= 14) return "B";
    if (average >= 12) return "AB";
    if (average >= 10) return "P";
    return "F";
}

// Une note (Grade) n'est reliée à un module qu'indirectement, via l'un de trois liens possibles :
// grade-assessment (devoir), grade-session-exam (examen) ou grade-manual-notation (note manuelle).
// Il faut tester les trois pour chaque note, puis remonter jusqu'au module.
async function resolveModuleContext(
    gradeId: string,
    courseModuleCache: Map<string, string>,
    moduleNameCache: Map<string, string>,
): Promise<{ moduleId: string; moduleName: string; label: string } | null> {
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

    const [assessmentLinks, examLinks, manualLinks] = await Promise.all([
        api.get<{ assessmentId: string }[]>(`/grade-assessments/grade/${gradeId}`),
        api.get<{ sessionExamId: string }[]>(`/grade-session-exams/grade/${gradeId}`),
        api.get<{ gradeManualId: string }[]>(`/grade-manual-notations/grade/${gradeId}`),
    ]);

    if (assessmentLinks[0]) {
        const assessment = await api.get<{ courseId: string; title: string }>(
            `/assessments/${assessmentLinks[0].assessmentId}`,
        );
        const moduleId = await resolveModuleIdForCourse(assessment.courseId);
        return { moduleId, moduleName: await resolveModuleName(moduleId), label: assessment.title };
    }
    if (examLinks[0]) {
        const sessionExam = await api.get<{ sessionId: string; type: "WRITTEN" | "DEFENSE" }>(
            `/session-exams/${examLinks[0].sessionExamId}`,
        );
        const session = await api.get<{ courseId: string }>(`/sessions/${sessionExam.sessionId}`);
        const moduleId = await resolveModuleIdForCourse(session.courseId);
        return {
            moduleId,
            moduleName: await resolveModuleName(moduleId),
            label: sessionExam.type === "WRITTEN" ? "Examen écrit" : "Soutenance",
        };
    }
    if (manualLinks[0]) {
        const manual = await api.get<{ moduleId: string; name: string }>(
            `/manual-notations/${manualLinks[0].gradeManualId}`,
        );
        return { moduleId: manual.moduleId, moduleName: await resolveModuleName(manual.moduleId), label: manual.name };
    }
    return null;
}

async function loadModuleGroups(): Promise<ModuleGroup[]> {
    const student = await api.get<{ id: string; programId: string }>("/students/me");
    const [grades, programModules] = await Promise.all([
        api.get<{ id: string; value: number; isLocked: boolean }[]>("/grades/mine"),
        api.get<{ moduleId: string; coefficient: number }[]>(`/program-modules/program/${student.programId}`),
    ]);

    const coefByModule = new Map(programModules.map((pm) => [pm.moduleId, pm.coefficient]));
    const courseModuleCache = new Map<string, string>();
    const moduleNameCache = new Map<string, string>();

    const groups = new Map<string, ModuleGroup>();

    for (const grade of grades) {
        const context = await resolveModuleContext(grade.id, courseModuleCache, moduleNameCache);
        if (!context) continue;

        if (!groups.has(context.moduleId)) {
            groups.set(context.moduleId, {
                moduleId: context.moduleId,
                moduleName: context.moduleName,
                coefficient: coefByModule.get(context.moduleId) ?? 1,
                grades: [],
                average: 0,
            });
        }
        groups.get(context.moduleId)!.grades.push({ id: grade.id, value: grade.value, isLocked: grade.isLocked, label: context.label });
    }

    return Array.from(groups.values())
        .map((g) => ({ ...g, average: Math.round((g.grades.reduce((a, x) => a + x.value, 0) / g.grades.length) * 100) / 100 }))
        .sort((a, b) => a.moduleName.localeCompare(b.moduleName));
}

export default function NotesEtudiant() {
    const [modules, setModules] = useState<ModuleGroup[]>([]);
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadModuleGroups()
            .then(setModules)
            .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger les notes."))
            .finally(() => setLoading(false));
    }, []);

    const weighted = modules.reduce((acc, m) => acc + m.average * m.coefficient, 0);
    const totalCoef = modules.reduce((acc, m) => acc + m.coefficient, 0);
    const gpa = totalCoef > 0 ? Math.round((weighted / totalCoef) * 10) / 10 : null;

    return (
        <div className="space-y-6 max-w-4xl">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && !error && (
                <>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 max-w-xs">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                            <TrendingUp size={18} className="text-blue-600" />
                        </div>
                        <div className="text-2xl font-black text-gray-900">{gpa !== null ? `${gpa}/20` : "—"}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Moyenne générale</div>
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-700 text-xs uppercase tracking-wider mb-3">Modules</h3>
                        {modules.length === 0 && <p className="text-sm text-gray-400">Aucune note pour le moment.</p>}
                        <div className="space-y-2">
                            {modules.map((mod) => (
                                <ModuleCard
                                    key={mod.moduleId}
                                    module={mod}
                                    expanded={expanded === mod.moduleId}
                                    onToggle={() => setExpanded(expanded === mod.moduleId ? null : mod.moduleId)}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function ModuleCard({ module, expanded, onToggle }: { module: ModuleGroup; expanded: boolean; onToggle: () => void }) {
    const mention = mentionConfig[mentionOf(module.average)];
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
            >
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm text-gray-900">{module.moduleName}</span>
                    <div className="text-xs text-gray-400 mt-0.5">Coefficient {module.coefficient}</div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-black text-gray-900 text-base">{module.average}/20</span>
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-lg", mention.className)}>
                        {mentionOf(module.average)}
                    </span>
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </button>

            {expanded && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {module.grades.map((g) => (
                        <div key={g.id} className="flex items-center justify-between px-5 py-2.5">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700 font-medium">{g.label}</span>
                                {g.isLocked && <Lock size={11} className="text-gray-400" />}
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{g.value}/20</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
