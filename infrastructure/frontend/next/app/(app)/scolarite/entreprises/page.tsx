"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, ChevronDown, ChevronUp, X } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { buildStudentNameMap, formatStudentName } from "@/lib/user-names";

type Company = { id: string; name: string; siret: string; address: string; contactName: string; contactNumber: string | null; contactEmail: string | null };
type Contract = { id: string; type: string; startDate: string; endDate: string; fileDocumentId: string };
type Student = { id: string; userId: string };

const contractLabels: Record<string, string> = { APPRENTICESHIP: "Apprentissage", PROFESSIONALIZATION: "Professionnalisation" };

export default function EntreprisesPage() {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [contracts, setContracts] = useState<Record<string, Contract[]>>({});
    const [students, setStudents] = useState<Student[]>([]);
    const [studentNames, setStudentNames] = useState<Record<string, string>>({});
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCreate, setShowCreate] = useState(false);
    const [addContractFor, setAddContractFor] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const [companyList, studentList] = await Promise.all([
                api.get<Company[]>("/companies"),
                api.get<Student[]>("/students"),
            ]);
            setCompanies(companyList);
            setStudents(studentList);
            void buildStudentNameMap(studentList.map((s) => s.id)).then(setStudentNames);
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les entreprises.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const refreshContracts = async (companyId: string) => {
        try {
            const list = await api.get<Contract[]>(`/document-apprenticeship-contracts/company/${companyId}`);
            setContracts((prev) => ({ ...prev, [companyId]: list }));
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les contrats.");
        }
    };

    const toggleExpand = async (companyId: string) => {
        if (expanded === companyId) {
            setExpanded(null);
            return;
        }
        setExpanded(companyId);
        if (!contracts[companyId]) await refreshContracts(companyId);
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
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contrats</div>
                                        <button
                                            onClick={() => setAddContractFor(c.id)}
                                            className="text-xs text-blue-600 font-medium hover:underline"
                                        >
                                            + Nouveau contrat
                                        </button>
                                    </div>
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
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showCreate && (
                <CreateCompanyModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void refresh(); }} />
            )}

            {addContractFor && (
                <CreateContractModal
                    companyId={addContractFor}
                    students={students}
                    studentNames={studentNames}
                    onClose={() => setAddContractFor(null)}
                    onCreated={() => { void refreshContracts(addContractFor); setAddContractFor(null); }}
                />
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

function CreateContractModal({
    companyId,
    students,
    studentNames,
    onClose,
    onCreated,
}: {
    companyId: string;
    students: Student[];
    studentNames: Record<string, string>;
    onClose: () => void;
    onCreated: () => void;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [studentId, setStudentId] = useState(students[0]?.id ?? "");
    const [type, setType] = useState<"APPRENTICESHIP" | "PROFESSIONALIZATION">("APPRENTICESHIP");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const valid = studentId && startDate && endDate;

    const handleSubmit = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            setError("Choisissez le fichier PDF du contrat.");
            return;
        }
        if (!valid) return;
        setSubmitting(true);
        setError("");
        try {
            const uploaded = await api.upload<{ id: string }>("/files/upload", file);
            const fileDocument = await api.post<{ id: string }>("/file-documents", { fileId: uploaded.id, studentId });
            await api.post("/document-apprenticeship-contracts", {
                fileDocumentId: fileDocument.id,
                companyId,
                type,
                startDate,
                endDate,
            });
            onCreated();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Création du contrat impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">Nouveau contrat</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
                </div>
                <div className="p-6 space-y-3">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Étudiant</label>
                        <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            {students.length === 0 && <option value="">Aucun étudiant</option>}
                            {students.map((s) => (
                                <option key={s.id} value={s.id}>{formatStudentName(s.id, studentNames)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Type de contrat</label>
                        <select value={type} onChange={(e) => setType(e.target.value as "APPRENTICESHIP" | "PROFESSIONALIZATION")} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                            <option value="APPRENTICESHIP">Apprentissage</option>
                            <option value="PROFESSIONALIZATION">Professionnalisation</option>
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-700 block mb-1">Début</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-700 block mb-1">Fin</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none" />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Contrat (PDF)</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,application/pdf"
                            className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#001944] hover:file:bg-blue-100"
                        />
                        <p className="text-xs text-gray-400 mt-1">PDF uniquement — 25 Mo max.</p>
                    </div>
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
