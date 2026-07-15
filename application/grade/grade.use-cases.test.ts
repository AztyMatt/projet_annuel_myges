import { describe, expect, it } from "vitest";
import { Role } from "@domain/auth/user.enums";
import { capabilitiesForRole } from "@domain/auth/authorization-policy";
import { type AuthContext } from "@application/types/auth-context";
import { buildGradeUseCases } from "@application/grade/grade.use-cases.fakes";

const authContext = (role: Role, requesterId = "requester"): AuthContext => ({
    requesterId,
    ...capabilitiesForRole(role),
});

describe("GradeUseCases.create", () => {
    it("refuse la création pour un étudiant", async () => {
        const { gradeUseCases } = buildGradeUseCases();
        const result = await gradeUseCases.create({ studentId: "s1", value: 15 }, authContext(Role.STUDENT));
        expect(result).toEqual({ kind: "forbidden" });
    });

    it("refuse une note hors de l'intervalle 0-20", async () => {
        const { gradeUseCases, students } = buildGradeUseCases();
        students.set("s1", { id: "s1", userId: "u1", programId: "prog1" });

        const tooHigh = await gradeUseCases.create({ studentId: "s1", value: 25 }, authContext(Role.INSTRUCTOR));
        const negative = await gradeUseCases.create({ studentId: "s1", value: -1 }, authContext(Role.INSTRUCTOR));

        expect(tooHigh).toEqual({ kind: "grade_out_of_range" });
        expect(negative).toEqual({ kind: "grade_out_of_range" });
    });

    it("renvoie not_found si l'étudiant n'existe pas", async () => {
        const { gradeUseCases } = buildGradeUseCases();
        const result = await gradeUseCases.create({ studentId: "inconnu", value: 15 }, authContext(Role.INSTRUCTOR));
        expect(result).toEqual({ kind: "not_found" });
    });

    it("crée la note non verrouillée et notifie l'étudiant (cas nominal)", async () => {
        const { gradeUseCases, students, sentNotifications } = buildGradeUseCases();
        students.set("s1", { id: "s1", userId: "u1", programId: "prog1" });

        const result = await gradeUseCases.create(
            { studentId: "s1", value: 16 },
            authContext(Role.INSTRUCTOR, "instr-1"),
        );

        expect(result.kind).toBe("grade_created");
        if (result.kind !== "grade_created") return;
        expect(result.grade.isLocked).toBe(false);
        expect(result.grade.enteredBy).toBe("instr-1");

        expect(sentNotifications).toHaveLength(1);
        expect(sentNotifications[0]).toMatchObject({ userId: "u1", type: "GRADE_PUBLISHED" });
    });
});

describe("GradeUseCases.update", () => {
    it("refuse la mise à jour pour un étudiant", async () => {
        const { gradeUseCases } = buildGradeUseCases();
        const result = await gradeUseCases.update("g1", { value: 10 }, authContext(Role.STUDENT));
        expect(result).toEqual({ kind: "forbidden" });
    });

    it("renvoie not_found si la note n'existe pas", async () => {
        const { gradeUseCases } = buildGradeUseCases();
        const result = await gradeUseCases.update("inconnue", { value: 10 }, authContext(Role.INSTRUCTOR));
        expect(result).toEqual({ kind: "not_found" });
    });

    it("refuse la modification d'une note gelée", async () => {
        const { gradeUseCases, grades } = buildGradeUseCases();
        grades.set("g1", {
            id: "g1",
            studentId: "s1",
            value: 10,
            isRetake: false,
            isLocked: true,
            enteredAt: new Date(),
            enteredBy: "instr-1",
        });

        const result = await gradeUseCases.update("g1", { value: 12 }, authContext(Role.INSTRUCTOR, "instr-1"));

        expect(result).toEqual({ kind: "grade_is_locked" });
    });

    it("refuse une nouvelle valeur hors intervalle", async () => {
        const { gradeUseCases, grades } = buildGradeUseCases();
        grades.set("g1", {
            id: "g1",
            studentId: "s1",
            value: 10,
            isRetake: false,
            isLocked: false,
            enteredAt: new Date(),
            enteredBy: "instr-1",
        });

        const result = await gradeUseCases.update("g1", { value: 21 }, authContext(Role.INSTRUCTOR, "instr-1"));

        expect(result).toEqual({ kind: "grade_out_of_range" });
    });

    it("met à jour la valeur d'une note non verrouillée (cas nominal)", async () => {
        const { gradeUseCases, grades } = buildGradeUseCases();
        grades.set("g1", {
            id: "g1",
            studentId: "s1",
            value: 10,
            isRetake: false,
            isLocked: false,
            enteredAt: new Date(),
            enteredBy: "instr-1",
        });

        const result = await gradeUseCases.update("g1", { value: 18 }, authContext(Role.INSTRUCTOR, "instr-1"));

        expect(result).toEqual({ kind: "grade_updated", grade: expect.objectContaining({ value: 18 }) });
        expect(grades.get("g1")?.value).toBe(18);
    });
});

describe("GradeUseCases.lock / unlock", () => {
    const seedGrade = (grades: Map<string, import("@domain/grade/grade.entity").Grade>, isLocked: boolean) =>
        grades.set("g1", {
            id: "g1",
            studentId: "s1",
            value: 10,
            isRetake: false,
            isLocked,
            enteredAt: new Date(),
            enteredBy: "instr-1",
        });

    it("refuse le gel/dégel pour un intervenant (réservé admin/super admin)", async () => {
        const { gradeUseCases, grades } = buildGradeUseCases();
        seedGrade(grades, false);

        const lockResult = await gradeUseCases.lock("g1", authContext(Role.INSTRUCTOR));
        const unlockResult = await gradeUseCases.unlock("g1", authContext(Role.INSTRUCTOR));

        expect(lockResult).toEqual({ kind: "forbidden" });
        expect(unlockResult).toEqual({ kind: "forbidden" });
    });

    it("renvoie not_found si la note à geler n'existe pas", async () => {
        const { gradeUseCases } = buildGradeUseCases();
        const result = await gradeUseCases.lock("inconnue", authContext(Role.ADMIN));
        expect(result).toEqual({ kind: "not_found" });
    });

    it("un admin peut geler une note", async () => {
        const { gradeUseCases, grades } = buildGradeUseCases();
        seedGrade(grades, false);

        const result = await gradeUseCases.lock("g1", authContext(Role.ADMIN));

        expect(result.kind).toBe("grade_locked_ok");
        expect(grades.get("g1")?.isLocked).toBe(true);
    });

    it("un admin peut dégeler une note", async () => {
        const { gradeUseCases, grades } = buildGradeUseCases();
        seedGrade(grades, true);

        const result = await gradeUseCases.unlock("g1", authContext(Role.ADMIN));

        expect(result.kind).toBe("grade_locked_ok");
        expect(grades.get("g1")?.isLocked).toBe(false);
    });
});
