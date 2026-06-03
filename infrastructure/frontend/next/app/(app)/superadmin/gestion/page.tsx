"use client";

import { useState } from "react";
import { Search, Plus, UserCheck, UserX, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

const users = [
    {
        id: 1,
        name: "Lucas Martin",
        email: "l.martin@myges.fr",
        role: "etudiant",
        status: "active",
        lastLogin: "Il y a 10 min",
    },
    {
        id: 2,
        name: "Sophie Bernard",
        email: "s.bernard@myges.fr",
        role: "intervenant",
        status: "active",
        lastLogin: "Il y a 2h",
    },
    { id: 3, name: "Marie Dupont", email: "m.dupont@myges.fr", role: "scolarite", status: "active", lastLogin: "Hier" },
    {
        id: 4,
        name: "Paul Girard",
        email: "p.girard@myges.fr",
        role: "etudiant",
        status: "suspended",
        lastLogin: "Il y a 5j",
    },
    {
        id: 5,
        name: "Jean Lefèvre",
        email: "j.lefevre@myges.fr",
        role: "scolarite",
        status: "active",
        lastLogin: "Il y a 3h",
    },
    {
        id: 6,
        name: "Emma Durand",
        email: "e.durand@myges.fr",
        role: "etudiant",
        status: "active",
        lastLogin: "Il y a 30 min",
    },
    {
        id: 7,
        name: "Thomas Leclerc",
        email: "t.leclerc@myges.fr",
        role: "etudiant",
        status: "active",
        lastLogin: "Aujourd'hui",
    },
];

const roleConfig: Record<string, { label: string; className: string }> = {
    etudiant: { label: "Étudiant", className: "bg-blue-100 text-blue-700" },
    intervenant: { label: "Intervenant", className: "bg-emerald-100 text-emerald-700" },
    scolarite: { label: "Administration", className: "bg-orange-100 text-orange-700" },
    superadmin: { label: "Super Admin", className: "bg-red-100 text-red-700" },
};

export default function GestionUtilisateurs() {
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [showCreate, setShowCreate] = useState(false);

    const filtered = users.filter((u) => {
        const matchSearch =
            u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    return (
        <div className="space-y-6 max-w-5xl">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { label: "Total", value: users.length },
                    { label: "Étudiants", value: users.filter((u) => u.role === "etudiant").length },
                    { label: "Intervenants", value: users.filter((u) => u.role === "intervenant").length },
                    { label: "Suspendus", value: users.filter((u) => u.status === "suspended").length },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center"
                    >
                        <div className="text-2xl font-black text-gray-900">{s.value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 p-5 border-b border-gray-100 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white text-gray-600"
                        >
                            <option value="all">Tous les rôles</option>
                            <option value="etudiant">Étudiants</option>
                            <option value="intervenant">Intervenants</option>
                            <option value="scolarite">Administration</option>
                            <option value="superadmin">Super Admin</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-[#001944] text-white text-sm font-semibold rounded-lg hover:bg-[#002C6E] transition-colors"
                    >
                        <Plus size={14} /> Créer un compte
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-50">
                                {["Utilisateur", "Email", "Rôle", "Dernière connexion", "Statut", "Actions"].map(
                                    (h) => (
                                        <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">
                                            {h}
                                        </th>
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((u) => {
                                const role = roleConfig[u.role];
                                return (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#001944] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {u.name
                                                        .split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </div>
                                                <span className="font-semibold text-gray-900">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-gray-500 text-xs">{u.email}</td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={cn(
                                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                                    role.className,
                                                )}
                                            >
                                                {role.label}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-xs text-gray-500">{u.lastLogin}</td>
                                        <td className="px-5 py-3">
                                            <span
                                                className={cn(
                                                    "text-xs font-medium px-2 py-0.5 rounded-full",
                                                    u.status === "active"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700",
                                                )}
                                            >
                                                {u.status === "active" ? "Actif" : "Suspendu"}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-1.5">
                                                <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white text-gray-600">
                                                    <option value={u.role}>{role.label}</option>
                                                    <option value="etudiant">Étudiant</option>
                                                    <option value="intervenant">Intervenant</option>
                                                    <option value="scolarite">Administration</option>
                                                </select>
                                                <button
                                                    className={cn(
                                                        "p-1.5 rounded-lg transition-colors",
                                                        u.status === "active"
                                                            ? "text-red-400 hover:bg-red-50"
                                                            : "text-green-500 hover:bg-green-50",
                                                    )}
                                                >
                                                    {u.status === "active" ? (
                                                        <UserX size={13} />
                                                    ) : (
                                                        <UserCheck size={13} />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreate && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Créer un compte</h3>
                            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Prénom</label>
                                    <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Nom</label>
                                    <input className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">Rôle</label>
                                <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white">
                                    <option>Étudiant</option>
                                    <option>Intervenant</option>
                                    <option>Administration</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-6 pb-6">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E]"
                            >
                                Créer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
