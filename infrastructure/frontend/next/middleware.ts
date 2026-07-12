import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, ROLE_HOME, verifySessionToken, type Role } from "@/lib/auth";

// Ces routes posent/suppriment elles-mêmes le cookie httpOnly (voir app/api/auth/**/route.ts) —
// elles ne doivent pas passer par le rewrite générique ci-dessous.
const AUTH_ROUTE_HANDLERS = new Set(["/api/auth/login", "/api/auth/login/2fa", "/api/auth/logout"]);

const ROLE_PROTECTED_PREFIXES: Array<{ prefix: string; roles: Role[] }> = [
    { prefix: "/etudiant", roles: ["STUDENT"] },
    { prefix: "/intervenant", roles: ["INSTRUCTOR"] },
    { prefix: "/scolarite", roles: ["ADMIN", "SUPER_ADMIN"] },
    { prefix: "/superadmin", roles: ["SUPER_ADMIN"] },
];

// Pages communes à tous les rôles connectés : authentification requise, pas de restriction de rôle.
const COMMON_PROTECTED_PREFIXES = ["/parametres", "/messagerie"];

const matchesPrefix = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/api/")) {
        if (AUTH_ROUTE_HANDLERS.has(pathname)) return NextResponse.next();

        const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
        const backendUrl = process.env.API_URL ?? "http://localhost:3001";
        const destination = new URL(pathname + request.nextUrl.search, backendUrl);

        const headers = new Headers(request.headers);
        if (token) headers.set("Authorization", `Bearer ${token}`);

        return NextResponse.rewrite(destination, { request: { headers } });
    }

    const roleRule = ROLE_PROTECTED_PREFIXES.find(({ prefix }) => matchesPrefix(pathname, prefix));
    const isCommonProtected = COMMON_PROTECTED_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));

    if (roleRule || isCommonProtected) {
        const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
        const session = token ? await verifySessionToken(token) : null;

        if (!session) {
            return NextResponse.redirect(new URL("/login", request.url));
        }
        if (roleRule && !roleRule.roles.includes(session.role)) {
            return NextResponse.redirect(new URL(ROLE_HOME[session.role] ?? "/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/api/:path*",
        "/etudiant/:path*",
        "/intervenant/:path*",
        "/scolarite/:path*",
        "/superadmin/:path*",
        "/parametres/:path*",
        "/messagerie/:path*",
    ],
};
