"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type Student = { id: string; userId: string; programId: string };
type Program = { id: string; name: string };
type StudentGroup = { id: string; studentId: string; groupId: string };
type Group = { id: string; name: string };
type Absence = { id: string; status: string };
type FileDocument = { id: string; status: string };

const nameCache = new Map<string, string>();

async function resolveStudentName(userId: string): Promise<string> {
    const cached = nameCache.get(userId);
    if (cached) return cached;
    const name = await api
        .get<{ firstname: string; lastname: string }>(`/users/${userId}`)
        .then((u) => `${u.firstname} ${u.lastname}`)
        .catch(() => `Étudiant #${userId.slice(0, 8)}`);
    nameCache.set(userId, name);
    return name;
}

export default function EtudiantsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [studentNames, setStudentNames] = useState<Record<string, string>>({});
    const [programs, setPrograms] = useState<Program[]>([]);
    const [programFilter, setProgramFilter] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [details, setDetails] = useState<Record<string, { groups: string[]; pendingAbsences: number; documentIssues: number }>>({});

    const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? id.slice(0, 8);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const [s, p] = await Promise.all([api.get<Student[]>("/students"), api.get<Program[]>("/programs")]);
                setStudents(s);
                setPrograms(p);
                const names = await Promise.all(
                    s.map(async (student) => [student.id, await resolveStudentName(student.userId)] as const),
                );
                setStudentNames(Object.fromEntries(names));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les étudiants.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const toggleExpand = async (student: Student) => {
        if (expanded === student.id) {
            setExpanded(null);
            return;
        }
        setExpanded(student.id);
        if (!details[student.id]) {
            try {
                const [studentGroups, absences, fileDocuments] = await Promise.all([
                    api.get<StudentGroup[]>(`/student-groups/student/${student.id}`),
                    api.get<Absence[]>(`/absences/student/${student.id}`),
                    api.get<FileDocument[]>(`/file-documents/student/${student.id}`),
                ]);
                const groupNames = await Promise.all(
                    studentGroups.map(async (sg) => (await api.get<Group>(`/groups/${sg.groupId}`)).name),
                );
                setDetails((prev) => ({
                    ...prev,
                    [student.id]: {
                        groups: groupNames,
                        pendingAbsences: absences.filter((a) => a.status === "PENDING").length,
                        documentIssues: fileDocuments.filter((d) => d.status !== "VALID").length,
                    },
                }));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger le dossier.");
            }
        }
    };

    const filtered = programFilter === "all" ? students : students.filter((s) => s.programId === programFilter);

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Dossiers étudiants</h2>
                <p className="text-sm text-gray-500 mt-1">Liste et fiches détaillées des étudiants inscrits.</p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">Filière :</label>
                <select value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                    <option value="all">Toutes</option>
                    {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>

            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                    {filtered.length === 0 && <p className="p-5 text-sm text-gray-400">Aucun étudiant.</p>}
                    {filtered.map((s) => {
                        const detail = details[s.id];
                        return (
                            <div key={s.id}>
                                <button onClick={() => void toggleExpand(s)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 text-left">
                                    <div className="flex-1">
                                        <div className="font-semibold text-sm text-gray-900">
                                            {studentNames[s.id] ?? "Chargement…"}
                                        </div>
                                        <div className="text-xs text-gray-500">{programName(s.programId)}</div>
                                    </div>
                                    {expanded === s.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                </button>
                                {expanded === s.id && (
                                    <div className="px-5 pb-4 pl-8 text-sm">
                                        {!detail && <p className="text-xs text-gray-400">Chargement…</p>}
                                        {detail && (
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-400 mb-1">Groupe(s)</div>
                                                    <div className="text-sm font-medium text-gray-800">{detail.groups.join(", ") || "—"}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-400 mb-1">Absences en attente</div>
                                                    <div className="text-sm font-medium text-gray-800">{detail.pendingAbsences}</div>
                                                </div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="text-xs text-gray-400 mb-1">Documents à régulariser</div>
                                                    <div className="text-sm font-medium text-gray-800">{detail.documentIssues}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
