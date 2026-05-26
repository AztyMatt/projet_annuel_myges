import { randomUUID } from "node:crypto"
import {
  emailIsValid,
  isLocked,
  isStrongPassword,
  LOCK_DURATION_MS,
  MAX_FAILED_ATTEMPTS,
  needsPasswordReset,
  PASSWORD_MAX_AGE_DAYS,
} from "../../domain/auth/security-policy"
import { type User } from "../../domain/auth/user.entity"
import { Role } from "../../domain/auth/user.enums"
import { type AdminRepository } from "../admin/admin.repository"
import { type InstructorRepository } from "../instructor/instructor.repository"
import { type StudentRepository } from "../student/student.repository"
import { type PasswordHasher } from "./password-hasher.port"
import { type TokenProvider } from "./token-provider.port"
import { type TotpProvider } from "./totp-provider.port"
import { type UserRepository } from "./user.repository"

type RoleKey = keyof typeof Role

type AuthUserView = {
  id: string
  email: string
  role: RoleKey
}

type AuthenticatedResult = {
  kind: "authenticated"
  token: string
  user: AuthUserView
}

export type SignupResult =
  | { kind: "missing_credentials" }
  | { kind: "invalid_email" }
  | { kind: "missing_gdpr_consent" }
  | { kind: "weak_password" }
  | { kind: "user_already_exists" }
  | {
      kind: "user_created"
      user: { id: string; email: string }
      twoFactor?: {
        secret: string
        provisioningUri: string
      }
    }

export type LoginResult =
  | { kind: "missing_credentials" }
  | { kind: "invalid_credentials" }
  | { kind: "pending_role_assignment" }
  | { kind: "account_locked"; lockedUntil: Date | null }
  | { kind: "password_expired"; passwordResetRequired: true }
  | { kind: "super_admin_2fa_required"; setup2FARequired: true }
  | { kind: "two_factor_required"; tempSessionUserId: string }
  | AuthenticatedResult

export type Verify2faResult =
  | { kind: "missing_2fa_payload" }
  | { kind: "invalid_2fa_session" }
  | { kind: "invalid_totp_code" }
  | AuthenticatedResult

export type ResetPasswordResult =
  | { kind: "missing_reset_payload" }
  | { kind: "weak_password" }
  | { kind: "user_not_found" }
  | { kind: "invalid_old_password" }
  | { kind: "password_updated" }

export type GetMeResult =
  | { kind: "user_not_found" }
  | {
      kind: "user_found"
      user: AuthUserView & {
        passwordExpiresInDays: number
        twoFactorEnabled: boolean
      }
    }

export class AuthUseCases {
  constructor(
    private readonly users: UserRepository,
    private readonly admins: AdminRepository,
    private readonly students: StudentRepository,
    private readonly instructors: InstructorRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenProvider,
    private readonly totp: TotpProvider
  ) {}

  private async resolveRole(userId: string): Promise<Role | undefined> {
    const admin = await this.admins.findByUserId(userId)
    if (admin) return admin.role
    const student = await this.students.findByUserId(userId)
    if (student) return Role.STUDENT
    const instructor = await this.instructors.findByUserId(userId)
    if (instructor) return Role.INSTRUCTOR
    return undefined
  }

  async signup(input: {
    email?: string
    password?: string
    enable2FA?: boolean
    gdprConsent?: boolean
  }): Promise<SignupResult> {
    const { email, password, enable2FA = false, gdprConsent = false } = input
    if (!email || !password) return { kind: "missing_credentials" }
    if (!emailIsValid(email)) return { kind: "invalid_email" }
    if (!gdprConsent) return { kind: "missing_gdpr_consent" }
    if (!isStrongPassword(password)) return { kind: "weak_password" }
    if (await this.users.findByEmail(email.toLowerCase())) return { kind: "user_already_exists" }

    const twoFactorSecret = enable2FA ? this.totp.generateSecret(email.toLowerCase()) : null
    const user: User = {
      id: randomUUID(),
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
    }
    await this.users.save(user)

    const result: SignupResult = {
      kind: "user_created",
      user: { id: user.id, email: user.email },
    }
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      result.twoFactor = {
        secret: user.twoFactorSecret,
        provisioningUri: this.totp.buildProvisioningUri(user.email, user.twoFactorSecret),
      }
    }
    return result
  }

  async login(input: { email?: string; password?: string }): Promise<LoginResult> {
    const { email, password } = input
    if (!email || !password) return { kind: "missing_credentials" }
    const user = await this.users.findByEmail(email.toLowerCase())
    if (!user) return { kind: "invalid_credentials" }
    if (isLocked(user)) return { kind: "account_locked", lockedUntil: user.lockedUntil }

    const validPassword = await this.hasher.verify(user.passwordHash, password)
    if (!validPassword) {
      user.failedAttempts += 1
      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
        user.failedAttempts = 0
      }
      await this.users.save(user)
      return { kind: "invalid_credentials" }
    }

    user.failedAttempts = 0
    user.lockedUntil = null
    await this.users.save(user)

    const role = await this.resolveRole(user.id)
    if (!role) return { kind: "pending_role_assignment" }

    if (needsPasswordReset(user.passwordUpdatedAt)) return { kind: "password_expired", passwordResetRequired: true }
    if (role === Role.SUPER_ADMIN && !user.twoFactorEnabled) return { kind: "super_admin_2fa_required", setup2FARequired: true }
    if (user.twoFactorEnabled) return { kind: "two_factor_required", tempSessionUserId: user.id }

    user.lastLoginAt = new Date()
    await this.users.save(user)
    return this.authenticated(user, role)
  }

  async verify2fa(input: { tempSessionUserId?: string; code?: string }): Promise<Verify2faResult> {
    const { tempSessionUserId, code } = input
    if (!tempSessionUserId || !code) return { kind: "missing_2fa_payload" }
    const user = await this.users.findById(tempSessionUserId)
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) return { kind: "invalid_2fa_session" }
    if (!this.totp.verify(user.twoFactorSecret, code)) return { kind: "invalid_totp_code" }
    const role = await this.resolveRole(user.id)
    if (!role) return { kind: "invalid_2fa_session" }
    user.lastLoginAt = new Date()
    await this.users.save(user)
    return this.authenticated(user, role)
  }

  async resetWithCredentials(input: { email?: string; oldPassword?: string; newPassword?: string }): Promise<ResetPasswordResult> {
    const { email, oldPassword, newPassword } = input
    if (!email || !oldPassword || !newPassword) return { kind: "missing_reset_payload" }
    if (!isStrongPassword(newPassword)) return { kind: "weak_password" }
    const user = await this.users.findByEmail(email.toLowerCase())
    if (!user) return { kind: "user_not_found" }
    if (!(await this.hasher.verify(user.passwordHash, oldPassword))) return { kind: "invalid_old_password" }
    user.passwordHash = await this.hasher.hash(newPassword)
    user.passwordUpdatedAt = new Date()
    user.failedAttempts = 0
    user.lockedUntil = null
    await this.users.save(user)
    return { kind: "password_updated" }
  }

  async getMe(userId: string): Promise<GetMeResult> {
    const user = await this.users.findById(userId)
    if (!user) return { kind: "user_not_found" }
    const role = await this.resolveRole(userId)
    if (!role) return { kind: "user_not_found" }
    return {
      kind: "user_found",
      user: {
        id: user.id,
        email: user.email,
        role: this.roleToKey(role),
        passwordExpiresInDays: Math.max(
          0,
          PASSWORD_MAX_AGE_DAYS -
            Math.floor((Date.now() - user.passwordUpdatedAt.getTime()) / (1000 * 60 * 60 * 24))
        ),
        twoFactorEnabled: user.twoFactorEnabled,
      },
    }
  }

  private roleToKey(role: Role): RoleKey {
    return (Object.keys(Role) as RoleKey[]).find((k) => Role[k] === role)!
  }

  private authenticated(user: User, role: Role): AuthenticatedResult {
    return {
      kind: "authenticated",
      token: this.tokens.issue(user, role),
      user: { id: user.id, email: user.email, role: this.roleToKey(role) },
    }
  }
}
