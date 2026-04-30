export type Role = "student" | "teacher" | "admin" | "super_admin"

export type User = {
  id: string
  email: string
  role: Role
  passwordHash: string
  failedAttempts: number
  lockedUntil: Date | null
  passwordUpdatedAt: Date
  twoFactorEnabled: boolean
  twoFactorSecret: string | null
  gdprConsentAt: Date
  createdAt: Date
  lastLoginAt: Date | null
}

export type DevSeedAccount = {
  role: Role
  email: string
  password: string
  twoFactorEnabled: boolean
  totpSecret: string | null
}
