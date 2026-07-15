// Doubles de test en mémoire pour AuthUseCases — permettent de tester les règles métier
// (login, verrouillage, reset, invitation) sans toucher une vraie base de données.
// Fichier volontairement non suffixé ".test.ts" pour que Vitest ne le traite pas comme
// une suite de tests (il ne contient aucun `describe`/`it`).
import { type User } from "@domain/auth/user.entity";
import { type Admin } from "@domain/admin/admin.entity";
import { type Student } from "@domain/student/student.entity";
import { type Instructor } from "@domain/instructor/instructor.entity";
import { type Program } from "@domain/program/program.entity";
import { type Role } from "@domain/auth/user.enums";
import { type TwoFactorSession } from "@domain/auth/two-factor-session.entity";
import { type PasswordResetToken, type PasswordResetTokenPurpose } from "@domain/auth/password-reset-token.entity";
import { type UserRepository } from "@application/auth/user.repository";
import { type AdminRepository } from "@application/admin/admin.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type ProgramRepository } from "@application/program/program.repository";
import { type FileRepository } from "@application/file/file.repository";
import { type MessageRepository } from "@application/message/message.repository";
import { type MessageReadRepository } from "@application/message/message-read/message-read.repository";
import { type AuditLogRepository } from "@application/audit-log/audit-log.repository";
import { type PasswordHasher } from "@application/auth/password-hasher.port";
import { type TokenProvider } from "@application/auth/token-provider.port";
import { type TotpProvider } from "@application/auth/totp-provider.port";
import { type TwoFactorSessionRepository } from "@application/auth/two-factor-session.repository";
import { type PasswordResetTokenRepository } from "@application/auth/password-reset-token.repository";
import { type EmailSender } from "@application/auth/email-sender.port";
import { AuthUseCases } from "@application/auth/auth.use-cases";

const notImplemented = (method: string) => (): never => {
    throw new Error(`fake non branché sur cette méthode: ${method} (pas utilisée par les tests actuels)`);
};

export function createFakeUserRepository() {
    const users = new Map<string, User>();
    const repo: UserRepository = {
        async findByEmail(email) {
            return [...users.values()].find((u) => u.email === email);
        },
        async findById(id) {
            return users.get(id);
        },
        async save(user) {
            users.set(user.id, { ...user });
        },
        async deleteById(id) {
            users.delete(id);
        },
        async list() {
            return [...users.values()];
        },
    };
    return { repo, users };
}

export function createFakeAdminRepository() {
    const admins = new Map<string, Admin>();
    const repo: AdminRepository = {
        findById: notImplemented("findById"),
        async findByUserId(userId) {
            return [...admins.values()].find((a) => a.userId === userId);
        },
        async save(admin) {
            admins.set(admin.id, admin);
        },
        deleteById: notImplemented("deleteById"),
        list: notImplemented("list"),
    };
    return { repo, admins };
}

export function createFakeStudentRepository() {
    const students = new Map<string, Student>();
    const repo: StudentRepository = {
        async findById(id) {
            return students.get(id);
        },
        async findByUserId(userId) {
            return [...students.values()].find((s) => s.userId === userId);
        },
        findByProgramId: notImplemented("findByProgramId"),
        existsByProgramId: notImplemented("existsByProgramId"),
        findUserIdsByGroupIds: notImplemented("findUserIdsByGroupIds"),
        async save(student) {
            students.set(student.id, student);
        },
        deleteById: notImplemented("deleteById"),
        list: notImplemented("list"),
    };
    return { repo, students };
}

export function createFakeInstructorRepository() {
    const instructors = new Map<string, Instructor>();
    const repo: InstructorRepository = {
        findById: notImplemented("findById"),
        async findByUserId(userId) {
            return [...instructors.values()].find((i) => i.userId === userId);
        },
        async save(instructor) {
            instructors.set(instructor.id, instructor);
        },
        deleteById: notImplemented("deleteById"),
        list: notImplemented("list"),
    };
    return { repo, instructors };
}

export function createFakeProgramRepository() {
    const programs = new Map<string, Program>();
    const repo: ProgramRepository = {
        async findById(id) {
            return programs.get(id);
        },
        findByPeriodId: notImplemented("findByPeriodId"),
        existsByPeriodId: notImplemented("existsByPeriodId"),
        findByNameAndCode: notImplemented("findByNameAndCode"),
        async save(program) {
            programs.set(program.id, program);
        },
        deleteById: notImplemented("deleteById"),
        list: notImplemented("list"),
    };
    return { repo, programs };
}

// Ces trois repositories ne servent qu'aux garde-fous de deleteAccount (existsBy...) —
// pas testés dans ce fichier (couverts par les tests API de l'étape 5), donc "toujours vide".
export function createFakeFileRepository(): FileRepository {
    return {
        findById: notImplemented("findById"),
        findByUploadedBy: notImplemented("findByUploadedBy"),
        async existsByUploadedBy() {
            return false;
        },
        save: notImplemented("save"),
        deleteById: notImplemented("deleteById"),
        deleteByIds: notImplemented("deleteByIds"),
        list: notImplemented("list"),
    };
}

export function createFakeMessageRepository(): MessageRepository {
    return {
        findById: notImplemented("findById"),
        findByConversationId: notImplemented("findByConversationId"),
        findBySenderId: notImplemented("findBySenderId"),
        async existsBySenderId() {
            return false;
        },
        save: notImplemented("save"),
        deleteById: notImplemented("deleteById"),
    };
}

export function createFakeMessageReadRepository(): MessageReadRepository {
    return {
        findByMessageIdAndUserId: notImplemented("findByMessageIdAndUserId"),
        findByMessageId: notImplemented("findByMessageId"),
        findByUserId: notImplemented("findByUserId"),
        async existsByUserId() {
            return false;
        },
        save: notImplemented("save"),
        deleteByMessageIdAndUserId: notImplemented("deleteByMessageIdAndUserId"),
    };
}

export function createFakeAuditLogRepository(): AuditLogRepository {
    return {
        findById: notImplemented("findById"),
        findByUserId: notImplemented("findByUserId"),
        async existsByUserId() {
            return false;
        },
        findByEntityId: notImplemented("findByEntityId"),
        findByAction: notImplemented("findByAction"),
        save: notImplemented("save"),
        deleteById: notImplemented("deleteById"),
        list: notImplemented("list"),
    };
}

// Hasher réversible et rapide (pas de vrai Argon2) : suffit à tester les règles métier,
// la robustesse cryptographique réelle n'est pas ce que ces tests vérifient.
export function createFakePasswordHasher(): PasswordHasher {
    return {
        async hash(value) {
            return `hashed:${value}`;
        },
        async verify(hash, raw) {
            return hash === `hashed:${raw}`;
        },
    };
}

export function createFakeTokenProvider(): TokenProvider {
    return {
        issue(user, role) {
            return `token:${user.id}:${role}`;
        },
        verify(token) {
            const [, sub, role] = token.split(":");
            return { sub, role: role as Role, email: "" };
        },
    };
}

// TOTP déterministe : le code "123456" est toujours accepté, tout le reste est refusé —
// évite de dépendre de la vraie horloge/algorithme TOTP dans les tests.
export function createFakeTotpProvider(): TotpProvider {
    return {
        generateSecret(email) {
            return `secret:${email}`;
        },
        verify(_secret, code) {
            return code === "123456";
        },
        buildProvisioningUri(email, secret) {
            return `otpauth://totp/${email}?secret=${secret}`;
        },
    };
}

export function createFakeTwoFactorSessionRepository() {
    const sessions = new Map<string, TwoFactorSession>();
    let counter = 0;
    const repo: TwoFactorSessionRepository = {
        async create(userId) {
            const session: TwoFactorSession = { token: `2fa-token-${++counter}`, userId, attempts: 0, createdAt: new Date() };
            sessions.set(session.token, session);
            return session;
        },
        async find(token, notBefore) {
            const session = sessions.get(token);
            if (!session || session.createdAt < notBefore) return undefined;
            return session;
        },
        async incrementAttempts(token) {
            const session = sessions.get(token);
            if (session) session.attempts += 1;
        },
        async delete(token) {
            sessions.delete(token);
        },
        async deleteOlderThan(cutoff) {
            for (const [token, session] of sessions) if (session.createdAt < cutoff) sessions.delete(token);
        },
    };
    return { repo, sessions };
}

export function createFakePasswordResetTokenRepository() {
    const tokens = new Map<string, PasswordResetToken>();
    let counter = 0;
    const repo: PasswordResetTokenRepository = {
        async create(userId, purpose) {
            const token: PasswordResetToken = { token: `reset-token-${++counter}`, userId, purpose, createdAt: new Date() };
            tokens.set(token.token, token);
            return token;
        },
        async find(token) {
            return tokens.get(token);
        },
        async delete(token) {
            tokens.delete(token);
        },
        async deleteByUserId(userId) {
            for (const [token, entry] of tokens) if (entry.userId === userId) tokens.delete(token);
        },
        async deleteOlderThan(cutoff, purpose) {
            for (const [token, entry] of tokens) if (entry.purpose === purpose && entry.createdAt < cutoff) tokens.delete(token);
        },
    };
    return { repo, tokens };
}

export function createFakeEmailSender() {
    const sentPasswordResets: Array<{ to: string; resetUrl: string }> = [];
    const sentInvitations: Array<{ to: string; firstname: string; inviteUrl: string }> = [];
    const sender: EmailSender = {
        async sendPasswordResetEmail(input) {
            sentPasswordResets.push(input);
        },
        async sendInvitationEmail(input) {
            sentInvitations.push(input);
        },
    };
    return { sender, sentPasswordResets, sentInvitations };
}

/**
 * Construit un AuthUseCases entièrement fonctionnel avec des doubles en mémoire, et expose
 * chaque store/fake pour que les tests puissent semer des données ou vérifier des effets de
 * bord (ex: `users.users.get(id)`, `emailSender.sentInvitations`).
 */
export function buildAuthUseCases(frontendPublicUrl = "http://localhost:3000") {
    const users = createFakeUserRepository();
    const admins = createFakeAdminRepository();
    const students = createFakeStudentRepository();
    const instructors = createFakeInstructorRepository();
    const programs = createFakeProgramRepository();
    const twoFactorSessions = createFakeTwoFactorSessionRepository();
    const passwordResetTokens = createFakePasswordResetTokenRepository();
    const emailSender = createFakeEmailSender();
    const hasher = createFakePasswordHasher();
    const tokens = createFakeTokenProvider();
    const totp = createFakeTotpProvider();

    const authUseCases = new AuthUseCases(
        users.repo,
        admins.repo,
        students.repo,
        instructors.repo,
        programs.repo,
        createFakeFileRepository(),
        createFakeMessageRepository(),
        createFakeMessageReadRepository(),
        createFakeAuditLogRepository(),
        hasher,
        tokens,
        totp,
        twoFactorSessions.repo,
        passwordResetTokens.repo,
        emailSender.sender,
        frontendPublicUrl,
    );

    return {
        authUseCases,
        users: users.users,
        admins: admins.admins,
        students: students.students,
        instructors: instructors.instructors,
        programs: programs.programs,
        twoFactorSessions: twoFactorSessions.sessions,
        passwordResetTokens: passwordResetTokens.tokens,
        emailSender,
        hasher,
    };
}

export const buildUser = (overrides: Partial<User> = {}): User => ({
    id: overrides.id ?? `user-${Math.random().toString(36).slice(2)}`,
    firstname: "Test",
    lastname: "User",
    email: "test@myges.fr",
    passwordHash: "hashed:MotDePasse1234$",
    failedAttempts: 0,
    lockedUntil: null,
    passwordUpdatedAt: new Date(),
    twoFactorEnabled: false,
    twoFactorSecret: null,
    gdprConsentAt: new Date(),
    createdAt: new Date(),
    lastLoginAt: null,
    ...overrides,
});
