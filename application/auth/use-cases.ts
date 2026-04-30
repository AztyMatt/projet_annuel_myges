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
import { type Role, type User } from "../../domain/auth/user"
import { type PasswordHasher, type TokenProvider, type TotpProvider, type UserRepository } from "./ports"

export class AuthUseCases {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenProvider,
    private readonly totp: TotpProvider
  ) {}

  async signup(input: {
    email?: string
    password?: string
    role?: Role
    enable2FA?: boolean
    gdprConsent?: boolean
  }): Promise<{ status: number; body: Record<string, unknown> }> {
    const { email, password, role = "student", enable2FA = false, gdprConsent = false } = input
    if (!email || !password) return { status: 400, body: { error: "Email and password are required" } }
    if (!emailIsValid(email)) return { status: 400, body: { error: "Invalid email format" } }
    if (!gdprConsent) return { status: 400, body: { error: "GDPR consent is required" } }
    if (!isStrongPassword(password)) return { status: 400, body: { error: "Weak password. Minimum 12 chars with uppercase, lowercase, number and symbol." } }
    if (!["student", "teacher", "admin", "super_admin"].includes(role)) return { status: 400, body: { error: "Invalid role" } }
    if (await this.users.findByEmail(email.toLowerCase())) return { status: 409, body: { error: "User already exists" } }

    const twoFactorSecret = enable2FA ? this.totp.generateSecret(email.toLowerCase()) : null
    const user: User = {
      id: randomUUID(),
      email: email.toLowerCase(),
      role,
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

    const body: Record<string, unknown> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      message: "User created",
    }
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      body.totpSecret = user.twoFactorSecret
      body.totpProvisioningUri = this.totp.buildProvisioningUri(user.email, user.twoFactorSecret)
    }
    return { status: 201, body }
  }

  async login(input: { email?: string; password?: string }): Promise<{ status: number; body: Record<string, unknown> }> {
    const { email, password } = input
    if (!email || !password) return { status: 400, body: { error: "Email and password are required" } }
    const user = await this.users.findByEmail(email.toLowerCase())
    if (!user) return { status: 401, body: { error: "Invalid credentials" } }
    if (isLocked(user)) return { status: 423, body: { error: "Account locked due to failed attempts", lockedUntil: user.lockedUntil?.toISOString() } }

    const validPassword = await this.hasher.verify(user.passwordHash, password)
    if (!validPassword) {
      user.failedAttempts += 1
      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
        user.failedAttempts = 0
      }
      await this.users.save(user)
      return { status: 401, body: { error: "Invalid credentials" } }
    }

    user.failedAttempts = 0
    user.lockedUntil = null
    await this.users.save(user)

    if (needsPasswordReset(user.passwordUpdatedAt)) return { status: 403, body: { error: "Password expired. Reset required every 60 days.", passwordResetRequired: true } }
    if (user.role === "super_admin" && !user.twoFactorEnabled) return { status: 403, body: { error: "Super admin must enable TOTP 2FA.", setup2FARequired: true } }
    if (user.twoFactorEnabled) return { status: 200, body: { twoFactorRequired: true, tempSessionUserId: user.id } }

    user.lastLoginAt = new Date()
    await this.users.save(user)
    return { status: 200, body: { token: this.tokens.issue(user), user: { id: user.id, email: user.email, role: user.role } } }
  }

  async verify2fa(input: { tempSessionUserId?: string; code?: string }): Promise<{ status: number; body: Record<string, unknown> }> {
    const { tempSessionUserId, code } = input
    if (!tempSessionUserId || !code) return { status: 400, body: { error: "tempSessionUserId and code are required" } }
    const user = await this.users.findById(tempSessionUserId)
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) return { status: 401, body: { error: "Invalid 2FA session" } }
    if (!this.totp.verify(user.twoFactorSecret, code)) return { status: 401, body: { error: "Invalid TOTP code" } }
    user.lastLoginAt = new Date()
    await this.users.save(user)
    return { status: 200, body: { token: this.tokens.issue(user), user: { id: user.id, email: user.email, role: user.role } } }
  }

  async resetWithCredentials(input: { email?: string; oldPassword?: string; newPassword?: string }): Promise<{ status: number; body: Record<string, unknown> }> {
    const { email, oldPassword, newPassword } = input
    if (!email || !oldPassword || !newPassword) return { status: 400, body: { error: "email, oldPassword and newPassword are required" } }
    if (!isStrongPassword(newPassword)) return { status: 400, body: { error: "Weak password. Minimum 12 chars with uppercase, lowercase, number and symbol." } }
    const user = await this.users.findByEmail(email.toLowerCase())
    if (!user) return { status: 404, body: { error: "User not found" } }
    if (!(await this.hasher.verify(user.passwordHash, oldPassword))) return { status: 401, body: { error: "Invalid old password" } }
    user.passwordHash = await this.hasher.hash(newPassword)
    user.passwordUpdatedAt = new Date()
    user.failedAttempts = 0
    user.lockedUntil = null
    await this.users.save(user)
    return { status: 200, body: { message: "Password updated" } }
  }

  async getMe(userId: string): Promise<{ status: number; body: Record<string, unknown> }> {
    const user = await this.users.findById(userId)
    if (!user) return { status: 404, body: { error: "User not found" } }
    return {
      status: 200,
      body: {
        id: user.id,
        email: user.email,
        role: user.role,
        passwordExpiresInDays: Math.max(
          0,
          PASSWORD_MAX_AGE_DAYS -
            Math.floor((Date.now() - user.passwordUpdatedAt.getTime()) / (1000 * 60 * 60 * 24))
        ),
        twoFactorEnabled: user.twoFactorEnabled,
      },
    }
  }
}
