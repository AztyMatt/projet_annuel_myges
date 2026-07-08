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

// Utilisé par Sidebar et TopBar pour connaître le vrai rôle de l'utilisateur connecté : le chemin
// d'URL ne suffit pas sur les pages communes (/parametres, /messagerie) qui n'ont pas de préfixe de rôle.
export function useCurrentUser(): CurrentUser | null {
    const [user, setUser] = useState<CurrentUser | null>(null);

    useEffect(() => {
        api
            .get<CurrentUser>("/users/me")
            .then(setUser)
            .catch(() => {});
    }, []);

    return user;
}
