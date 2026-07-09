import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { externalUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";

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
        not_found: { status: 404, error: "External not found" },
        external_found: (r) => ({ status: 200, body: r.external }),
    });
}));

externalRouter.post("/externals", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await externalUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "firstname, lastname, email and type are required" },
        external_already_exists: { blocked: { type: "Creation", reason: "An external with this email already exists" } },
        external_created: (r) => ({ status: 201, body: r.external }),
    });
}));

externalRouter.patch("/externals/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await externalUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "External not found" },
        external_updated: (r) => ({ status: 200, body: r.external }),
    });
}));

externalRouter.delete("/externals/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await externalUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "External not found" },
        external_has_session_exams: { blocked: { type: "Deletion", reason: "External has session exam assignments" } },
        external_deleted: { status: 200, body: { message: "External deleted" } },
    });
}));
