import { describe, expect, it } from "vitest";
import { Role } from "@domain/auth/user.enums";
import { BasicStatus } from "@domain/absence/absence.enums";
import { type Absence } from "@domain/absence/absence.entity";
import { capabilitiesForRole } from "@domain/auth/authorization-policy";
import { type AuthContext } from "@application/types/auth-context";
import { buildAbsenceUseCases } from "@application/absence/absence.use-cases.fakes";

const authContext = (role: Role, requesterId = "requester"): AuthContext => ({
    requesterId,
    ...capabilitiesForRole(role),
});

const pendingAbsence = (overrides: Partial<Absence> = {}): Absence => ({
    id: "abs1",
    studentId: "s1",
    sessionId: "sess1",
    reason: "Rendez-vous médical",
    status: BasicStatus.PENDING,
    declaredAt: new Date(),
    ...overrides,
});

describe("AbsenceUseCases.validate", () => {
    it("refuse la validation pour un intervenant (réservé à l'administration)", async () => {
        const { absenceUseCases, absences } = buildAbsenceUseCases();
        absences.set("abs1", pendingAbsence());

        const result = await absenceUseCases.validate("abs1", authContext(Role.INSTRUCTOR));

        expect(result).toEqual({ kind: "forbidden" });
    });

    it("refuse la validation pour un étudiant", async () => {
        const { absenceUseCases, absences } = buildAbsenceUseCases();
        absences.set("abs1", pendingAbsence());

        const result = await absenceUseCases.validate("abs1", authContext(Role.STUDENT));

        expect(result).toEqual({ kind: "forbidden" });
    });

    it("renvoie not_found si l'absence n'existe pas", async () => {
        const { absenceUseCases } = buildAbsenceUseCases();
        const result = await absenceUseCases.validate("inconnue", authContext(Role.ADMIN));
        expect(result).toEqual({ kind: "not_found" });
    });

    it("un ADMIN ne peut pas re-traiter une absence déjà décidée", async () => {
        const { absenceUseCases, absences } = buildAbsenceUseCases();
        absences.set("abs1", pendingAbsence({ status: BasicStatus.REJECTED }));

        const result = await absenceUseCases.validate("abs1", authContext(Role.ADMIN));

        expect(result).toEqual({ kind: "absence_already_processed" });
    });

    it("un SUPER_ADMIN peut re-traiter (écraser) une décision déjà prise", async () => {
        const { absenceUseCases, absences } = buildAbsenceUseCases();
        absences.set("abs1", pendingAbsence({ status: BasicStatus.REJECTED }));

        const result = await absenceUseCases.validate("abs1", authContext(Role.SUPER_ADMIN));

        expect(result.kind).toBe("absence_validated");
        expect(absences.get("abs1")?.status).toBe(BasicStatus.VALIDATED);
    });

    it("valide une absence en attente et notifie l'étudiant (cas nominal)", async () => {
        const { absenceUseCases, absences, students, sentNotifications } = buildAbsenceUseCases();
        absences.set("abs1", pendingAbsence());
        students.set("s1", { id: "s1", userId: "u1", programId: "prog1" });

        const result = await absenceUseCases.validate("abs1", authContext(Role.ADMIN));

        expect(result.kind).toBe("absence_validated");
        expect(absences.get("abs1")?.status).toBe(BasicStatus.VALIDATED);
        expect(sentNotifications).toHaveLength(1);
        expect(sentNotifications[0]).toMatchObject({ userId: "u1", type: "ABSENCE_VALIDATED" });
    });

    it("valide sans planter même si l'étudiant n'existe plus (notification simplement omise)", async () => {
        const { absenceUseCases, absences, sentNotifications } = buildAbsenceUseCases();
        absences.set("abs1", pendingAbsence({ studentId: "etudiant-supprime" }));

        const result = await absenceUseCases.validate("abs1", authContext(Role.ADMIN));

        expect(result.kind).toBe("absence_validated");
        expect(sentNotifications).toHaveLength(0);
    });
});

describe("AbsenceUseCases.reject", () => {
    it("refuse le rejet pour un intervenant", async () => {
        const { absenceUseCases, absences } = buildAbsenceUseCases();
        absences.set("abs1", pendingAbsence());

        const result = await absenceUseCases.reject("abs1", authContext(Role.INSTRUCTOR));

        expect(result).toEqual({ kind: "forbidden" });
    });

    it("renvoie not_found si l'absence n'existe pas", async () => {
        const { absenceUseCases } = buildAbsenceUseCases();
        const result = await absenceUseCases.reject("inconnue", authContext(Role.ADMIN));
        expect(result).toEqual({ kind: "not_found" });
    });

    it("un ADMIN ne peut pas re-traiter une absence déjà décidée", async () => {
        const { absenceUseCases, absences } = buildAbsenceUseCases();
        absences.set("abs1", pendingAbsence({ status: BasicStatus.VALIDATED }));

        const result = await absenceUseCases.reject("abs1", authContext(Role.ADMIN));

        expect(result).toEqual({ kind: "absence_already_processed" });
    });

    it("rejette une absence en attente et notifie l'étudiant (cas nominal)", async () => {
        const { absenceUseCases, absences, students, sentNotifications } = buildAbsenceUseCases();
        absences.set("abs1", pendingAbsence());
        students.set("s1", { id: "s1", userId: "u1", programId: "prog1" });

        const result = await absenceUseCases.reject("abs1", authContext(Role.ADMIN));

        expect(result.kind).toBe("absence_rejected");
        expect(absences.get("abs1")?.status).toBe(BasicStatus.REJECTED);
        expect(sentNotifications).toHaveLength(1);
        expect(sentNotifications[0]).toMatchObject({ userId: "u1", type: "ABSENCE_REJECTED" });
    });
});
