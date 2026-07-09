import {
    type Enable2faResult,
    type GetMeResult,
    type LoginResult,
    type RequestPasswordResetResult,
    type ResetPasswordResult,
    type Verify2faResult,
} from "@application/auth/auth.use-cases";
import { Router, type Response } from "express";
import { authed, requireCronSecret, getAuthFlags } from "@express/src/auth/middleware";
import { tokenProvider } from "@express/src/auth/token-provider.adapter";
import { authUseCases } from "@express/src/container";
import { respond, send, type HttpStatus } from "@express/src/http/responses";

export const authRouter = Router();

type AuthUserView = { id: string; firstname: string; lastname: string; email: string; role: string };

type LoginResponseBody =
    | { error: string }
    | { error: string; lockedUntil?: string }
    | { error: string; passwordResetRequired: true }
    | { error: string; setup2FARequired: true; setupSessionToken?: string }
    | { twoFactorRequired: true; tempSessionToken: string }
    | { token: string; user: AuthUserView };

type Verify2faResponseBody = { error: string } | { token: string; user: AuthUserView };

type ResetPasswordResponseBody = { error: string } | { message: string };

type Enable2faResponseBody =
    | { error: string }
    | { totpSecret: string; totpProvisioningUri: string }
    | { message: string };

type GetMeResponseBody =
    | { error: string }
    | { id: string; firstname: string; lastname: string; email: string; role: string; passwordExpiresInDays: number; twoFactorEnabled: boolean };

const loginResponse = (result: LoginResult): { status: HttpStatus; body: LoginResponseBody } => {
    switch (result.kind) {
        case "missing_credentials":
            return { status: 400, body: { error: "Email and password are required" } };
        case "invalid_credentials":
            return { status: 401, body: { error: "Invalid credentials" } };
        case "pending_role_assignment":
            return {
                status: 403,
                body: { error: "Your account is pending role assignment. An administrator will process your request." },
            };
        case "account_locked":
            return {
                status: 423,
                body: {
                    error: "Account locked due to failed attempts",
                    lockedUntil: result.lockedUntil?.toISOString(),
                },
            };
        case "password_expired":
            return {
                status: 403,
                body: {
                    error: "Password expired. Reset required every 60 days.",
                    passwordResetRequired: result.passwordResetRequired,
                },
            };
        case "super_admin_2fa_required":
            return {
                status: 403,
                body: {
                    error: "Super admin must enable TOTP 2FA.",
                    setup2FARequired: result.setup2FARequired,
                    setupSessionToken: result.setupSessionToken,
                },
            };
        case "two_factor_required":
            return { status: 200, body: { twoFactorRequired: true, tempSessionToken: result.tempSessionToken } };
        case "authenticated":
            return { status: 200, body: { token: result.token, user: result.user } };
    }
};

const verify2faResponse = (result: Verify2faResult): { status: HttpStatus; body: Verify2faResponseBody } => {
    switch (result.kind) {
        case "missing_2fa_payload":
            return { status: 400, body: { error: "tempSessionToken and code are required" } };
        case "invalid_2fa_session":
            return { status: 401, body: { error: "Invalid 2FA session" } };
        case "invalid_totp_code":
            return { status: 401, body: { error: "Invalid TOTP code" } };
        case "authenticated":
            return { status: 200, body: { token: result.token, user: result.user } };
    }
};

const resetPasswordResponse = (result: ResetPasswordResult): { status: HttpStatus; body: ResetPasswordResponseBody } => {
    switch (result.kind) {
        case "missing_reset_payload":
            return { status: 400, body: { error: "email, oldPassword and newPassword are required" } };
        case "weak_password":
            return {
                status: 400,
                body: { error: "Weak password. Minimum 12 chars with uppercase, lowercase, number and symbol." },
            };
        case "user_not_found":
            return { status: 404, body: { error: "User not found" } };
        case "invalid_old_password":
            return { status: 401, body: { error: "Invalid old password" } };
        case "invalid_or_expired_token":
            return { status: 401, body: { error: "Invalid or expired reset token" } };
        case "password_updated":
            return { status: 200, body: { message: "Password updated" } };
    }
};

const requestPasswordResetResponse = (
    result: RequestPasswordResetResult,
): { status: HttpStatus; body: ResetPasswordResponseBody } => {
    switch (result.kind) {
        case "missing_email":
            return { status: 400, body: { error: "Email is required" } };
        case "invalid_email":
            return { status: 400, body: { error: "Invalid email format" } };
        case "reset_email_sent":
            return {
                status: 200,
                body: {
                    message:
                        "If an account exists for this email, a password reset link has been sent.",
                },
            };
    }
};

const getMeResponse = (result: GetMeResult): { status: HttpStatus; body: GetMeResponseBody } => {
    switch (result.kind) {
        case "user_not_found":
            return { status: 404, body: { error: "User not found" } };
        case "user_found":
            return {
                status: 200,
                body: { ...result.user },
            };
    }
};

const enable2faResponse = (result: Enable2faResult): { status: number; body: Enable2faResponseBody } => {
    switch (result.kind) {
        case "unauthorized":
            return { status: 401, body: { error: "Unauthorized" } };
        case "invalid_session":
            return { status: 401, body: { error: "Invalid or expired setup session" } };
        case "already_enabled":
            return { status: 409, body: { error: "Two-factor authentication is already enabled" } };
        case "missing_code":
            return { status: 400, body: { error: "TOTP code is required to confirm activation" } };
        case "invalid_totp_code":
            return { status: 401, body: { error: "Invalid TOTP code" } };
        case "setup_initiated":
            return {
                status: 200,
                body: { totpSecret: result.totpSecret, totpProvisioningUri: result.totpProvisioningUri },
            };
        case "two_factor_enabled":
            return { status: 200, body: { message: "Two-factor authentication enabled" } };
    }
};

authRouter.post("/auth/signup", async (request, response) => {
    const result = await authUseCases.signup(request.body);
    respond(response, result, {
        missing_credentials: { status: 400, error: "firstname, lastname, email and password are required" },
        invalid_email: { status: 400, error: "Invalid email format" },
        missing_gdpr_consent: { status: 400, error: "GDPR consent is required" },
        weak_password: { status: 400, error: "Weak password. Minimum 12 chars with uppercase, lowercase, number and symbol." },
        user_already_exists: { blocked: { type: "Creation", reason: "A user with this email already exists" } },
        user_created: (r) => ({
            status: 201,
            body: {
                userId: r.user.id,
                email: r.user.email,
                message: "User created",
                totpSecret: r.twoFactor?.secret,
                totpProvisioningUri: r.twoFactor?.provisioningUri,
            },
        }),
    });
});

authRouter.post("/auth/login", async (request, response) => {
    const httpResponse = loginResponse(await authUseCases.login(request.body));
    send(response, { status: httpResponse.status, body: httpResponse.body });
});

authRouter.post("/auth/login/2fa", async (request, response) => {
    const httpResponse = verify2faResponse(await authUseCases.verify2fa(request.body));
    send(response, { status: httpResponse.status, body: httpResponse.body });
});

authRouter.post("/auth/2fa/enable", async (request, response) => {
    const { code, setupSessionToken } = request.body as { code?: string; setupSessionToken?: string };
    const authorization = request.headers.authorization;
    let userId: string | undefined;
    if (authorization?.startsWith("Bearer ")) {
        try {
            userId = tokenProvider.verify(authorization.slice("Bearer ".length)).sub;
        } catch {
            userId = undefined;
        }
    }

    const result = await authUseCases.enable2fa({ userId, setupSessionToken, code });
    const httpResponse = enable2faResponse(result);
    response.status(httpResponse.status).json(httpResponse.body);
});

authRouter.post("/auth/password/reset", ...authed(async (request, response) => {
    const { oldPassword, newPassword } = request.body as { oldPassword?: string; newPassword?: string };
    const result = await authUseCases.resetAuthenticatedPassword({
        userId: request.auth.userId,
        oldPassword,
        newPassword,
    });
    const httpResponse = resetPasswordResponse(result);
    send(response, { status: httpResponse.status, body: httpResponse.body });
}));

authRouter.post("/auth/password/reset-with-credentials", async (request, response) => {
    const httpResponse = resetPasswordResponse(await authUseCases.resetWithCredentials(request.body));
    send(response, { status: httpResponse.status, body: httpResponse.body });
});

authRouter.post("/auth/password/forgot", async (request, response) => {
    const httpResponse = requestPasswordResetResponse(
        await authUseCases.requestPasswordReset(request.body as { email?: string }),
    );
    send(response, { status: httpResponse.status, body: httpResponse.body });
});

authRouter.post("/auth/password/reset-with-token", async (request, response) => {
    const httpResponse = resetPasswordResponse(
        await authUseCases.resetWithToken(request.body as { token?: string; newPassword?: string }),
    );
    send(response, { status: httpResponse.status, body: httpResponse.body });
});

authRouter.get("/users/me", ...authed(async (request, response) => {
    const httpResponse = getMeResponse(await authUseCases.getMe(request.auth.userId));
    send(response, { status: httpResponse.status, body: httpResponse.body });
}));

authRouter.get("/admin/security/users", ...authed(async (request, response) => {
        const auth = getAuthFlags(request.auth);
        const result = await authUseCases.listUsersForAdmin(auth);
        respond(response, result, {
            users_listed: (r) => ({ status: 200, body: {
                users: r.users.map((user) => ({ ...user, lockedUntil: user.lockedUntil?.toISOString() ?? null })),
            } }),
        });
    }));

authRouter.get("/gdpr/export", ...authed(async (request, response) => {
    const result = await authUseCases.exportGdprData(request.auth.userId);
    respond(response, result, {
        user_not_found: { status: 404, error: "User not found" },
        data_exported: (r) => ({ status: 200, body: {
            data: {
                ...r.data,
                gdprConsentAt: r.data.gdprConsentAt.toISOString(),
                createdAt: r.data.createdAt.toISOString(),
                lastLoginAt: r.data.lastLoginAt?.toISOString() ?? null,
            },
        } }),
    });
}));

authRouter.post("/admin/auth/cleanup-sessions", requireCronSecret, async (_request, response) => {
    await authUseCases.cleanupExpiredSessions();
    send(response, { status: 200, body: { message: "Expired 2FA sessions deleted" } });
});

type DeleteAccountResult = Awaited<ReturnType<typeof authUseCases.deleteAccount>>;

const sendDeleteAccountResult = (result: DeleteAccountResult, response: Response): void => {
    respond(response, result, {
        user_not_found: { status: 404, error: "User not found" },
        user_has_active_role: { blocked: { type: "Deletion", reason: "User still has an active role (remove the role first)" } },
        user_has_files: { blocked: { type: "Deletion", reason: "Account has uploaded files" } },
        user_has_messages: { blocked: { type: "Deletion", reason: "Account has sent messages" } },
        user_has_message_reads: { blocked: { type: "Deletion", reason: "Account has message read records" } },
        user_has_audit_logs: { blocked: { type: "Deletion", reason: "Account has audit log entries" } },
        account_deleted: { status: 200, body: { message: "Account deleted" } },
    });
};

authRouter.delete("/users/:id", ...authed(async (request, response) => {
    const auth = getAuthFlags(request.auth);
    const result = await authUseCases.deleteAccount(String(request.params.id), auth);
    sendDeleteAccountResult(result, response);
}));
