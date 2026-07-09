"use client";

import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CheckCircle, Smartphone } from "lucide-react";

type SetupState = "loading" | "ready" | "success" | "error";

export default function TwoFactorSetupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setupSessionToken = searchParams.get("token") ?? "";

    const [state, setState] = useState<SetupState>("loading");
    const [totpSecret, setTotpSecret] = useState("");
    const [totpProvisioningUri, setTotpProvisioningUri] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Aucun header à construire manuellement : si l'utilisateur est déjà connecté, le middleware
    // attache automatiquement l'Authorization à partir du cookie httpOnly. Sinon, le backend
    // accepte `setupSessionToken` seul (cas "super_admin_2fa_required" avant même la connexion).
    const initSetup = useCallback(async () => {
        setState("loading");
        setError("");
        try {
            const response = await fetch("/api/auth/2fa/enable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(setupSessionToken ? { setupSessionToken } : {}),
            });
            const payload = (await response.json()) as {
                error?: string;
                totpSecret?: string;
                totpProvisioningUri?: string;
            };

            if (!response.ok) {
                setState("error");
                setError(payload.error ?? "Impossible d'initialiser la configuration 2FA.");
                return;
            }

            if (payload.totpSecret && payload.totpProvisioningUri) {
                setTotpSecret(payload.totpSecret);
                setTotpProvisioningUri(payload.totpProvisioningUri);
                setState("ready");
                return;
            }

            setState("error");
            setError("Réponse serveur invalide.");
        } catch {
            setState("error");
            setError("Serveur indisponible.");
        }
    }, [setupSessionToken]);

    useEffect(() => {
        void initSetup();
    }, [initSetup]);

    const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        try {
            const response = await fetch("/api/auth/2fa/enable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(setupSessionToken ? { setupSessionToken } : {}),
                    code,
                }),
            });
            const payload = (await response.json()) as { error?: string; message?: string };

            if (!response.ok) {
                setError(payload.error ?? "Code TOTP invalide.");
                return;
            }

            setState("success");
            // Avec setupSessionToken : l'utilisateur venait du blocage "super_admin_2fa_required" au
            // login, pas encore connecté → retour à /login. Sans : il était déjà connecté (activation
            // volontaire depuis /parametres) → retour à /parametres.
            setTimeout(() => {
                router.push(setupSessionToken ? "/login" : "/parametres");
            }, 2000);
        } catch {
            setError("Erreur lors de la validation du code.");
        } finally {
            setSubmitting(false);
        }
    };

    const qrImageUrl = totpProvisioningUri
        ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpProvisioningUri)}`
        : "";

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: "linear-gradient(135deg, #001944 0%, #002C6E 55%, #1d4ed8 100%)" }}
        >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-[#001944]/10 flex items-center justify-center">
                        <Smartphone size={20} className="text-[#001944]" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Configurer la 2FA</h1>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    Scannez le QR code avec Google Authenticator, Authy ou une application TOTP compatible.
                </p>

                {state === "loading" && (
                    <p className="text-sm text-gray-500 text-center py-8">Génération du QR code…</p>
                )}

                {state === "error" && (
                    <div className="space-y-4">
                        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</p>
                        <Link
                            href="/login"
                            className="block text-center text-sm text-blue-700 hover:text-blue-900 font-medium"
                        >
                            Retour à la connexion
                        </Link>
                    </div>
                )}

                {state === "success" && (
                    <div className="flex flex-col items-center gap-3 py-6 text-green-700">
                        <CheckCircle size={40} />
                        <p className="font-semibold">2FA activée avec succès !</p>
                        <p className="text-sm text-gray-500">Redirection en cours…</p>
                    </div>
                )}

                {state === "ready" && (
                    <div className="space-y-5">
                        <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                            {qrImageUrl && (
                                <img
                                    src={qrImageUrl}
                                    alt="QR code pour la 2FA"
                                    width={200}
                                    height={200}
                                    className="rounded-lg"
                                />
                            )}
                            <div className="w-full">
                                <p className="text-xs text-gray-500 mb-1 text-center">
                                    Impossible de scanner ? Saisissez ce secret manuellement :
                                </p>
                                <code className="block text-xs text-center font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 break-all select-all">
                                    {totpSecret}
                                </code>
                            </div>
                        </div>

                        <form onSubmit={handleConfirm} className="space-y-3">
                            <div>
                                <label className="text-xs font-medium text-gray-700 block mb-1">
                                    Code de vérification à 6 chiffres
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="123456"
                                    value={code}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                                    }
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                    required
                                />
                            </div>

                            {error && (
                                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || code.length !== 6}
                                className={cn(
                                    "w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all",
                                    !submitting && code.length === 6
                                        ? "bg-[#001944] hover:bg-[#002C6E] cursor-pointer"
                                        : "bg-gray-300 cursor-not-allowed",
                                )}
                            >
                                {submitting ? "Validation…" : "Valider et continuer"}
                            </button>
                        </form>
                    </div>
                )}

                {state === "ready" && (
                    <p className="mt-4 text-xs text-center">
                        <Link href="/login" className="text-blue-700 hover:text-blue-900 font-medium">
                            Retour à la connexion
                        </Link>
                    </p>
                )}
            </div>
        </div>
    );
}
