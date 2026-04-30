import { randomUUID } from "node:crypto"
import { devSeedAccounts, usersByEmail, usersById } from "./store"
import { isStrongPassword } from "./policy"
import { type Role, type User } from "./types"
import { passwordHasher, totpProvider } from "./adapters"

export const OIDC_ENABLED = process.env.OIDC_ISSUER_URL && process.env.OIDC_CLIENT_ID
export const SEED_ON_START = process.env.SEED_ON_START === "true"
export const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Str0ng!Password#2026"

export const createUser = async ({
  email,
  password,
  role,
  enable2FA = false,
}: {
  email: string
  password: string
  role: Role
  enable2FA?: boolean
}): Promise<User> => {
  const normalizedEmail = email.toLowerCase()
  const existingUser = usersByEmail.get(normalizedEmail)
  if (existingUser) return existingUser

  const passwordHash = await passwordHasher.hash(password)
  const twoFactorSecret = enable2FA
    ? totpProvider.generateSecret(normalizedEmail)
    : null
  const user: User = {
    id: randomUUID(),
    email: normalizedEmail,
    role,
    passwordHash,
    failedAttempts: 0,
    lockedUntil: null,
    passwordUpdatedAt: new Date(),
    twoFactorEnabled: Boolean(enable2FA),
    twoFactorSecret,
    gdprConsentAt: new Date(),
    createdAt: new Date(),
    lastLoginAt: null,
  }
  usersByEmail.set(user.email, user)
  usersById.set(user.id, user)
  return user
}

export const seedUsers = async (): Promise<void> => {
  if (!SEED_ON_START) return
  if (!isStrongPassword(SEED_PASSWORD)) return

  const seedDefinitions: Array<{ email: string; role: Role; enable2FA?: boolean }> = [
    { email: "student.seed@myges.fr", role: "student" },
    { email: "teacher.seed@myges.fr", role: "teacher" },
    { email: "admin.seed@myges.fr", role: "admin" },
    { email: "superadmin.seed@myges.fr", role: "super_admin", enable2FA: true },
  ]

  for (const definition of seedDefinitions) {
    await createUser({
      email: definition.email,
      password: SEED_PASSWORD,
      role: definition.role,
      enable2FA: definition.enable2FA,
    })
  }

  devSeedAccounts.length = 0
  for (const definition of seedDefinitions) {
    const user = usersByEmail.get(definition.email.toLowerCase())
    if (!user) continue
    devSeedAccounts.push({
      role: definition.role,
      email: user.email,
      password: SEED_PASSWORD,
      twoFactorEnabled: user.twoFactorEnabled,
      totpSecret: user.twoFactorSecret,
    })
  }
}
