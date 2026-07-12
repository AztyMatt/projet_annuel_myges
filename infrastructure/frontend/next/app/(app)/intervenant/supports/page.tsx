"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Trash2, Search, Upload, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type SupportFile = {
    id: string; // FileCourse id
    fileId: string;
    name: string;
    moduleName: string;
    fileName: string;
    sizeBytes: number;
    uploadedAt: string;
};

type CourseOption = { id: string; moduleName: string };

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

async function loadSupports(): Promise<{ supports: SupportFile[]; courses: CourseOption[] }> {
    const courses = await api.get<{ id: string; moduleId: string }[]>("/courses/mine");
    const moduleCache = new Map<string, string>();
    const supports: SupportFile[] = [];
    const courseOptions: CourseOption[] = [];

    for (const course of courses) {
        if (!moduleCache.has(course.moduleId)) {
            const moduleData = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
            moduleCache.set(course.moduleId, moduleData.name);
        }
        const moduleName = moduleCache.get(course.moduleId)!;
        courseOptions.push({ id: course.id, moduleName });

        const fileCourses = await api.get<{ id: string; name: string; fileId: string }[]>(
            `/file-courses/course/${course.id}`,
        );
        for (const fc of fileCourses) {
            const file = await api.get<{ originalName: string; sizeBytes: number; uploadedAt: string }>(
                `/files/${fc.fileId}`,
            );
            supports.push({
                id: fc.id,
                fileId: fc.fileId,
                name: fc.name,
                moduleName,
                fileName: file.originalName,
                sizeBytes: file.sizeBytes,
                uploadedAt: file.uploadedAt,
            });
        }
    }

    return {
        supports: supports.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
        courses: courseOptions,
    };
}

export default function SupportsIntervenant() {
    const [supports, setSupports] = useState<SupportFile[]>([]);
    const [courses, setCourses] = useState<CourseOption[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SupportFile | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const toast = useToast();

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const { supports, courses } = await loadSupports();
            setSupports(supports);
            setCourses(courses);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les supports.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filtered = useMemo(
        () =>
            supports.filter(
                (s) =>
                    s.name.toLowerCase().includes(search.toLowerCase()) ||
                    s.moduleName.toLowerCase().includes(search.toLowerCase()),
            ),
        [supports, search],
    );

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeletingId(deleteTarget.id);
        try {
            await api.delete(`/file-courses/${deleteTarget.id}`);
            setSupports((prev) => prev.filter((s) => s.id !== deleteTarget.id));
            toast.success("Support supprimé.");
            setDeleteTarget(null);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Suppression impossible.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="grid grid-cols-2 gap-4 max-w-md">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="text-2xl font-black text-gray-900">{supports.length}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Fichiers déposés</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 text-sm">Mes supports de cours</h3>
                        <button
                            onClick={() => setShowUpload(true)}
                            disabled={courses.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#001944] rounded-lg hover:bg-[#002C6E] disabled:opacity-50"
                        >
                            <Upload size={13} /> Ajouter un support
                        </button>
                    </div>
                    <div className="relative max-w-xs">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                {loading && <p className="p-5 text-sm text-gray-400">Chargement…</p>}

                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    <th className="text-left font-semibold text-gray-400 text-xs px-5 pb-3 pt-3">Fichier</th>
                                    <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Module</th>
                                    <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Taille</th>
                                    <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Date</th>
                                    <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50">
                                                    <FileText size={14} className="text-blue-600" />
                                                </div>
                                                <span className="font-medium text-gray-800 text-xs max-w-[220px] truncate">
                                                    {s.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-500 max-w-[120px] truncate">{s.moduleName}</td>
                                        <td className="px-3 py-3 text-xs text-gray-500">{formatSize(s.sizeBytes)}</td>
                                        <td className="px-3 py-3 text-xs text-gray-500">
                                            {new Date(s.uploadedAt).toLocaleDateString("fr-FR")}
                                        </td>
                                        <td className="px-3 py-3">
                                            <a
                                                href={`/api/files/${s.fileId}/download`}
                                                className="inline-flex p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Télécharger"
                                            >
                                                <Download size={13} />
                                            </a>
                                            <button
                                                onClick={() => setDeleteTarget(s)}
                                                disabled={deletingId === s.id}
                                                className={cn(
                                                    "p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors",
                                                    deletingId === s.id && "opacity-50",
                                                )}
                                                title="Supprimer"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filtered.length === 0 && (
                            <div className="text-center py-12 text-gray-400 text-sm">Aucun fichier trouvé</div>
                        )}
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={deleteTarget !== null}
                title="Supprimer ce support ?"
                description={`« ${deleteTarget?.name ?? ""} » ne sera plus visible par les étudiants.`}
                confirmLabel="Supprimer"
                pendingLabel="Suppression…"
                loading={deletingId !== null}
                onConfirm={() => void handleDelete()}
                onCancel={() => setDeleteTarget(null)}
            />

            {showUpload && (
                <UploadModal
                    courses={courses}
                    onClose={() => setShowUpload(false)}
                    onUploaded={() => {
                        setShowUpload(false);
                        toast.success("Support déposé.");
                        void refresh();
                    }}
                />
            )}
        </div>
    );
}

function UploadModal({
    courses,
    onClose,
    onUploaded,
}: {
    courses: CourseOption[];
    onClose: () => void;
    onUploaded: () => void;
}) {
    const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!courseId || !file) {
            setError("Choisissez un cours et un fichier.");
            return;
        }
        setSubmitting(true);
        setError("");
        try {
            const uploaded = await api.upload<{ id: string }>("/files/upload", file);
            await api.post("/file-courses", { name: name.trim() || file.name, fileId: uploaded.id, courseId });
            onUploaded();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Le dépôt a échoué.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Ajouter un support</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Cours</label>
                        <select
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.moduleName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Nom (optionnel)</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Support de cours - Chapitre 1"
                            className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Fichier</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="w-full text-xs text-gray-600 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                        />
                    </div>
                </div>

                {error && <p className="text-xs text-red-600 mt-3">{error}</p>}

                <button
                    onClick={() => void handleSubmit()}
                    disabled={submitting}
                    className="w-full mt-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#001944] hover:bg-[#002C6E] disabled:opacity-50"
                >
                    {submitting ? "Dépôt en cours…" : "Déposer"}
                </button>
            </div>
        </div>
    );
}
