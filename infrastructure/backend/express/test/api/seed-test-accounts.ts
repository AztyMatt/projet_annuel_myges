import { randomUUID } from "node:crypto";
import speakeasy from "speakeasy";
import { type User } from "@domain/auth/user.entity";
import { type Admin } from "@domain/admin/admin.entity";
import { AdminRole } from "@domain/admin/admin.enums";
import { type Instructor } from "@domain/instructor/instructor.entity";
import { InstructorContractType } from "@domain/instructor/instructor.enums";
import { type Student } from "@domain/student/student.entity";
import { type AcademicYear } from "@domain/academic-year/academic-year.entity";
import { type Period } from "@domain/period/period.entity";
import { type Program } from "@domain/program/program.entity";
import { userRepository } from "@express/src/postgres/auth/user.adapter";
import { adminRepository } from "@express/src/postgres/admin/admin.adapter";
import { instructorRepository } from "@express/src/postgres/instructor/instructor.adapter";
import { studentRepository } from "@express/src/postgres/student/student.adapter";
import { academicYearRepository } from "@express/src/postgres/academic-year/academic-year.adapter";
import { periodRepository } from "@express/src/postgres/period/period.adapter";
import { programRepository } from "@express/src/postgres/program/program.adapter";
import { passwordHasher } from "@express/src/auth/password-hasher.adapter";

// Mot de passe partagé par tous les comptes de test API — respecte la politique de mot de
// passe fort (12+ car., maj./min./chiffre/symbole) pour ne jamais être bloqué par isStrongPassword.
export const TEST_ACCOUNT_PASSWORD = "MotDePasseTest1234$";

async function createBaseUser(overrides: Partial<User> = {}): Promise<User> {
    const user: User = {
        id: randomUUID(),
        firstname: "Test",
        lastname: "Compte",
        email: `test-${randomUUID()}@myges-test.fr`,
        passwordHash: await passwordHasher.hash(TEST_ACCOUNT_PASSWORD),
        failedAttempts: 0,
        lockedUntil: null,
        passwordUpdatedAt: new Date(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        gdprConsentAt: new Date(),
        createdAt: new Date(),
        lastLoginAt: null,
        ...overrides,
    };
    await userRepository.save(user);
    return user;
}

export async function createTestAdmin(role: AdminRole = AdminRole.ADMIN): Promise<{ user: User; admin: Admin }> {
    const user = await createBaseUser();
    const admin: Admin = { id: randomUUID(), userId: user.id, role };
    await adminRepository.save(admin);
    return { user, admin };
}

/** SUPER_ADMIN avec la 2FA déjà activée (obligatoire côté login) — le secret est renvoyé pour générer un code TOTP valide dans les tests. */
export async function createTestSuperAdmin(): Promise<{ user: User; admin: Admin; totpSecret: string }> {
    const totpSecret = speakeasy.generateSecret({ name: "MyGES (test)" }).base32;
    const user = await createBaseUser({ twoFactorEnabled: true, twoFactorSecret: totpSecret });
    const admin: Admin = { id: randomUUID(), userId: user.id, role: AdminRole.SUPER_ADMIN };
    await adminRepository.save(admin);
    return { user, admin, totpSecret };
}

export function generateTotpCode(secret: string): string {
    return speakeasy.totp({ secret, encoding: "base32" });
}

export async function createTestInstructor(): Promise<{ user: User; instructor: Instructor }> {
    const user = await createBaseUser();
    const instructor: Instructor = {
        id: randomUUID(),
        userId: user.id,
        contractType: InstructorContractType.PERMANENT,
        specialties: null,
    };
    await instructorRepository.save(instructor);
    return { user, instructor };
}

let cachedProgramId: string | undefined;

// ⚠️ Suppose que resetTestDatabase() n'est appelé qu'une fois par fichier de test (beforeAll),
// jamais entre deux appels à createTestStudent() dans le même fichier — sinon ce cache pointerait
// vers une ligne "program" déjà supprimée par le TRUNCATE suivant (violation de FK à l'insertion).

/** Programme réutilisé par tous les comptes étudiant de test — créé une seule fois par run (academicYear -> period -> program). */
async function getOrCreateTestProgram(): Promise<string> {
    if (cachedProgramId) return cachedProgramId;

    const academicYear: AcademicYear = {
        id: randomUUID(),
        startDate: new Date("2026-09-01"),
        endDate: new Date("2027-08-31"),
        isCurrent: false,
    };
    await academicYearRepository.save(academicYear);

    const period: Period = {
        id: randomUUID(),
        order: 1,
        startDate: academicYear.startDate,
        endDate: academicYear.endDate,
        academicYearId: academicYear.id,
    };
    await periodRepository.save(period);

    const program: Program = {
        id: randomUUID(),
        name: "Programme de test",
        code: `TEST-${randomUUID().slice(0, 8)}`,
        periodId: period.id,
    };
    await programRepository.save(program);

    cachedProgramId = program.id;
    return program.id;
}

export async function createTestStudent(): Promise<{ user: User; student: Student }> {
    const programId = await getOrCreateTestProgram();
    const user = await createBaseUser();
    const student: Student = { id: randomUUID(), userId: user.id, programId };
    await studentRepository.save(student);
    return { user, student };
}

/** Compte sans aucun rôle (student/instructor/admin) — reproduit l'état "pending_role_assignment". */
export async function createTestUserWithoutRole(): Promise<{ user: User }> {
    return { user: await createBaseUser() };
}
