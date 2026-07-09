import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { moduleUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";

export const moduleRouter = Router();

moduleRouter.get("/modules", ...authed(async (_req, res) => {
    const result = await moduleUseCases.list();
    send(res, { status: 200, body: result.modules });
}));

moduleRouter.get("/modules/:id", ...authed(async (req, res) => {
    const result = await moduleUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Module not found" },
        module_found: (r) => ({ status: 200, body: r.module }),
    });
}));

moduleRouter.post("/modules", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await moduleUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "name is required" },
        module_already_exists: { blocked: { type: "Creation", reason: "A module with this name and code already exists" } },
        module_created: (r) => ({ status: 201, body: r.module }),
    });
}));

moduleRouter.patch("/modules/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await moduleUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Module not found" },
        module_already_exists: { blocked: { type: "Creation", reason: "A module with this name and code already exists" } },
        module_updated: (r) => ({ status: 200, body: r.module }),
    });
}));

moduleRouter.delete("/modules/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await moduleUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Module not found" },
        module_has_programs: { blocked: { type: "Deletion", reason: "Module has programs" } },
        module_has_courses: { blocked: { type: "Deletion", reason: "Module has courses" } },
        module_has_notations: { blocked: { type: "Deletion", reason: "Module has manual notations" } },
        module_deleted: { status: 200, body: { message: "Module deleted" } },
    });
}));

moduleRouter.get("/modules/:id/courses", ...authed(async (req, res) => {
    const { courseUseCases } = await import("@express/src/container");
    const result = await courseUseCases.listByModule(String(req.params.id));
    respond(res, result, {
        courses_listed: (r) => ({ status: 200, body: r.courses }),
    });
}));
