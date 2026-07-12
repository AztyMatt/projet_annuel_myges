"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type External = { id: string; firstname: string; lastname: string; email: string; type: "INVIGILATOR" | "JURY" | "OTHER" };

const typeLabels: Record<External["type"], string> = { INVIGILATOR: "Surveillant", JURY: "Jury", OTHER: "Autre" };

export default function ExternesPage() {
    const [externals, setExternals] = useState<External[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<External | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            setExternals(await api.get<External[]>("/externals"));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les externes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Jurys et surveillants externes</h2>
                    <p className="text-sm text-gray-500 mt-1">Utilisés pour affecter des personnes externes aux sessions d&apos;examen</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E]">
                    <Plus size={14} /> Nouveau
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                {["Nom", "Email", "Type", ""].map((h) => (
                                    <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {externals.map((e) => (
                                <tr key={e.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-3 font-medium text-gray-900">{e.firstname} {e.lastname}</td>
                                    <td className="px-5 py-3 text-gray-500">{e.email}</td>
                                    <td className="px-5 py-3 text-gray-700">{typeLabels[e.type]}</td>
                                    <td className="px-5 py-3">
                                        <button onClick={() => setEditing(e)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Pencil size={13} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {externals.length === 0 && (
                                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">Aucun externe.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {showCreate && <ExternalModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); void refresh(); }} />}
            {editing && <ExternalModal external={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void refresh(); }} />}
        </div>
    );
}

function ExternalModal({ external, onClose, onSaved }: { external?: External; onClose: () => void; onSaved: () => void }) {
    const [firstname, setFirstname] = useState(external?.firstname ?? "");
    const [lastname, setLastname] = useState(external?.lastname ?? "");
    const [email, setEmail] = useState(external?.email ?? "");
    const [type, setType] = useState<External["type"]>(external?.type ?? "JURY");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const valid = firstname && lastname && email;

    const handleSubmit = async () => {
        if (!valid) return;
        setSubmitting(true);
        setError("");
        try {
            if (external) await api.patch(`/externals/${external.id}`, { firstname, lastname, email, type });
            else await api.post("/externals", { firstname, lastname, email, type });
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
                    <h3 className="font-bold text-gray-900">{external ? "Modifier" : "Nouveau"}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-3">
                    <input value={firstname} onChange={(e) => setFirstname(e.target.value)} placeholder="Prénom" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <input value={lastname} onChange={(e) => setLastname(e.target.value)} placeholder="Nom" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <select value={type} onChange={(e) => setType(e.target.value as External["type"])} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                        <option value="JURY">Jury</option>
                        <option value="INVIGILATOR">Surveillant</option>
                        <option value="OTHER">Autre</option>
                    </select>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting || !valid} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Enregistrement…" : external ? "Enregistrer" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
