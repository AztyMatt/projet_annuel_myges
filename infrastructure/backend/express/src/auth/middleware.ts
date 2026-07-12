import { type NextFunction, type Request, type RequestHandler, type Response } from "express";
import { type ZodType } from "zod";
import { tokenProvider } from "@express/src/auth/token-provider.adapter";
import { Role } from "@domain/auth/user.enums";
import { capabilitiesForRole } from "@domain/auth/authorization-policy";
import { type AuthContext } from "@application/types/auth-context";
import { send, FORBIDDEN_MESSAGE, UNAUTHORIZED_MESSAGE } from "@express/src/http/responses";
import { validateBody } from "@express/src/http/validate";

export type AuthRequest = Request & {
    auth?: { userId: string; role: Role; email: string };
};

export type AuthedRequest = AuthRequest & { auth: NonNullable<AuthRequest["auth"]> };

export const getAuthFlags = (auth: NonNullable<AuthRequest["auth"]>): AuthContext => ({
    requesterId: auth.userId,
    ...capabilitiesForRole(auth.role),
});

export const sendForbidden = (res: Response, message = FORBIDDEN_MESSAGE): void => {
    send(res, { status: 403, error: message });
};

export const sendUnauthorized = (res: Response, message = UNAUTHORIZED_MESSAGE): void => {
    send(res, { status: 401, error: message });
};

export const requireAuth = (request: AuthRequest, response: Response, nextFunction: NextFunction): void => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        sendUnauthorized(response);
        return;
    }
    try {
        const token = authorization.slice("Bearer ".length);
        const payload = tokenProvider.verify(token);
        request.auth = { userId: payload.sub, role: payload.role, email: payload.email };
        nextFunction();
    } catch {
        sendUnauthorized(response, "Invalid token");
    }
};

export const authed = (
    handler: (req: AuthedRequest, res: Response) => unknown,
    bodySchema?: ZodType,
): RequestHandler[] => [
    requireAuth,

    ...(bodySchema ? [validateBody(bodySchema)] : []),
    (req: AuthRequest, res, next) => {
        if (!req.auth) return void sendUnauthorized(res);
        Promise.resolve()
            .then(() => handler(req as AuthedRequest, res))
            .catch(next);
    },
];

export const requireCronSecret = (request: Request, response: Response, nextFunction: NextFunction): void => {
    const authorization = request.headers.authorization;
    const secret = process.env.CRON_SECRET;
    if (!secret || !authorization || authorization !== `Bearer ${secret}`) {
        sendUnauthorized(response);
        return;
    }
    nextFunction();
};
