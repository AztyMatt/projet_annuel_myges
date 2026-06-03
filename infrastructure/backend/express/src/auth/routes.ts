import {
  type GetMeResult,
  type LoginResult,
  type ResetPasswordResult,
  type SignupResult,
  type Verify2faResult,
} from "@application/auth/use-cases"
import { Router } from "express"
import { requireAuth, requireCronSecret, requireRole, type AuthRequest } from "@express/src/auth/middleware"
import { AdminRole } from "@domain/admin/admin.enums"
import { authUseCases } from "@express/src/container"

export const authRouter = Router()

type AuthUserView = { id: string; email: string; role: string }

type SignupResponseBody =
  | { error: string }
  | { userId: string; email: string; message: string; totpSecret?: string; totpProvisioningUri?: string }

type LoginResponseBody =
  | { error: string }
  | { error: string; lockedUntil?: string }
  | { error: string; passwordResetRequired: true }
  | { error: string; setup2FARequired: true }
  | { twoFactorRequired: true; tempSessionToken: string }
  | { token: string; user: AuthUserView }

type Verify2faResponseBody = { error: string } | { token: string; user: AuthUserView }

type ResetPasswordResponseBody = { error: string } | { message: string }

type GetMeResponseBody =
  | { error: string }
  | { id: string; email: string; role: string; passwordExpiresInDays: number; twoFactorEnabled: boolean }

const signupResponse = (result: SignupResult): { status: number; body: SignupResponseBody } => {
  switch (result.kind) {
    case "missing_credentials":
      return { status: 400, body: { error: "Email and password are required" } }
    case "invalid_email":
      return { status: 400, body: { error: "Invalid email format" } }
    case "missing_gdpr_consent":
      return { status: 400, body: { error: "GDPR consent is required" } }
    case "weak_password":
      return { status: 400, body: { error: "Weak password. Minimum 12 chars with uppercase, lowercase, number and symbol." } }
    case "user_already_exists":
      return { status: 409, body: { error: "User already exists" } }
    case "user_created":
      return {
        status: 201,
        body: {
          userId: result.user.id,
          email: result.user.email,
          message: "User created",
          totpSecret: result.twoFactor?.secret,
          totpProvisioningUri: result.twoFactor?.provisioningUri,
        },
      }
  }
}

const loginResponse = (result: LoginResult): { status: number; body: LoginResponseBody } => {
  switch (result.kind) {
    case "missing_credentials":
      return { status: 400, body: { error: "Email and password are required" } }
    case "invalid_credentials":
      return { status: 401, body: { error: "Invalid credentials" } }
    case "pending_role_assignment":
      return { status: 403, body: { error: "Your account is pending role assignment. An administrator will process your request." } }
    case "account_locked":
      return { status: 423, body: { error: "Account locked due to failed attempts", lockedUntil: result.lockedUntil?.toISOString() } }
    case "password_expired":
      return { status: 403, body: { error: "Password expired. Reset required every 60 days.", passwordResetRequired: result.passwordResetRequired } }
    case "super_admin_2fa_required":
      return { status: 403, body: { error: "Super admin must enable TOTP 2FA.", setup2FARequired: result.setup2FARequired } }
    case "two_factor_required":
      return { status: 200, body: { twoFactorRequired: true, tempSessionToken: result.tempSessionToken } }
    case "authenticated":
      return { status: 200, body: { token: result.token, user: result.user } }
  }
}

const verify2faResponse = (result: Verify2faResult): { status: number; body: Verify2faResponseBody } => {
  switch (result.kind) {
    case "missing_2fa_payload":
      return { status: 400, body: { error: "tempSessionToken and code are required" } }
    case "invalid_2fa_session":
      return { status: 401, body: { error: "Invalid 2FA session" } }
    case "invalid_totp_code":
      return { status: 401, body: { error: "Invalid TOTP code" } }
    case "authenticated":
      return { status: 200, body: { token: result.token, user: result.user } }
  }
}

const resetPasswordResponse = (result: ResetPasswordResult): { status: number; body: ResetPasswordResponseBody } => {
  switch (result.kind) {
    case "missing_reset_payload":
      return { status: 400, body: { error: "email, oldPassword and newPassword are required" } }
    case "weak_password":
      return { status: 400, body: { error: "Weak password. Minimum 12 chars with uppercase, lowercase, number and symbol." } }
    case "user_not_found":
      return { status: 404, body: { error: "User not found" } }
    case "invalid_old_password":
      return { status: 401, body: { error: "Invalid old password" } }
    case "password_updated":
      return { status: 200, body: { message: "Password updated" } }
  }
}

const getMeResponse = (result: GetMeResult): { status: number; body: GetMeResponseBody } => {
  switch (result.kind) {
    case "user_not_found":
      return { status: 404, body: { error: "User not found" } }
    case "user_found":
      return {
        status: 200,
        body: { ...result.user },
      }
  }
}

authRouter.post("/auth/signup", async (request, response) => {
  const httpResponse = signupResponse(await authUseCases.signup(request.body))
  response.status(httpResponse.status).json(httpResponse.body)
})

authRouter.post("/auth/login", async (request, response) => {
  const httpResponse = loginResponse(await authUseCases.login(request.body))
  response.status(httpResponse.status).json(httpResponse.body)
})

authRouter.post("/auth/login/2fa", async (request, response) => {
  const httpResponse = verify2faResponse(await authUseCases.verify2fa(request.body))
  response.status(httpResponse.status).json(httpResponse.body)
})

authRouter.post("/auth/password/reset", requireAuth, async (request: AuthRequest, response) => {
  if (!request.auth) return void response.status(401).json({ error: "Unauthorized" })
  const { oldPassword, newPassword } = request.body as { oldPassword?: string; newPassword?: string }
  const result = await authUseCases.resetAuthenticatedPassword({ userId: request.auth.userId, oldPassword, newPassword })
  const httpResponse = resetPasswordResponse(result)
  response.status(httpResponse.status).json(httpResponse.body)
})

authRouter.post("/auth/password/reset-with-credentials", async (request, response) => {
  const httpResponse = resetPasswordResponse(await authUseCases.resetWithCredentials(request.body))
  response.status(httpResponse.status).json(httpResponse.body)
})

authRouter.get("/users/me", requireAuth, async (request: AuthRequest, response) => {
  if (!request.auth) return void response.status(401).json({ error: "Unauthorized" })
  const httpResponse = getMeResponse(await authUseCases.getMe(request.auth.userId))
  response.status(httpResponse.status).json(httpResponse.body)
})

authRouter.get("/admin/security/users", requireAuth, requireRole(AdminRole.SUPER_ADMIN), async (_request: AuthRequest, response) => {
  const result = await authUseCases.listUsersForAdmin()
  response.status(200).json({
    users: result.users.map((user) => ({ ...user, lockedUntil: user.lockedUntil?.toISOString() ?? null })),
  })
})

authRouter.get("/gdpr/export", requireAuth, async (request: AuthRequest, response) => {
  if (!request.auth) return void response.status(401).json({ error: "Unauthorized" })
  const result = await authUseCases.exportGdprData(request.auth.userId)
  if (result.kind === "user_not_found") return void response.status(404).json({ error: "User not found" })
  response.status(200).json({
    data: {
      ...result.data,
      gdprConsentAt: result.data.gdprConsentAt.toISOString(),
      createdAt: result.data.createdAt.toISOString(),
      lastLoginAt: result.data.lastLoginAt?.toISOString() ?? null,
    },
  })
})

authRouter.post("/admin/auth/cleanup-sessions", requireCronSecret, async (_request, response) => {
  await authUseCases.cleanupExpiredSessions()
  response.status(200).json({ message: "Expired 2FA sessions deleted" })
})

authRouter.delete("/users/me", requireAuth, async (request: AuthRequest, response) => {
  if (!request.auth) return void response.status(401).json({ error: "Unauthorized" })
  const result = await authUseCases.deleteAccount(request.auth.userId)
  if (result.kind === "user_not_found") return void response.status(404).json({ error: "User not found" })
  response.status(200).json({ message: "Account deleted and personal data erased" })
})
