import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { blocUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";

export const blocRouter = Router();

blocRouter.get("/blocs", ...authed(async (_req, res) => {
    const result = await blocUseCases.list();
    respond(res, result, {
        blocs_listed: (r) => ({ status: 200, body: r.blocs }),
    });
}));

blocRouter.get("/blocs/:id", ...authed(async (req, res) => {
    const result = await blocUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Bloc not found" },
        bloc_found: (r) => ({ status: 200, body: r.bloc }),
    });
}));

blocRouter.post("/blocs", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await blocUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "name and programId are required" },
        bloc_already_exists: { blocked: { type: "Creation", reason: "A bloc with this name already exists in this program" } },
        bloc_created: (r) => ({ status: 201, body: r.bloc }),
    });
}));

blocRouter.patch("/blocs/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await blocUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Bloc not found" },
        bloc_updated: (r) => ({ status: 200, body: r.bloc }),
    });
}));

blocRouter.delete("/blocs/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await blocUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Bloc not found" },
        bloc_has_courses: { blocked: { type: "Deletion", reason: "Bloc has courses" } },
        bloc_deleted: { status: 200, body: { message: "Bloc deleted" } },
    });
}));

blocRouter.get("/blocs/:id/courses", ...authed(async (req, res) => {
    const { courseUseCases } = await import("@express/src/container");
    const result = await courseUseCases.listByBloc(String(req.params.id));
    respond(res, result, {
        courses_listed: (r) => ({ status: 200, body: r.courses }),
    });
}));
