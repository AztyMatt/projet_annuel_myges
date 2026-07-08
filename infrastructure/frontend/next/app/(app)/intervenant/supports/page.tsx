"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Trash2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type SupportFile = {
    id: string; // FileCourse id
    name: string;
    moduleName: string;
    fileName: string;
    sizeBytes: number;
    uploadedAt: string;
};

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

async function loadSupports(): Promise<SupportFile[]> {
    const courses = await api.get<{ id: string; moduleId: string }[]>("/courses/mine");
    const moduleCache = new Map<string, string>();
    const supports: SupportFile[] = [];

    for (const course of courses) {
        if (!moduleCache.has(course.moduleId)) {
            const moduleData = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
            moduleCache.set(course.moduleId, moduleData.name);
        }
        const moduleName = moduleCache.get(course.moduleId)!;

        const fileCourses = await api.get<{ id: string; name: string; fileId: string }[]>(
            `/file-courses/course/${course.id}`,
        );
        for (const fc of fileCourses) {
            const file = await api.get<{ originalName: string; sizeBytes: number; uploadedAt: string }>(
                `/files/${fc.fileId}`,
            );
            supports.push({
                id: fc.id,
                name: fc.name,
                moduleName,
                fileName: file.originalName,
                sizeBytes: file.sizeBytes,
                uploadedAt: file.uploadedAt,
            });
        }
    }

    return supports.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
}

export default function SupportsIntervenant() {
    const [supports, setSupports] = useState<SupportFile[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const refresh = async () => {
            setLoading(true);
            setError("");
            try {
                setSupports(await loadSupports());
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les supports.");
            } finally {
                setLoading(false);
            }
        };
        void refresh();
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

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await api.delete(`/file-courses/${id}`);
            setSupports((prev) => prev.filter((s) => s.id !== id));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Suppression impossible.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
                Le dépôt de nouveaux fichiers dépend d&apos;un stockage réel côté backend, pas encore implémenté (voir
                CLAUDE.md) — cette page liste et permet de supprimer les supports déjà enregistrés.
            </div>

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
                                            <button
                                                onClick={() => void handleDelete(s.id)}
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
        </div>
    );
}
