"use client";

import { useEffect, useState } from "react";
import { Plus, CheckCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type AcademicYear = { id: string; startDate: string; endDate: string; isCurrent: boolean };
type Period = { id: string; order: number; startDate: string; endDate: string; academicYearId: string };

const fmt = (d: string) => new Date(d).toLocaleDateString("fr-FR");

export default function AnneeAcademique() {
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [periods, setPeriods] = useState<Record<string, Period[]>>({});
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [showPeriodFor, setShowPeriodFor] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const list = await api.get<AcademicYear[]>("/academic-years");
            setYears(list.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les années académiques.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const toggleExpand = async (yearId: string) => {
        if (expanded === yearId) {
            setExpanded(null);
            return;
        }
        setExpanded(yearId);
        if (!periods[yearId]) {
            try {
                const list = await api.get<Period[]>(`/academic-years/${yearId}/periods`);
                setPeriods((prev) => ({ ...prev, [yearId]: list.sort((a, b) => a.order - b.order) }));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les périodes.");
            }
        }
    };

    const handleSetCurrent = async (yearId: string) => {
        setBusyId(yearId);
        try {
            const others = years.filter((y) => y.isCurrent && y.id !== yearId);
            await Promise.all(others.map((y) => api.patch(`/academic-years/${y.id}`, { isCurrent: false })));
            await api.patch(`/academic-years/${yearId}`, { isCurrent: true });
            await refresh();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Action impossible.");
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Années académiques</h2>
                    <p className="text-sm text-gray-500 mt-1">Prérequis pour créer une filière</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E]"
                >
                    <Plus size={14} /> Nouvelle année
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                    {years.length === 0 && <p className="p-5 text-sm text-gray-400">Aucune année académique.</p>}
                    {years.map((year) => (
                        <div key={year.id}>
                            <button
                                onClick={() => void toggleExpand(year.id)}
                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 text-left"
                            >
                                <div className="flex-1">
                                    <span className="font-semibold text-sm text-gray-900">
                                        {fmt(year.startDate)} — {fmt(year.endDate)}
                                    </span>
                                    {year.isCurrent && (
                                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                            <CheckCircle size={11} /> En cours
                                        </span>
                                    )}
                                </div>
                                {!year.isCurrent && (
                                    <span
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            void handleSetCurrent(year.id);
                                        }}
                                        className={cn(
                                            "text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50",
                                            busyId === year.id && "opacity-50",
                                        )}
                                    >
                                        Définir comme actuelle
                                    </span>
                                )}
                                {expanded === year.id ? (
                                    <ChevronUp size={16} className="text-gray-400" />
                                ) : (
                                    <ChevronDown size={16} className="text-gray-400" />
                                )}
                            </button>

                            {expanded === year.id && (
                                <div className="px-5 pb-4 pl-8">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Périodes
                                        </span>
                                        <button
                                            onClick={() => setShowPeriodFor(year.id)}
                                            className="text-xs text-blue-600 font-medium hover:underline"
                                        >
                                            + Ajouter une période
                                        </button>
                                    </div>
                                    {(periods[year.id] ?? []).length === 0 && (
                                        <p className="text-xs text-gray-400">Aucune période.</p>
                                    )}
                                    <div className="space-y-1.5">
                                        {(periods[year.id] ?? []).map((p) => (
                                            <div key={p.id} className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                                                <span className="font-semibold">#{p.order}</span>
                                                <span>
                                                    {fmt(p.startDate)} — {fmt(p.endDate)}
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

            {showCreate && (
                <CreateYearModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void refresh(); }} />
            )}
            {showPeriodFor && (
                <CreatePeriodModal
                    academicYearId={showPeriodFor}
                    nextOrder={(periods[showPeriodFor]?.length ?? 0) + 1}
                    onClose={() => setShowPeriodFor(null)}
                    onCreated={(period) => {
                        setPeriods((prev) => ({
                            ...prev,
                            [showPeriodFor]: [...(prev[showPeriodFor] ?? []), period].sort((a, b) => a.order - b.order),
                        }));
                        setShowPeriodFor(null);
                    }}
                />
            )}
        </div>
    );
}

function CreateYearModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!startDate || !endDate) return;
        setSubmitting(true);
        setError("");
        try {
            await api.post("/academic-years", { startDate, endDate });
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
                    <h3 className="font-bold text-gray-900">Nouvelle année académique</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Date de début</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Date de fin</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                        Annuler
                    </button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={submitting || !startDate || !endDate}
                        className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CreatePeriodModal({
    academicYearId,
    nextOrder,
    onClose,
    onCreated,
}: {
    academicYearId: string;
    nextOrder: number;
    onClose: () => void;
    onCreated: (period: Period) => void;
}) {
    const [order, setOrder] = useState(nextOrder);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!startDate || !endDate) return;
        setSubmitting(true);
        setError("");
        try {
            const period = await api.post<Period>("/periods", { order, startDate, endDate, academicYearId });
            onCreated(period);
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
                    <h3 className="font-bold text-gray-900">Nouvelle période</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Ordre</label>
                        <input type="number" min={1} value={order} onChange={(e) => setOrder(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Date de début</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Date de fin</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">
                        Annuler
                    </button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={submitting || !startDate || !endDate}
                        className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
