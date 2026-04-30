"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

type SeedAccount = {
  role: string;
  email: string;
  password: string;
  twoFactorEnabled: boolean;
  totpSecret: string | null;
};

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [error, setError] = useState("");
  const [totpRequired, setTotpRequired] = useState(false);
  const [tempSessionUserId, setTempSessionUserId] = useState("");
  const [seedAccounts, setSeedAccounts] = useState<SeedAccount[]>([]);

  const getApiBaseUrl = (): string => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  const roleToRoute: Record<string, string> = {
    student: "/etudiant",
    teacher: "/intervenant",
    admin: "/scolarite",
    super_admin: "/superadmin",
  };

  const roleToLegacyStorage: Record<string, string> = {
    student: "etudiant",
    teacher: "intervenant",
    admin: "scolarite",
    super_admin: "superadmin",
  };

  const completeLogin = (token: string, role: string) => {
    const route = roleToRoute[role] ?? "/login";
    if (typeof window !== "undefined") {
      localStorage.setItem("myges_token", token);
      localStorage.setItem("myges_role", roleToLegacyStorage[role] ?? "etudiant");
    }
    router.push(route);
  };

  useEffect(() => {
    const loadSeedAccounts = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/auth/dev-seed-accounts`);
        if (!response.ok) return;
        const payload = (await response.json()) as { accounts?: SeedAccount[] };
        if (Array.isArray(payload.accounts)) {
          setSeedAccounts(payload.accounts);
        }
      } catch {
        // Ignore in production/non-seed contexts.
      }
    };
    loadSeedAccounts();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        twoFactorRequired?: boolean;
        tempSessionUserId?: string;
        token?: string;
        user?: { role?: string };
        passwordResetRequired?: boolean;
      };

      if (!response.ok) {
        if (payload.passwordResetRequired) {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
          return;
        }
        setError(payload.error ?? "Connexion impossible.");
        return;
      }

      if (payload.twoFactorRequired && payload.tempSessionUserId) {
        setTotpRequired(true);
        setTempSessionUserId(payload.tempSessionUserId);
        return;
      }

      if (payload.token && payload.user?.role) {
        completeLogin(payload.token, payload.user.role);
        return;
      }

      setError("Réponse serveur invalide.");
    } catch {
      setError("Serveur indisponible. Vérifie que le backend tourne sur le port 3001.");
    } finally {
      setLoading(false);
    }
  };

  const handle2FALogin = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login/2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempSessionUserId, code: totpCode }),
      });
      const payload = (await response.json()) as {
        error?: string;
        token?: string;
        user?: { role?: string };
      };

      if (!response.ok) {
        setError(payload.error ?? "Code TOTP invalide.");
        return;
      }

      if (payload.token && payload.user?.role) {
        completeLogin(payload.token, payload.user.role);
        return;
      }

      setError("Réponse serveur invalide.");
    } catch {
      setError("Erreur lors de la validation du code 2FA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #001944 0%, #002C6E 55%, #1d4ed8 100%)",
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 backdrop-blur-sm bg-white/10 border border-white/20">
            <span className="text-2xl font-black text-white">M</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">MYGES 2.0</h1>
          <p className="text-white/50 mt-1.5 text-sm">Plateforme de gestion scolaire</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900">Connexion</h2>
          <p className="text-gray-500 text-sm mt-1 mb-6">
            Saisissez vos identifiants pour accéder à la plateforme
          </p>

          {/* Form */}
          <div className="space-y-3 mb-5">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Adresse email</label>
              <input
                type="email"
                placeholder="votre@email.fr"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            {totpRequired && (
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">
                  Code de vérification (2FA)
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  value={totpCode}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <button
            onClick={totpRequired ? handle2FALogin : handleLogin}
            disabled={!email || !password || loading || (totpRequired && totpCode.length !== 6)}
            className={cn(
              "w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all",
              !loading && email && password && (!totpRequired || totpCode.length === 6)
                ? "bg-[#001944] hover:bg-[#002C6E] cursor-pointer shadow-sm"
                : "bg-gray-300 cursor-not-allowed"
            )}
          >
            {loading ? "Connexion en cours…" : totpRequired ? "Valider le code 2FA" : "Se connecter"}
          </button>

          {!totpRequired && (
            <div className="mt-4 flex items-center justify-start text-xs">
              <Link href="/signup" className="text-blue-700 hover:text-blue-900 font-medium">
                Créer un compte
              </Link>
            </div>
          )}

          {seedAccounts.length > 0 && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 space-y-2">
              <p className="font-semibold">Comptes de test (dev)</p>
              {seedAccounts.map((account) => (
                <div key={account.email} className="rounded-md bg-white/70 p-2">
                  <p>
                    <span className="font-semibold">Rôle:</span> {account.role}
                  </p>
                  <p>
                    <span className="font-semibold">Email:</span> {account.email}
                  </p>
                  <p>
                    <span className="font-semibold">Mot de passe:</span> {account.password}
                  </p>
                  {account.twoFactorEnabled && account.totpSecret && (
                    <p>
                      <span className="font-semibold">Secret 2FA:</span> {account.totpSecret}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-white/30 text-xs mt-6">
          MyGES 2.0 — Projet Annuel ESGI 5IW
        </p>
      </div>
    </div>
  );
}
