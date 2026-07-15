import request from "supertest";
import { app } from "@express/src/app";
import { TEST_ACCOUNT_PASSWORD } from "./seed-test-accounts";

/** Connecte un compte de test sans 2FA (student/instructor/admin) et renvoie son JWT. */
export async function loginAndGetToken(email: string): Promise<string> {
    const response = await request(app).post("/api/auth/login").send({ email, password: TEST_ACCOUNT_PASSWORD });
    if (!response.body.token) {
        throw new Error(`Échec de connexion de test pour ${email}: ${JSON.stringify(response.body)}`);
    }
    return response.body.token as string;
}
