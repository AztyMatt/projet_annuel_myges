"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type SignupState = "form" | "totp-setup" | "done";

const passwordChecks = [
    { label: "12 caractères minimum", test: (p: string) => p.length >= 12 },
    { label: "Une majuscule", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Une minuscule", test: (p: string) => /[a-z]/.test(p) },
    { label: "Un chiffre", test: (p: string) => /[0-9]/.test(p) },
    { label: "Un symbole", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function SignupPage() {
    const router = useRouter();
    const [state, setState] = useState<SignupState>("form");

    const [firstname, setFirstname] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [enable2FA, setEnable2FA] = useState(false);
    const [gdprConsent, setGdprConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [totpSecret, setTotpSecret] = useState("");
    const [totpProvisioningUri, setTotpProvisioningUri] = useState("");

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firstname, lastname, email, password, enable2FA, gdprConsent }),
            });
            const payload = (await response.json()) as {
                error?: string;
                message?: string;
                totpSecret?: string;
                totpProvisioningUri?: string;
            };

            if (!response.ok) {
                setError(payload.error ?? "Inscription impossible.");
                return;
            }

            if (payload.totpSecret && payload.totpProvisioningUri) {
                setTotpSecret(payload.totpSecret);
                setTotpProvisioningUri(payload.totpProvisioningUri);
                setState("totp-setup");
                return;
            }

            setState("done");
        } catch {
            setError("Serveur indisponible.");
        } finally {
            setLoading(false);
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
                {state === "form" && (
                    <>
                        <h1 className="text-2xl font-bold text-gray-900">Inscription</h1>
                        <p className="text-sm text-gray-500 mt-1 mb-6">
                            Mot de passe fort obligatoire (12+ caractères, maj/min/chiffre/symbole)
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Prénom</label>
                                    <input
                                        type="text"
                                        value={firstname}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstname(e.target.value)}
                                        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 block mb-1">Nom</label>
                                    <input
                                        type="text"
                                        value={lastname}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setLastname(e.target.value)}
                                        className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none"
                                        required
                                    />
                                </div>
                            </div>
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
                                <label className="text-xs font-medium text-gray-700 block mb-1">Mot de passe</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none"
                                    required
                                />
                                {password.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        {passwordChecks.map((check) => {
                                            const passed = check.test(password);
                                            return (
                                                <div
                                                    key={check.label}
                                                    className={cn(
                                                        "flex items-center gap-1.5 text-xs",
                                                        passed ? "text-green-600" : "text-gray-400",
                                                    )}
                                                >
                                                    {passed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                                                    {check.label}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <label className="flex items-center gap-2 text-xs text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={enable2FA}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEnable2FA(e.target.checked)}
                                />
                                Activer la double authentification maintenant (recommandé)
                            </label>
                            <label className="flex items-center gap-2 text-xs text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={gdprConsent}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setGdprConsent(e.target.checked)}
                                    required
                                />
                                J&apos;accepte le traitement de mes données (RGPD/CNIL)
                            </label>

                            {error && (
                                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[#001944] hover:bg-[#002C6E] disabled:bg-gray-300"
                            >
                                {loading ? "Création..." : "Créer mon compte"}
                            </button>
                        </form>

                        <p className="mt-4 text-xs text-center">
                            <Link href="/login" className="text-blue-700 hover:text-blue-900 font-medium">
                                Retour à la connexion
                            </Link>
                        </p>
                    </>
                )}

                {state === "totp-setup" && (
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Configurer la 2FA</h1>
                        <p className="text-sm text-gray-500 mt-1 mb-4">
                            Scannez ce QR code avec Google Authenticator, Authy ou une application TOTP compatible.
                        </p>
                        <div className="flex flex-col items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl mb-4">
                            {qrImageUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={qrImageUrl} alt="QR code pour la 2FA" width={200} height={200} className="rounded-lg" />
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
                        <button
                            onClick={() => setState("done")}
                            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[#001944] hover:bg-[#002C6E]"
                        >
                            J&apos;ai terminé
                        </button>
                    </div>
                )}

                {state === "done" && (
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Compte créé</h1>
                        <p className="text-sm text-gray-600 mb-6">
                            Un administrateur doit vous attribuer un rôle avant que vous puissiez vous connecter.
                        </p>
                        <button
                            onClick={() => router.push("/login")}
                            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[#001944] hover:bg-[#002C6E]"
                        >
                            Retour à la connexion
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
