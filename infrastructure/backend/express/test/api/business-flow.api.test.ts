import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "@express/src/app";
import { pool } from "@express/src/postgres/db";
import { resetTestDatabase } from "./reset-database";
import { createTestAdmin, createTestInstructor, createTestUserWithoutRole } from "./seed-test-accounts";
import { loginAndGetToken } from "./login";

/**
 * Fil rouge de bout en bout à travers la vraie API HTTP (aucun accès direct à la base) :
 * filière → classe → groupe → cours → session → déclaration d'absence → validation.
 * C'est exactement le scénario de démo décrit dans PROJECT_AUDIT_AND_ROADMAP.md — s'il casse
 * ici, il casserait en démo.
 */

let adminToken: string;
let instructorId: string;
let instructorToken: string;

beforeAll(async () => {
    await resetTestDatabase();

    const admin = await createTestAdmin();
    adminToken = await loginAndGetToken(admin.user.email);

    const instructor = await createTestInstructor();
    instructorId = instructor.instructor.id;
    instructorToken = await loginAndGetToken(instructor.user.email);
});

afterAll(async () => {
    await pool.end();
});

describe("Parcours métier complet : filière → session → absence → validation", () => {
    it("construit toute la chaîne pédagogique puis déclare et valide une absence", async () => {
        const academicYear = await request(app)
            .post("/api/academic-years")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ startDate: "2026-09-01T00:00:00.000Z", endDate: "2027-08-31T00:00:00.000Z" });
        expect(academicYear.status).toBe(201);

        const period = await request(app)
            .post("/api/periods")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                order: 1,
                startDate: "2026-09-01T00:00:00.000Z",
                endDate: "2027-08-31T00:00:00.000Z",
                academicYearId: academicYear.body.id,
            });
        expect(period.status).toBe(201);

        const program = await request(app)
            .post("/api/programs")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Développement Full-Stack", code: `DEV-${Date.now()}`, periodId: period.body.id });
        expect(program.status).toBe(201);

        const klass = await request(app)
            .post("/api/classes")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ number: 1, programId: program.body.id, size: 24 });
        expect(klass.status).toBe(201);

        const group = await request(app)
            .post("/api/groups")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ classId: klass.body.id, name: "Groupe A" });
        expect(group.status).toBe(201);

        const bloc = await request(app)
            .post("/api/blocs")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Bloc technique", programId: program.body.id });
        expect(bloc.status).toBe(201);

        const module = await request(app)
            .post("/api/modules")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Architecture logicielle", code: `MOD-${Date.now()}` });
        expect(module.status).toBe(201);

        // Un cours n'accepte qu'un module déjà rattaché à la filière (validateModuleAndBloc)
        const programModule = await request(app)
            .post("/api/program-modules")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ programId: program.body.id, moduleId: module.body.id, coefficient: 3, ectsCredits: 5 });
        expect(programModule.status).toBe(201);

        const course = await request(app)
            .post("/api/courses")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                instructorId,
                moduleId: module.body.id,
                classId: klass.body.id,
                groupId: group.body.id,
                blocId: bloc.body.id,
            });
        expect(course.status).toBe(201);

        const campus = await request(app)
            .post("/api/campuses")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "Campus Paris", address: "1 rue de Paris" });
        expect(campus.status).toBe(201);

        const classroom = await request(app)
            .post("/api/classrooms")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ name: "P101", capacity: 30, campusId: campus.body.id });
        expect(classroom.status).toBe(201);

        const { user: studentUser } = await createTestUserWithoutRole();
        const student = await request(app)
            .post("/api/students")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ userId: studentUser.id, programId: program.body.id });
        expect(student.status).toBe(201);

        const studentGroup = await request(app)
            .post("/api/student-groups")
            .set("Authorization", `Bearer ${adminToken}`)
            .send({ studentId: student.body.id, groupId: group.body.id });
        expect(studentGroup.status).toBe(201);

        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const anHourLater = new Date(yesterday.getTime() + 60 * 60 * 1000);
        const session = await request(app).post("/api/sessions").set("Authorization", `Bearer ${adminToken}`).send({
            courseId: course.body.id,
            startTime: yesterday.toISOString(),
            endTime: anHourLater.toISOString(),
            mode: "ON_SITE",
            classroomId: classroom.body.id,
        });
        expect(session.status).toBe(201);

        // Déclarée par l'intervenant du cours — la déclaration d'absence est réservée au staff (§ règle métier, CLAUDE.md)
        const absence = await request(app)
            .post("/api/absences")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({ studentId: student.body.id, sessionId: session.body.id, reason: "Absent sans justificatif" });
        expect(absence.status).toBe(201);
        expect(absence.body.status).toBe("PENDING");

        const validation = await request(app)
            .post(`/api/absences/${absence.body.id}/validate`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(validation.status).toBe(200);
        expect(validation.body.status).toBe("VALIDATED");

        const refetched = await request(app)
            .get(`/api/absences/${absence.body.id}`)
            .set("Authorization", `Bearer ${adminToken}`);
        expect(refetched.status).toBe(200);
        expect(refetched.body.status).toBe("VALIDATED");
    });
});
