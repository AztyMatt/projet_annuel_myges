"use client";

import {
    Users,
    AlertTriangle,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    ChevronRight,
    Search,
    Filter,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

const stats = [
    {
        label: "Étudiants total",
        value: "324",
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50",
        sub: "+12 cette année",
    },
    {
        label: "Formation initiale",
        value: "198",
        icon: Users,
        color: "text-purple-600",
        bg: "bg-purple-50",
        sub: "61%",
    },
    { label: "Alternance", value: "126", icon: Users, color: "text-orange-600", bg: "bg-orange-50", sub: "39%" },
    {
        label: "Dossiers incomplets",
        value: "17",
        icon: AlertTriangle,
        color: "text-red-600",
        bg: "bg-red-50",
        sub: "Action requise",
    },
];

const alerts = [
    { type: "error", text: "8 contrats d'alternance expirés ou manquants", action: "Traiter" },
    { type: "warning", text: "5 conventions de stage non signées", action: "Voir" },
    { type: "info", text: "12 justificatifs d'absence en attente de validation", action: "Traiter" },
];

const justificatifs = [
    { student: "Lucas Martin", class: "5IW", date: "18/04/2026", reason: "Maladie", status: "pending" },
    { student: "Emma Durand", class: "5NIDS", date: "17/04/2026", reason: "Convocation entreprise", status: "pending" },
    { student: "Thomas Leclerc", class: "5IW", date: "15/04/2026", reason: "Transport", status: "approved" },
    { student: "Clara Petit", class: "5TWIN", date: "14/04/2026", reason: "Médecin", status: "rejected" },
    { student: "Antoine Roux", class: "5IW", date: "12/04/2026", reason: "Famille", status: "pending" },
];

const dossiers = [
    { student: "Paul Girard", class: "5IW", missing: ["Contrat alternance", "RIB"], status: "incomplete" },
    { student: "Julie Moreau", class: "5NIDS", missing: ["Photo d'identité"], status: "incomplete" },
    { student: "Marc Simon", class: "5TWIN", missing: ["Convention de stage"], status: "incomplete" },
];

const activityLog = [
    { action: "Dossier validé", student: "Lucas Martin", admin: "M. Dupont", time: "Il y a 5 min" },
    { action: "Absence justifiée", student: "Emma Durand", admin: "Mme. Martin", time: "Il y a 20 min" },
    { action: "Contrat ajouté", student: "Thomas Leclerc", admin: "M. Bernard", time: "Il y a 1h" },
    { action: "Absence rejetée", student: "Clara Petit", admin: "M. Dupont", time: "Il y a 2h" },
];

const statusConfig = {
    pending: { label: "En attente", color: "bg-orange-100 text-orange-700", icon: Clock },
    approved: { label: "Validé", color: "bg-green-100 text-green-700", icon: CheckCircle },
    rejected: { label: "Refusé", color: "bg-red-100 text-red-700", icon: XCircle },
    incomplete: { label: "Incomplet", color: "bg-red-100 text-red-700", icon: AlertTriangle },
};

type Tab = "justificatifs" | "dossiers" | "activite";

export default function DashboardScolarite() {
    const [tab, setTab] = useState<Tab>("justificatifs");

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Tableau de bord — Scolarité</h2>
                <p className="text-gray-500 text-sm mt-1 capitalize">
                    {new Date().toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    })}
                </p>
            </div>

            {/* KPI */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                                <Icon size={18} className={s.color} />
                            </div>
                            <div className="text-2xl font-black text-gray-900">{s.value}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                            <div className="text-xs text-gray-400 font-medium mt-1.5">{s.sub}</div>
                        </div>
                    );
                })}
            </div>

            {/* Alerts */}
            <div className="space-y-2">
                {alerts.map((a, i) => (
                    <div
                        key={i}
                        className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
                            a.type === "error" && "bg-red-50 border-red-200",
                            a.type === "warning" && "bg-orange-50 border-orange-200",
                            a.type === "info" && "bg-blue-50 border-blue-200",
                        )}
                    >
                        <AlertTriangle
                            size={15}
                            className={cn(
                                a.type === "error" && "text-red-500",
                                a.type === "warning" && "text-orange-500",
                                a.type === "info" && "text-blue-500",
                            )}
                        />
                        <span className="flex-1 font-medium text-gray-800">{a.text}</span>
                        <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex-shrink-0">
                            {a.action} →
                        </button>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex border-b border-gray-100 px-5 pt-5">
                    {(["justificatifs", "dossiers", "activite"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors capitalize",
                                tab === t
                                    ? "border-[#001944] text-[#001944]"
                                    : "border-transparent text-gray-500 hover:text-gray-700",
                            )}
                        >
                            {t === "justificatifs" && "Justificatifs"}
                            {t === "dossiers" && "Dossiers incomplets"}
                            {t === "activite" && "Activité récente"}
                        </button>
                    ))}
                </div>

                {/* Justificatifs */}
                {tab === "justificatifs" && (
                    <div className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="relative flex-1 max-w-xs">
                                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un étudiant…"
                                    className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                                <Filter size={13} /> Filtrer
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left font-semibold text-gray-500 text-xs pb-2 pr-4">
                                            Étudiant
                                        </th>
                                        <th className="text-left font-semibold text-gray-500 text-xs pb-2 pr-4">
                                            Classe
                                        </th>
                                        <th className="text-left font-semibold text-gray-500 text-xs pb-2 pr-4">
                                            Date
                                        </th>
                                        <th className="text-left font-semibold text-gray-500 text-xs pb-2 pr-4">
                                            Motif
                                        </th>
                                        <th className="text-left font-semibold text-gray-500 text-xs pb-2 pr-4">
                                            Statut
                                        </th>
                                        <th className="text-left font-semibold text-gray-500 text-xs pb-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {justificatifs.map((j, i) => {
                                        const s = statusConfig[j.status as keyof typeof statusConfig];
                                        const SIcon = s.icon;
                                        return (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 pr-4 font-medium text-gray-900">{j.student}</td>
                                                <td className="py-3 pr-4 text-gray-500">{j.class}</td>
                                                <td className="py-3 pr-4 text-gray-500">{j.date}</td>
                                                <td className="py-3 pr-4 text-gray-700">{j.reason}</td>
                                                <td className="py-3 pr-4">
                                                    <span
                                                        className={cn(
                                                            "flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium",
                                                            s.color,
                                                        )}
                                                    >
                                                        <SIcon size={11} /> {s.label}
                                                    </span>
                                                </td>
                                                <td className="py-3">
                                                    {j.status === "pending" && (
                                                        <div className="flex items-center gap-1.5">
                                                            <button className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 font-medium">
                                                                Valider
                                                            </button>
                                                            <button className="px-2.5 py-1 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 border border-red-200 font-medium">
                                                                Refuser
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Dossiers incomplets */}
                {tab === "dossiers" && (
                    <div className="p-5 space-y-3">
                        {dossiers.map((d, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 rounded-xl bg-red-50 border border-red-100"
                            >
                                <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {d.student
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-900">{d.student}</div>
                                    <div className="text-xs text-gray-500">{d.class}</div>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {d.missing.map((m) => (
                                            <span
                                                key={m}
                                                className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium"
                                            >
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button className="px-3 py-1.5 bg-[#001944] text-white text-xs rounded-lg hover:bg-[#002C6E] font-medium flex-shrink-0">
                                    Contacter
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Activité */}
                {tab === "activite" && (
                    <div className="divide-y divide-gray-50">
                        {activityLog.map((log, i) => (
                            <div key={i} className="flex items-center gap-4 px-5 py-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <FileText size={13} className="text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-sm font-medium text-gray-800">{log.action}</span>
                                    <span className="text-sm text-gray-600"> — {log.student}</span>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-xs text-gray-400">{log.time}</div>
                                    <div className="text-xs text-gray-500">par {log.admin}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                    { label: "Gestion des étudiants", href: "/scolarite/etudiants", icon: Users },
                    { label: "Notes & jurys", href: "/scolarite/notes", icon: FileText },
                    { label: "Messagerie", href: "/messagerie", icon: ChevronRight },
                ].map((l) => {
                    const Icon = l.icon;
                    return (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                        >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-orange-50">
                                <Icon size={16} className="text-orange-600" />
                            </div>
                            <span className="font-medium text-sm text-gray-800">{l.label}</span>
                            <ChevronRight size={14} className="text-gray-400 ml-auto" />
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
