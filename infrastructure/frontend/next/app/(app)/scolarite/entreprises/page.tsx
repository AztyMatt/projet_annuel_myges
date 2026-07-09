"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type Company = { id: string; name: string; siret: string; address: string; contactName: string; contactNumber: string | null; contactEmail: string | null };
type Contract = { id: string; type: string; startDate: string; endDate: string };

const contractLabels: Record<string, string> = { APPRENTICESHIP: "Apprentissage", PROFESSIONALIZATION: "Professionnalisation" };

export default function EntreprisesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [contracts, setContracts] = useState<Record<string, Contract[]>>({});
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            setCompanies(await api.get<Company[]>("/companies"));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les entreprises.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const toggleExpand = async (companyId: string) => {
        if (expanded === companyId) {
            setExpanded(null);
            return;
        }
        setExpanded(companyId);
        if (!contracts[companyId]) {
            try {
                const list = await api.get<Contract[]>(`/document-apprenticeship-contracts/company/${companyId}`);
                setContracts((prev) => ({ ...prev, [companyId]: list }));
            } catch (e) {
                setError(e instanceof ApiError ? e.message : "Impossible de charger les contrats.");
            }
        }
    };

    const isExpiringSoon = (endDate: string) => {
        const days = (new Date(endDate).getTime() - Date.now()) / 86400000;
        return days >= 0 && days <= 30;
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Entreprises</h2>
                    <p className="text-sm text-gray-500 mt-1">Suivi des alternants et des contrats</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-2 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E]">
                    <Plus size={14} /> Nouvelle entreprise
                </button>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                    {companies.length === 0 && <p className="p-5 text-sm text-gray-400">Aucune entreprise.</p>}
                    {companies.map((c) => (
                        <div key={c.id}>
                            <button onClick={() => void toggleExpand(c.id)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 text-left">
                                <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-900">{c.name}</div>
                                    <div className="text-xs text-gray-500">SIRET {c.siret} · {c.contactName}</div>
                                </div>
                                {expanded === c.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                            </button>
                            {expanded === c.id && (
                                <div className="px-5 pb-4 pl-8">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Contrats</div>
                                    {(contracts[c.id] ?? []).length === 0 && <p className="text-xs text-gray-400">Aucun contrat.</p>}
                                    <div className="space-y-1.5">
                                        {(contracts[c.id] ?? []).map((contract) => (
                                            <div key={contract.id} className="flex items-center gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                                                <span className="font-medium text-gray-700">{contractLabels[contract.type] ?? contract.type}</span>
                                                <span className="text-gray-500">
                                                    {new Date(contract.startDate).toLocaleDateString("fr-FR")} — {new Date(contract.endDate).toLocaleDateString("fr-FR")}
                                                </span>
                                                {isExpiringSoon(contract.endDate) && (
                                                    <span className="text-orange-600 font-medium">Expire bientôt</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        L&apos;ajout de contrats dépend de l&apos;upload de fichiers, pas encore implémenté (voir CLAUDE.md).
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showCreate && (
                <CreateCompanyModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void refresh(); }} />
            )}
        </div>
    );
}

function CreateCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [name, setName] = useState("");
    const [siret, setSiret] = useState("");
    const [address, setAddress] = useState("");
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const valid = name && siret && address && contactName;

    const handleSubmit = async () => {
        if (!valid) return;
        setSubmitting(true);
        setError("");
        try {
            await api.post("/companies", {
                name,
                siret,
                address,
                contactName,
                contactEmail: contactEmail || null,
                contactNumber: contactNumber || null,
            });
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
                    <h3 className="font-bold text-gray-900">Nouvelle entreprise</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <input value={siret} onChange={(e) => setSiret(e.target.value)} placeholder="SIRET" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Adresse" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nom du contact" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email du contact (optionnel)" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Téléphone du contact (optionnel)" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Annuler</button>
                    <button onClick={() => void handleSubmit()} disabled={submitting || !valid} className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50">
                        {submitting ? "Création…" : "Créer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
