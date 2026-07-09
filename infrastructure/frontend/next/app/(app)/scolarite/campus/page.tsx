"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, X, Users } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type Campus = { id: string; name: string; address: string };
type Classroom = { id: string; name: string; capacity: number; campusId: string };

export default function CampusPage() {
    const [campuses, setCampuses] = useState<Campus[]>([]);
    const [classrooms, setClassrooms] = useState<Record<string, Classroom[]>>({});
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreateCampus, setShowCreateCampus] = useState(false);
    const [showCreateClassroomFor, setShowCreateClassroomFor] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            setCampuses(await api.get<Campus[]>("/campuses"));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les campus.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const toggleExpand = async (campusId: string) => {
        if (expanded === campusId) {
            setExpanded(null);
            return;
        }
        setExpanded(campusId);
        if (!classrooms[campusId]) {
            try {
                const list = await api.get<Classroom[]>(`/campuses/${campusId}/classrooms`);
                setClassrooms((prev) => ({ ...prev, [campusId]: list }));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les salles.");
            }
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Campus et salles</h2>
                    <p className="text-sm text-gray-500 mt-1">Nécessaire pour rattacher une session à une salle</p>
                </div>
                <button
                    onClick={() => setShowCreateCampus(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E]"
                >
                    <Plus size={14} /> Nouveau campus
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                    {campuses.length === 0 && <p className="p-5 text-sm text-gray-400">Aucun campus.</p>}
                    {campuses.map((campus) => (
                        <div key={campus.id}>
                            <button
                                onClick={() => void toggleExpand(campus.id)}
                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 text-left"
                            >
                                <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-900">{campus.name}</div>
                                    <div className="text-xs text-gray-500">{campus.address}</div>
                                </div>
                                {expanded === campus.id ? (
                                    <ChevronUp size={16} className="text-gray-400" />
                                ) : (
                                    <ChevronDown size={16} className="text-gray-400" />
                                )}
                            </button>

                            {expanded === campus.id && (
                                <div className="px-5 pb-4 pl-8">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Salles</span>
                                        <button
                                            onClick={() => setShowCreateClassroomFor(campus.id)}
                                            className="text-xs text-blue-600 font-medium hover:underline"
                                        >
                                            + Ajouter une salle
                                        </button>
                                    </div>
                                    {(classrooms[campus.id] ?? []).length === 0 && (
                                        <p className="text-xs text-gray-400">Aucune salle.</p>
                                    )}
                                    <div className="space-y-1.5">
                                        {(classrooms[campus.id] ?? []).map((room) => (
                                            <div key={room.id} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                                                <span className="font-semibold">{room.name}</span>
                                                <span className="flex items-center gap-1 text-gray-400">
                                                    <Users size={11} /> {room.capacity}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showCreateCampus && (
                <CreateCampusModal onClose={() => setShowCreateCampus(false)} onCreated={() => { setShowCreateCampus(false); void refresh(); }} />
            )}
            {showCreateClassroomFor && (
                <CreateClassroomModal
                    campusId={showCreateClassroomFor}
                    onClose={() => setShowCreateClassroomFor(null)}
                    onCreated={(room) => {
                        setClassrooms((prev) => ({ ...prev, [showCreateClassroomFor]: [...(prev[showCreateClassroomFor] ?? []), room] }));
                        setShowCreateClassroomFor(null);
                    }}
                />
            )}
        </div>
    );
}

function CreateCampusModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name || !address) return;
        setSubmitting(true);
        setError("");
        try {
            await api.post("/campuses", { name, address });
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
                    <h3 className="font-bold text-gray-900">Nouveau campus</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Nom</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Adresse</label>
                        <input value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                        Annuler
                    </button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={submitting || !name || !address}
                        className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CreateClassroomModal({
    campusId,
    onClose,
    onCreated,
}: {
    campusId: string;
    onClose: () => void;
    onCreated: (room: Classroom) => void;
}) {
    const [name, setName] = useState("");
    const [capacity, setCapacity] = useState(20);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name) return;
        setSubmitting(true);
        setError("");
        try {
            const room = await api.post<Classroom>("/classrooms", { name, capacity, campusId });
            onCreated(room);
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
                    <h3 className="font-bold text-gray-900">Nouvelle salle</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Nom</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Capacité</label>
                        <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                        Annuler
                    </button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={submitting || !name}
                        className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
