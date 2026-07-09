"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError("");
        setSent(false);

        try {
            const response = await fetch("/api/auth/password/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const payload = (await response.json()) as { error?: string; message?: string };

            if (!response.ok) {
                setError(payload.error ?? "Envoi impossible.");
                return;
            }

            setSent(true);
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
                <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h1>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                    Saisissez votre adresse email. Si un compte existe, vous recevrez un lien de réinitialisation.
                </p>

                {sent ? (
                    <div className="space-y-4">
                        <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg p-3">
                            Si un compte existe pour cette adresse, un email de réinitialisation a été envoyé. Vérifiez
                            votre boîte de réception.
                        </p>
                        <Link
                            href="/login"
                            className="block text-center text-sm text-blue-700 hover:text-blue-900 font-medium"
                        >
                            Retour à la connexion
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Adresse email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                                required
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[#001944] hover:bg-[#002C6E] disabled:bg-gray-300"
                        >
                            {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
                        </button>
                    </form>
                )}

                {!sent && (
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
