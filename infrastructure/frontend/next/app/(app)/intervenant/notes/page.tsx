"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type Course = { id: string; moduleId: string; groupId: string; moduleName: string };
type Assessment = { id: string; title: string; type: "CONTINUOUS" | "EXAM"; isPublished: boolean; dueDate: string };
type StudentRow = { studentId: string; studentName: string; gradeId: string | null; value: number | null; isLocked: boolean };

function mentionOf(value: number): { label: string; className: string } {
    if (value >= 16) return { label: "TB", className: "bg-green-100 text-green-700" };
    if (value >= 14) return { label: "B", className: "bg-blue-100 text-blue-700" };
    if (value >= 12) return { label: "AB", className: "bg-sky-100 text-sky-700" };
    if (value >= 10) return { label: "P", className: "bg-gray-100 text-gray-700" };
    return { label: "F", className: "bg-red-100 text-red-700" };
}

async function loadCourses(): Promise<Course[]> {
    const courses = await api.get<{ id: string; moduleId: string; groupId: string }[]>("/courses/mine");
    const moduleCache = new Map<string, string>();
    const resolved: Course[] = [];
    for (const course of courses) {
        if (!moduleCache.has(course.moduleId)) {
            const moduleData = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
            moduleCache.set(course.moduleId, moduleData.name);
        }
        resolved.push({ ...course, moduleName: moduleCache.get(course.moduleId)! });
    }
    return resolved;
}

async function loadRoster(course: Course, assessmentId: string): Promise<StudentRow[]> {
    const [studentGroups, gradeLinks] = await Promise.all([
        api.get<{ studentId: string }[]>(`/groups/${course.groupId}/students`),
        api.get<{ gradeId: string }[]>(`/grade-assessments/assessment/${assessmentId}`),
    ]);

    const grades = await Promise.all(
        gradeLinks.map((link) => api.get<{ id: string; studentId: string; value: number; isLocked: boolean }>(`/grades/${link.gradeId}`)),
    );
    const gradeByStudent = new Map(grades.map((g) => [g.studentId, g]));

    return Promise.all(
        studentGroups.map(async (sg) => {
            const grade = gradeByStudent.get(sg.studentId);
            const studentName = await api
                .get<{ userId: string }>(`/students/${sg.studentId}`)
                .then((student) => api.get<{ firstname: string; lastname: string }>(`/users/${student.userId}`))
                .then((user) => `${user.firstname} ${user.lastname}`)
                .catch(() => `Étudiant #${sg.studentId.slice(0, 8)}`);
            return {
                studentId: sg.studentId,
                studentName,
                gradeId: grade?.id ?? null,
                value: grade?.value ?? null,
                isLocked: grade?.isLocked ?? false,
            };
        }),
    );
}

export default function SaisieNotes() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [courseId, setCourseId] = useState("");
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [assessmentId, setAssessmentId] = useState("");
    const [roster, setRoster] = useState<StudentRow[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [loadingRoster, setLoadingRoster] = useState(false);
    const [error, setError] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        loadCourses()
            .then((list) => {
                setCourses(list);
                if (list[0]) setCourseId(list[0].id);
            })
            .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger vos cours."))
            .finally(() => setLoadingCourses(false));
    }, []);

    useEffect(() => {
        if (!courseId) return;
        api
            .get<Assessment[]>(`/courses/${courseId}/assessments`)
            .then((list) => {
                setAssessments(list);
                setAssessmentId(list[0]?.id ?? "");
            })
            .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger les évaluations."));
    }, [courseId]);

    useEffect(() => {
        const course = courses.find((c) => c.id === courseId);
        if (!course || !assessmentId) {
            setRoster([]);
            return;
        }
        setLoadingRoster(true);
        setError("");
        loadRoster(course, assessmentId)
            .then(setRoster)
            .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger les étudiants."))
            .finally(() => setLoadingRoster(false));
    }, [courseId, assessmentId, courses]);

    const selectedCourse = courses.find((c) => c.id === courseId);
    const average = useMemo(() => {
        const graded = roster.filter((r) => r.value !== null);
        if (graded.length === 0) return null;
        return Math.round((graded.reduce((a, r) => a + (r.value ?? 0), 0) / graded.length) * 100) / 100;
    }, [roster]);

    const handleSaveValue = async (studentId: string, rawValue: string) => {
        const value = Number(rawValue);
        if (Number.isNaN(value) || value < 0 || value > 20) return;
        const row = roster.find((r) => r.studentId === studentId);
        if (!row || row.isLocked) return;

        setSavingId(studentId);
        try {
            if (row.gradeId) {
                await api.patch(`/grades/${row.gradeId}`, { value });
            } else {
                const grade = await api.post<{ id: string }>("/grades", { studentId, value });
                await api.post("/grade-assessments", { gradeId: grade.id, assessmentId });
                setRoster((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, gradeId: grade.id } : r)));
            }
            setRoster((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, value } : r)));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Enregistrement impossible.");
        } finally {
            setSavingId(null);
            setEditingId(null);
        }
    };

    const handleExportCsv = () => {
        const rows = [["Étudiant", "Note /20"], ...roster.map((r) => [r.studentName, r.value?.toString() ?? ""])];
        const csv = rows.map((row) => row.join(";")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "notes.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Saisie des notes</h2>
                <p className="text-sm text-gray-500 mt-1">Saisissez les notes de vos étudiants pour chaque évaluation</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-wrap items-end gap-4">
                <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Cours</label>
                    <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white min-w-[220px]"
                    >
                        {loadingCourses && <option>Chargement…</option>}
                        {!loadingCourses && courses.length === 0 && <option>Aucun cours</option>}
                        {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.moduleName}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-medium text-gray-700 block mb-1">Évaluation</label>
                    <select
                        value={assessmentId}
                        onChange={(e) => setAssessmentId(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white min-w-[220px]"
                    >
                        {assessments.length === 0 && <option value="">Aucune évaluation</option>}
                        {assessments.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.title}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleExportCsv}
                    disabled={roster.length === 0}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    <Download size={13} /> Exporter CSV
                </button>
            </div>

            {selectedCourse && (
                <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="text-2xl font-black text-gray-900">
                            {roster.filter((r) => r.value !== null).length}/{roster.length}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">Étudiants notés</div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="text-2xl font-black text-gray-900">{average !== null ? `${average}/20` : "—"}</div>
                        <div className="text-xs text-gray-500 mt-0.5">Moyenne</div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loadingRoster && <p className="p-5 text-sm text-gray-400">Chargement…</p>}
                {!loadingRoster && roster.length === 0 && (
                    <p className="p-5 text-sm text-gray-400">Sélectionnez un cours et une évaluation.</p>
                )}
                {!loadingRoster && roster.length > 0 && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50">
                                {["Étudiant", "Note /20", "Mention", ""].map((h) => (
                                    <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {roster.map((row) => {
                                const mention = row.value !== null ? mentionOf(row.value) : null;
                                const isEditing = editingId === row.studentId && !row.isLocked;
                                return (
                                    <tr key={row.studentId}>
                                        <td className="px-5 py-3 font-medium text-gray-800">
                                            {row.studentName}
                                        </td>
                                        <td className="px-5 py-3">
                                            {isEditing ? (
                                                <input
                                                    autoFocus
                                                    type="number"
                                                    min={0}
                                                    max={20}
                                                    step={0.5}
                                                    defaultValue={row.value ?? ""}
                                                    onBlur={(e) => void handleSaveValue(row.studentId, e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                                    }}
                                                    className="w-20 px-2 py-1 border-2 border-blue-500 rounded-lg outline-none font-bold"
                                                />
                                            ) : (
                                                <button
                                                    onClick={() => !row.isLocked && setEditingId(row.studentId)}
                                                    disabled={row.isLocked || savingId === row.studentId}
                                                    className={cn(
                                                        "min-w-[44px] px-2.5 py-1 rounded-lg font-bold text-left",
                                                        mention ? mention.className : "text-gray-400",
                                                    )}
                                                >
                                                    {savingId === row.studentId ? "…" : (row.value ?? "—")}
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            {mention && (
                                                <span className={cn("text-xs font-bold px-2 py-0.5 rounded", mention.className)}>
                                                    {mention.label}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            {row.isLocked && (
                                                <span className="flex items-center gap-1 text-xs text-purple-600 font-medium">
                                                    <Lock size={11} /> Gelée
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="text-xs text-gray-400">
                Le gel des notes se fait depuis l&apos;administration (<code>/scolarite/notes</code>) une fois la
                saisie terminée — cette action n&apos;est pas autorisée pour les intervenants côté backend.
            </p>
        </div>
    );
}
