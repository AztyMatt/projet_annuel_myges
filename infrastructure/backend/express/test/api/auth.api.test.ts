import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@express/src/app";
import { pool } from "@express/src/postgres/db";
import { resetTestDatabase } from "./reset-database";
import {
    createTestStudent,
    createTestSuperAdmin,
    createTestUserWithoutRole,
    generateTotpCode,
    TEST_ACCOUNT_PASSWORD,
} from "./seed-test-accounts";

beforeAll(async () => {
    await resetTestDatabase();
});

afterAll(async () => {
    await pool.end();
});

describe("Auth API — inscription et connexion", () => {
    it("POST /auth/signup crée un compte, mais celui-ci reste en attente de rôle", async () => {
        const email = `nouvel-inscrit-${Date.now()}@myges-test.fr`;
        const signupResponse = await request(app).post("/api/auth/signup").send({
            firstname: "Nouvel",
            lastname: "Inscrit",
            email,
            password: TEST_ACCOUNT_PASSWORD,
            gdprConsent: true,
        });
        expect(signupResponse.status).toBe(201);
        expect(signupResponse.body.email).toBe(email);

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({ email, password: TEST_ACCOUNT_PASSWORD });
        expect(loginResponse.status).toBe(403);
        expect(loginResponse.body.error).toMatch(/attente/i);
    });

    it("POST /auth/signup refuse un consentement RGPD manquant", async () => {
        const response = await request(app)
            .post("/api/auth/signup")
            .send({
                firstname: "Sans",
                lastname: "Consentement",
                email: `sans-consentement-${Date.now()}@myges-test.fr`,
                password: TEST_ACCOUNT_PASSWORD,
            });
        expect(response.status).toBe(400);
    });

    it("POST /auth/login refuse un email inconnu", async () => {
        const response = await request(app)
            .post("/api/auth/login")
            .send({ email: "personne-nexiste@myges-test.fr", password: TEST_ACCOUNT_PASSWORD });
        expect(response.status).toBe(401);
    });

    it("une route protégée renvoie 401 sans token", async () => {
        const response = await request(app).get("/api/users/me");
        expect(response.status).toBe(401);
    });

    it("une route protégée renvoie 401 avec un token invalide", async () => {
        const response = await request(app).get("/api/users/me").set("Authorization", "Bearer token-invalide");
        expect(response.status).toBe(401);
    });

    it("parcours complet : un étudiant se connecte et consulte son propre profil", async () => {
        const { user } = await createTestStudent();

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({ email: user.email, password: TEST_ACCOUNT_PASSWORD });
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.token).toBeTruthy();
        expect(loginResponse.body.user.role).toBe("STUDENT");

        const meResponse = await request(app)
            .get("/api/users/me")
            .set("Authorization", `Bearer ${loginResponse.body.token}`);
        expect(meResponse.status).toBe(200);
        expect(meResponse.body.email).toBe(user.email);
        expect(meResponse.body.role).toBe("STUDENT");
    });

    it("un SUPER_ADMIN doit compléter la 2FA avant d'obtenir un token", async () => {
        const { user, totpSecret } = await createTestSuperAdmin();

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({ email: user.email, password: TEST_ACCOUNT_PASSWORD });
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.twoFactorRequired).toBe(true);
        expect(loginResponse.body.token).toBeUndefined();

        const code = generateTotpCode(totpSecret);
        const twoFaResponse = await request(app)
            .post("/api/auth/login/2fa")
            .send({ tempSessionToken: loginResponse.body.tempSessionToken, code });
        expect(twoFaResponse.status).toBe(200);
        expect(twoFaResponse.body.token).toBeTruthy();
        expect(twoFaResponse.body.user.role).toBe("SUPER_ADMIN");
    });

    it("un compte sans rôle reçoit pending_role_assignment", async () => {
        const { user } = await createTestUserWithoutRole();

        const response = await request(app)
            .post("/api/auth/login")
            .send({ email: user.email, password: TEST_ACCOUNT_PASSWORD });

        expect(response.status).toBe(403);
        expect(response.body.error).toMatch(/attente/i);
    });
});
