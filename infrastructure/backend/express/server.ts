import express, { type NextFunction, type Request, type Response } from "express"
import cors from "cors"
import argon2 from "argon2"
import jwt from "jsonwebtoken"
import speakeasy from "speakeasy"
import { randomUUID } from "node:crypto"

type Role = "student" | "teacher" | "admin" | "super_admin"

type User = {
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

type AuthRequest = Request & {
  auth?: { userId: string; role: Role; email: string }
}

type DevSeedAccount = {
  role: Role
  email: string
  password: string
  twoFactorEnabled: boolean
  totpSecret: string | null
}

const PASSWORD_MAX_AGE_DAYS = 60
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MS = 15 * 60 * 1000
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-me"
const JWT_EXPIRES_IN = "8h"
const OIDC_ENABLED = process.env.OIDC_ISSUER_URL && process.env.OIDC_CLIENT_ID
const SEED_ON_START = process.env.SEED_ON_START === "true"
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "Str0ng!Password#2026"

const usersByEmail = new Map<string, User>()
const usersById = new Map<string, User>()
const devSeedAccounts: DevSeedAccount[] = []
const rolePermissions: Record<Role, string[]> = {
  student: ["grades:read:self", "profile:read:self"],
  teacher: ["courses:read", "grades:write"],
  admin: ["users:read", "users:update", "reports:read"],
  super_admin: ["*"],
}

const app = express()

app.use(cors())
app.use(express.json())
const router = express.Router()
app.use("/api", router)

const emailIsValid = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

const isStrongPassword = (password: string): boolean =>
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password)

const needsPasswordReset = (passwordUpdatedAt: Date): boolean => {
  const expiresAt = new Date(passwordUpdatedAt)
  expiresAt.setDate(expiresAt.getDate() + PASSWORD_MAX_AGE_DAYS)
  return Date.now() > expiresAt.getTime()
}

const isLocked = (user: User): boolean =>
  Boolean(user.lockedUntil && user.lockedUntil.getTime() > Date.now())

const issueToken = (user: User): string =>
  jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

const createUser = async ({
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
  if (existingUser) {
    return existingUser
  }

  const passwordHash = await argon2.hash(password)
  const twoFactorSecret = enable2FA
    ? speakeasy.generateSecret({ name: `MyGES (${normalizedEmail})` }).base32
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

const seedUsers = async (): Promise<void> => {
  if (!SEED_ON_START) {
    return
  }
  if (!isStrongPassword(SEED_PASSWORD)) {
    console.warn(
      "[seed] Ignoré: SEED_PASSWORD ne respecte pas la politique (12+, maj, min, chiffre, symbole)."
    )
    return
  }

  const seedDefinitions: Array<{ email: string; role: Role; enable2FA?: boolean }> = [
    { email: "student.seed@myges.fr", role: "student" },
    { email: "teacher.seed@myges.fr", role: "teacher" },
    { email: "admin.seed@myges.fr", role: "admin" },
    { email: "superadmin.seed@myges.fr", role: "super_admin", enable2FA: true },
  ]

  for (const definition of seedDefinitions) {
    const existed = usersByEmail.has(definition.email.toLowerCase())
    const user = await createUser({
      email: definition.email,
      password: SEED_PASSWORD,
      role: definition.role,
      enable2FA: definition.enable2FA,
    })
    if (!existed) {
      console.log(`[seed] Compte ${definition.role} créé: ${user.email}`)
      if (definition.role === "super_admin" && user.twoFactorSecret) {
        console.log(`[seed] Secret TOTP super_admin: ${user.twoFactorSecret}`)
      }
    }
  }

  devSeedAccounts.length = 0
  for (const definition of seedDefinitions) {
    const user = usersByEmail.get(definition.email.toLowerCase())
    if (!user) {
      continue
    }
    devSeedAccounts.push({
      role: definition.role,
      email: user.email,
      password: SEED_PASSWORD,
      twoFactorEnabled: user.twoFactorEnabled,
      totpSecret: user.twoFactorSecret,
    })
  }
}

const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  try {
    const token = authorization.slice("Bearer ".length)
    const payload = jwt.verify(token, JWT_SECRET) as {
      sub: string
      role: Role
      email: string
    }
    req.auth = { userId: payload.sub, role: payload.role, email: payload.email }
    next()
  } catch {
    res.status(401).json({ error: "Invalid token" })
  }
}

const requireRole =
  (...allowedRoles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }
    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({ error: "Forbidden: insufficient role" })
      return
    }
    next()
  }

router.get("/hello", (_req, res) => {
  res.json({ message: "Hello from Express!" })
})

router.post("/auth/signup", async (req, res) => {
  const {
    email,
    password,
    role = "student",
    enable2FA = false,
    gdprConsent = false,
  }: {
    email?: string
    password?: string
    role?: Role
    enable2FA?: boolean
    gdprConsent?: boolean
  } = req.body

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" })
    return
  }
  if (!emailIsValid(email)) {
    res.status(400).json({ error: "Invalid email format" })
    return
  }
  if (!gdprConsent) {
    res.status(400).json({ error: "GDPR consent is required" })
    return
  }
  if (!isStrongPassword(password)) {
    res.status(400).json({
      error:
        "Weak password. Minimum 12 chars with uppercase, lowercase, number and symbol.",
    })
    return
  }
  if (!["student", "teacher", "admin", "super_admin"].includes(role)) {
    res.status(400).json({ error: "Invalid role" })
    return
  }
  if (usersByEmail.has(email.toLowerCase())) {
    res.status(409).json({ error: "User already exists" })
    return
  }

  const user = await createUser({ email, password, role, enable2FA })

  const response: Record<string, unknown> = {
    userId: user.id,
    email: user.email,
    role: user.role,
    message: "User created",
  }
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    response.totpSecret = user.twoFactorSecret
    response.totpProvisioningUri = speakeasy.otpauthURL({
      secret: user.twoFactorSecret,
      label: user.email,
      issuer: "MyGES",
      encoding: "base32",
    })
  }

  res.status(201).json(response)
})

router.post("/auth/login", async (req, res) => {
  const { email, password }: { email?: string; password?: string } = req.body
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" })
    return
  }

  const user = usersByEmail.get(email.toLowerCase())
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" })
    return
  }
  if (isLocked(user)) {
    res.status(423).json({
      error: "Account locked due to failed attempts",
      lockedUntil: user.lockedUntil?.toISOString(),
    })
    return
  }

  const validPassword = await argon2.verify(user.passwordHash, password)
  if (!validPassword) {
    user.failedAttempts += 1
    if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS)
      user.failedAttempts = 0
    }
    res.status(401).json({ error: "Invalid credentials" })
    return
  }

  user.failedAttempts = 0
  user.lockedUntil = null

  if (needsPasswordReset(user.passwordUpdatedAt)) {
    res.status(403).json({
      error: "Password expired. Reset required every 60 days.",
      passwordResetRequired: true,
    })
    return
  }

  // Super admin accounts must always use MFA.
  if (user.role === "super_admin" && !user.twoFactorEnabled) {
    res.status(403).json({
      error: "Super admin must enable TOTP 2FA.",
      setup2FARequired: true,
    })
    return
  }

  if (user.twoFactorEnabled) {
    res.status(200).json({
      twoFactorRequired: true,
      tempSessionUserId: user.id,
    })
    return
  }

  user.lastLoginAt = new Date()
  res.status(200).json({
    token: issueToken(user),
    user: { id: user.id, email: user.email, role: user.role },
  })
})

router.post("/auth/login/2fa", (req, res) => {
  const { tempSessionUserId, code }: { tempSessionUserId?: string; code?: string } = req.body
  if (!tempSessionUserId || !code) {
    res.status(400).json({ error: "tempSessionUserId and code are required" })
    return
  }
  const user = usersById.get(tempSessionUserId)
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    res.status(401).json({ error: "Invalid 2FA session" })
    return
  }

  const valid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    token: code,
    encoding: "base32",
    window: 1,
  })
  if (!valid) {
    res.status(401).json({ error: "Invalid TOTP code" })
    return
  }

  user.lastLoginAt = new Date()
  res.status(200).json({
    token: issueToken(user),
    user: { id: user.id, email: user.email, role: user.role },
  })
})

router.post("/auth/password/reset", requireAuth, async (req: AuthRequest, res) => {
  const { oldPassword, newPassword }: { oldPassword?: string; newPassword?: string } = req.body
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  if (!oldPassword || !newPassword) {
    res.status(400).json({ error: "oldPassword and newPassword are required" })
    return
  }
  if (!isStrongPassword(newPassword)) {
    res.status(400).json({
      error:
        "Weak password. Minimum 12 chars with uppercase, lowercase, number and symbol.",
    })
    return
  }

  const user = usersById.get(req.auth.userId)
  if (!user) {
    res.status(404).json({ error: "User not found" })
    return
  }
  const validPassword = await argon2.verify(user.passwordHash, oldPassword)
  if (!validPassword) {
    res.status(401).json({ error: "Invalid old password" })
    return
  }

  user.passwordHash = await argon2.hash(newPassword)
  user.passwordUpdatedAt = new Date()
  res.status(200).json({ message: "Password updated" })
})

router.post("/auth/password/reset-with-credentials", async (req, res) => {
  const {
    email,
    oldPassword,
    newPassword,
  }: { email?: string; oldPassword?: string; newPassword?: string } = req.body

  if (!email || !oldPassword || !newPassword) {
    res.status(400).json({ error: "email, oldPassword and newPassword are required" })
    return
  }
  if (!isStrongPassword(newPassword)) {
    res.status(400).json({
      error:
        "Weak password. Minimum 12 chars with uppercase, lowercase, number and symbol.",
    })
    return
  }

  const user = usersByEmail.get(email.toLowerCase())
  if (!user) {
    res.status(404).json({ error: "User not found" })
    return
  }

  const validPassword = await argon2.verify(user.passwordHash, oldPassword)
  if (!validPassword) {
    res.status(401).json({ error: "Invalid old password" })
    return
  }

  user.passwordHash = await argon2.hash(newPassword)
  user.passwordUpdatedAt = new Date()
  user.failedAttempts = 0
  user.lockedUntil = null

  res.status(200).json({ message: "Password updated" })
})

router.get("/auth/oidc/config", (_req, res) => {
  if (!OIDC_ENABLED) {
    res.status(200).json({ enabled: false, message: "OIDC not configured" })
    return
  }
  res.status(200).json({
    enabled: true,
    issuer: process.env.OIDC_ISSUER_URL,
    clientId: process.env.OIDC_CLIENT_ID,
  })
})

router.get("/auth/dev-seed-accounts", (_req, res) => {
  const isProduction = process.env.NODE_ENV === "production"
  if (!SEED_ON_START || isProduction) {
    res.status(404).json({ error: "Not found" })
    return
  }

  res.status(200).json({
    accounts: devSeedAccounts,
  })
})

router.get("/users/me", requireAuth, (req: AuthRequest, res) => {
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const user = usersById.get(req.auth.userId)
  if (!user) {
    res.status(404).json({ error: "User not found" })
    return
  }
  res.status(200).json({
    id: user.id,
    email: user.email,
    role: user.role,
    permissions: rolePermissions[user.role],
    passwordExpiresInDays: Math.max(
      0,
      PASSWORD_MAX_AGE_DAYS -
        Math.floor((Date.now() - user.passwordUpdatedAt.getTime()) / (1000 * 60 * 60 * 24))
    ),
    twoFactorEnabled: user.twoFactorEnabled,
  })
})

router.get(
  "/admin/security/users",
  requireAuth,
  requireRole("super_admin"),
  (_req: AuthRequest, res) => {
    const users = Array.from(usersById.values()).map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      failedAttempts: user.failedAttempts,
      lockedUntil: user.lockedUntil?.toISOString() ?? null,
      passwordExpired: needsPasswordReset(user.passwordUpdatedAt),
      twoFactorEnabled: user.twoFactorEnabled,
    }))
    res.status(200).json({ users })
  }
)

router.get("/gdpr/export", requireAuth, (req: AuthRequest, res) => {
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const user = usersById.get(req.auth.userId)
  if (!user) {
    res.status(404).json({ error: "User not found" })
    return
  }
  res.status(200).json({
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      gdprConsentAt: user.gdprConsentAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    },
  })
})

router.delete("/gdpr/me", requireAuth, (req: AuthRequest, res) => {
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  const user = usersById.get(req.auth.userId)
  if (!user) {
    res.status(404).json({ error: "User not found" })
    return
  }
  usersById.delete(user.id)
  usersByEmail.delete(user.email)
  res.status(200).json({ message: "Account deleted and personal data erased" })
})

const PORT = process.env.PORT || 3001
seedUsers()
  .catch((error) => {
    console.error("[seed] Erreur pendant l'initialisation des comptes de test:", error)
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`)
      if (SEED_ON_START) {
        console.log("[seed] Comptes de test activés (SEED_ON_START=true).")
      }
    })
  })