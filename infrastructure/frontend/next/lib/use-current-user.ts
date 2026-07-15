"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type CurrentUser = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    role: "STUDENT" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN";
};

const SESSION_USER_KEY = "myges_user";

function readCachedUser(): CurrentUser | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = sessionStorage.getItem(SESSION_USER_KEY);
        return raw ? (JSON.parse(raw) as CurrentUser) : null;
    } catch {
        return null;
    }
}

export function cacheCurrentUser(user: CurrentUser): void {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function clearCachedUser(): void {
    sessionStorage.removeItem(SESSION_USER_KEY);
}

type UseCurrentUserResult = {
    user: CurrentUser | null;
    /** false jusqu'au premier useEffect (après hydratation) — évite un mismatch SSR/client. */
    hydrated: boolean;
};

// Utilisé par Sidebar et TopBar pour connaître le vrai rôle de l'utilisateur connecté : le chemin
// d'URL ne suffit pas sur les pages communes (/parametres, /messagerie) qui n'ont pas de préfixe de rôle.
export function useCurrentUser(): UseCurrentUserResult {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // La lecture doit rester dans l'effet (pas dans l'initialiseur de useState) : sessionStorage
        // n'existe pas côté serveur, donc lire la valeur au rendu créerait un mismatch d'hydratation
        // SSR/client. La reporter ici, après le premier rendu, est le pattern recommandé pour ce cas.
        const cached = readCachedUser();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (cached) setUser(cached);
        setHydrated(true);

        void api
            .get<CurrentUser>("/users/me")
            .then((me) => {
                setUser(me);
                cacheCurrentUser(me);
            })
            .catch(() => {});
    }, []);

    return { user, hydrated };
}
