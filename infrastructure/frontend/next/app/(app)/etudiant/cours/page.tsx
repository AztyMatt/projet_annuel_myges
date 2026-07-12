"use client";

import { useEffect, useState } from "react";
import { FileText, Download } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type SupportFile = { id: string; fileId: string; name: string; sizeBytes: number; uploadedAt: string };
type ModuleSupports = { moduleId: string; moduleName: string; files: SupportFile[] };

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

async function loadModuleSupports(): Promise<ModuleSupports[]> {
    const student = await api.get<{ id: string }>("/students/me");
    const studentGroups = await api.get<{ groupId: string }[]>(`/student-groups/student/${student.id}`);
    const byModule = new Map<string, ModuleSupports>();

    for (const sg of studentGroups) {
        const courses = await api.get<{ id: string; moduleId: string }[]>(`/groups/${sg.groupId}/courses`);
        for (const course of courses) {
            if (!byModule.has(course.moduleId)) {
                const moduleData = await api.get<{ name: string }>(`/modules/${course.moduleId}`);
                byModule.set(course.moduleId, { moduleId: course.moduleId, moduleName: moduleData.name, files: [] });
            }
            const fileCourses = await api.get<{ id: string; name: string; fileId: string }[]>(
                `/file-courses/course/${course.id}`,
            );
            for (const fc of fileCourses) {
                const file = await api.get<{ sizeBytes: number; uploadedAt: string }>(`/files/${fc.fileId}`);
                byModule.get(course.moduleId)!.files.push({ id: fc.id, fileId: fc.fileId, name: fc.name, sizeBytes: file.sizeBytes, uploadedAt: file.uploadedAt });
            }
        }
    }

    return Array.from(byModule.values()).sort((a, b) => a.moduleName.localeCompare(b.moduleName));
}

export default function CoursEtudiant() {
    const [modules, setModules] = useState<ModuleSupports[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadModuleSupports()
            .then(setModules)
            .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger les supports."))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Supports de cours</h2>
                <p className="text-sm text-gray-500 mt-1">Documents déposés par vos intervenants, par module</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && modules.length === 0 && !error && (
                <p className="text-sm text-gray-400">Aucun support disponible pour le moment.</p>
            )}

            {!loading &&
                modules.map((mod) => (
                    <div key={mod.moduleId} className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="p-5 border-b border-gray-50">
                            <h3 className="font-bold text-sm text-gray-900">{mod.moduleName}</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {mod.files.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">Aucun fichier déposé.</p>}
                            {mod.files.map((f) => (
                                <div key={f.id} className="flex items-center gap-4 px-5 py-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <FileText size={16} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-gray-800 truncate">{f.name}</div>
                                        <div className="text-xs text-gray-400">
                                            {formatSize(f.sizeBytes)} · {new Date(f.uploadedAt).toLocaleDateString("fr-FR")}
                                        </div>
                                    </div>
                                    <a
                                        href={`/api/files/${f.fileId}/download`}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 flex-shrink-0"
                                        title="Télécharger"
                                    >
                                        <Download size={15} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
        </div>
    );
}
