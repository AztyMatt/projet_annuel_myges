import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { moduleUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createModuleSchema = z.object({ name: z.string().min(1), code: z.string().optional() });
const updateModuleSchema = patchBody({ name: z.string().min(1).optional(), code: z.string().optional() });

export const moduleRouter = Router();

moduleRouter.get("/modules", ...authed(async (_req, res) => {
    const result = await moduleUseCases.list();
    send(res, { status: 200, body: result.modules });
}));

moduleRouter.get("/modules/:id", ...authed(async (req, res) => {
    const result = await moduleUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Module introuvable" },
        module_found: (r) => ({ status: 200, body: r.module }),
    });
}));

moduleRouter.post("/modules", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await moduleUseCases.create(req.body, auth);
    respond(res, result, {
        module_already_exists: { blocked: { type: "Creation", reason: "Un module avec ce nom et ce code existe déjà" } },
        module_code_exists: { blocked: { type: "Creation", reason: "Un module avec ce code existe déjà" } },
        module_created: (r) => ({ status: 201, body: r.module }),
    });
}, createModuleSchema));

moduleRouter.patch("/modules/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await moduleUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Module introuvable" },
        module_already_exists: { blocked: { type: "Operation", reason: "Un module avec ce nom et ce code existe déjà" } },
        module_code_exists: { blocked: { type: "Operation", reason: "Un module avec ce code existe déjà" } },
        module_updated: (r) => ({ status: 200, body: r.module }),
    });
}, updateModuleSchema));

moduleRouter.delete("/modules/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await moduleUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Module introuvable" },
        module_has_programs: { blocked: { type: "Deletion", reason: "Le module a des filières" } },
        module_has_courses: { blocked: { type: "Deletion", reason: "Le module a des cours" } },
        module_has_notations: { blocked: { type: "Deletion", reason: "Le module a des notations manuelles" } },
        module_deleted: { status: 200, body: { message: "Module supprimé" } },
    });
}));

moduleRouter.get("/modules/:id/courses", ...authed(async (req, res) => {
    const { courseUseCases } = await import("@express/src/container");
    const result = await courseUseCases.listByModule(String(req.params.id));
    respond(res, result, {
        courses_listed: (r) => ({ status: 200, body: r.courses }),
    });
}));
