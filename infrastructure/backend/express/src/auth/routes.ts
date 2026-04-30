import { AuthUseCases } from "../../../../../application/auth/use-cases"
import { PASSWORD_MAX_AGE_DAYS, needsPasswordReset } from "../../../../../domain/auth/security-policy"
import { Router } from "express"
import { passwordHasher, tokenProvider, totpProvider, userRepository } from "./adapters"
import { requireAuth, requireRole, type AuthRequest } from "./middleware"
import { rolePermissions } from "./store"
import { OIDC_ENABLED, SEED_ON_START } from "./service"

export const authRouter = Router()
const authUseCases = new AuthUseCases(userRepository, passwordHasher, tokenProvider, totpProvider)

authRouter.post("/auth/signup", async (req, res) => {
  const result = await authUseCases.signup(req.body)
  res.status(result.status).json(result.body)
})

authRouter.post("/auth/login", async (req, res) => {
  const result = await authUseCases.login(req.body)
  res.status(result.status).json(result.body)
})

authRouter.post("/auth/login/2fa", (req, res) => {
  authUseCases
    .verify2fa(req.body)
    .then((result) => res.status(result.status).json(result.body))
    .catch(() => res.status(500).json({ error: "Internal server error" }))
})

authRouter.post("/auth/password/reset", requireAuth, async (req: AuthRequest, res) => {
  if (!req.auth) return void res.status(401).json({ error: "Unauthorized" })
  const user = await userRepository.findById(req.auth.userId)
  if (!user) return void res.status(404).json({ error: "User not found" })
  const { oldPassword, newPassword } = req.body as { oldPassword?: string; newPassword?: string }
  const result = await authUseCases.resetWithCredentials({
    email: user.email,
    oldPassword,
    newPassword,
  })
  res.status(result.status).json(result.body)
})

authRouter.post("/auth/password/reset-with-credentials", async (req, res) => {
  const result = await authUseCases.resetWithCredentials(req.body)
  res.status(result.status).json(result.body)
})

authRouter.get("/auth/oidc/config", (_req, res) => {
  if (!OIDC_ENABLED) return void res.status(200).json({ enabled: false, message: "OIDC not configured" })
  res.status(200).json({ enabled: true, issuer: process.env.OIDC_ISSUER_URL, clientId: process.env.OIDC_CLIENT_ID })
})

authRouter.get("/auth/dev-seed-accounts", (_req, res) => {
  const isProduction = process.env.NODE_ENV === "production"
  if (!SEED_ON_START || isProduction) return void res.status(404).json({ error: "Not found" })
  userRepository
    .listDevSeedAccounts()
    .then((accounts) => res.status(200).json({ accounts }))
    .catch(() => res.status(500).json({ error: "Internal server error" }))
})

authRouter.get("/users/me", requireAuth, async (req: AuthRequest, res) => {
  if (!req.auth) return void res.status(401).json({ error: "Unauthorized" })
  const result = await authUseCases.getMe(req.auth.userId)
  if (result.status !== 200) return void res.status(result.status).json(result.body)
  const body = result.body as { role: keyof typeof rolePermissions }
  res.status(200).json({
    ...result.body,
    permissions: rolePermissions[body.role],
  })
})

authRouter.get("/admin/security/users", requireAuth, requireRole("super_admin"), async (_req: AuthRequest, res) => {
  const users = (await userRepository.list()).map((user) => ({
    id: user.id,
    email: user.email,
    role: user.role,
    failedAttempts: user.failedAttempts,
    lockedUntil: user.lockedUntil?.toISOString() ?? null,
    passwordExpired: needsPasswordReset(user.passwordUpdatedAt),
    twoFactorEnabled: user.twoFactorEnabled,
  }))
  res.status(200).json({ users })
})

authRouter.get("/gdpr/export", requireAuth, (req: AuthRequest, res) => {
  if (!req.auth) return void res.status(401).json({ error: "Unauthorized" })
  userRepository.findById(req.auth.userId).then((user) => {
    if (!user) return void res.status(404).json({ error: "User not found" })
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
})

authRouter.delete("/gdpr/me", requireAuth, (req: AuthRequest, res) => {
  if (!req.auth) return void res.status(401).json({ error: "Unauthorized" })
  userRepository.findById(req.auth.userId).then((user) => {
    if (!user) return void res.status(404).json({ error: "User not found" })
    userRepository.deleteById(user.id).then(() => {
      res.status(200).json({ message: "Account deleted and personal data erased" })
    })
  })
})
