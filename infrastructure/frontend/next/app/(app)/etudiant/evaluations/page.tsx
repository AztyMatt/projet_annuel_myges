"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, CheckCircle, AlertTriangle, Users, Upload } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

type Assessment = {
    id: string;
    courseId: string;
    title: string;
    type: "CONTINUOUS" | "EXAM";
    isPublished: boolean;
    dueDate: string;
    maxGroupSize: number;
};

type Row = Assessment & {
    moduleName: string;
    myGroupId: string | null;
    hasSubmission: boolean;
};

async function loadAssessments(studentId: string): Promise<Row[]> {
    const studentGroups = await api.get<{ groupId: string }[]>(`/student-groups/student/${studentId}`);
    const myMemberships = await api.get<{ assessmentGroupId: string }[]>(`/assessment-group-members/student/${studentId}`);
    const moduleCache = new Map<string, string>();
    const rows: Row[] = [];

    for (const sg of studentGroups) {
        const courses = await api.get<{ id: string; moduleId: string }[]>(`/groups/${sg.groupId}/courses`);
        for (const course of courses) {
            if (!moduleCache.has(course.moduleId)) {
                const moduleData = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
                moduleCache.set(course.moduleId, moduleData.name);
            }
            const assessments = await api.get<Assessment[]>(`/courses/${course.id}/assessments`);
            for (const a of assessments.filter((x) => x.isPublished)) {
                const groupsForAssessment = await api.get<{ id: string }[]>(`/assessment-groups/assessment/${a.id}`);
                const groupIds = new Set(groupsForAssessment.map((g) => g.id));
                const myGroupId = myMemberships.find((m) => groupIds.has(m.assessmentGroupId))?.assessmentGroupId ?? null;

                let hasSubmission = false;
                if (myGroupId) {
                    const submissions = await api.get<unknown[]>(`/file-assessments/group/${myGroupId}`);
                    hasSubmission = submissions.length > 0;
                }

                rows.push({ ...a, moduleName: moduleCache.get(course.moduleId)!, myGroupId, hasSubmission });
            }
        }
    }

    return rows.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

function statusOf(row: Row): { label: string; tone: StatusTone; icon: typeof Clock } {
    if (row.hasSubmission) return { label: "Rendu", tone: "green", icon: CheckCircle };
    if (new Date(row.dueDate) < new Date()) return { label: "En retard", tone: "red", icon: AlertTriangle };
    return { label: "À rendre", tone: "orange", icon: Clock };
}

export default function EvaluationsEtudiant() {
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formingId, setFormingId] = useState<string | null>(null);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const uploadTargetRef = useRef<Row | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const student = await api.get<{ id: string }>("/students/me");
            setRows(await loadAssessments(student.id));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les évaluations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const formGroup = async (assessmentId: string): Promise<string> => {
        const student = await api.get<{ id: string }>("/students/me");
        const group = await api.post<{ id: string }>("/assessment-groups", { assessmentId });
        await api.post("/assessment-group-members", { assessmentGroupId: group.id, studentId: student.id });
        return group.id;
    };

    const handleFormGroup = async (assessmentId: string) => {
        setFormingId(assessmentId);
        try {
            await formGroup(assessmentId);
            await refresh();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Formation du groupe impossible.");
        } finally {
            setFormingId(null);
        }
    };

    const openFilePicker = (row: Row) => {
        uploadTargetRef.current = row;
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const row = uploadTargetRef.current;
        e.target.value = "";
        if (!file || !row) return;

        setUploadingId(row.id);
        setError("");
        try {
            const groupId = row.myGroupId ?? (await formGroup(row.id));
            const uploaded = await api.upload<{ id: string }>("/files/upload", file);
            await api.post("/file-assessments", { assessmentId: row.id, assessmentGroupId: groupId, fileId: uploaded.id });
            await refresh();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Le dépôt du rendu a échoué.");
        } finally {
            setUploadingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Évaluations</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Échéances de vos évaluations publiées — formez votre groupe si nécessaire puis déposez votre rendu.
                </p>
            </div>

            <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => void handleFileSelected(e)} />

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                    {rows.length === 0 && <p className="p-5 text-sm text-gray-400">Aucune évaluation publiée.</p>}
                    {rows.map((row) => {
                        const s = statusOf(row);
                        const SIcon = s.icon;
                        const canSubmit = !row.hasSubmission && new Date(row.dueDate) > new Date();
                        return (
                            <div key={row.id} className="flex items-center gap-4 px-5 py-4">
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-gray-900">{row.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {row.moduleName} · {row.type === "CONTINUOUS" ? "Continu" : "Examen"} · Échéance {new Date(row.dueDate).toLocaleDateString("fr-FR")}
                                    </div>
                                </div>
                                {row.maxGroupSize > 1 && (
                                    row.myGroupId ? (
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <Users size={12} /> Groupe formé
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => void handleFormGroup(row.id)}
                                            disabled={formingId === row.id}
                                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                                        >
                                            <Users size={12} /> Former mon groupe
                                        </button>
                                    )
                                )}
                                {canSubmit && (
                                    <button
                                        onClick={() => openFilePicker(row)}
                                        disabled={uploadingId === row.id}
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                                    >
                                        <Upload size={12} /> {uploadingId === row.id ? "Envoi…" : "Déposer un rendu"}
                                    </button>
                                )}
                                <StatusBadge tone={s.tone} icon={SIcon} className="flex-shrink-0">{s.label}</StatusBadge>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
