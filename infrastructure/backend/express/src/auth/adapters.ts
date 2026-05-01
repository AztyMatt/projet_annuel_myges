import argon2 from "argon2"
import jwt from "jsonwebtoken"
import speakeasy from "speakeasy"
import { type PasswordHasher, type TokenProvider, type TotpProvider, type UserRepository } from "../../../../../application/auth/ports"
import { type Role, type User } from "../../../../../domain/auth/user"
import { pool } from "../db"
import { devSeedAccounts } from "./store"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-me"
const JWT_EXPIRES_IN = "8h"

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    email: row.email as string,
    role: row.role as Role,
    passwordHash: row.password_hash as string,
    failedAttempts: row.failed_attempts as number,
    lockedUntil: row.locked_until ? new Date(row.locked_until as string) : null,
    passwordUpdatedAt: new Date(row.password_updated_at as string),
    twoFactorEnabled: row.two_factor_enabled as boolean,
    twoFactorSecret: (row.two_factor_secret as string | null) ?? null,
    gdprConsentAt: new Date(row.gdpr_consent_at as string),
    createdAt: new Date(row.created_at as string),
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at as string) : null,
  }
}

export const userRepository: UserRepository = {
  async findByEmail(email) {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()])
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined
  },
  async findById(id) {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id])
    return result.rows[0] ? rowToUser(result.rows[0]) : undefined
  },
  async save(user) {
    await pool.query(
      `INSERT INTO users (
        id, email, role, password_hash, failed_attempts, locked_until,
        password_updated_at, two_factor_enabled, two_factor_secret,
        gdpr_consent_at, created_at, last_login_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        email               = EXCLUDED.email,
        role                = EXCLUDED.role,
        password_hash       = EXCLUDED.password_hash,
        failed_attempts     = EXCLUDED.failed_attempts,
        locked_until        = EXCLUDED.locked_until,
        password_updated_at = EXCLUDED.password_updated_at,
        two_factor_enabled  = EXCLUDED.two_factor_enabled,
        two_factor_secret   = EXCLUDED.two_factor_secret,
        gdpr_consent_at     = EXCLUDED.gdpr_consent_at,
        created_at          = EXCLUDED.created_at,
        last_login_at       = EXCLUDED.last_login_at`,
      [
        user.id, user.email, user.role, user.passwordHash, user.failedAttempts,
        user.lockedUntil, user.passwordUpdatedAt, user.twoFactorEnabled,
        user.twoFactorSecret, user.gdprConsentAt, user.createdAt, user.lastLoginAt,
      ]
    )
  },
  async deleteById(id) {
    await pool.query("DELETE FROM users WHERE id = $1", [id])
  },
  async list() {
    const result = await pool.query("SELECT * FROM users ORDER BY created_at DESC")
    return result.rows.map(rowToUser)
  },
  async listDevSeedAccounts() {
    return devSeedAccounts
  },
}

export const passwordHasher: PasswordHasher = {
  async hash(value) {
    return argon2.hash(value)
  },
  async verify(hash, raw) {
    return argon2.verify(hash, raw)
  },
}

export const tokenProvider: TokenProvider = {
  issue(user: User) {
    return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    })
  },
  verify(token: string) {
    return jwt.verify(token, JWT_SECRET) as { sub: string; role: Role; email: string }
  },
}

export const totpProvider: TotpProvider = {
  generateSecret(email: string) {
    return speakeasy.generateSecret({ name: `MyGES (${email.toLowerCase()})` }).base32
  },
  verify(secret: string, code: string) {
    return speakeasy.totp.verify({ secret, token: code, encoding: "base32", window: 1 })
  },
  buildProvisioningUri(email: string, secret: string) {
    return speakeasy.otpauthURL({
      secret,
      label: email,
      issuer: "MyGES",
      encoding: "base32",
    })
  },
}
