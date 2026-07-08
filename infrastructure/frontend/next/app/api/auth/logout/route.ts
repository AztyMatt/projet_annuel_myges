import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/auth";

// Le JWT est stateless (pas d'invalidation côté backend) : se déconnecter revient simplement
// à effacer le cookie httpOnly côté navigateur.
export async function POST() {
    const response = NextResponse.json({ message: "Logged out" });
    response.cookies.set(AUTH_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
    return response;
}
