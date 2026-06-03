"use client";

import {
    Server,
    Database,
    Shield,
    Users,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Activity,
    Lock,
    Eye,
    UserCog,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";

const infraStatus = [
    {
        name: "API Gateway",
        status: "healthy",
        replicas: "3/3",
        latency: "12ms",
        color: "text-green-600",
        dot: "bg-green-500",
    },
    {
        name: "PostgreSQL",
        status: "healthy",
        replicas: "2/2",
        latency: "4ms",
        color: "text-green-600",
        dot: "bg-green-500",
    },
    {
        name: "Redis Cache",
        status: "healthy",
        replicas: "2/2",
        latency: "1ms",
        color: "text-green-600",
        dot: "bg-green-500",
    },
    {
        name: "Frontend Next",
        status: "healthy",
        replicas: "2/2",
        latency: "38ms",
        color: "text-green-600",
        dot: "bg-green-500",
    },
    {
        name: "Sentry (logs)",
        status: "degraded",
        replicas: "1/2",
        latency: "—",
        color: "text-orange-600",
        dot: "bg-orange-400",
    },
];

const userStats = [
    { role: "Étudiants", count: 324, active: 289, color: "bg-blue-500" },
    { role: "Intervenants", count: 48, active: 43, color: "bg-emerald-500" },
    { role: "Administration", count: 12, active: 12, color: "bg-orange-500" },
    { role: "Super Admin", count: 3, active: 3, color: "bg-red-500" },
];

const auditLog = [
    { action: "Connexion", user: "admin@myges.fr", ip: "192.168.1.42", time: "Il y a 2 min", level: "info" },
    { action: "Rôle modifié", user: "intervenant@myges.fr", ip: "10.0.0.15", time: "Il y a 15 min", level: "warning" },
    {
        action: "Tentative de connexion échouée (×3)",
        user: "unknown@test.fr",
        ip: "203.0.113.5",
        time: "Il y a 23 min",
        level: "error",
    },
    { action: "Export données", user: "superadmin@myges.fr", ip: "192.168.1.1", time: "Il y a 1h", level: "warning" },
    { action: "Compte créé", user: "nouveau@myges.fr", ip: "192.168.1.42", time: "Il y a 2h", level: "info" },
    {
        action: "Paramètre système modifié",
        user: "superadmin@myges.fr",
        ip: "192.168.1.1",
        time: "Il y a 3h",
        level: "warning",
    },
];

const accessRequests = [
    { user: "prof.dupont@myges.fr", requested: "Admin Pédagogique", current: "Intervenant", time: "Il y a 1h" },
    { user: "marie.martin@myges.fr", requested: "Scolarité", current: "Étudiant", time: "Il y a 3h" },
];

const levelConfig = {
    info: { color: "text-blue-600", bg: "bg-blue-50 border-blue-100", icon: CheckCircle },
    warning: { color: "text-orange-600", bg: "bg-orange-50 border-orange-100", icon: AlertTriangle },
    error: { color: "text-red-600", bg: "bg-red-50 border-red-100", icon: XCircle },
};

type Tab = "audit" | "users" | "requests";

export default function DashboardSuperAdmin() {
    const [tab, setTab] = useState<Tab>("audit");
    const [lockdown, setLockdown] = useState(false);

    const allHealthy = infraStatus.every((s) => s.status === "healthy");
    const degraded = infraStatus.filter((s) => s.status !== "healthy").length;

    return (
        <div className="space-y-6 max-w-7xl">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Super Administration</h2>
                    <p className="text-gray-500 text-sm mt-1 capitalize">
                        {new Date().toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        })}
                    </p>
                </div>
                <button
                    onClick={() => setLockdown(!lockdown)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border",
                        lockdown
                            ? "bg-red-600 border-red-600 text-white hover:bg-red-700"
                            : "bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600",
                    )}
                >
                    <Lock size={14} />
                    {lockdown ? "Verrouillage actif" : "Verrouiller le système"}
                </button>
            </div>

            {/* Infrastructure */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between p-5 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                        <Server size={16} className="text-gray-500" />
                        <h3 className="font-bold text-gray-900 text-sm">Infrastructure — État des services</h3>
                    </div>
                    <span
                        className={cn(
                            "text-xs font-medium px-2.5 py-1 rounded-full",
                            allHealthy ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700",
                        )}
                    >
                        {allHealthy ? "Tous opérationnels" : `${degraded} service(s) dégradé(s)`}
                    </span>
                </div>
                <div className="divide-y divide-gray-50">
                    {infraStatus.map((s, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3">
                            <div className="flex items-center gap-2 w-40 flex-shrink-0">
                                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", s.dot)} />
                                <span className="text-sm font-medium text-gray-800">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                                <Database size={11} className="text-gray-400" />
                                <span className="text-gray-500">Réplicas :</span>
                                <span className={cn("font-semibold", s.color)}>{s.replicas}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs ml-4">
                                <Activity size={11} className="text-gray-400" />
                                <span className="text-gray-500">Latence :</span>
                                <span className="font-semibold text-gray-700">{s.latency}</span>
                            </div>
                            <div className="ml-auto">
                                <span
                                    className={cn(
                                        "text-xs font-medium px-2 py-0.5 rounded-full",
                                        s.status === "healthy"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-orange-100 text-orange-700",
                                    )}
                                >
                                    {s.status === "healthy" ? "Opérationnel" : "Dégradé"}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* User stats + security */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 p-5 border-b border-gray-50">
                        <Users size={16} className="text-gray-500" />
                        <h3 className="font-bold text-gray-900 text-sm">Utilisateurs par rôle</h3>
                    </div>
                    <div className="p-5 space-y-4">
                        {userStats.map((u) => (
                            <div key={u.role}>
                                <div className="flex items-center justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-800">{u.role}</span>
                                    <span className="text-gray-500">
                                        {u.active} actifs / {u.count}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className={cn("h-2 rounded-full", u.color)}
                                        style={{ width: `${(u.active / u.count) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        <Link
                            href="/superadmin/gestion"
                            className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mt-2 hover:underline"
                        >
                            <UserCog size={12} /> Gérer les utilisateurs
                        </Link>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 p-5 border-b border-gray-50">
                        <Shield size={16} className="text-gray-500" />
                        <h3 className="font-bold text-gray-900 text-sm">Paramètres de sécurité</h3>
                    </div>
                    <div className="p-5 space-y-3">
                        {[
                            { label: "Authentification 2FA obligatoire", active: true },
                            { label: "Blocage après 5 tentatives", active: true },
                            { label: "Expiration MDP tous les 60 jours", active: true },
                            { label: "Mode lecture seule (backup)", active: false },
                            { label: "Verrouillage système", active: lockdown },
                        ].map((setting, i) => (
                            <div key={i} className="flex items-center justify-between py-1">
                                <span className="text-sm text-gray-700">{setting.label}</span>
                                <div
                                    className={cn(
                                        "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                                        setting.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500",
                                    )}
                                >
                                    {setting.active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                                    {setting.active ? "Actif" : "Inactif"}
                                </div>
                            </div>
                        ))}
                        <Link
                            href="/superadmin/securite"
                            className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mt-2 hover:underline"
                        >
                            <Eye size={12} /> Voir tous les paramètres
                        </Link>
                    </div>
                </div>
            </div>

            {/* Tabs: Audit + Users + Requests */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex border-b border-gray-100 px-5 pt-5">
                    {(["audit", "users", "requests"] as Tab[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={cn(
                                "px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors",
                                tab === t
                                    ? "border-[#001944] text-[#001944]"
                                    : "border-transparent text-gray-500 hover:text-gray-700",
                            )}
                        >
                            {t === "audit" && "Journal d'audit"}
                            {t === "users" && "Comptes privilégiés"}
                            {t === "requests" && `Demandes d'accès (${accessRequests.length})`}
                        </button>
                    ))}
                </div>

                {tab === "audit" && (
                    <div className="divide-y divide-gray-50">
                        {auditLog.map((log, i) => {
                            const cfg = levelConfig[log.level as keyof typeof levelConfig];
                            const Icon = cfg.icon;
                            return (
                                <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                                    <Icon size={14} className={cfg.color} />
                                    <div className="flex-1">
                                        <span className="text-sm font-medium text-gray-800">{log.action}</span>
                                        <span className="text-sm text-gray-500"> — {log.user}</span>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="text-xs text-gray-500 font-mono">{log.ip}</div>
                                        <div className="text-xs text-gray-400">{log.time}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {tab === "users" && (
                    <div className="p-5 space-y-3">
                        {[
                            {
                                name: "Admin Système",
                                email: "superadmin@myges.fr",
                                role: "Super Admin",
                                lastLogin: "Il y a 2 min",
                                mfa: true,
                            },
                            {
                                name: "Marie Dupont",
                                email: "admin@myges.fr",
                                role: "Administration",
                                lastLogin: "Il y a 1h",
                                mfa: true,
                            },
                            {
                                name: "Jean Lefèvre",
                                email: "j.lefevre@myges.fr",
                                role: "Admin Pédagogique",
                                lastLogin: "Hier",
                                mfa: false,
                            },
                        ].map((u, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    {u.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-900">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.email}</div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                        {u.role}
                                    </span>
                                    <div className="text-xs text-gray-400 mt-1">{u.lastLogin}</div>
                                </div>
                                <div
                                    className={cn(
                                        "text-xs font-medium px-2 py-0.5 rounded-full",
                                        u.mfa ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700",
                                    )}
                                >
                                    {u.mfa ? "2FA ✓" : "2FA ✗"}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === "requests" && (
                    <div className="p-5 space-y-3">
                        {accessRequests.map((r, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-4 p-4 rounded-xl bg-orange-50 border border-orange-100"
                            >
                                <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-900">{r.user}</div>
                                    <div className="text-xs text-gray-600 mt-0.5">
                                        Demande : <strong>{r.requested}</strong> (actuellement : {r.current})
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">{r.time}</div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700">
                                        Accepter
                                    </button>
                                    <button className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 border border-red-200">
                                        Refuser
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
