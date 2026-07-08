"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, Shield, Trash2, Eye, EyeOff, CheckCircle, AlertTriangle, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type Section = "profil" | "securite" | "confidentialite";

const sections: { id: Section; label: string; icon: React.ElementType }[] = [
    { id: "profil", label: "Profil", icon: User },
    { id: "securite", label: "Sécurité", icon: Lock },
    { id: "confidentialite", label: "Confidentialité", icon: Shield },
];

const roleLabels: Record<string, string> = {
    STUDENT: "Étudiant",
    INSTRUCTOR: "Intervenant",
    ADMIN: "Administration",
    SUPER_ADMIN: "Super Administrateur",
};

type Me = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    role: string;
    passwordExpiresInDays: number;
    twoFactorEnabled: boolean;
};

export default function Parametres() {
    const router = useRouter();
    const [section, setSection] = useState<Section>("profil");

    const [me, setMe] = useState<Me | null>(null);
    const [meError, setMeError] = useState("");

    const [showCurrentPwd, setShowCurrentPwd] = useState(false);
    const [showNewPwd, setShowNewPwd] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [pwdSubmitting, setPwdSubmitting] = useState(false);
    const [pwdError, setPwdError] = useState("");
    const [pwdSuccess, setPwdSuccess] = useState("");

    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError] = useState("");
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    useEffect(() => {
        api
            .get<Me>("/users/me")
            .then(setMe)
            .catch((error: unknown) => {
                setMeError(error instanceof ApiError ? error.message : "Impossible de charger le profil.");
            });
    }, []);

    const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPwdError("");
        setPwdSuccess("");

        if (newPassword !== confirmPassword) {
            setPwdError("Les deux mots de passe ne correspondent pas.");
            return;
        }

        setPwdSubmitting(true);
        try {
            const result = await api.post<{ message: string }>("/auth/password/reset", { oldPassword, newPassword });
            setPwdSuccess(result.message ?? "Mot de passe mis à jour.");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            setPwdError(error instanceof ApiError ? error.message : "Erreur inattendue.");
        } finally {
            setPwdSubmitting(false);
        }
    };

    const handleExport = async () => {
        setExporting(true);
        setExportError("");
        try {
            const result = await api.get<{ data: Record<string, unknown> }>("/gdpr/export");
            const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "myges-mes-donnees.json";
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            setExportError(error instanceof ApiError ? error.message : "Export impossible.");
        } finally {
            setExporting(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        setDeleteError("");
        try {
            await api.delete("/users/me");
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
        } catch (error) {
            setDeleteError(error instanceof ApiError ? error.message : "Suppression impossible.");
            setDeleting(false);
        }
    };

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
                    {meError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">
                            {meError}
                        </div>
                    )}

                    {/* Profil */}
                    {section === "profil" && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="font-bold text-gray-900 mb-1">Informations personnelles</h3>
                            <p className="text-sm text-gray-500 mb-5">
                                Ces informations sont gérées par l&apos;administration.
                            </p>
                            {!me && !meError && <p className="text-sm text-gray-400">Chargement…</p>}
                            {me && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-full bg-[#001944] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                            {me.firstname[0]}
                                            {me.lastname[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">
                                                {me.firstname} {me.lastname}
                                            </div>
                                            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                {roleLabels[me.role] ?? me.role}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">
                                            Adresse email
                                        </label>
                                        <input
                                            value={me.email}
                                            readOnly
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-gray-50 text-gray-500"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sécurité */}
                    {section === "securite" && (
                        <>
                            <form
                                onSubmit={handlePasswordSubmit}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                            >
                                <h3 className="font-bold text-gray-900 mb-5">Changer le mot de passe</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">
                                            Mot de passe actuel
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showCurrentPwd ? "text" : "password"}
                                                value={oldPassword}
                                                onChange={(e) => setOldPassword(e.target.value)}
                                                placeholder="••••••••••••"
                                                required
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
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="12 caractères minimum"
                                                required
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
                                            Min. 12 caractères, majuscule, minuscule, chiffre et symbole.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-700 block mb-1">
                                            Confirmer le nouveau mot de passe
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••••••"
                                            required
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                        />
                                    </div>
                                </div>

                                {pwdError && (
                                    <p className="mt-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                                        {pwdError}
                                    </p>
                                )}
                                {pwdSuccess && (
                                    <p className="mt-4 text-xs text-green-800 bg-green-50 border border-green-200 rounded-lg p-2">
                                        {pwdSuccess}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={pwdSubmitting}
                                    className="mt-5 px-5 py-2.5 bg-[#001944] text-white text-sm font-semibold rounded-xl hover:bg-[#002C6E] transition-colors disabled:bg-gray-300"
                                >
                                    {pwdSubmitting ? "Modification…" : "Modifier le mot de passe"}
                                </button>
                            </form>

                            {me && me.passwordExpiresInDays < 7 && (
                                <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
                                    <AlertTriangle size={16} className="flex-shrink-0" />
                                    <span>
                                        Votre mot de passe expire dans {me.passwordExpiresInDays} jour
                                        {me.passwordExpiresInDays > 1 ? "s" : ""} (renouvellement obligatoire tous les
                                        60 jours).
                                    </span>
                                </div>
                            )}

                            {/* 2FA */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Authentification à deux facteurs</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Protégez votre compte avec un code TOTP (Google Authenticator, Authy…)
                                        </p>
                                    </div>
                                </div>
                                {me?.twoFactorEnabled && (
                                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                                        <CheckCircle size={15} />
                                        <span className="font-medium">2FA activée — votre compte est protégé</span>
                                    </div>
                                )}
                                {me && !me.twoFactorEnabled && (
                                    <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <Smartphone size={18} className="text-orange-500 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-orange-700">
                                                Activez la 2FA pour renforcer la sécurité de votre compte.
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
                        </>
                    )}

                    {/* Confidentialité */}
                    {section === "confidentialite" && (
                        <>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="font-bold text-gray-900 mb-1">Données personnelles</h3>
                                <p className="text-sm text-gray-500 mb-5">
                                    Conformément au RGPD, vous pouvez exporter vos données à tout moment.
                                </p>
                                {exportError && (
                                    <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                                        {exportError}
                                    </p>
                                )}
                                <button
                                    onClick={handleExport}
                                    disabled={exporting}
                                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    <span className="text-sm font-medium text-gray-700">
                                        {exporting ? "Export en cours…" : "Exporter mes données (JSON)"}
                                    </span>
                                    <Shield size={15} className="text-gray-400" />
                                </button>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-6">
                                <h3 className="font-bold text-red-700 mb-1">Zone de danger</h3>
                                <p className="text-sm text-gray-500 mb-5">
                                    La suppression du compte est définitive et efface vos données personnelles.
                                </p>
                                {deleteError && (
                                    <p className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                                        {deleteError}
                                    </p>
                                )}
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Supprimer mon compte
                                </button>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {showDeleteConfirm && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
                    onClick={() => !deleting && setShowDeleteConfirm(false)}
                >
                    <div
                        className="bg-white rounded-2xl p-6 w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="font-bold text-gray-900 mb-2">Supprimer définitivement votre compte ?</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            Cette action est irréversible : votre compte et vos données personnelles seront effacés.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                            >
                                {deleting ? "Suppression…" : "Supprimer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
