import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@express/src/app";
import { pool } from "@express/src/postgres/db";
import { resetTestDatabase } from "./reset-database";
import { createTestAdmin, createTestStudent } from "./seed-test-accounts";
import { loginAndGetToken } from "./login";

/**
 * Vérifie que les contraintes d'intégrité (doublon, suppression référencée) remontent bien un
 * 409 explicite à l'API plutôt qu'un 500 générique ou une suppression silencieusement corrompue.
 */

let adminToken: string;

beforeAll(async () => {
    await resetTestDatabase();
    const admin = await createTestAdmin();
    adminToken = await loginAndGetToken(admin.user.email);
});

afterAll(async () => {
    await pool.end();
});

describe("Contraintes — création en doublon", () => {
    it("refuse la création d'une entreprise avec un SIRET déjà utilisé (409)", async () => {
        const company = {
            name: "Entreprise Test",
            siret: `SIRET-${Date.now()}`,
            address: "1 rue de Test",
            contactName: "Contact Test",
        };

        const first = await request(app)
            .post("/api/companies")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(company);
        expect(first.status).toBe(201);

        const second = await request(app)
            .post("/api/companies")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(company);
        expect(second.status).toBe(409);
        expect(second.body.type).toBe("Creation");
    });
});

describe("Contraintes — suppression d'une entité encore référencée", () => {
    it("refuse la suppression d'une filière encore rattachée à un étudiant (409)", async () => {
        const { student } = await createTestStudent();

        const response = await request(app)
            .delete(`/api/programs/${student.programId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(409);
        expect(response.body.type).toBe("Deletion");
        expect(response.body.error).toMatch(/étudiant/i);
    });
});
