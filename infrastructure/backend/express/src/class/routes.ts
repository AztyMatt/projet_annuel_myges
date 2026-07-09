import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { classUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";

export const classRouter = Router();

classRouter.get("/classes", ...authed(async (_req, res) => {
    const result = await classUseCases.list();
    send(res, { status: 200, body: result.classes });
}));

classRouter.get("/classes/:id", ...authed(async (req, res) => {
    const result = await classUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Class not found" },
        class_found: (r) => ({ status: 200, body: r.class }),
    });
}));

classRouter.post("/classes", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "number, programId and size are required" },
        class_number_already_exists: { blocked: { type: "Creation", reason: "A class with this number already exists in this program" } },
        class_created: (r) => ({ status: 201, body: r.class }),
    });
}));

classRouter.patch("/classes/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Class not found" },
        class_updated: (r) => ({ status: 200, body: r.class }),
    });
}));

classRouter.delete("/classes/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Class not found" },
        class_has_groups_with_courses: { blocked: { type: "Deletion", reason: "Class has groups with courses (delete the courses first)" } },
        class_deleted: { status: 200, body: { message: "Class deleted" } },
    });
}));

classRouter.get("/classes/:id/groups", ...authed(async (req, res) => {
    const { groupUseCases } = await import("@express/src/container");
    const result = await groupUseCases.listByClass(String(req.params.id));
    send(res, { status: 200, body: result.groups });
}));
