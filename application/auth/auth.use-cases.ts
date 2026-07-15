import { randomUUID } from "node:crypto";
import {
    isLocked,
    isStrongPassword,
    LOCK_DURATION_MS,
    MAX_FAILED_ATTEMPTS,
    needsPasswordReset,
    PASSWORD_MAX_AGE_DAYS,
} from "@domain/auth/security-policy";
import { type User } from "@domain/auth/user.entity";
import { Role } from "@domain/auth/user.enums";
import { type Student } from "@domain/student/student.entity";
import { type AdminRepository } from "@application/admin/admin.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type ProgramRepository } from "@application/program/program.repository";
import { type FileRepository } from "@application/file/file.repository";
import { type MessageRepository } from "@application/message/message.repository";
import { type MessageReadRepository } from "@application/message/message-read/message-read.repository";
import { type AuditLogRepository } from "@application/audit-log/audit-log.repository";
import { type PasswordHasher } from "@application/auth/password-hasher.port";
import { type TokenProvider } from "@application/auth/token-provider.port";
import { type TotpProvider } from "@application/auth/totp-provider.port";
import { type UserRepository } from "@application/auth/user.repository";
import { type TwoFactorSessionRepository } from "@application/auth/two-factor-session.repository";
import { type PasswordResetTokenRepository } from "@application/auth/password-reset-token.repository";
import { type EmailSender } from "@application/auth/email-sender.port";
import { type AuthContext } from "@application/types/auth-context";
import { Forbidden } from "@application/types/results";

const MAX_2FA_ATTEMPTS = 5;
const TWO_FACTOR_SESSION_EXPIRY_MS = 5 * 60 * 1000;
const PASSWORD_RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
// Une invitation doit survivre à un week-end — TTL volontairement plus long que le reset (1 h)
const INVITATION_TOKEN_EXPIRY_MS = 72 * 60 * 60 * 1000;

type RoleKey = keyof typeof Role;

type AuthUserView = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    role: RoleKey;
};

type AuthenticatedResult = {
    kind: "authenticated";
    token: string;
    user: AuthUserView;
};

export type SignupResult =
    | { kind: "missing_gdpr_consent" }
    | { kind: "weak_password" }
    | { kind: "user_already_exists" }
    | {
          kind: "user_created";
          user: { id: string; email: string };
          twoFactor?: {
              secret: string;
              provisioningUri: string;
          };
      };

export type LoginResult =
    | { kind: "invalid_credentials" }
    | { kind: "pending_role_assignment" }
    | { kind: "account_locked"; lockedUntil: Date | null }
    | { kind: "password_expired"; passwordResetRequired: true }
    | { kind: "super_admin_2fa_required"; setup2FARequired: true; setupSessionToken: string }
    | { kind: "two_factor_required"; tempSessionToken: string }
    | AuthenticatedResult;

export type Verify2faResult =
    | { kind: "invalid_2fa_session" }
    | { kind: "invalid_totp_code" }
    | AuthenticatedResult;

export type ResetPasswordResult =
    | { kind: "weak_password" }
    | { kind: "user_not_found" }
    | { kind: "invalid_old_password" }
    | { kind: "invalid_or_expired_token" }
    | { kind: "missing_gdpr_consent" }
    | { kind: "password_updated" };

export type InviteStudentResult =
    | Forbidden
    | { kind: "user_already_exists" }
    | { kind: "program_not_found" }
    | { kind: "student_invited"; user: { id: string; email: string } };

export type RequestPasswordResetResult = { kind: "reset_email_sent" };

export type GetMeResult =
    | { kind: "user_not_found" }
    | {
          kind: "user_found";
          user: AuthUserView & {
              passwordExpiresInDays: number;
              twoFactorEnabled: boolean;
          };
      };

export type GetPublicProfileResult =
    | { kind: "user_not_found" }
    | { kind: "user_found"; user: { id: string; firstname: string; lastname: string } };

export type ListUsersResult =
    | Forbidden
    | {
          kind: "users_listed";
          users: Array<{
              id: string;
              firstname: string;
              lastname: string;
              email: string;
              failedAttempts: number;
              lockedUntil: Date | null;
              passwordExpired: boolean;
              twoFactorEnabled: boolean;
          }>;
      };

export type GdprExportResult =
    | { kind: "user_not_found" }
    | {
          kind: "data_exported";
          data: { id: string; firstname: string; lastname: string; email: string; gdprConsentAt: Date | null; createdAt: Date; lastLoginAt: Date | null };
      };

export type DeleteAccountResult =
    | Forbidden
    | { kind: "user_not_found" }
    | { kind: "user_has_active_role" }
    | { kind: "user_has_files" }
    | { kind: "user_has_messages" }
    | { kind: "user_has_message_reads" }
    | { kind: "user_has_audit_logs" }
    | { kind: "account_deleted" };

export type Enable2faResult =
    | { kind: "unauthorized" }
    | { kind: "invalid_session" }
    | { kind: "already_enabled" }
    | { kind: "invalid_totp_code" }
    | { kind: "setup_initiated"; totpSecret: string; totpProvisioningUri: string }
    | { kind: "two_factor_enabled" };

export class AuthUseCases {
    constructor(
        private readonly users: UserRepository,
        private readonly admins: AdminRepository,
        private readonly students: StudentRepository,
        private readonly instructors: InstructorRepository,
        private readonly programs: ProgramRepository,
        private readonly files: FileRepository,
        private readonly messages: MessageRepository,
        private readonly messageReads: MessageReadRepository,
        private readonly auditLogs: AuditLogRepository,
        private readonly hasher: PasswordHasher,
        private readonly tokens: TokenProvider,
        private readonly totp: TotpProvider,
        private readonly twoFactorSessions: TwoFactorSessionRepository,
        private readonly passwordResetTokens: PasswordResetTokenRepository,
        private readonly emailSender: EmailSender,
        private readonly frontendPublicUrl: string,
    ) {}

    private async resolveRole(userId: string): Promise<Role | undefined> {
        const admin = await this.admins.findByUserId(userId);
        if (admin) return admin.role;
        const student = await this.students.findByUserId(userId);
        if (student) return Role.STUDENT;
        const instructor = await this.instructors.findByUserId(userId);
        if (instructor) return Role.INSTRUCTOR;
        return undefined;
    }

    async signup(input: {
        firstname: string;
        lastname: string;
        email: string;
        password: string;
        enable2FA?: boolean;
        gdprConsent?: boolean;
    }): Promise<SignupResult> {
        const { firstname, lastname, email, password, enable2FA = false, gdprConsent = false } = input;
        if (!gdprConsent) return { kind: "missing_gdpr_consent" };
        if (!isStrongPassword(password)) return { kind: "weak_password" };
        if (await this.users.findByEmail(email.toLowerCase())) return { kind: "user_already_exists" };

        const twoFactorSecret = enable2FA ? this.totp.generateSecret(email.toLowerCase()) : null;
        const user: User = {
            id: randomUUID(),
            firstname,
            lastname,
            email: email.toLowerCase(),
            passwordHash: await this.hasher.hash(password),
            failedAttempts: 0,
            lockedUntil: null,
            passwordUpdatedAt: new Date(),

            twoFactorEnabled: false,
            twoFactorSecret,
            gdprConsentAt: new Date(),
            createdAt: new Date(),
            lastLoginAt: null,
        };
        await this.users.save(user);

        const result: SignupResult = {
            kind: "user_created",
            user: { id: user.id, email: user.email },
        };
        if (user.twoFactorSecret) {
            result.twoFactor = {
                secret: user.twoFactorSecret,
                provisioningUri: this.totp.buildProvisioningUri(user.email, user.twoFactorSecret),
            };
        }
        return result;
    }

    async login(input: { email: string; password: string }): Promise<LoginResult> {
        const { email, password } = input;
        const user = await this.users.findByEmail(email.toLowerCase());
        if (!user) return { kind: "invalid_credentials" };
        if (isLocked(user)) return { kind: "account_locked", lockedUntil: user.lockedUntil };

        const validPassword = await this.hasher.verify(user.passwordHash, password);
        if (!validPassword) {
            user.failedAttempts += 1;
            if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
                user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
                user.failedAttempts = 0;
            }
            await this.users.save(user);
            return { kind: "invalid_credentials" };
        }

        user.failedAttempts = 0;
        user.lockedUntil = null;
        await this.users.save(user);

        const role = await this.resolveRole(user.id);
        if (!role) return { kind: "pending_role_assignment" };

        if (needsPasswordReset(user.passwordUpdatedAt))
            return { kind: "password_expired", passwordResetRequired: true };
        if (role === Role.SUPER_ADMIN && !user.twoFactorEnabled) {
            const session = await this.twoFactorSessions.create(user.id);
            return {
                kind: "super_admin_2fa_required",
                setup2FARequired: true,
                setupSessionToken: session.token,
            };
        }
        if (user.twoFactorEnabled) {
            const session = await this.twoFactorSessions.create(user.id);
            return { kind: "two_factor_required", tempSessionToken: session.token };
        }

        user.lastLoginAt = new Date();
        await this.users.save(user);
        return this.authenticated(user, role);
    }

    async verify2fa(input: { tempSessionToken: string; code: string }): Promise<Verify2faResult> {
        const { tempSessionToken, code } = input;
        const notBefore = new Date(Date.now() - TWO_FACTOR_SESSION_EXPIRY_MS);
        const session = await this.twoFactorSessions.find(tempSessionToken, notBefore);
        if (!session) return { kind: "invalid_2fa_session" };
        if (session.attempts >= MAX_2FA_ATTEMPTS) {
            await this.twoFactorSessions.delete(tempSessionToken);
            return { kind: "invalid_2fa_session" };
        }
        const user = await this.users.findById(session.userId);
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) return { kind: "invalid_2fa_session" };
        if (!this.totp.verify(user.twoFactorSecret, code)) {
            await this.twoFactorSessions.incrementAttempts(tempSessionToken);
            return { kind: "invalid_totp_code" };
        }
        await this.twoFactorSessions.delete(tempSessionToken);
        const role = await this.resolveRole(user.id);
        if (!role) return { kind: "invalid_2fa_session" };
        user.lastLoginAt = new Date();
        await this.users.save(user);
        return this.authenticated(user, role);
    }

    async resetWithCredentials(input: {
        email: string;
        oldPassword: string;
        newPassword: string;
    }): Promise<ResetPasswordResult> {
        const { email, oldPassword, newPassword } = input;
        if (!isStrongPassword(newPassword)) return { kind: "weak_password" };
        const user = await this.users.findByEmail(email.toLowerCase());
        if (!user) return { kind: "user_not_found" };
        if (!(await this.hasher.verify(user.passwordHash, oldPassword))) return { kind: "invalid_old_password" };
        return this.applyPasswordUpdate(user, newPassword);
    }

    async requestPasswordReset(input: { email: string }): Promise<RequestPasswordResetResult> {
        const user = await this.users.findByEmail(input.email.toLowerCase());
        if (user) {
            await this.passwordResetTokens.deleteByUserId(user.id);
            const resetToken = await this.passwordResetTokens.create(user.id, "reset");
            const resetUrl = `${this.frontendPublicUrl}/reset-password?token=${encodeURIComponent(resetToken.token)}`;
            await this.emailSender.sendPasswordResetEmail({ to: user.email, resetUrl });
        }

        return { kind: "reset_email_sent" };
    }

    async resetWithToken(input: { token: string; newPassword: string; gdprConsent?: boolean }): Promise<ResetPasswordResult> {
        const { token, newPassword, gdprConsent = false } = input;
        if (!isStrongPassword(newPassword)) return { kind: "weak_password" };

        const resetToken = await this.passwordResetTokens.find(token);
        if (!resetToken) return { kind: "invalid_or_expired_token" };
        const expiryMs = resetToken.purpose === "invitation" ? INVITATION_TOKEN_EXPIRY_MS : PASSWORD_RESET_TOKEN_EXPIRY_MS;
        if (resetToken.createdAt.getTime() < Date.now() - expiryMs) return { kind: "invalid_or_expired_token" };

        const user = await this.users.findById(resetToken.userId);
        if (!user) return { kind: "invalid_or_expired_token" };

        // Compte créé par invitation : l'admin n'a pas pu consentir à la place de l'étudiant,
        // le consentement RGPD est recueilli ici, au moment où il active son compte.
        if (user.gdprConsentAt === null) {
            if (!gdprConsent) return { kind: "missing_gdpr_consent" };
            user.gdprConsentAt = new Date();
        }

        await this.applyPasswordUpdate(user, newPassword);
        await this.passwordResetTokens.delete(resetToken.token);
        return { kind: "password_updated" };
    }

    async inviteStudent(
        input: { firstname: string; lastname: string; email: string; programId: string },
        auth: AuthContext,
    ): Promise<InviteStudentResult> {
        if (!auth.isAdmin) return Forbidden;
        const email = input.email.toLowerCase();
        if (await this.users.findByEmail(email)) return { kind: "user_already_exists" };
        if (!(await this.programs.findById(input.programId))) return { kind: "program_not_found" };

        const user: User = {
            id: randomUUID(),
            firstname: input.firstname,
            lastname: input.lastname,
            email,
            // Hash d'un aléa jamais communiqué : la connexion est impossible tant que
            // l'étudiant n'a pas défini son propre mot de passe via le lien d'invitation.
            passwordHash: await this.hasher.hash(randomUUID()),
            failedAttempts: 0,
            lockedUntil: null,
            passwordUpdatedAt: new Date(),
            twoFactorEnabled: false,
            twoFactorSecret: null,
            gdprConsentAt: null,
            createdAt: new Date(),
            lastLoginAt: null,
        };
        await this.users.save(user);

        const student: Student = { id: randomUUID(), userId: user.id, programId: input.programId };
        await this.students.save(student);

        const inviteToken = await this.passwordResetTokens.create(user.id, "invitation");
        const inviteUrl = `${this.frontendPublicUrl}/reset-password?token=${encodeURIComponent(inviteToken.token)}&invitation=1`;
        await this.emailSender.sendInvitationEmail({ to: user.email, firstname: user.firstname, inviteUrl });

        return { kind: "student_invited", user: { id: user.id, email: user.email } };
    }

    private async applyPasswordUpdate(user: User, newPassword: string): Promise<ResetPasswordResult> {
        user.passwordHash = await this.hasher.hash(newPassword);
        user.passwordUpdatedAt = new Date();
        user.failedAttempts = 0;
        user.lockedUntil = null;
        await this.users.save(user);
        return { kind: "password_updated" };
    }

    async getMe(userId: string): Promise<GetMeResult> {
        const user = await this.users.findById(userId);
        if (!user) return { kind: "user_not_found" };
        const role = await this.resolveRole(userId);
        if (!role) return { kind: "user_not_found" };
        return {
            kind: "user_found",
            user: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                role: this.roleToKey(role),
                passwordExpiresInDays: Math.max(
                    0,
                    PASSWORD_MAX_AGE_DAYS -
                        Math.floor((Date.now() - user.passwordUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)),
                ),
                twoFactorEnabled: user.twoFactorEnabled,
            },
        };
    }

    /**
     * Profil public minimal (nom/prénom uniquement, aucune donnée sensible) — accessible à tout
     * utilisateur authentifié, pour résoudre l'affichage "qui est-ce" (ex: liste d'étudiants,
     * messagerie) sans exposer email/rôle/mot de passe. Voir CLAUDE.md section 10.
     */
    async findPublicProfile(id: string): Promise<GetPublicProfileResult> {
        const user = await this.users.findById(id);
        if (!user) return { kind: "user_not_found" };
        return { kind: "user_found", user: { id: user.id, firstname: user.firstname, lastname: user.lastname } };
    }

    async resetAuthenticatedPassword(input: {
        userId: string;
        oldPassword: string;
        newPassword: string;
    }): Promise<ResetPasswordResult> {
        const { userId, oldPassword, newPassword } = input;
        if (!isStrongPassword(newPassword)) return { kind: "weak_password" };
        const user = await this.users.findById(userId);
        if (!user) return { kind: "user_not_found" };
        if (!(await this.hasher.verify(user.passwordHash, oldPassword))) return { kind: "invalid_old_password" };
        return this.applyPasswordUpdate(user, newPassword);
    }

    async listUsersForAdmin(auth: AuthContext): Promise<ListUsersResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const users = await this.users.list();
        return {
            kind: "users_listed",
            users: users.map((user) => ({
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                failedAttempts: user.failedAttempts,
                lockedUntil: user.lockedUntil,
                passwordExpired: needsPasswordReset(user.passwordUpdatedAt),
                twoFactorEnabled: user.twoFactorEnabled,
            })),
        };
    }

    async exportGdprData(userId: string): Promise<GdprExportResult> {
        const user = await this.users.findById(userId);
        if (!user) return { kind: "user_not_found" };
        return {
            kind: "data_exported",
            data: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                gdprConsentAt: user.gdprConsentAt,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
            },
        };
    }

    async enable2fa(input: {
        userId?: string;
        setupSessionToken?: string;
        code?: string;
    }): Promise<Enable2faResult> {
        const userId = await this.resolveEnable2faUserId(input.userId, input.setupSessionToken);
        if (!userId) return { kind: "unauthorized" };

        const user = await this.users.findById(userId);
        if (!user) return { kind: "unauthorized" };
        if (user.twoFactorEnabled) return { kind: "already_enabled" };

        if (!input.code) {
            if (!user.twoFactorSecret) {
                user.twoFactorSecret = this.totp.generateSecret(user.email);
                await this.users.save(user);
            }
            return {
                kind: "setup_initiated",
                totpSecret: user.twoFactorSecret,
                totpProvisioningUri: this.totp.buildProvisioningUri(user.email, user.twoFactorSecret),
            };
        }

        if (!user.twoFactorSecret) return { kind: "invalid_session" };
        if (!this.totp.verify(user.twoFactorSecret, input.code)) return { kind: "invalid_totp_code" };

        user.twoFactorEnabled = true;
        await this.users.save(user);
        if (input.setupSessionToken) await this.twoFactorSessions.delete(input.setupSessionToken);
        return { kind: "two_factor_enabled" };
    }

    private async resolveEnable2faUserId(
        userId?: string,
        setupSessionToken?: string,
    ): Promise<string | undefined> {
        if (userId) return userId;
        if (!setupSessionToken) return undefined;
        const notBefore = new Date(Date.now() - TWO_FACTOR_SESSION_EXPIRY_MS);
        const session = await this.twoFactorSessions.find(setupSessionToken, notBefore);
        return session?.userId;
    }

    async cleanupExpiredSessions(): Promise<void> {
        const twoFactorCutoff = new Date(Date.now() - TWO_FACTOR_SESSION_EXPIRY_MS);
        await this.twoFactorSessions.deleteOlderThan(twoFactorCutoff);
        await this.passwordResetTokens.deleteOlderThan(new Date(Date.now() - PASSWORD_RESET_TOKEN_EXPIRY_MS), "reset");
        await this.passwordResetTokens.deleteOlderThan(new Date(Date.now() - INVITATION_TOKEN_EXPIRY_MS), "invitation");
    }

    async deleteAccount(userId: string, auth: AuthContext): Promise<DeleteAccountResult> {
        const isSelf = auth.requesterId === userId;
        if (!isSelf && !auth.isSuperAdmin) return Forbidden;
        const user = await this.users.findById(userId);
        if (!user) return { kind: "user_not_found" };
        if (await this.resolveRole(userId)) return { kind: "user_has_active_role" };
        if (await this.files.existsByUploadedBy(userId)) return { kind: "user_has_files" };
        if (await this.messages.existsBySenderId(userId)) return { kind: "user_has_messages" };
        if (await this.messageReads.existsByUserId(userId)) return { kind: "user_has_message_reads" };
        if (await this.auditLogs.existsByUserId(userId)) return { kind: "user_has_audit_logs" };
        await this.users.deleteById(user.id);
        return { kind: "account_deleted" };
    }

    private roleToKey(role: Role): RoleKey {
        return (Object.keys(Role) as RoleKey[]).find((k) => Role[k] === role)!;
    }

    private authenticated(user: User, role: Role): AuthenticatedResult {
        return {
            kind: "authenticated",
            token: this.tokens.issue(user, role),
            user: { id: user.id, firstname: user.firstname, lastname: user.lastname, email: user.email, role: this.roleToKey(role) },
        };
    }
}
