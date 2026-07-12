import {
    type Enable2faResult,
    type GetMeResult,
    type LoginResult,
    type RequestPasswordResetResult,
    type ResetPasswordResult,
    type Verify2faResult,
} from "@application/auth/auth.use-cases";
import { Router, type Response } from "express";
import { z } from "zod";
import { authed, requireCronSecret, getAuthFlags } from "@express/src/auth/middleware";
import { tokenProvider } from "@express/src/auth/token-provider.adapter";
import { authUseCases } from "@express/src/container";
import { respond, send, type HttpStatus } from "@express/src/http/responses";
import { validateBody } from "@express/src/http/validate";

export const authRouter = Router();

const signupSchema = z.object({
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    email: z.email(),
    password: z.string().min(1),
    enable2FA: z.boolean().optional(),
    gdprConsent: z.boolean().optional(),
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

const verify2faSchema = z.object({
    tempSessionToken: z.string().min(1),
    code: z.string().min(1),
});

const enable2faSchema = z.object({
    code: z.string().optional(),
    setupSessionToken: z.string().optional(),
});

const resetPasswordSchema = z.object({
    oldPassword: z.string().min(1),
    newPassword: z.string().min(1),
});

const resetWithCredentialsSchema = z.object({
    email: z.email(),
    oldPassword: z.string().min(1),
    newPassword: z.string().min(1),
});

const forgotPasswordSchema = z.object({
    email: z.email(),
});

const resetWithTokenSchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(1),
});

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
        case "invalid_credentials":
            return { status: 401, body: { error: "Identifiants invalides" } };
        case "pending_role_assignment":
            return {
                status: 403,
                body: { error: "Votre compte est en attente d'attribution de rôle. Un administrateur traitera votre demande." },
            };
        case "account_locked":
            return {
                status: 423,
                body: {
                    error: "Compte verrouillé suite à des tentatives infructueuses",
                    lockedUntil: result.lockedUntil?.toISOString(),
                },
            };
        case "password_expired":
            return {
                status: 403,
                body: {
                    error: "Mot de passe expiré. Réinitialisation requise tous les 60 jours.",
                    passwordResetRequired: result.passwordResetRequired,
                },
            };
        case "super_admin_2fa_required":
            return {
                status: 403,
                body: {
                    error: "Le super administrateur doit activer la 2FA TOTP.",
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
        case "invalid_2fa_session":
            return { status: 401, body: { error: "Session 2FA invalide" } };
        case "invalid_totp_code":
            return { status: 401, body: { error: "Code TOTP invalide" } };
        case "authenticated":
            return { status: 200, body: { token: result.token, user: result.user } };
    }
};

const resetPasswordResponse = (result: ResetPasswordResult): { status: HttpStatus; body: ResetPasswordResponseBody } => {
    switch (result.kind) {
        case "weak_password":
            return {
                status: 400,
                body: { error: "Mot de passe trop faible. Minimum 12 caractères avec majuscule, minuscule, chiffre et symbole." },
            };
        case "user_not_found":
            return { status: 404, body: { error: "Utilisateur introuvable" } };
        case "invalid_old_password":
            return { status: 401, body: { error: "Ancien mot de passe invalide" } };
        case "invalid_or_expired_token":
            return { status: 401, body: { error: "Jeton de réinitialisation invalide ou expiré" } };
        case "password_updated":
            return { status: 200, body: { message: "Mot de passe mis à jour" } };
    }
};

const requestPasswordResetResponse = (
    result: RequestPasswordResetResult,
): { status: HttpStatus; body: ResetPasswordResponseBody } => {
    switch (result.kind) {
        case "reset_email_sent":
            return {
                status: 200,
                body: {
                    message:
                        "Si un compte existe pour cet email, un lien de réinitialisation du mot de passe a été envoyé.",
                },
            };
    }
};

const getMeResponse = (result: GetMeResult): { status: HttpStatus; body: GetMeResponseBody } => {
    switch (result.kind) {
        case "user_not_found":
            return { status: 404, body: { error: "Utilisateur introuvable" } };
        case "user_found":
            return {
                status: 200,
                body: { ...result.user },
            };
    }
};

const enable2faResponse = (result: Exclude<Enable2faResult, { kind: "already_enabled" }>): { status: number; body: Enable2faResponseBody } => {
    switch (result.kind) {
        case "unauthorized":
            return { status: 401, body: { error: "Non autorisé" } };
        case "invalid_session":
            return { status: 401, body: { error: "Session de configuration invalide ou expirée" } };
        case "invalid_totp_code":
            return { status: 401, body: { error: "Code TOTP invalide" } };
        case "setup_initiated":
            return {
                status: 200,
                body: { totpSecret: result.totpSecret, totpProvisioningUri: result.totpProvisioningUri },
            };
        case "two_factor_enabled":
            return { status: 200, body: { message: "Authentification à deux facteurs activée" } };
    }
};

authRouter.post("/auth/signup", validateBody(signupSchema), async (request, response) => {
    const result = await authUseCases.signup(request.body);
    respond(response, result, {
        missing_gdpr_consent: { status: 400, error: "Le consentement RGPD est requis" },
        weak_password: { status: 400, error: "Mot de passe trop faible. Minimum 12 caractères avec majuscule, minuscule, chiffre et symbole." },
        user_already_exists: { blocked: { type: "Creation", reason: "Un utilisateur avec cet email existe déjà" } },
        user_created: (r) => ({
            status: 201,
            body: {
                userId: r.user.id,
                email: r.user.email,
                message: "Utilisateur créé",
                totpSecret: r.twoFactor?.secret,
                totpProvisioningUri: r.twoFactor?.provisioningUri,
            },
        }),
    });
});

authRouter.post("/auth/login", validateBody(loginSchema), async (request, response) => {
    const httpResponse = loginResponse(await authUseCases.login(request.body));
    send(response, { status: httpResponse.status, body: httpResponse.body });
});

authRouter.post("/auth/login/2fa", validateBody(verify2faSchema), async (request, response) => {
    const httpResponse = verify2faResponse(await authUseCases.verify2fa(request.body));
    send(response, { status: httpResponse.status, body: httpResponse.body });
});

authRouter.post("/auth/2fa/enable", validateBody(enable2faSchema), async (request, response) => {
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

    if (result.kind === "already_enabled") {
        return void send(response, { blocked: { type: "Operation", reason: "L'authentification à deux facteurs est déjà activée" } });
    }
    const httpResponse = enable2faResponse(result);
    response.status(httpResponse.status).json(httpResponse.body);
});

authRouter.post("/auth/password/reset", ...authed(async (request, response) => {
    const { oldPassword, newPassword } = request.body as { oldPassword: string; newPassword: string };
    const result = await authUseCases.resetAuthenticatedPassword({
        userId: request.auth.userId,
        oldPassword,
        newPassword,
    });
    const httpResponse = resetPasswordResponse(result);
    send(response, { status: httpResponse.status, body: httpResponse.body });
}, resetPasswordSchema));

authRouter.post("/auth/password/reset-with-credentials", validateBody(resetWithCredentialsSchema), async (request, response) => {
    const httpResponse = resetPasswordResponse(await authUseCases.resetWithCredentials(request.body));
    send(response, { status: httpResponse.status, body: httpResponse.body });
});

authRouter.post("/auth/password/forgot", validateBody(forgotPasswordSchema), async (request, response) => {
    const httpResponse = requestPasswordResetResponse(await authUseCases.requestPasswordReset(request.body));
    send(response, { status: httpResponse.status, body: httpResponse.body });
});

authRouter.post("/auth/password/reset-with-token", validateBody(resetWithTokenSchema), async (request, response) => {
    const httpResponse = resetPasswordResponse(await authUseCases.resetWithToken(request.body));
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
        user_not_found: { status: 404, error: "Utilisateur introuvable" },
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
    send(response, { status: 200, body: { message: "Sessions 2FA expirées supprimées" } });
});

type DeleteAccountResult = Awaited<ReturnType<typeof authUseCases.deleteAccount>>;

const sendDeleteAccountResult = (result: DeleteAccountResult, response: Response): void => {
    respond(response, result, {
        user_not_found: { status: 404, error: "Utilisateur introuvable" },
        user_has_active_role: { blocked: { type: "Deletion", reason: "L'utilisateur a encore un rôle actif (retirez le rôle d'abord)" } },
        user_has_files: { blocked: { type: "Deletion", reason: "Le compte a des fichiers téléversés" } },
        user_has_messages: { blocked: { type: "Deletion", reason: "Le compte a envoyé des messages" } },
        user_has_message_reads: { blocked: { type: "Deletion", reason: "Le compte a des enregistrements de lecture de messages" } },
        user_has_audit_logs: { blocked: { type: "Deletion", reason: "Le compte a des entrées de journal d'audit" } },
        account_deleted: { status: 200, body: { message: "Compte supprimé" } },
    });
};

authRouter.delete("/users/:id", ...authed(async (request, response) => {
    const auth = getAuthFlags(request.auth);
    const result = await authUseCases.deleteAccount(String(request.params.id), auth);
    sendDeleteAccountResult(result, response);
}));
