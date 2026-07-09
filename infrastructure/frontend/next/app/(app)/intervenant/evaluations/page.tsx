"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Send, ExternalLink } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { StatusBadge } from "@/components/ui/status-badge";

type CourseOption = { id: string; label: string; groupId: string };

type Assessment = {
    id: string;
    courseId: string;
    title: string;
    type: "CONTINUOUS" | "EXAM";
    isPublished: boolean;
    dueDate: string;
    maxGroupSize: number;
};

type Row = Assessment & { courseLabel: string; groupsCount: number; submissionsCount: number };

type GroupDetail = {
    id: string;
    members: { id: string; studentId: string }[];
    submitted: boolean;
};

async function loadCourseOptions(): Promise<CourseOption[]> {
    const courses = await api.get<{ id: string; moduleId: string; groupId: string }[]>("/courses/mine");
    const moduleCache = new Map<string, string>();
    const groupCache = new Map<string, string>();
    const options: CourseOption[] = [];

    for (const course of courses) {
        if (!moduleCache.has(course.moduleId)) {
            const moduleData = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
            moduleCache.set(course.moduleId, moduleData.name);
        }
        if (!groupCache.has(course.groupId)) {
            const groupData = await api.get<{ name: string }>(`/groups/${course.groupId}`);
            groupCache.set(course.groupId, groupData.name);
        }
        options.push({
            id: course.id,
            groupId: course.groupId,
            label: `${moduleCache.get(course.moduleId)} — ${groupCache.get(course.groupId)}`,
        });
    }

    return options;
}

async function loadRows(courses: CourseOption[]): Promise<Row[]> {
    const rows: Row[] = [];
    for (const course of courses) {
        const assessments = await api.get<Assessment[]>(`/courses/${course.id}/assessments`);
        for (const a of assessments) {
            const groups = await api.get<{ id: string }[]>(`/assessment-groups/assessment/${a.id}`);
            const submissions = await api.get<unknown[]>(`/file-assessments/assessment/${a.id}`);
            rows.push({ ...a, courseLabel: course.label, groupsCount: groups.length, submissionsCount: submissions.length });
        }
    }
    return rows.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

async function loadGroupDetails(assessmentId: string): Promise<GroupDetail[]> {
    const groups = await api.get<{ id: string }[]>(`/assessment-groups/assessment/${assessmentId}`);
    const details: GroupDetail[] = [];
    for (const g of groups) {
        const members = await api.get<{ id: string; studentId: string }[]>(`/assessment-group-members/group/${g.id}`);
        const submissions = await api.get<unknown[]>(`/file-assessments/group/${g.id}`);
        details.push({ id: g.id, members, submitted: submissions.length > 0 });
    }
    return details;
}

const emptyForm = { courseId: "", title: "", type: "CONTINUOUS" as "CONTINUOUS" | "EXAM", dueDate: "", maxGroupSize: 1, publish: false };

export default function EvaluationsIntervenant() {
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [rows, setRows] = useState<Row[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [groupDetails, setGroupDetails] = useState<GroupDetail[]>([]);
    const [detailsLoading, setDetailsLoading] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
    const [deleting, setDeleting] = useState(false);

    const toast = useToast();

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const courseOptions = await loadCourseOptions();
            setCourses(courseOptions);
            setRows(await loadRows(courseOptions));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les évaluations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const sortedByCourse = useMemo(() => rows, [rows]);

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...emptyForm, courseId: courses[0]?.id ?? "" });
        setShowForm(true);
    };

    const openEdit = (row: Row) => {
        setEditingId(row.id);
        setForm({
            courseId: row.courseId,
            title: row.title,
            type: row.type,
            dueDate: row.dueDate.slice(0, 16),
            maxGroupSize: row.maxGroupSize,
            publish: row.isPublished,
        });
        setShowForm(true);
    };

    const handleSubmit = async () => {
        if (!form.courseId || !form.title || !form.dueDate) return;
        setSaving(true);
        setError("");
        try {
            const payload = {
                courseId: form.courseId,
                title: form.title,
                type: form.type,
                dueDate: new Date(form.dueDate).toISOString(),
                maxGroupSize: form.maxGroupSize,
                isPublished: form.publish,
            };
            if (editingId) await api.patch(`/assessments/${editingId}`, payload);
            else await api.post("/assessments", payload);
            setShowForm(false);
            toast.success(editingId ? "Évaluation modifiée." : "Évaluation créée.");
            await refresh();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Enregistrement impossible.");
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await api.post(`/assessments/${id}/publish`);
            toast.success("Évaluation publiée.");
            await refresh();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Publication impossible.");
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await api.delete(`/assessments/${deleteTarget.id}`);
            setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
            toast.success("Évaluation supprimée.");
            setDeleteTarget(null);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Suppression impossible.");
        } finally {
            setDeleting(false);
        }
    };

    const toggleExpand = async (row: Row) => {
        if (expandedId === row.id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(row.id);
        setDetailsLoading(true);
        try {
            setGroupDetails(await loadGroupDetails(row.id));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les rendus.");
        } finally {
            setDetailsLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Évaluations</h2>
                    <p className="text-sm text-gray-500 mt-1">Création et suivi des rendus par cours</p>
                </div>
                <button
                    onClick={openCreate}
                    disabled={courses.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-[#002C6E] rounded-lg hover:bg-[#001944] disabled:opacity-50"
                >
                    <Plus size={14} /> Nouvelle évaluation
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
                Le dépôt de rendu par les étudiants dépend de l&apos;upload de fichiers, pas encore implémenté côté
                backend (voir CLAUDE.md) — cette page permet de créer/publier des évaluations et de suivre la formation
                des groupes et les rendus déjà enregistrés.
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                    <h3 className="font-bold text-sm text-gray-900">{editingId ? "Modifier l'évaluation" : "Nouvelle évaluation"}</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-gray-500">Cours</label>
                            <select
                                value={form.courseId}
                                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                                className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-gray-500">Titre</label>
                            <input
                                type="text"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Type</label>
                            <select
                                value={form.type}
                                onChange={(e) => setForm({ ...form, type: e.target.value as "CONTINUOUS" | "EXAM" })}
                                className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="CONTINUOUS">Contrôle continu</option>
                                <option value="EXAM">Examen</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-500">Taille max. de groupe</label>
                            <input
                                type="number"
                                min={1}
                                value={form.maxGroupSize}
                                onChange={(e) => setForm({ ...form, maxGroupSize: Number(e.target.value) })}
                                className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs font-medium text-gray-500">Date limite</label>
                            <input
                                type="datetime-local"
                                value={form.dueDate}
                                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                className="mt-1 w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <label className="col-span-2 flex items-center gap-2 text-xs font-medium text-gray-600">
                            <input
                                type="checkbox"
                                checked={form.publish}
                                onChange={(e) => setForm({ ...form, publish: e.target.checked })}
                            />
                            Publier {editingId ? "" : "immédiatement"}
                        </label>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <button
                            onClick={() => void handleSubmit()}
                            disabled={saving}
                            className="px-4 py-2 text-sm font-semibold text-white bg-[#002C6E] rounded-lg hover:bg-[#001944] disabled:opacity-50"
                        >
                            Enregistrer
                        </button>
                        <button
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                {loading && <p className="p-5 text-sm text-gray-400">Chargement…</p>}
                {!loading && sortedByCourse.length === 0 && (
                    <p className="p-5 text-sm text-gray-400">Aucune évaluation créée.</p>
                )}
                {!loading &&
                    sortedByCourse.map((row) => (
                        <div key={row.id}>
                            <div className="flex items-center gap-4 px-5 py-4">
                                <button onClick={() => void toggleExpand(row)} className="text-gray-400 hover:text-gray-600">
                                    {expandedId === row.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-gray-900">{row.title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {row.courseLabel} · {row.type === "CONTINUOUS" ? "Continu" : "Examen"} · Échéance{" "}
                                        {new Date(row.dueDate).toLocaleDateString("fr-FR")}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {row.groupsCount} groupe{row.groupsCount > 1 ? "s" : ""} · {row.submissionsCount} rendu
                                    {row.submissionsCount > 1 ? "s" : ""}
                                </span>
                                <StatusBadge tone={row.isPublished ? "green" : "gray"} className="flex-shrink-0">
                                    {row.isPublished ? "Publiée" : "Brouillon"}
                                </StatusBadge>
                                {!row.isPublished && (
                                    <button
                                        onClick={() => void handlePublish(row.id)}
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                                    >
                                        <Send size={11} /> Publier
                                    </button>
                                )}
                                <button
                                    onClick={() => openEdit(row)}
                                    className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Modifier
                                </button>
                                <button
                                    onClick={() => setDeleteTarget(row)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                    title="Supprimer"
                                >
                                    <Trash2 size={13} />
                                </button>
                            </div>

                            {expandedId === row.id && (
                                <div className="px-5 pb-4 pl-14 space-y-2">
                                    {detailsLoading && <p className="text-xs text-gray-400">Chargement des rendus…</p>}
                                    {!detailsLoading && groupDetails.length === 0 && (
                                        <p className="text-xs text-gray-400">Aucun groupe formé pour l&apos;instant.</p>
                                    )}
                                    {!detailsLoading &&
                                        groupDetails.map((g, i) => (
                                            <div key={g.id} className="flex items-center gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                                                <span className="font-medium text-gray-700">Groupe {i + 1}</span>
                                                <span className="text-gray-500">
                                                    {g.members.map((m) => `Étudiant #${m.studentId.slice(0, 8)}`).join(", ")}
                                                </span>
                                                <StatusBadge tone={g.submitted ? "green" : "orange"} className="ml-auto">
                                                    {g.submitted ? "Rendu déposé" : "Aucun rendu"}
                                                </StatusBadge>
                                            </div>
                                        ))}
                                    <a
                                        href="/intervenant/notes"
                                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline w-fit"
                                    >
                                        <ExternalLink size={11} /> Noter cette évaluation
                                    </a>
                                </div>
                            )}
                        </div>
                    ))}
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Supprimer cette évaluation ?"
                description={`« ${deleteTarget?.title ?? ""} » sera définitivement supprimée, ainsi que les groupes formés pour celle-ci.`}
                confirmLabel="Supprimer"
                pendingLabel="Suppression…"
                loading={deleting}
                onConfirm={() => void handleDelete()}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
