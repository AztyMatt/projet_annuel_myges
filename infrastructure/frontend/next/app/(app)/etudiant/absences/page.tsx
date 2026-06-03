"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle, XCircle, Clock, Plus, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const absences = [
    {
        date: "18/04/2026",
        course: "DevOps & CI/CD",
        duration: "2h",
        status: "pending",
        reason: "Maladie",
        justif: true,
    },
    {
        date: "15/04/2026",
        course: "Architecture logicielle",
        duration: "2h",
        status: "approved",
        reason: "Médecin",
        justif: true,
    },
    {
        date: "10/04/2026",
        course: "React avancé",
        duration: "2h",
        status: "approved",
        reason: "Convocation entreprise",
        justif: true,
    },
    {
        date: "02/03/2026",
        course: "Bases de données avancées",
        duration: "2h",
        status: "rejected",
        reason: "Retard transport",
        justif: false,
    },
    {
        date: "18/02/2026",
        course: "Sécurité applicative",
        duration: "2h",
        status: "approved",
        reason: "Familial",
        justif: true,
    },
];

const statusConfig = {
    pending: {
        label: "En attente",
        className: "bg-orange-100 text-orange-700",
        icon: Clock,
    },
    approved: {
        label: "Justifiée",
        className: "bg-green-100 text-green-700",
        icon: CheckCircle,
    },
    rejected: {
        label: "Non justifiée",
        className: "bg-red-100 text-red-700",
        icon: XCircle,
    },
};

export default function AbsencesEtudiant() {
    const [showModal, setShowModal] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");

    const total = absences.length;
    const justified = absences.filter((a) => a.status === "approved").length;
    const unjustified = absences.filter((a) => a.status === "rejected").length;
    const pending = absences.filter((a) => a.status === "pending").length;
    const rate = Math.round((1 - unjustified / (total || 1)) * 100);

    const filtered = selectedStatus === "all" ? absences : absences.filter((a) => a.status === selectedStatus);

    return (
        <div className="space-y-6 max-w-4xl">
            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total absences",
                        value: total,
                        icon: AlertCircle,
                        color: "text-gray-600",
                        bg: "bg-gray-100",
                    },
                    {
                        label: "Justifiées",
                        value: justified,
                        icon: CheckCircle,
                        color: "text-green-600",
                        bg: "bg-green-50",
                    },
                    {
                        label: "Non justifiées",
                        value: unjustified,
                        icon: XCircle,
                        color: "text-red-600",
                        bg: "bg-red-50",
                    },
                    { label: "En attente", value: pending, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
                ].map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                                <Icon size={18} className={s.color} />
                            </div>
                            <div className="text-2xl font-black text-gray-900">{s.value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Attendance rate */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-gray-900">Taux d'assiduité</span>
                    <span
                        className={cn(
                            "text-xl font-black",
                            rate >= 90 ? "text-green-600" : rate >= 75 ? "text-orange-500" : "text-red-600",
                        )}
                    >
                        {rate}%
                    </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                        className={cn(
                            "h-3 rounded-full transition-all",
                            rate >= 90 ? "bg-green-500" : rate >= 75 ? "bg-orange-400" : "bg-red-500",
                        )}
                        style={{ width: `${rate}%` }}
                    />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                    Seuil minimum requis : <strong>80%</strong> d'assiduité par semestre.{" "}
                    {rate >= 80 ? (
                        <span className="text-green-600 font-medium">Vous êtes dans les normes ✓</span>
                    ) : (
                        <span className="text-red-600 font-medium">Attention : seuil critique</span>
                    )}
                </p>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between p-5 border-b border-gray-50">
                    <h3 className="font-bold text-sm text-gray-900">Historique des absences</h3>
                    <div className="flex items-center gap-2">
                        {/* Filter */}
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none bg-gray-50 text-gray-600"
                        >
                            <option value="all">Toutes</option>
                            <option value="pending">En attente</option>
                            <option value="approved">Justifiées</option>
                            <option value="rejected">Non justifiées</option>
                        </select>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#001944] text-white text-xs font-semibold rounded-lg hover:bg-[#002C6E] transition-colors"
                        >
                            <Plus size={13} /> Déclarer
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                <th className="text-left font-semibold text-gray-400 text-xs px-5 pb-3 pt-3">Date</th>
                                <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Cours</th>
                                <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Durée</th>
                                <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Motif</th>
                                <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">
                                    Justificatif
                                </th>
                                <th className="text-left font-semibold text-gray-400 text-xs px-3 pb-3 pt-3">Statut</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((a, i) => {
                                const s = statusConfig[a.status as keyof typeof statusConfig];
                                const SIcon = s.icon;
                                return (
                                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3 font-medium text-gray-800">{a.date}</td>
                                        <td className="px-3 py-3 text-gray-700">{a.course}</td>
                                        <td className="px-3 py-3 text-gray-500">{a.duration}</td>
                                        <td className="px-3 py-3 text-gray-700">{a.reason}</td>
                                        <td className="px-3 py-3">
                                            {a.justif ? (
                                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                    <CheckCircle size={12} /> Déposé
                                                </span>
                                            ) : (
                                                <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                                                    <XCircle size={12} /> Manquant
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3">
                                            <span
                                                className={cn(
                                                    "flex items-center gap-1.5 w-fit px-2 py-0.5 rounded-full text-xs font-medium",
                                                    s.className,
                                                )}
                                            >
                                                <SIcon size={11} /> {s.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Déclarer une absence</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">
                                    Date de l'absence
                                </label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">Cours concerné</label>
                                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                                    <option>Architecture logicielle</option>
                                    <option>Bases de données avancées</option>
                                    <option>DevOps & CI/CD</option>
                                    <option>React avancé</option>
                                    <option>Sécurité applicative</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">Motif</label>
                                <input
                                    type="text"
                                    placeholder="Ex : Maladie, Convocation…"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">Justificatif</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors cursor-pointer">
                                    <Upload size={18} className="text-gray-400 mx-auto mb-1.5" />
                                    <p className="text-xs text-gray-500">
                                        Glisser un fichier ou{" "}
                                        <span className="text-blue-600 font-medium">parcourir</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-6 pb-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] transition-colors"
                            >
                                Soumettre
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
