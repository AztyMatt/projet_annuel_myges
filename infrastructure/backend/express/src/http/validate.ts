import { type NextFunction, type Request, type Response } from "express";
import { type ZodType } from "zod";
import { send } from "@express/src/http/responses";

export const validateBody =
    (schema: ZodType) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const details = result.error.issues
                .map((issue) => `${issue.path.join(".") || "(body)"}: ${issue.message}`)
                .join("; ");
            return void send(res, { status: 400, error: `Corps de requête invalide : ${details}` });
        }
        req.body = result.data;
        next();
    };
