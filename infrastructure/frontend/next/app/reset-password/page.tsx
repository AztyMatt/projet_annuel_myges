"use client";

import { Suspense, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const isForgotFlow = Boolean(token);
    // Lien d'invitation envoyé par l'administration : même token que le reset, mais le compte
    // n'a pas encore de consentement RGPD — il est recueilli ici, à l'activation.
    const isInvitationFlow = isForgotFlow && searchParams.get("invitation") === "1";

    const [email, setEmail] = useState(searchParams.get("email") ?? "");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [gdprConsent, setGdprConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleCredentialsSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/auth/password/reset-with-credentials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, oldPassword, newPassword }),
            });
            const payload = (await response.json()) as { error?: string; message?: string };
            if (!response.ok) {
                setError(payload.error ?? "Réinitialisation impossible.");
                return;
            }
            setSuccess(payload.message ?? "Mot de passe mis à jour.");
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            setError("Serveur indisponible.");
        } finally {
            setLoading(false);
        }
    };

    const handleTokenSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (newPassword !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }
        if (isInvitationFlow && !gdprConsent) {
            setError("Vous devez accepter le traitement de vos données pour activer votre compte.");
            return;
        }

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/auth/password/reset-with-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(
                    isInvitationFlow ? { token, newPassword, gdprConsent } : { token, newPassword },
                ),
            });
            const payload = (await response.json()) as { error?: string; message?: string };
            if (!response.ok) {
                setError(payload.error ?? "Lien invalide ou expiré.");
                return;
            }
            setSuccess(
                isInvitationFlow
                    ? "Compte activé. Vous pouvez vous connecter."
                    : "Mot de passe mis à jour. Vous pouvez vous connecter.",
            );
            setTimeout(() => router.push("/login"), 2000);
        } catch {
            setError("Serveur indisponible.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "linear-gradient(135deg, #001944 0%, #002C6E 55%, #1d4ed8 100%)" }}
        >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    {isInvitationFlow ? "Définissez votre mot de passe" : "Réinitialisation mot de passe"}
                </h1>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                    {isInvitationFlow
                        ? "Votre compte a été créé par l'administration. Choisissez un mot de passe fort (12+ caractères, majuscule, minuscule, chiffre, symbole) pour l'activer."
                        : isForgotFlow
                          ? "Choisissez un nouveau mot de passe fort (12+ caractères, majuscule, minuscule, chiffre, symbole)."
                          : "Obligatoire tous les 60 jours — saisissez votre ancien mot de passe et un nouveau mot de passe fort."}
                </p>

                <form
                    onSubmit={isForgotFlow ? handleTokenSubmit : handleCredentialsSubmit}
                    className="space-y-3"
                >
                    {!isForgotFlow && (
                        <>
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">Adresse email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">
                                    Ancien mot de passe
                                </label>
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none"
                                    required
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Nouveau mot de passe</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none"
                            required
                        />
                    </div>
                    {isForgotFlow && (
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">
                                Confirmer le nouveau mot de passe
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none"
                                required
                            />
                        </div>
                    )}

                    {isInvitationFlow && (
                        <label className="flex items-start gap-2 text-xs text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={gdprConsent}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setGdprConsent(e.target.checked)}
                                className="mt-0.5"
                                required
                            />
                            <span>
                                J&apos;accepte que mes données personnelles soient traitées dans le cadre de la gestion
                                de ma scolarité (RGPD). Ce consentement est requis pour activer le compte.
                            </span>
                        </label>
                    )}

                    {error && (
                        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
                    )}
                    {success && (
                        <p className="text-xs text-green-800 bg-green-50 border border-green-200 rounded-lg p-2">
                            {success}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all",
                            !loading ? "bg-[#001944] hover:bg-[#002C6E]" : "bg-gray-300 cursor-not-allowed",
                        )}
                    >
                        {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                    </button>
                </form>

                <p className="mt-4 text-xs text-center">
                    <Link href="/login" className="text-blue-700 hover:text-blue-900 font-medium">
                        Retour à la connexion
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div
                    className="min-h-screen flex items-center justify-center px-4"
                    style={{ background: "linear-gradient(135deg, #001944 0%, #002C6E 55%, #1d4ed8 100%)" }}
                >
                    <p className="text-white text-sm">Chargement…</p>
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
