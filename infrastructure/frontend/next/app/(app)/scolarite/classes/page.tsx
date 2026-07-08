"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, X, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type Program = { id: string; name: string };
type Class = { id: string; number: number; programId: string; size: number; conversationId: string };
type Group = { id: string; classId: string; name: string };
type StudentGroup = { id: string; studentId: string; groupId: string };
type Student = { id: string };

export default function ClassesPage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [programId, setProgramId] = useState("");
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [groups, setGroups] = useState<Record<string, Group[]>>({});
    const [studentGroups, setStudentGroups] = useState<Record<string, StudentGroup[]>>({});
    const [expandedClass, setExpandedClass] = useState<string | null>(null);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showCreateClass, setShowCreateClass] = useState(false);
    const [showCreateGroupFor, setShowCreateGroupFor] = useState<string | null>(null);
    const [showAddStudentFor, setShowAddStudentFor] = useState<string | null>(null);

    const loadClasses = async (pid: string) => {
        try {
            setClasses(await api.get<Class[]>(`/programs/${pid}/classes`));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les classes.");
        }
    };

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError("");
            try {
                const [p, s] = await Promise.all([api.get<Program[]>("/programs"), api.get<Student[]>("/students")]);
                setPrograms(p);
                setStudents(s);
                if (p[0]) {
                    setProgramId(p[0].id);
                    await loadClasses(p[0].id);
                }
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les données.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleProgramChange = async (pid: string) => {
        setProgramId(pid);
        setExpandedClass(null);
        await loadClasses(pid);
    };

    const toggleClass = async (classId: string) => {
        if (expandedClass === classId) {
            setExpandedClass(null);
            return;
        }
        setExpandedClass(classId);
        if (!groups[classId]) {
            try {
                const list = await api.get<Group[]>(`/classes/${classId}/groups`);
                setGroups((prev) => ({ ...prev, [classId]: list }));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les groupes.");
            }
        }
    };

    const toggleGroup = async (groupId: string) => {
        if (expandedGroup === groupId) {
            setExpandedGroup(null);
            return;
        }
        setExpandedGroup(groupId);
        if (!studentGroups[groupId]) {
            try {
                const list = await api.get<StudentGroup[]>(`/student-groups/group/${groupId}`);
                setStudentGroups((prev) => ({ ...prev, [groupId]: list }));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les étudiants.");
            }
        }
    };

    const handleRemoveStudent = async (groupId: string, studentGroupId: string) => {
        try {
            await api.delete(`/student-groups/${studentGroupId}`);
            setStudentGroups((prev) => ({ ...prev, [groupId]: prev[groupId].filter((sg) => sg.id !== studentGroupId) }));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Retrait impossible.");
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Classes et groupes</h2>
                    <p className="text-sm text-gray-500 mt-1">Gestion des promotions en sous-effectif : déplacer manuellement les étudiants puis supprimer l&apos;ancienne classe — pas de fusion automatique.</p>
                </div>
                <button
                    onClick={() => setShowCreateClass(true)}
                    disabled={!programId}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E] disabled:opacity-50"
                >
                    <Plus size={14} /> Nouvelle classe
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="flex items-center gap-3">
                <label className="text-xs font-medium text-gray-700">Filière :</label>
                <select
                    value={programId}
                    onChange={(e) => void handleProgramChange(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white"
                >
                    {programs.length === 0 && <option value="">Aucune filière</option>}
                    {programs.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                    {classes.length === 0 && <p className="p-5 text-sm text-gray-400">Aucune classe pour cette filière.</p>}
                    {classes.map((cls) => (
                        <div key={cls.id}>
                            <button onClick={() => void toggleClass(cls.id)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 text-left">
                                <div className="flex-1">
                                    <span className="font-semibold text-sm text-gray-900">Classe {cls.number}</span>
                                    <span className="text-xs text-gray-400 ml-2">Effectif déclaré : {cls.size}</span>
                                </div>
                                {expandedClass === cls.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </button>

                            {expandedClass === cls.id && (
                                <div className="px-5 pb-4 pl-8">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Groupes</span>
                                        <button onClick={() => setShowCreateGroupFor(cls.id)} className="text-xs text-blue-600 font-medium hover:underline">
                                            + Ajouter un groupe
                                        </button>
                                    </div>
                                    {(groups[cls.id] ?? []).length === 0 && <p className="text-xs text-gray-400">Aucun groupe.</p>}
                                    <div className="space-y-2">
                                        {(groups[cls.id] ?? []).map((group) => (
                                            <div key={group.id} className="bg-gray-50 rounded-lg">
                                                <button onClick={() => void toggleGroup(group.id)} className="w-full flex items-center gap-2 px-3 py-2 text-left">
                                                    <span className="flex-1 text-sm font-medium text-gray-800">{group.name}</span>
                                                    {expandedGroup === group.id ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
                                                </button>
                                                {expandedGroup === group.id && (
                                                    <div className="px-3 pb-3">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-xs text-gray-500">Étudiants</span>
                                                            <button onClick={() => setShowAddStudentFor(group.id)} className="text-xs text-blue-600 font-medium hover:underline">
                                                                + Affecter un étudiant
                                                            </button>
                                                        </div>
                                                        {(studentGroups[group.id] ?? []).length === 0 && (
                                                            <p className="text-xs text-gray-400">Aucun étudiant affecté.</p>
                                                        )}
                                                        <div className="space-y-1">
                                                            {(studentGroups[group.id] ?? []).map((sg) => (
                                                                <div key={sg.id} className="flex items-center gap-2 text-xs bg-white border border-gray-100 rounded-lg px-2.5 py-1.5">
                                                                    <span className="flex-1 text-gray-600">Étudiant #{sg.studentId.slice(0, 8)}</span>
                                                                    <button onClick={() => void handleRemoveStudent(group.id, sg.id)} className="text-gray-400 hover:text-red-600">
                                                                        <Trash2 size={11} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showCreateClass && (
                <CreateClassModal
                    programId={programId}
                    onClose={() => setShowCreateClass(false)}
                    onCreated={(cls) => { setClasses((prev) => [...prev, cls]); setShowCreateClass(false); }}
                />
            )}
            {showCreateGroupFor && (
                <CreateGroupModal
                    classId={showCreateGroupFor}
                    onClose={() => setShowCreateGroupFor(null)}
                    onCreated={(g) => { setGroups((prev) => ({ ...prev, [showCreateGroupFor]: [...(prev[showCreateGroupFor] ?? []), g] })); setShowCreateGroupFor(null); }}
                />
            )}
            {showAddStudentFor && (
                <AddStudentModal
                    groupId={showAddStudentFor}
                    students={students}
                    onClose={() => setShowAddStudentFor(null)}
                    onCreated={(sg) => { setStudentGroups((prev) => ({ ...prev, [showAddStudentFor]: [...(prev[showAddStudentFor] ?? []), sg] })); setShowAddStudentFor(null); }}
                />
            )}
        </div>
    );
}

function CreateClassModal({ programId, onClose, onCreated }: { programId: string; onClose: () => void; onCreated: (c: Class) => void }) {
    const [number, setNumber] = useState(1);
    const [size, setSize] = useState(25);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            const conversation = await api.post<{ id: string }>("/conversations", {});
            const cls = await api.post<Class>("/classes", { number, programId, size, conversationId: conversation.id });
            onCreated(cls);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Création impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Nouvelle classe</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Numéro</label>
                        <input type="number" min={1} value={number} onChange={(e) => setNumber(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Effectif déclaré</label>
                        <input type="number" min={1} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CreateGroupModal({ classId, onClose, onCreated }: { classId: string; onClose: () => void; onCreated: (g: Group) => void }) {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name) return;
        setSubmitting(true);
        setError("");
        try {
            const group = await api.post<Group>("/groups", { classId, name });
            onCreated(group);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Création impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Nouveau groupe</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Nom</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Groupe A" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting || !name} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddStudentModal({
    groupId,
    students,
    onClose,
    onCreated,
}: {
    groupId: string;
    students: Student[];
    onClose: () => void;
    onCreated: (sg: StudentGroup) => void;
}) {
    const [studentId, setStudentId] = useState(students[0]?.id ?? "");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!studentId) return;
        setSubmitting(true);
        setError("");
        try {
            const sg = await api.post<StudentGroup>("/student-groups", { studentId, groupId });
            onCreated(sg);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Affectation impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Affecter un étudiant</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-500">
                        Les noms d&apos;étudiants ne sont pas encore disponibles côté backend — sélection par identifiant.
                    </p>
                    <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                        {students.length === 0 && <option value="">Aucun étudiant</option>}
                        {students.map((s) => (
                            <option key={s.id} value={s.id}>Étudiant #{s.id.slice(0, 8)}</option>
                        ))}
                    </select>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting || !studentId} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Affectation…" : "Affecter"}
                    </button>
                </div>
            </div>
        </div>
    );
}
