"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { buildNameMap } from "@/lib/user-names";

type Course = { id: string; instructorId: string; moduleId: string; groupId: string; blocId: string; conversationId: string };
type Module = { id: string; name: string };
type Group = { id: string; name: string; classId: string };
type Bloc = { id: string; name: string };
type Instructor = { id: string; userId: string; contractType: string; specialties: string[] | null };

export default function CoursPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [blocs, setBlocs] = useState<Bloc[]>([]);
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [instructorNames, setInstructorNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Course | null>(null);

    const moduleName = (id: string) => modules.find((m) => m.id === id)?.name ?? id.slice(0, 8);
    const groupName = (id: string) => groups.find((g) => g.id === id)?.name ?? id.slice(0, 8);
    const blocName = (id: string) => blocs.find((b) => b.id === id)?.name ?? id.slice(0, 8);
    const instructorName = (id: string) => instructorNames[id] ?? `Intervenant #${id.slice(0, 8)}`;

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const [c, m, g, b, i] = await Promise.all([
                api.get<Course[]>("/courses"),
                api.get<Module[]>("/modules"),
                api.get<Group[]>("/groups"),
                api.get<Bloc[]>("/blocs"),
                api.get<Instructor[]>("/instructors"),
            ]);
            setCourses(c);
            setModules(m);
            setGroups(g);
            setBlocs(b);
            setInstructors(i);
            setInstructorNames(await buildNameMap(i, "Intervenant"));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les cours.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Cours</h2>
                    <p className="text-sm text-gray-500 mt-1">Affectation intervenant / module / groupe / bloc</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E]"
                >
                    <Plus size={14} /> Nouveau cours
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                {["Module", "Groupe", "Bloc", "Intervenant", ""].map((h) => (
                                    <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {courses.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 font-medium text-gray-900">{moduleName(c.moduleId)}</td>
                                    <td className="px-5 py-3 text-gray-700">{groupName(c.groupId)}</td>
                                    <td className="px-5 py-3 text-gray-700">{blocName(c.blocId)}</td>
                                    <td className="px-5 py-3 text-gray-700">{instructorName(c.instructorId)}</td>
                                    <td className="px-5 py-3">
                                        <button onClick={() => setEditing(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Pencil size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {courses.length === 0 && (
                                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Aucun cours.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showCreate && (
                <CourseModal
                    modules={modules}
                    groups={groups}
                    blocs={blocs}
                    instructors={instructors}
                    instructorNames={instructorNames}
                    onClose={() => setShowCreate(false)}
                    onSaved={() => { setShowCreate(false); void refresh(); }}
                />
            )}
            {editing && (
                <CourseModal
                    course={editing}
                    modules={modules}
                    groups={groups}
                    blocs={blocs}
                    instructors={instructors}
                    instructorNames={instructorNames}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); void refresh(); }}
                />
            )}
        </div>
    );
}

function CourseModal({
    course,
    modules,
    groups,
    blocs,
    instructors,
    instructorNames,
    onClose,
    onSaved,
}: {
    course?: Course;
    modules: Module[];
    groups: Group[];
    blocs: Bloc[];
    instructors: Instructor[];
    instructorNames: Record<string, string>;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [moduleId, setModuleId] = useState(course?.moduleId ?? modules[0]?.id ?? "");
    const [groupId, setGroupId] = useState(course?.groupId ?? groups[0]?.id ?? "");
    const [blocId, setBlocId] = useState(course?.blocId ?? blocs[0]?.id ?? "");
    const [instructorId, setInstructorId] = useState(course?.instructorId ?? instructors[0]?.id ?? "");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const selectedInstructor = instructors.find((i) => i.id === instructorId);

    const handleSubmit = async () => {
        if (!moduleId || !groupId || !blocId || !instructorId) return;
        setSubmitting(true);
        setError("");
        try {
            if (course) {
                await api.patch(`/courses/${course.id}`, { moduleId, groupId, blocId, instructorId });
            } else {
                const conversation = await api.post<{ id: string }>("/conversations", {});
                await api.post("/courses", { moduleId, groupId, blocId, instructorId, conversationId: conversation.id });
            }
            onSaved();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Enregistrement impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">{course ? "Modifier le cours" : "Nouveau cours"}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Module</label>
                        <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            {modules.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Groupe</label>
                        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Bloc</label>
                        <select value={blocId} onChange={(e) => setBlocId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            {blocs.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Intervenant</label>
                        <select value={instructorId} onChange={(e) => setInstructorId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            {instructors.map((i) => <option key={i.id} value={i.id}>{instructorNames[i.id] ?? `Intervenant #${i.id.slice(0, 8)}`}</option>)}
                        </select>
                        {selectedInstructor && (selectedInstructor.specialties ?? []).length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                                Spécialités : {(selectedInstructor.specialties ?? []).join(", ")} — aide à la décision, pas d&apos;affectation automatique
                            </p>
                        )}
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={submitting || !moduleId || !groupId || !blocId || !instructorId}
                        className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        {submitting ? "Enregistrement…" : course ? "Enregistrer" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
