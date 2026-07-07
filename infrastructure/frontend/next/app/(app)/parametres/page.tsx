"use client";

import { useState } from "react";
import Link from "next/link";
import { User, Lock, Bell, Shield, Trash2, Eye, EyeOff, CheckCircle, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Section = "profil" | "securite" | "notifications" | "confidentialite";

const sections: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "profil", label: "Profil", icon: User },
    { id: "securite", label: "Sécurité", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "confidentialite", label: "Confidentialité", icon: Shield },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
    return (
        <button
            onClick={onChange}
            className={cn("relative w-10 h-5 rounded-full transition-colors", checked ? "bg-[#001944]" : "bg-gray-200")}
        >
            <div
                className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                    checked ? "translate-x-5" : "translate-x-0",
                )}
            />
        </button>
    );
}

export default function Parametres() {
    const [section, setSection] = useState<Section>("profil");
    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [twoFA, setTwoFA] = useState(true);
    const [notifications, setNotifications] = useState({
        planning: true,
        notes: true,
        absences: true,
        messages: true,
        admin: false,
        email: true,
    });

    const toggleNotif = (key: keyof typeof notifications) => setNotifications((n) => ({ ...n, [key]: !n[key] }));

    return (
        <div className="max-w-4xl">
            <div className="flex gap-6">
                {/* Nav */}
                <aside className="w-52 flex-shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
                        {sections.map((s) => {
                            const Icon = s.icon;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setSection(s.id)}
                                    className={cn(
                                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                                        section === s.id ? "bg-[#001944] text-white" : "text-gray-600 hover:bg-gray-50",
                                    )}
                                >
                                    <Icon size={15} />
                                    {s.label}
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* Content */}
                <main className="flex-1 space-y-4">
                    {/* Profil */}
                    {section === "profil" && (
                        <>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-5">Informations personnelles</h3>
                                {/* Avatar */}
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                                        LM
                                    </div>
                                    <div>
                                        <button className="px-3 py-1.5 text-xs font-semibold text-white bg-[#001944] rounded-lg hover:bg-[#002C6E] transition-colors">
                                            Changer la photo
                                        </button>
                                        <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 2 Mo</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Prénom</label>
                                        <input
                                            defaultValue="Lucas"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Nom</label>
                                        <input
                                            defaultValue="Martin"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-gray-700 block mb-1">
                                            Adresse email
                                        </label>
                                        <input
                                            defaultValue="l.martin@myges.fr"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50 text-gray-500"
                                            readOnly
                                        />
                                        <p className="text-xs text-gray-400 mt-1">
                                            L'email est géré par l'administration.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">
                                            Téléphone
                                        </label>
                                        <input
                                            defaultValue="06 12 34 56 78"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Langue</label>
                                        <select className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                                            <option>Français</option>
                                            <option>English</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <button className="px-5 py-2.5 bg-[#001944] text-white text-sm font-semibold rounded-xl hover:bg-[#002C6E] transition-colors">
                                Enregistrer les modifications
                            </button>
                        </>
                    )}

                    {/* Sécurité */}
                    {section === "securite" && (
                        <>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-5">Changer le mot de passe</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">
                                            Mot de passe actuel
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPwd ? "text" : "password"}
                                                placeholder="••••••••••••"
                                                className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            >
                                                {showCurrentPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">
                                            Nouveau mot de passe
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showNewPwd ? "text" : "password"}
                                                placeholder="12 caractères minimum"
                                                className="w-full px-3 py-2 pr-10 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPwd(!showNewPwd)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            >
                                                {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Min. 12 caractères, majuscule, chiffre et symbole.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">
                                            Confirmer le nouveau mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="••••••••••••"
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        />
                                    </div>
                                </div>
                                <button className="mt-5 px-5 py-2.5 bg-[#001944] text-white text-sm font-semibold rounded-xl hover:bg-[#002C6E] transition-colors">
                                    Modifier le mot de passe
                                </button>
                            </div>

                            {/* 2FA */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Authentification à deux facteurs</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Protégez votre compte avec un code TOTP (Google Authenticator, Authy…)
                                        </p>
                                    </div>
                                    <Toggle checked={twoFA} onChange={() => setTwoFA(!twoFA)} />
                                </div>
                                {twoFA && (
                                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                                        <CheckCircle size={15} />
                                        <span className="font-medium">2FA activé — votre compte est protégé</span>
                                    </div>
                                )}
                                {!twoFA && (
                                    <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <Smartphone size={18} className="text-orange-500 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-orange-700">
                                                Activez la 2FA pour renforcer la sécurité de votre compte. Scannez le QR
                                                code avec votre application TOTP.
                                            </p>
                                            <Link
                                                href="/2fa/setup"
                                                className="inline-block mt-3 px-4 py-2 bg-[#001944] text-white text-xs font-semibold rounded-lg hover:bg-[#002C6E] transition-colors"
                                            >
                                                Configurer la 2FA
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sessions */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Sessions actives</h3>
                                {[
                                    {
                                        device: "Chrome – Windows 11",
                                        ip: "192.168.1.42",
                                        time: "Maintenant",
                                        current: true,
                                    },
                                    {
                                        device: "Safari – iPhone 15",
                                        ip: "90.123.45.67",
                                        time: "Il y a 2h",
                                        current: false,
                                    },
                                ].map((session, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                                    >
                                        <div>
                                            <div className="font-medium text-sm text-gray-800 flex items-center gap-2">
                                                {session.device}
                                                {session.current && (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                                        Session actuelle
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {session.ip} · {session.time}
                                            </div>
                                        </div>
                                        {!session.current && (
                                            <button className="text-xs text-red-500 font-semibold hover:text-red-700">
                                                Révoquer
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Notifications */}
                    {section === "notifications" && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-5">Préférences de notification</h3>
                            <div className="space-y-1">
                                {[
                                    {
                                        key: "planning" as const,
                                        label: "Modifications du planning",
                                        desc: "Cours annulés, déplacés ou ajoutés",
                                    },
                                    {
                                        key: "notes" as const,
                                        label: "Nouvelles notes",
                                        desc: "Quand une note est publiée",
                                    },
                                    {
                                        key: "absences" as const,
                                        label: "Statut des absences",
                                        desc: "Validation ou refus de justificatifs",
                                    },
                                    {
                                        key: "messages" as const,
                                        label: "Nouveaux messages",
                                        desc: "Messages de vos intervenants ou de l'administration",
                                    },
                                    {
                                        key: "admin" as const,
                                        label: "Annonces administratives",
                                        desc: "Informations générales de l'école",
                                    },
                                ].map((notif) => (
                                    <div
                                        key={notif.key}
                                        className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
                                    >
                                        <div>
                                            <div className="font-medium text-sm text-gray-800">{notif.label}</div>
                                            <div className="text-xs text-gray-400">{notif.desc}</div>
                                        </div>
                                        <Toggle
                                            checked={notifications[notif.key]}
                                            onChange={() => toggleNotif(notif.key)}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <div className="flex items-center justify-between py-3">
                                    <div>
                                        <div className="font-medium text-sm text-gray-800">Notifications par email</div>
                                        <div className="text-xs text-gray-400">
                                            Recevoir un récapitulatif quotidien par email
                                        </div>
                                    </div>
                                    <Toggle checked={notifications.email} onChange={() => toggleNotif("email")} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Confidentialité */}
                    {section === "confidentialite" && (
                        <>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-1">Données personnelles</h3>
                                <p className="text-sm text-gray-500 mb-5">
                                    Conformément au RGPD, vous pouvez exporter ou supprimer vos données.
                                </p>
                                <div className="space-y-3">
                                    <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                        <span className="text-sm font-medium text-gray-700">
                                            Exporter mes données (JSON)
                                        </span>
                                        <Shield size={15} className="text-gray-400" />
                                    </button>
                                    <button className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                                        <span className="text-sm font-medium text-gray-700">
                                            Historique des connexions
                                        </span>
                                        <Eye size={15} className="text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
                                <h3 className="font-bold text-red-700 mb-1">Zone de danger</h3>
                                <p className="text-sm text-gray-500 mb-5">
                                    Ces actions sont irréversibles. Contactez l'administration pour toute demande de
                                    suppression de compte.
                                </p>
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                                    <Trash2 size={14} />
                                    Demander la suppression du compte
                                </button>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
