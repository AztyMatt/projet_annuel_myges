import { jwtVerify } from "jose";

// Doit rester alignée avec JWT_EXPIRES_IN côté backend (infrastructure/backend/express/src/auth/token-provider.adapter.ts)
export const AUTH_COOKIE_NAME = "myges_token";
export const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

export type Role = "STUDENT" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN";

export const ROLE_HOME: Record<Role, string> = {
    STUDENT: "/etudiant",
    INSTRUCTOR: "/intervenant",
    ADMIN: "/scolarite",
    SUPER_ADMIN: "/superadmin",
};

export type SessionPayload = { userId: string; role: Role; email: string; token: string };

/**
 * Vérifie la signature du JWT (même secret que le backend) — compatible Edge runtime (Web Crypto via `jose`).
 * Ne fait pas confiance au contenu tant que la signature n'est pas validée : un cookie forgé sans le bon
 * secret est rejeté ici, avant même que la page protégée ne soit rendue.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        if (typeof payload.sub !== "string" || typeof payload.role !== "string" || typeof payload.email !== "string") {
            return null;
        }
        return { userId: payload.sub, role: payload.role as Role, email: payload.email, token };
    } catch {
        return null;
    }
}
