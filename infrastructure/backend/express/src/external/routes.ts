import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { ExternalType } from "@domain/external/external.enums";
import { externalUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createExternalSchema = z.object({
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    email: z.email(),
    type: z.enum(Object.values(ExternalType) as [string, ...string[]]),
});
const updateExternalSchema = patchBody({
    firstname: z.string().min(1).optional(),
    lastname: z.string().min(1).optional(),
    email: z.email().optional(),
    type: z.enum(Object.values(ExternalType) as [string, ...string[]]).optional(),
});

export const externalRouter = Router();

externalRouter.get("/externals", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await externalUseCases.list(auth);
    respond(res, result, {
        externals_listed: (r) => ({ status: 200, body: r.externals }),
    });
}));

externalRouter.get("/externals/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await externalUseCases.findById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Externe introuvable" },
        external_found: (r) => ({ status: 200, body: r.external }),
    });
}));

externalRouter.post("/externals", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await externalUseCases.create(req.body, auth);
    respond(res, result, {
        external_already_exists: { blocked: { type: "Creation", reason: "Un externe avec cet email existe déjà" } },
        external_created: (r) => ({ status: 201, body: r.external }),
    });
}, createExternalSchema));

externalRouter.patch("/externals/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await externalUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Externe introuvable" },
        external_already_exists: { blocked: { type: "Operation", reason: "Un externe avec cet email existe déjà" } },
        external_updated: (r) => ({ status: 200, body: r.external }),
    });
}, updateExternalSchema));

externalRouter.delete("/externals/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await externalUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Externe introuvable" },
        external_has_session_exams: { blocked: { type: "Deletion", reason: "L'externe a des affectations à des sessions d'examen" } },
        external_deleted: { status: 200, body: { message: "Externe supprimé" } },
    });
}));
