"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, X, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { buildNameMap, resolveUserName } from "@/lib/user-names";
import { useToast } from "@/components/ui/toast";

type SessionExam = { id: string; sessionId: string; type: "WRITTEN" | "DEFENSE"; isRetake: boolean; assessmentId: string | null };
type SessionInfo = { id: string; startTime: string; courseId: string };
type Assessment = { id: string; title: string };
type SEStudent = { id: string; studentId: string };
type SEInstructor = { id: string; instructorId: string };
type SEExternal = { id: string; externalId: string };
type ExternalPerson = { id: string; firstname: string; lastname: string };
type Student = { id: string; userId: string };
type Instructor = { id: string; userId: string };

export default function ExamensPage() {
    const [sessionExams, setSessionExams] = useState<SessionExam[]>([]);
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [externals, setExternals] = useState<ExternalPerson[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [studentNames, setStudentNames] = useState<Record<string, string>>({});
    const [instructorNames, setInstructorNames] = useState<Record<string, string>>({});
    const [expanded, setExpanded] = useState<string | null>(null);
    const [seStudents, setSeStudents] = useState<Record<string, SEStudent[]>>({});
    const [seInstructors, setSeInstructors] = useState<Record<string, SEInstructor[]>>({});
    const [seExternals, setSeExternals] = useState<Record<string, SEExternal[]>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [addFor, setAddFor] = useState<{ sessionExamId: string; kind: "student" | "instructor" | "external" } | null>(null);

    const sessionLabel = (id: string) => {
        const s = sessions.find((x) => x.id === id);
        return s ? new Date(s.startTime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : id.slice(0, 8);
    };
    const externalName = (id: string) => {
        const e = externals.find((x) => x.id === id);
        return e ? `${e.firstname} ${e.lastname}` : id.slice(0, 8);
    };

    const studentName = (id: string) => studentNames[id] ?? `Étudiant #${id.slice(0, 8)}`;
    const instructorName = (id: string) => instructorNames[id] ?? `Intervenant #${id.slice(0, 8)}`;

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const [se, s, ext, stu, ins] = await Promise.all([
                api.get<SessionExam[]>("/session-exams"),
                api.get<SessionInfo[]>("/sessions"),
                api.get<ExternalPerson[]>("/externals"),
                api.get<Student[]>("/students"),
                api.get<Instructor[]>("/instructors"),
            ]);
            setSessionExams(se);
            setSessions(s);
            setExternals(ext);
            setStudents(stu);
            setInstructors(ins);
            const [stuNames, insNames] = await Promise.all([
                buildNameMap(stu, "Étudiant"),
                buildNameMap(ins, "Intervenant"),
            ]);
            setStudentNames(stuNames);
            setInstructorNames(insNames);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les sessions d'examen.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const toggleExpand = async (id: string) => {
        if (expanded === id) {
            setExpanded(null);
            return;
        }
        setExpanded(id);
        try {
            let studentList = students;
            let instructorList = instructors;
            if (studentList.length === 0 || instructorList.length === 0) {
                [studentList, instructorList] = await Promise.all([
                    api.get<Student[]>("/students"),
                    api.get<Instructor[]>("/instructors"),
                ]);
                setStudents(studentList);
                setInstructors(instructorList);
            }

            const [st, ins, ext] = await Promise.all([
                api.get<SEStudent[]>(`/session-exam-students/session-exam/${id}`),
                api.get<SEInstructor[]>(`/session-exam-instructors/session-exam/${id}`),
                api.get<SEExternal[]>(`/session-exam-externals/session-exam/${id}`),
            ]);
            setSeStudents((prev) => ({ ...prev, [id]: st }));
            setSeInstructors((prev) => ({ ...prev, [id]: ins }));
            setSeExternals((prev) => ({ ...prev, [id]: ext }));

            const studentById = new Map(studentList.map((s) => [s.id, s]));
            const instructorById = new Map(instructorList.map((i) => [i.id, i]));
            const stuNameUpdates: Record<string, string> = {};
            const insNameUpdates: Record<string, string> = {};

            await Promise.all([
                ...st.map(async ({ studentId }) => {
                    if (studentNames[studentId]) return;
                    const student = studentById.get(studentId);
                    if (!student?.userId) return;
                    stuNameUpdates[studentId] = await resolveUserName(student.userId, "Étudiant");
                }),
                ...ins.map(async ({ instructorId }) => {
                    if (instructorNames[instructorId]) return;
                    const instructor = instructorById.get(instructorId);
                    if (!instructor?.userId) return;
                    insNameUpdates[instructorId] = await resolveUserName(instructor.userId, "Intervenant");
                }),
            ]);

            if (Object.keys(stuNameUpdates).length > 0) {
                setStudentNames((prev) => ({ ...prev, ...stuNameUpdates }));
            }
            if (Object.keys(insNameUpdates).length > 0) {
                setInstructorNames((prev) => ({ ...prev, ...insNameUpdates }));
            }
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger le détail.");
        }
    };

    const handleRemove = async (kind: "student" | "instructor" | "external", sessionExamId: string, linkId: string) => {
        const path = kind === "student" ? "session-exam-students" : kind === "instructor" ? "session-exam-instructors" : "session-exam-externals";
        try {
            await api.delete(`/${path}/${linkId}`);
            if (kind === "student") setSeStudents((prev) => ({ ...prev, [sessionExamId]: prev[sessionExamId].filter((x) => x.id !== linkId) }));
            if (kind === "instructor") setSeInstructors((prev) => ({ ...prev, [sessionExamId]: prev[sessionExamId].filter((x) => x.id !== linkId) }));
            if (kind === "external") setSeExternals((prev) => ({ ...prev, [sessionExamId]: prev[sessionExamId].filter((x) => x.id !== linkId) }));
            toast.success("Affectation retirée.");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Retrait impossible.");
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sessions d&apos;examen</h2>
                    <p className="text-sm text-gray-500 mt-1">Écrit/soutenance, rattrapage, jury et surveillants</p>
                </div>
                <button onClick={() => setShowCreate(true)} disabled={sessions.length === 0} className="flex items-center gap-1.5 px-3 py-2 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E] disabled:opacity-50">
                    <Plus size={14} /> Nouvelle session d&apos;examen
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                    {sessionExams.length === 0 && <p className="p-5 text-sm text-gray-400">Aucune session d&apos;examen.</p>}
                    {sessionExams.map((se) => (
                        <div key={se.id}>
                            <button onClick={() => void toggleExpand(se.id)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 text-left">
                                <div className="flex-1">
                                    <span className="font-semibold text-sm text-gray-900">{se.type === "WRITTEN" ? "Écrit" : "Soutenance"}</span>
                                    <span className="text-xs text-gray-400 ml-2">{sessionLabel(se.sessionId)}</span>
                                    {se.isRetake && <span className="ml-2 text-xs px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">Rattrapage</span>}
                                </div>
                                {expanded === se.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </button>

                            {expanded === se.id && (
                                <div className="px-5 pb-4 pl-8 space-y-3">
                                    {(
                                        [
                                            { kind: "student" as const, label: "Étudiants", items: seStudents[se.id] ?? [], render: (x: SEStudent) => studentName(x.studentId) },
                                            { kind: "instructor" as const, label: "Jury / surveillants (intervenants)", items: seInstructors[se.id] ?? [], render: (x: SEInstructor) => instructorName(x.instructorId) },
                                            { kind: "external" as const, label: "Jury / surveillants externes", items: seExternals[se.id] ?? [], render: (x: SEExternal) => externalName(x.externalId) },
                                        ]
                                    ).map((section) => (
                                        <div key={section.kind}>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{section.label}</span>
                                                <button onClick={() => setAddFor({ sessionExamId: se.id, kind: section.kind })} className="text-xs text-blue-600 font-medium hover:underline">
                                                    + Ajouter
                                                </button>
                                            </div>
                                            <div className="space-y-1">
                                                {section.items.map((item) => (
                                                    <div key={item.id} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-1.5">
                                                        <span className="flex-1 text-gray-700">{section.render(item as never)}</span>
                                                        <button onClick={() => void handleRemove(section.kind, se.id, item.id)} className="text-gray-400 hover:text-red-600">
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {section.items.length === 0 && <p className="text-xs text-gray-400">Aucun.</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showCreate && (
                <CreateSessionExamModal sessions={sessions} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void refresh(); }} />
            )}
            {addFor && (
                <AddParticipantModal
                    kind={addFor.kind}
                    sessionExamId={addFor.sessionExamId}
                    students={students}
                    instructors={instructors}
                    externals={externals}
                    studentNames={studentNames}
                    instructorNames={instructorNames}
                    onClose={() => setAddFor(null)}
                    onSaved={() => {
                        const id = addFor.sessionExamId;
                        setAddFor(null);
                        void toggleExpand(id).then(() => void toggleExpand(id));
                    }}
                />
            )}
        </div>
    );
}

function CreateSessionExamModal({ sessions, onClose, onCreated }: { sessions: SessionInfo[]; onClose: () => void; onCreated: () => void }) {
    const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
    const [type, setType] = useState<"WRITTEN" | "DEFENSE">("WRITTEN");
    const [isRetake, setIsRetake] = useState(false);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [assessmentId, setAssessmentId] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get<Assessment[]>("/assessments").then(setAssessments).catch(() => {});
    }, []);

    const handleSubmit = async () => {
        if (!sessionId) return;
        setSubmitting(true);
        setError("");
        try {
            await api.post("/session-exams", { sessionId, type, isRetake, assessmentId: assessmentId || null });
            onCreated();
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
                    <h3 className="font-bold text-gray-900">Nouvelle session d&apos;examen</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Session</label>
                        <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>{new Date(s.startTime).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Type</label>
                        <select value={type} onChange={(e) => setType(e.target.value as "WRITTEN" | "DEFENSE")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            <option value="WRITTEN">Écrit</option>
                            <option value="DEFENSE">Soutenance</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Évaluation liée (optionnel)</label>
                        <select value={assessmentId} onChange={(e) => setAssessmentId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            <option value="">Aucune</option>
                            {assessments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={isRetake} onChange={(e) => setIsRetake(e.target.checked)} />
                        Rattrapage
                    </label>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting || !sessionId} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddParticipantModal({
    kind,
    sessionExamId,
    students,
    instructors,
    externals,
    studentNames,
    instructorNames,
    onClose,
    onSaved,
}: {
    kind: "student" | "instructor" | "external";
    sessionExamId: string;
    students: Student[];
    instructors: Instructor[];
    externals: ExternalPerson[];
    studentNames: Record<string, string>;
    instructorNames: Record<string, string>;
    onClose: () => void;
    onSaved: () => void;
}) {
    const options = kind === "student" ? students : kind === "instructor" ? instructors : externals;
    const [selectedId, setSelectedId] = useState(options[0]?.id ?? "");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const labelFor = (item: Student | Instructor | ExternalPerson) => {
        if (kind === "external") return `${(item as ExternalPerson).firstname} ${(item as ExternalPerson).lastname}`;
        if (kind === "student") return studentNames[item.id] ?? `Étudiant #${item.id.slice(0, 8)}`;
        return instructorNames[item.id] ?? `Intervenant #${item.id.slice(0, 8)}`;
    };

    const handleSubmit = async () => {
        if (!selectedId) return;
        setSubmitting(true);
        setError("");
        try {
            if (kind === "student") await api.post("/session-exam-students", { sessionExamId, studentId: selectedId });
            else if (kind === "instructor") await api.post("/session-exam-instructors", { sessionExamId, instructorId: selectedId });
            else await api.post("/session-exam-externals", { sessionExamId, externalId: selectedId });
            onSaved();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Ajout impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Ajouter</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                        {options.length === 0 && <option value="">Aucune option</option>}
                        {options.map((o) => <option key={o.id} value={o.id}>{labelFor(o)}</option>)}
                    </select>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting || !selectedId} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Ajout…" : "Ajouter"}
                    </button>
                </div>
            </div>
        </div>
    );
}
