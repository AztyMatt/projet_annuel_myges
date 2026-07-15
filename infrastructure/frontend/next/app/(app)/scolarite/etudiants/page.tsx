"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, UserPlus, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

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
    const [showInvite, setShowInvite] = useState(false);
    const toast = useToast();

    const programName = (id: string) => programs.find((p) => p.id === id)?.name ?? id.slice(0, 8);

    const refresh = async () => {
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
    };

    useEffect(() => {
        void refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dossiers étudiants</h2>
                    <p className="text-sm text-gray-500 mt-1">Liste et fiches détaillées des étudiants inscrits.</p>
                </div>
                <button
                    onClick={() => setShowInvite(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E]"
                >
                    <UserPlus size={16} />
                    Inviter un étudiant
                </button>
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

            {showInvite && (
                <InviteStudentModal
                    programs={programs}
                    onClose={() => setShowInvite(false)}
                    onInvited={(email) => {
                        setShowInvite(false);
                        toast.success(`Invitation envoyée à ${email}.`);
                        void refresh();
                    }}
                />
            )}
        </div>
    );
}

function InviteStudentModal({
    programs,
    onClose,
    onInvited,
}: {
    programs: Program[];
    onClose: () => void;
    onInvited: (email: string) => void;
}) {
    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [programId, setProgramId] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const valid = firstname && lastname && email && programId;

    const handleSubmit = async () => {
        if (!valid) return;
        setSubmitting(true);
        setError("");
        try {
            await api.post("/users/invite", { firstname, lastname, email, programId });
            onInvited(email);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Invitation impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Inviter un étudiant</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-3">
                    <p className="text-xs text-gray-500">
                        L&apos;étudiant recevra un email avec un lien (valable 72 h) pour définir son mot de passe et
                        activer son compte.
                    </p>
                    <input value={firstname} onChange={(e) => setFirstname(e.target.value)} placeholder="Prénom" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <input value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder="Nom" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Adresse email" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                        <option value="">Filière…</option>
                        {programs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting || !valid} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Envoi…" : "Envoyer l'invitation"}
                    </button>
                </div>
            </div>
        </div>
    );
}
