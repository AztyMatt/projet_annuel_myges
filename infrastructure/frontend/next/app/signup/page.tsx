"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";

type Role = "student" | "teacher" | "admin" | "super_admin";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("student");
  const [enable2FA, setEnable2FA] = useState(false);
  const [gdprConsent, setGdprConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [totpSecret, setTotpSecret] = useState<string | null>(null);

  const getApiBaseUrl = (): string => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setTotpSecret(null);

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, enable2FA, gdprConsent }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        totpSecret?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Inscription impossible.");
        return;
      }

      setSuccess(payload.message ?? "Compte créé.");
      if (payload.totpSecret) {
        setTotpSecret(payload.totpSecret);
      }
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
        <h1 className="text-2xl font-bold text-gray-900">Inscription</h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          Mot de passe fort obligatoire (12+ caractères, maj/min/chiffre/symbole)
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
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
          </div>
          <div>
            <label className="text-xs font-medium text-gray-700 block mb-1">Rôle</label>
            <select
              value={role}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none"
            >
              <option value="student">student</option>
              <option value="teacher">teacher</option>
              <option value="admin">admin</option>
              <option value="super_admin">super_admin</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={enable2FA}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEnable2FA(e.target.checked)}
            />
            Activer la 2FA TOTP
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={gdprConsent}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setGdprConsent(e.target.checked)}
              required
            />
            J'accepte le traitement de mes données (RGPD/CNIL)
          </label>

          {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
          {success && (
            <div className="text-xs text-green-800 bg-green-50 border border-green-200 rounded-lg p-2 space-y-1">
              <p>{success}</p>
              {totpSecret && <p>Secret TOTP: {totpSecret}</p>}
            </div>
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
      </div>
    </div>
  );
}
