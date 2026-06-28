import { randomUUID } from "node:crypto";
import {
    emailIsValid,
    isLocked,
    isStrongPassword,
    LOCK_DURATION_MS,
    MAX_FAILED_ATTEMPTS,
    needsPasswordReset,
    PASSWORD_MAX_AGE_DAYS,
} from "@domain/auth/security-policy";
import { type User } from "@domain/auth/user.entity";
import { Role } from "@domain/auth/user.enums";
import { type AdminRepository } from "@application/admin/admin.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type PasswordHasher } from "@application/auth/password-hasher.port";
import { type TokenProvider } from "@application/auth/token-provider.port";
import { type TotpProvider } from "@application/auth/totp-provider.port";
import { type UserRepository } from "@application/auth/user.repository";
import { type TwoFactorSessionRepository } from "@application/auth/two-factor-session.repository";

const MAX_2FA_ATTEMPTS = 5;
const TWO_FACTOR_SESSION_EXPIRY_MS = 5 * 60 * 1000;

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
    | { kind: "missing_credentials" }
    | { kind: "invalid_email" }
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
    | { kind: "missing_credentials" }
    | { kind: "invalid_credentials" }
    | { kind: "pending_role_assignment" }
    | { kind: "account_locked"; lockedUntil: Date | null }
    | { kind: "password_expired"; passwordResetRequired: true }
    | { kind: "super_admin_2fa_required"; setup2FARequired: true }
    | { kind: "two_factor_required"; tempSessionToken: string }
    | AuthenticatedResult;

export type Verify2faResult =
    | { kind: "missing_2fa_payload" }
    | { kind: "invalid_2fa_session" }
    | { kind: "invalid_totp_code" }
    | AuthenticatedResult;

export type ResetPasswordResult =
    | { kind: "missing_reset_payload" }
    | { kind: "weak_password" }
    | { kind: "user_not_found" }
    | { kind: "invalid_old_password" }
    | { kind: "password_updated" };

export type GetMeResult =
    | { kind: "user_not_found" }
    | {
          kind: "user_found";
          user: AuthUserView & {
              passwordExpiresInDays: number;
              twoFactorEnabled: boolean;
          };
      };

export type ListUsersResult = {
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
          data: { id: string; firstname: string; lastname: string; email: string; gdprConsentAt: Date; createdAt: Date; lastLoginAt: Date | null };
      };

export type DeleteAccountResult = { kind: "user_not_found" } | { kind: "account_deleted" };

export class AuthUseCases {
    constructor(
        private readonly users: UserRepository,
        private readonly admins: AdminRepository,
        private readonly students: StudentRepository,
        private readonly instructors: InstructorRepository,
        private readonly hasher: PasswordHasher,
        private readonly tokens: TokenProvider,
        private readonly totp: TotpProvider,
        private readonly twoFactorSessions: TwoFactorSessionRepository,
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
        firstname?: string;
        lastname?: string;
        email?: string;
        password?: string;
        enable2FA?: boolean;
        gdprConsent?: boolean;
    }): Promise<SignupResult> {
        const { firstname, lastname, email, password, enable2FA = false, gdprConsent = false } = input;
        if (!firstname || !lastname || !email || !password) return { kind: "missing_credentials" };
        if (!emailIsValid(email)) return { kind: "invalid_email" };
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
            twoFactorEnabled: Boolean(enable2FA),
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
        if (user.twoFactorEnabled && user.twoFactorSecret) {
            result.twoFactor = {
                secret: user.twoFactorSecret,
                provisioningUri: this.totp.buildProvisioningUri(user.email, user.twoFactorSecret),
            };
        }
        return result;
    }

    async login(input: { email?: string; password?: string }): Promise<LoginResult> {
        const { email, password } = input;
        if (!email || !password) return { kind: "missing_credentials" };
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
        if (role === Role.SUPER_ADMIN && !user.twoFactorEnabled)
            return { kind: "super_admin_2fa_required", setup2FARequired: true };
        if (user.twoFactorEnabled) {
            const session = await this.twoFactorSessions.create(user.id);
            return { kind: "two_factor_required", tempSessionToken: session.token };
        }

        user.lastLoginAt = new Date();
        await this.users.save(user);
        return this.authenticated(user, role);
    }

    async verify2fa(input: { tempSessionToken?: string; code?: string }): Promise<Verify2faResult> {
        const { tempSessionToken, code } = input;
        if (!tempSessionToken || !code) return { kind: "missing_2fa_payload" };
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
        email?: string;
        oldPassword?: string;
        newPassword?: string;
    }): Promise<ResetPasswordResult> {
        const { email, oldPassword, newPassword } = input;
        if (!email || !oldPassword || !newPassword) return { kind: "missing_reset_payload" };
        if (!isStrongPassword(newPassword)) return { kind: "weak_password" };
        const user = await this.users.findByEmail(email.toLowerCase());
        if (!user) return { kind: "user_not_found" };
        if (!(await this.hasher.verify(user.passwordHash, oldPassword))) return { kind: "invalid_old_password" };
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

    async resetAuthenticatedPassword(input: {
        userId: string;
        oldPassword?: string;
        newPassword?: string;
    }): Promise<ResetPasswordResult> {
        const { userId, oldPassword, newPassword } = input;
        if (!oldPassword || !newPassword) return { kind: "missing_reset_payload" };
        if (!isStrongPassword(newPassword)) return { kind: "weak_password" };
        const user = await this.users.findById(userId);
        if (!user) return { kind: "user_not_found" };
        if (!(await this.hasher.verify(user.passwordHash, oldPassword))) return { kind: "invalid_old_password" };
        user.passwordHash = await this.hasher.hash(newPassword);
        user.passwordUpdatedAt = new Date();
        user.failedAttempts = 0;
        user.lockedUntil = null;
        await this.users.save(user);
        return { kind: "password_updated" };
    }

    async listUsersForAdmin(): Promise<ListUsersResult> {
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

    async cleanupExpiredSessions(): Promise<void> {
        const cutoff = new Date(Date.now() - TWO_FACTOR_SESSION_EXPIRY_MS);
        await this.twoFactorSessions.deleteOlderThan(cutoff);
    }

    async deleteAccount(userId: string): Promise<DeleteAccountResult> {
        const user = await this.users.findById(userId);
        if (!user) return { kind: "user_not_found" };
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
