"use client";

import { useEffect, useState } from "react";
import { FileText, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";
import { StatusBadge, type StatusTone } from "@/components/ui/status-badge";

type FileDocumentStatus = "PENDING" | "VALID" | "EXPIRED";

type OfficialDoc = { id: string; type: string; expiration: string | null; fileName: string; status: FileDocumentStatus };
type ContractDoc = {
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    fileName: string;
    status: FileDocumentStatus;
};
type PersonalDoc = { id: string; fileName: string; sizeBytes: number; status: FileDocumentStatus };

const statusConfig: Record<FileDocumentStatus, { label: string; icon: typeof CheckCircle; className: string; bg: string; tone: StatusTone }> = {
    VALID: { label: "Valide", icon: CheckCircle, className: "text-green-600", bg: "bg-green-50", tone: "green" },
    PENDING: { label: "En attente de validation", icon: Clock, className: "text-orange-600", bg: "bg-orange-50", tone: "orange" },
    EXPIRED: { label: "Expiré", icon: AlertCircle, className: "text-red-600", bg: "bg-red-50", tone: "red" },
};

const documentTypeLabels: Record<string, string> = {
    SCHOOL_CERTIFICATE: "Certificat de scolarité",
    ENROLLMENT_CERTIFICATE: "Attestation d'inscription",
    TRANSCRIPTS: "Relevé de notes",
    OFFICIAL_DOCUMENTS_ISSUED_BY_THE_SCHOOL: "Document officiel de l'école",
    AGREEMENT: "Convention",
    AMENDMENTS: "Avenant",
    COMPANY_DOCUMENTS: "Document entreprise",
    OTHER: "Autre",
};

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

async function loadDocuments(): Promise<{ official: OfficialDoc[]; contracts: ContractDoc[]; personal: PersonalDoc[] }> {
    const fileDocuments = await api.get<{ id: string; fileId: string; status: FileDocumentStatus }[]>(
        "/file-documents/mine",
    );

    const official: OfficialDoc[] = [];
    const contracts: ContractDoc[] = [];
    const personal: PersonalDoc[] = [];

    for (const fd of fileDocuments) {
        const file = await api.get<{ originalName: string; sizeBytes: number }>(`/files/${fd.fileId}`);

        const administrative = await api
            .get<{ type: string; expiration: string | null }>(`/document-administratives/file-document/${fd.id}`)
            .catch(() => null);
        if (administrative) {
            official.push({
                id: fd.id,
                type: administrative.type,
                expiration: administrative.expiration,
                fileName: file.originalName,
                status: fd.status,
            });
            continue;
        }

        const contract = await api
            .get<{ type: string; startDate: string; endDate: string }>(
                `/document-apprenticeship-contracts/file-document/${fd.id}`,
            )
            .catch(() => null);
        if (contract) {
            contracts.push({
                id: fd.id,
                type: contract.type,
                startDate: contract.startDate,
                endDate: contract.endDate,
                fileName: file.originalName,
                status: fd.status,
            });
            continue;
        }

        personal.push({ id: fd.id, fileName: file.originalName, sizeBytes: file.sizeBytes, status: fd.status });
    }

    return { official, contracts, personal };
}

export default function DocumentsEtudiant() {
    const [official, setOfficial] = useState<OfficialDoc[]>([]);
    const [contracts, setContracts] = useState<ContractDoc[]>([]);
    const [personal, setPersonal] = useState<PersonalDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadDocuments()
            .then(({ official, contracts, personal }) => {
                setOfficial(official);
                setContracts(contracts);
                setPersonal(personal);
            })
            .catch((e) => setError(e instanceof ApiError ? e.message : "Impossible de charger les documents."))
            .finally(() => setLoading(false));
    }, []);

    const missingOrExpired = official.filter((d) => d.status !== "VALID").length;

    return (
        <div className="space-y-6 max-w-4xl">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}
            {loading && <p className="text-sm text-gray-400">Chargement…</p>}

            {!loading && !error && (
                <>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800">
                        Le dépôt et le téléchargement de fichiers dépendent d&apos;un stockage réel côté backend, pas
                        encore implémenté (voir CLAUDE.md) — cette page affiche les documents déjà enregistrés.
                    </div>

                    {missingOrExpired > 0 && (
                        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm">
                            <AlertCircle size={16} className="text-orange-500 flex-shrink-0" />
                            <span className="text-orange-800 font-medium">
                                {missingOrExpired} document{missingOrExpired > 1 ? "s" : ""} officiel
                                {missingOrExpired > 1 ? "s" : ""} en attente ou expiré{missingOrExpired > 1 ? "s" : ""}.
                            </span>
                        </div>
                    )}

                    {contracts.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                            <div className="p-5 border-b border-gray-50">
                                <h3 className="font-bold text-sm text-gray-900">Documents d&apos;alternance</h3>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {contracts.map((doc) => {
                                    const s = statusConfig[doc.status];
                                    const SIcon = s.icon;
                                    return (
                                        <div key={doc.id} className="flex items-center gap-4 px-5 py-4">
                                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", s.bg)}>
                                                <FileText size={18} className={s.className} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-semibold text-sm text-gray-900">
                                                    {documentTypeLabels[doc.type] ?? doc.type}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Du {new Date(doc.startDate).toLocaleDateString("fr-FR")} au{" "}
                                                    {new Date(doc.endDate).toLocaleDateString("fr-FR")}
                                                </div>
                                            </div>
                                            <StatusBadge tone={s.tone} icon={SIcon}>{s.label}</StatusBadge>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="p-5 border-b border-gray-50">
                            <h3 className="font-bold text-sm text-gray-900">Documents officiels</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {official.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">Aucun document.</p>}
                            {official.map((doc) => {
                                const s = statusConfig[doc.status];
                                const SIcon = s.icon;
                                return (
                                    <div key={doc.id} className="flex items-center gap-4 px-5 py-3">
                                        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", s.bg)}>
                                            <FileText size={16} className={s.className} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-800">
                                                {documentTypeLabels[doc.type] ?? doc.type}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {doc.fileName}
                                                {doc.expiration && ` · Expire le ${new Date(doc.expiration).toLocaleDateString("fr-FR")}`}
                                            </div>
                                        </div>
                                        <span className={cn("flex items-center gap-1 text-xs font-medium", s.className)}>
                                            <SIcon size={11} /> {s.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="p-5 border-b border-gray-50">
                            <h3 className="font-bold text-sm text-gray-900">Mes documents personnels</h3>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {personal.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">Aucun document.</p>}
                            {personal.map((doc) => {
                                const s = statusConfig[doc.status];
                                const SIcon = s.icon;
                                return (
                                    <div key={doc.id} className="flex items-center gap-4 px-5 py-3">
                                        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                            <FileText size={16} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-800 truncate">{doc.fileName}</div>
                                            <div className="text-xs text-gray-400">{formatSize(doc.sizeBytes)}</div>
                                        </div>
                                        <span className={cn("flex items-center gap-1 text-xs font-medium flex-shrink-0", s.className)}>
                                            <SIcon size={11} /> {s.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
