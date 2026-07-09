"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, X, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/toast";

type Program = { id: string; name: string; code: string; periodId: string };
type Period = { id: string; order: number; startDate: string; endDate: string };
type Module = { id: string; name: string; code: string };
type Bloc = { id: string; name: string; programId: string };
type ProgramModule = { id: string; programId: string; moduleId: string; coefficient: number; ectsCredits: number };

export default function Formations() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [periods, setPeriods] = useState<Period[]>([]);
    const [modules, setModules] = useState<Module[]>([]);
    const [blocs, setBlocs] = useState<Record<string, Bloc[]>>({});
    const [programModules, setProgramModules] = useState<Record<string, ProgramModule[]>>({});
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const toast = useToast();

    const [showCreateProgram, setShowCreateProgram] = useState(false);
    const [showCreateModule, setShowCreateModule] = useState(false);
    const [showCreateBlocFor, setShowCreateBlocFor] = useState<string | null>(null);
    const [showAttachModuleFor, setShowAttachModuleFor] = useState<string | null>(null);

    const moduleName = (id: string) => modules.find((m) => m.id === id)?.name ?? id.slice(0, 8);
    const periodLabel = (id: string) => {
        const p = periods.find((x) => x.id === id);
        return p ? `Période #${p.order} (${new Date(p.startDate).toLocaleDateString("fr-FR")})` : id.slice(0, 8);
    };

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const [p, per, mod] = await Promise.all([
                api.get<Program[]>("/programs"),
                api.get<Period[]>("/periods"),
                api.get<Module[]>("/modules"),
            ]);
            setPrograms(p);
            setPeriods(per);
            setModules(mod);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les filières.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const toggleExpand = async (programId: string) => {
        if (expanded === programId) {
            setExpanded(null);
            return;
        }
        setExpanded(programId);
        if (!blocs[programId]) {
            try {
                const [b, pm] = await Promise.all([
                    api.get<Bloc[]>(`/programs/${programId}/blocs`),
                    api.get<ProgramModule[]>(`/program-modules/program/${programId}`),
                ]);
                setBlocs((prev) => ({ ...prev, [programId]: b }));
                setProgramModules((prev) => ({ ...prev, [programId]: pm }));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger le détail.");
            }
        }
    };

    const handleRemoveModule = async (programId: string, programModuleId: string) => {
        try {
            await api.delete(`/program-modules/${programModuleId}`);
            setProgramModules((prev) => ({ ...prev, [programId]: prev[programId].filter((pm) => pm.id !== programModuleId) }));
            toast.success("Module retiré de la filière.");
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Suppression impossible.");
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            {/* Catalogue des modules */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-sm">Catalogue des modules</h3>
                    <button
                        onClick={() => setShowCreateModule(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200"
                    >
                        <Plus size={12} /> Nouveau module
                    </button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {modules.map((m) => (
                        <span key={m.id} className="text-xs px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-gray-600">
                            {m.name} {m.code && <span className="text-gray-400">({m.code})</span>}
                        </span>
                    ))}
                    {modules.length === 0 && <p className="text-xs text-gray-400">Aucun module.</p>}
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Filières</h2>
                    <p className="text-sm text-gray-500 mt-1">Blocs de compétences et modules rattachés</p>
                </div>
                <button
                    onClick={() => setShowCreateProgram(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E]"
                >
                    <Plus size={14} /> Nouvelle filière
                </button>
            </div>

            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                    {programs.length === 0 && <p className="p-5 text-sm text-gray-400">Aucune filière.</p>}
                    {programs.map((program) => (
                        <div key={program.id}>
                            <button
                                onClick={() => void toggleExpand(program.id)}
                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 text-left"
                            >
                                <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-900">
                                        {program.name} {program.code && <span className="text-gray-400 font-normal">({program.code})</span>}
                                    </div>
                                    <div className="text-xs text-gray-500">{periodLabel(program.periodId)}</div>
                                </div>
                                {expanded === program.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </button>

                            {expanded === program.id && (
                                <div className="px-5 pb-4 pl-8 space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Blocs de compétences</span>
                                            <button onClick={() => setShowCreateBlocFor(program.id)} className="text-xs text-blue-600 font-medium hover:underline">
                                                + Ajouter un bloc
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(blocs[program.id] ?? []).map((b) => (
                                                <span key={b.id} className="text-xs px-2 py-1 bg-gray-50 border border-gray-200 rounded-full text-gray-600">
                                                    {b.name}
                                                </span>
                                            ))}
                                            {(blocs[program.id] ?? []).length === 0 && <p className="text-xs text-gray-400">Aucun bloc.</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Modules rattachés</span>
                                            <button onClick={() => setShowAttachModuleFor(program.id)} className="text-xs text-blue-600 font-medium hover:underline">
                                                + Rattacher un module
                                            </button>
                                        </div>
                                        <div className="space-y-1.5">
                                            {(programModules[program.id] ?? []).map((pm) => (
                                                <div key={pm.id} className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                                                    <span className="flex-1 font-medium">{moduleName(pm.moduleId)}</span>
                                                    <span>Coef. {pm.coefficient}</span>
                                                    <span>{pm.ectsCredits} ECTS</span>
                                                    <button onClick={() => void handleRemoveModule(program.id, pm.id)} className="text-gray-400 hover:text-red-600">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(programModules[program.id] ?? []).length === 0 && <p className="text-xs text-gray-400">Aucun module rattaché.</p>}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showCreateProgram && (
                <CreateProgramModal periods={periods} onClose={() => setShowCreateProgram(false)} onCreated={() => { setShowCreateProgram(false); void refresh(); }} />
            )}
            {showCreateModule && (
                <CreateModuleModal onClose={() => setShowCreateModule(false)} onCreated={(m) => { setModules((prev) => [...prev, m]); setShowCreateModule(false); }} />
            )}
            {showCreateBlocFor && (
                <CreateBlocModal
                    programId={showCreateBlocFor}
                    onClose={() => setShowCreateBlocFor(null)}
                    onCreated={(b) => { setBlocs((prev) => ({ ...prev, [showCreateBlocFor]: [...(prev[showCreateBlocFor] ?? []), b] })); setShowCreateBlocFor(null); }}
                />
            )}
            {showAttachModuleFor && (
                <AttachModuleModal
                    programId={showAttachModuleFor}
                    modules={modules}
                    onClose={() => setShowAttachModuleFor(null)}
                    onCreated={(pm) => { setProgramModules((prev) => ({ ...prev, [showAttachModuleFor]: [...(prev[showAttachModuleFor] ?? []), pm] })); setShowAttachModuleFor(null); }}
                />
            )}
        </div>
    );
}

function CreateProgramModal({ periods, onClose, onCreated }: { periods: Period[]; onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name || !periodId) return;
        setSubmitting(true);
        setError("");
        try {
            await api.post("/programs", { name, code, periodId });
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
                    <h3 className="font-bold text-gray-900">Nouvelle filière</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Nom</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Code</label>
                        <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Période</label>
                        <select value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            {periods.length === 0 && <option value="">Aucune période — créez-en une dans /scolarite/annee-academique</option>}
                            {periods.map((p) => (
                                <option key={p.id} value={p.id}>
                                    Période #{p.order} ({new Date(p.startDate).toLocaleDateString("fr-FR")})
                                </option>
                            ))}
                        </select>
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting || !name || !periodId} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CreateModuleModal({ onClose, onCreated }: { onClose: () => void; onCreated: (m: Module) => void }) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name) return;
        setSubmitting(true);
        setError("");
        try {
            const created = await api.post<Module>("/modules", { name, code });
            onCreated(created);
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
                    <h3 className="font-bold text-gray-900">Nouveau module</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Nom</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Code</label>
                        <input value={code} onChange={(e) => setCode(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
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

function CreateBlocModal({ programId, onClose, onCreated }: { programId: string; onClose: () => void; onCreated: (b: Bloc) => void }) {
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name) return;
        setSubmitting(true);
        setError("");
        try {
            const bloc = await api.post<Bloc>("/blocs", { name, programId });
            onCreated(bloc);
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
                    <h3 className="font-bold text-gray-900">Nouveau bloc de compétences</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Nom</label>
                        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
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

function AttachModuleModal({
    programId,
    modules,
    onClose,
    onCreated,
}: {
    programId: string;
    modules: Module[];
    onClose: () => void;
    onCreated: (pm: ProgramModule) => void;
}) {
    const [moduleId, setModuleId] = useState(modules[0]?.id ?? "");
    const [coefficient, setCoefficient] = useState(1);
    const [ectsCredits, setEctsCredits] = useState(3);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!moduleId) return;
        setSubmitting(true);
        setError("");
        try {
            const pm = await api.post<ProgramModule>("/program-modules", { programId, moduleId, coefficient, ectsCredits });
            onCreated(pm);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Rattachement impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Rattacher un module</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Module</label>
                        <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            {modules.length === 0 && <option value="">Aucun module — créez-en un d&apos;abord</option>}
                            {modules.map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Coefficient</label>
                            <input type="number" min={1} value={coefficient} onChange={(e) => setCoefficient(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Crédits ECTS</label>
                            <input type="number" min={0} value={ectsCredits} onChange={(e) => setEctsCredits(Number(e.target.value))} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                        </div>
                    </div>
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting || !moduleId} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Rattachement…" : "Rattacher"}
                    </button>
                </div>
            </div>
        </div>
    );
}
