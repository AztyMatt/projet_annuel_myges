import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@express/src/app";
import { pool } from "@express/src/postgres/db";
import { resetTestDatabase } from "./reset-database";
import {
    createTestAdmin,
    createTestInstructor,
    createTestStudent,
    createTestSuperAdmin,
    createTestUserWithoutRole,
    generateTotpCode,
    TEST_ACCOUNT_PASSWORD,
} from "./seed-test-accounts";
import { loginAndGetToken } from "./login";

/**
 * Vérifie, pour chaque endpoint sensible, que les rôles non autorisés reçoivent bien 403 —
 * exactement le type de régression trouvé "à la main" ces dernières semaines (ex: suppression
 * de compte cassée) et qu'aucun test n'aurait laissé passer inaperçue.
 */

let studentToken: string;
let instructorToken: string;
let adminToken: string;
let superAdminToken: string;

beforeAll(async () => {
    await resetTestDatabase();

    const student = await createTestStudent();
    studentToken = await loginAndGetToken(student.user.email);

    const instructor = await createTestInstructor();
    instructorToken = await loginAndGetToken(instructor.user.email);

    const admin = await createTestAdmin();
    adminToken = await loginAndGetToken(admin.user.email);

    const superAdmin = await createTestSuperAdmin();
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: superAdmin.user.email, password: TEST_ACCOUNT_PASSWORD });
    const twoFaResponse = await request(app)
        .post("/api/auth/login/2fa")
        .send({ tempSessionToken: loginResponse.body.tempSessionToken, code: generateTotpCode(superAdmin.totpSecret) });
    superAdminToken = twoFaResponse.body.token;
});

afterAll(async () => {
    await pool.end();
});

describe("RBAC — POST /grades/:id/lock (réservé admin/super admin)", () => {
    it("refuse un étudiant", async () => {
        const res = await request(app).post("/api/grades/inconnue/lock").set("Authorization", `Bearer ${studentToken}`);
        expect(res.status).toBe(403);
    });

    it("refuse un intervenant", async () => {
        const res = await request(app).post("/api/grades/inconnue/lock").set("Authorization", `Bearer ${instructorToken}`);
        expect(res.status).toBe(403);
    });

    it("laisse passer un admin (404 attendu, pas 403 : la note n'existe juste pas)", async () => {
        const res = await request(app).post("/api/grades/inconnue/lock").set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).not.toBe(403);
        expect(res.status).toBe(404);
    });
});

describe("RBAC — GET /grades (liste complète, réservé admin/super admin)", () => {
    it("refuse un étudiant", async () => {
        const res = await request(app).get("/api/grades").set("Authorization", `Bearer ${studentToken}`);
        expect(res.status).toBe(403);
    });

    it("refuse un intervenant", async () => {
        const res = await request(app).get("/api/grades").set("Authorization", `Bearer ${instructorToken}`);
        expect(res.status).toBe(403);
    });

    it("autorise un admin", async () => {
        const res = await request(app).get("/api/grades").set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});

describe("RBAC — POST /absences/:id/validate (réservé admin/super admin)", () => {
    it("refuse un étudiant", async () => {
        const res = await request(app).post("/api/absences/inconnue/validate").set("Authorization", `Bearer ${studentToken}`);
        expect(res.status).toBe(403);
    });

    it("refuse un intervenant", async () => {
        const res = await request(app).post("/api/absences/inconnue/validate").set("Authorization", `Bearer ${instructorToken}`);
        expect(res.status).toBe(403);
    });

    it("laisse passer un admin (404 attendu, pas 403)", async () => {
        const res = await request(app).post("/api/absences/inconnue/validate").set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).not.toBe(403);
        expect(res.status).toBe(404);
    });
});

describe("RBAC — POST /users/invite (réservé admin/super admin)", () => {
    it("refuse un étudiant", async () => {
        const res = await request(app)
            .post("/api/users/invite")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({ firstname: "A", lastname: "B", email: "x@myges-test.fr", programId: "peu-importe" });
        expect(res.status).toBe(403);
    });

    it("refuse un intervenant", async () => {
        const res = await request(app)
            .post("/api/users/invite")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({ firstname: "A", lastname: "B", email: "y@myges-test.fr", programId: "peu-importe" });
        expect(res.status).toBe(403);
    });

    it("laisse passer un admin (404 filière attendu, pas 403)", async () => {
        const res = await request(app)
            .post("/api/users/invite")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ firstname: "A", lastname: "B", email: "z@myges-test.fr", programId: "filiere-inconnue" });
        expect(res.status).not.toBe(403);
        expect(res.status).toBe(404);
    });
});

describe("RBAC — DELETE /users/:id (suppression du compte d'autrui, réservé super admin)", () => {
    it("refuse un admin simple qui tente de supprimer le compte d'un étudiant", async () => {
        const target = await createTestStudent();
        const res = await request(app).delete(`/api/users/${target.user.id}`).set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(403);
    });

    it("un super admin peut supprimer le compte d'un utilisateur sans rôle", async () => {
        const target = await createTestUserWithoutRole();
        const res = await request(app).delete(`/api/users/${target.user.id}`).set("Authorization", `Bearer ${superAdminToken}`);
        expect(res.status).toBe(200);
    });
});

describe("RBAC — GET /admin/security/users (réservé super admin uniquement)", () => {
    it("refuse un admin simple", async () => {
        const res = await request(app).get("/api/admin/security/users").set("Authorization", `Bearer ${adminToken}`);
        expect(res.status).toBe(403);
    });

    it("autorise un super admin", async () => {
        const res = await request(app).get("/api/admin/security/users").set("Authorization", `Bearer ${superAdminToken}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.users)).toBe(true);
    });
});
