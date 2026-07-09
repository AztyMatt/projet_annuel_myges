import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { campusUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";

export const campusRouter = Router();

campusRouter.get("/campuses", ...authed(async (_req, res) => {
    const result = await campusUseCases.list();
    send(res, { status: 200, body: result.campuses });
}));

campusRouter.get("/campuses/:id", ...authed(async (req, res) => {
    const result = await campusUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Campus not found" },
        campus_found: (r) => ({ status: 200, body: r.campus }),
    });
}));

campusRouter.post("/campuses", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await campusUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "name and address are required" },
        campus_already_exists: { blocked: { type: "Creation", reason: "A campus with this name already exists" } },
        campus_created: (r) => ({ status: 201, body: r.campus }),
    });
}));

campusRouter.patch("/campuses/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await campusUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Campus not found" },
        campus_updated: (r) => ({ status: 200, body: r.campus }),
    });
}));

campusRouter.delete("/campuses/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await campusUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Campus not found" },
        campus_has_classrooms: { blocked: { type: "Deletion", reason: "Campus has classrooms" } },
        campus_deleted: { status: 200, body: { message: "Campus deleted" } },
    });
}));

campusRouter.get("/campuses/:id/classrooms", ...authed(async (req, res) => {
    const { classroomUseCases } = await import("@express/src/container");
    const result = await classroomUseCases.listByCampus(String(req.params.id));
    send(res, { status: 200, body: result.classrooms });
}));
