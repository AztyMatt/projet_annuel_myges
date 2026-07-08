import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME } from "@/lib/auth";

// Ce endpoint n'est PAS proxié par le middleware (il est exclu du rewrite générique /api/*) :
// il doit intercepter la réponse du backend pour transformer le `token` JSON en cookie httpOnly,
// afin que le JWT ne soit jamais exposé au JavaScript du navigateur.
export async function POST(request: NextRequest) {
    const backendUrl = process.env.API_URL ?? "http://localhost:3001";
    const body = await request.text();

    const backendResponse = await fetch(new URL("/auth/login", backendUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
    });

    const payload = await backendResponse.json();

    const response = NextResponse.json(payload.token ? { user: payload.user } : payload, {
        status: backendResponse.status,
    });

    if (payload.token) {
        response.cookies.set(AUTH_COOKIE_NAME, payload.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
        });
    }

    return response;
}
