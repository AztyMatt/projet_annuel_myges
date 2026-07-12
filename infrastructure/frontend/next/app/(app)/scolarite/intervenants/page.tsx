"use client";

import { useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type Instructor = { id: string; userId: string; contractType: string; specialties: string[] | null };

const contractLabels: Record<string, string> = {
    PERMANENT: "Permanent",
    FIXED_TERM: "CDD",
    FREELANCE: "Indépendant",
    TEMPORARY: "Vacataire",
};

export default function IntervenantsPage() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [courseCounts, setCourseCounts] = useState<Record<string, number>>({});
    const [names, setNames] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editing, setEditing] = useState<Instructor | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const list = await api.get<Instructor[]>("/instructors");
            setInstructors(list);
            const counts = await Promise.all(
                list.map(async (i) => [i.id, (await api.get<unknown[]>(`/instructors/${i.id}/courses`)).length] as const),
            );
            setCourseCounts(Object.fromEntries(counts));
            const resolvedNames = await Promise.all(
                list.map(async (i) => {
                    const name = await api
                        .get<{ firstname: string; lastname: string }>(`/users/${i.userId}`)
                        .then((u) => `${u.firstname} ${u.lastname}`)
                        .catch(() => `Intervenant #${i.id.slice(0, 8)}`);
                    return [i.id, name] as const;
                }),
            );
            setNames(Object.fromEntries(resolvedNames));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les intervenants.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Intervenants</h2>
                <p className="text-sm text-gray-500 mt-1">
                    La création d&apos;un profil intervenant se fait depuis l&apos;attribution de rôle
                    (<code>/superadmin/gestion</code>) — cette page permet de modifier un intervenant existant.
                </p>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                {["Intervenant", "Type de contrat", "Spécialités", "Cours affectés", ""].map((h) => (
                                    <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {instructors.map((i) => (
                                <tr key={i.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 font-medium text-gray-900">{names[i.id] ?? `Intervenant #${i.id.slice(0, 8)}`}</td>
                                    <td className="px-5 py-3 text-gray-700">{contractLabels[i.contractType] ?? i.contractType}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {(i.specialties ?? []).map((s) => (
                                                <span key={s} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{s}</span>
                                            ))}
                                            {(i.specialties ?? []).length === 0 && <span className="text-xs text-gray-400">—</span>}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-gray-700">{courseCounts[i.id] ?? "—"}</td>
                                    <td className="px-5 py-3">
                                        <button onClick={() => setEditing(i)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Pencil size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {instructors.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">Aucun intervenant.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {editing && (
                <EditInstructorModal
                    instructor={editing}
                    onClose={() => setEditing(null)}
                    onSaved={() => { setEditing(null); void refresh(); }}
                />
            )}
        </div>
    );
}

function EditInstructorModal({
    instructor,
    onClose,
    onSaved,
}: {
    instructor: Instructor;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [contractType, setContractType] = useState(instructor.contractType);
    const [specialties, setSpecialties] = useState((instructor.specialties ?? []).join(", "));
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            const specialtiesArray = specialties.split(",").map((s) => s.trim()).filter(Boolean);
            await api.patch(`/instructors/${instructor.id}`, { contractType, specialties: specialtiesArray });
            onSaved();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Modification impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Modifier l&apos;intervenant</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Type de contrat</label>
                        <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            {Object.entries(contractLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Spécialités (séparées par des virgules)</label>
                        <input value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="Cloud, DevOps, Sécurité" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Enregistrement…" : "Enregistrer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
