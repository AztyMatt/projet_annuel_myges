"use client";

import { useState } from "react";
import {
    Upload,
    Download,
    FileText,
    Presentation,
    Archive,
    Eye,
    Trash2,
    Plus,
    Search,
    X,
    FileUp,
    CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FileType = "pdf" | "ppt" | "zip" | "other";
type TabType = "all" | "cours" | "tp" | "ressources";

type Support = {
    name: string;
    module: string;
    type: FileType;
    tab: Exclude<TabType, "all">;
    size: string;
    date: string;
    downloads: number;
    published: boolean;
};

const supports: Support[] = [
    {
        name: "CM1 – Introduction à l'architecture hexagonale.pdf",
        module: "Architecture logicielle",
        type: "pdf",
        tab: "cours",
        size: "2.4 Mo",
        date: "01/04/2026",
        downloads: 23,
        published: true,
    },
    {
        name: "CM2 – Design Patterns (GoF).pptx",
        module: "Architecture logicielle",
        type: "ppt",
        tab: "cours",
        size: "5.1 Mo",
        date: "08/04/2026",
        downloads: 19,
        published: true,
    },
    {
        name: "CM3 – Event-Driven Architecture.pdf",
        module: "Architecture logicielle",
        type: "pdf",
        tab: "cours",
        size: "3.8 Mo",
        date: "15/04/2026",
        downloads: 11,
        published: true,
    },
    {
        name: "TP1 – Refactoring vers Hexagonal.zip",
        module: "Architecture logicielle",
        type: "zip",
        tab: "tp",
        size: "840 Ko",
        date: "05/04/2026",
        downloads: 20,
        published: true,
    },
    {
        name: "TP2 – Implémentation CQRS.zip",
        module: "Architecture logicielle",
        type: "zip",
        tab: "tp",
        size: "1.2 Mo",
        date: "12/04/2026",
        downloads: 15,
        published: true,
    },
    {
        name: "Ressources – Liens & bibliographie.pdf",
        module: "Architecture logicielle",
        type: "pdf",
        tab: "ressources",
        size: "120 Ko",
        date: "01/04/2026",
        downloads: 8,
        published: true,
    },
    {
        name: "CM1 – Kubernetes & Orchestration.pdf",
        module: "Cloud & DevOps",
        type: "pdf",
        tab: "cours",
        size: "4.2 Mo",
        date: "10/04/2026",
        downloads: 17,
        published: true,
    },
    {
        name: "TP1 – Déploiement k8s (draft).zip",
        module: "Cloud & DevOps",
        type: "zip",
        tab: "tp",
        size: "960 Ko",
        date: "18/04/2026",
        downloads: 0,
        published: false,
    },
];

const fileIcons: Record<FileType, { icon: React.ElementType; color: string; bg: string }> = {
    pdf: { icon: FileText, color: "text-red-600", bg: "bg-red-50" },
    ppt: { icon: Presentation, color: "text-orange-600", bg: "bg-orange-50" },
    zip: { icon: Archive, color: "text-purple-600", bg: "bg-purple-50" },
    other: { icon: FileText, color: "text-gray-600", bg: "bg-gray-100" },
};

function getFileType(name: string): FileType {
    if (name.endsWith(".pdf")) return "pdf";
    if (name.endsWith(".pptx") || name.endsWith(".ppt")) return "ppt";
    if (name.endsWith(".zip")) return "zip";
    return "other";
}

export default function SupportsIntervenant() {
    const [tab, setTab] = useState<TabType>("all");
    const [search, setSearch] = useState("");
    const [showUpload, setShowUpload] = useState(false);

    const filtered = supports.filter((s) => {
        const matchTab = tab === "all" || s.tab === tab;
        const matchSearch =
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.module.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    const totalDownloads = supports.reduce((acc, s) => acc + s.downloads, 0);
    const published = supports.filter((s) => s.published).length;

    return (
        <div className="space-y-6 max-w-5xl">
            {/* KPI */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="text-2xl font-black text-gray-900">{supports.length}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Fichiers déposés</div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="text-2xl font-black text-emerald-600">{published}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Publiés</div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="text-2xl font-black text-gray-900">{totalDownloads}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Téléchargements totaux</div>
                </div>
            </div>

            {/* File list */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                {/* Tabs + search + upload */}
                <div className="p-5 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900 text-sm">Mes supports de cours</h3>
                        <button
                            onClick={() => setShowUpload(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001944] text-white text-xs font-semibold rounded-lg hover:bg-[#002C6E] transition-colors"
                        >
                            <Plus size={13} /> Déposer un fichier
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            {(["all", "cours", "tp", "ressources"] as TabType[]).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                                        tab === t
                                            ? "bg-[#001944] text-white"
                                            : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                                    )}
                                >
                                    {t === "all" ? "Tous" : t === "cours" ? "Cours" : t === "tp" ? "TPs" : "Ressources"}
                                </button>
                            ))}
                        </div>
                        <div className="relative flex-1 max-w-xs ml-auto">
                            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Rechercher…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="text-left font-semibold text-gray-400 text-xs px-5 pb-3 pt-3">
                                    Fichier
                                </th>
                                <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Module</th>
                                <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Date</th>
                                <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">
                                    Téléch.
                                </th>
                                <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Statut</th>
                                <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((s, i) => {
                                const ftype = getFileType(s.name);
                                const cfg = fileIcons[ftype];
                                const Icon = cfg.icon;
                                return (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                                        cfg.bg,
                                                    )}
                                                >
                                                    <Icon size={14} className={cfg.color} />
                                                </div>
                                                <span className="font-medium text-gray-800 text-xs max-w-[220px] truncate">
                                                    {s.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-500 max-w-[120px] truncate">
                                            {s.module}
                                        </td>
                                        <td className="px-3 py-3 text-xs text-gray-500">{s.date}</td>
                                        <td className="px-3 py-3 text-xs font-medium text-gray-700">{s.downloads}</td>
                                        <td className="px-3 py-3">
                                            {s.published ? (
                                                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                    <CheckCircle size={11} /> Publié
                                                </span>
                                            ) : (
                                                <span className="text-xs font-medium text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
                                                    Brouillon
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Aperçu"
                                                >
                                                    <Eye size={13} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Télécharger"
                                                >
                                                    <Download size={13} />
                                                </button>
                                                <button
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="text-center py-12 text-gray-400 text-sm">Aucun fichier trouvé</div>
                    )}
                </div>
            </div>

            {/* Upload modal */}
            {showUpload && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Déposer un support</h3>
                            <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Module</label>
                                    <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                                        <option>Architecture logicielle</option>
                                        <option>Design Patterns</option>
                                        <option>Cloud & DevOps</option>
                                        <option>TP Microservices</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Catégorie</label>
                                    <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                                        <option>Cours</option>
                                        <option>TP</option>
                                        <option>Ressource</option>
                                    </select>
                                </div>
                            </div>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-emerald-300 hover:bg-emerald-50/30 transition-all cursor-pointer">
                                <FileUp size={28} className="text-gray-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-600">Glisser-déposer le fichier ici</p>
                                <p className="text-xs text-gray-400 mt-1">PDF, PPTX, ZIP, DOCX — max 50 Mo</p>
                                <button className="mt-3 px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700">
                                    Parcourir
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="publish" className="rounded" defaultChecked />
                                <label htmlFor="publish" className="text-sm text-gray-700">
                                    Publier immédiatement pour les étudiants
                                </label>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-6 pb-6">
                            <button
                                onClick={() => setShowUpload(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => setShowUpload(false)}
                                className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E]"
                            >
                                Déposer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
