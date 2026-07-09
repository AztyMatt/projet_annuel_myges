import { Router } from "express";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { classroomUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";

export const classroomRouter = Router();

classroomRouter.get("/classrooms", ...authed(async (_req, res) => {
    const result = await classroomUseCases.list();
    send(res, { status: 200, body: result.classrooms });
}));

classroomRouter.get("/classrooms/:id", ...authed(async (req, res) => {
    const result = await classroomUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Classroom not found" },
        classroom_found: (r) => ({ status: 200, body: r.classroom }),
    });
}));

classroomRouter.post("/classrooms", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classroomUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "name, capacity and campusId are required" },
        classroom_already_exists: { blocked: { type: "Creation", reason: "A classroom with this name already exists in this campus" } },
        classroom_created: (r) => ({ status: 201, body: r.classroom }),
    });
}));

classroomRouter.patch("/classrooms/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classroomUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Classroom not found" },
        classroom_updated: (r) => ({ status: 200, body: r.classroom }),
    });
}));

classroomRouter.delete("/classrooms/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await classroomUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Classroom not found" },
        classroom_has_sessions: { blocked: { type: "Deletion", reason: "Classroom has sessions" } },
        classroom_deleted: { status: 200, body: { message: "Classroom deleted" } },
    });
}));
