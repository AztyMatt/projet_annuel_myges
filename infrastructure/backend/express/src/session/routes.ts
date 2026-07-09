import { Router } from "express";
import { authed, getAuthFlags, sendForbidden } from "@express/src/auth/middleware";
import { sessionUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";

export const sessionRouter = Router();

sessionRouter.get("/sessions", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    if (!auth.isAdmin) return void sendForbidden(res);
    const result = await sessionUseCases.list();
    send(res, { status: 200, body: result.sessions });
}));

sessionRouter.get("/sessions/:id", ...authed(async (req, res) => {
    const result = await sessionUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Session not found" },
        session_found: (r) => ({ status: 200, body: r.session }),
    });
}));

sessionRouter.post("/sessions", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "courseId, startTime, endTime and mode are required" },
        classroom_required: { status: 400, error: "classroomId is required for an ON_SITE session" },
        classroom_forbidden: { status: 400, error: "classroomId must be null for a REMOTE session" },
        classroom_conflict: { blocked: { type: "Creation", reason: "A session with this course, classroom and time slot already exists" } },
        session_created: (r) => ({ status: 201, body: r.session }),
    });
}));

sessionRouter.patch("/sessions/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session not found" },
        classroom_conflict: { blocked: { type: "Creation", reason: "A session with this course, classroom and time slot already exists" } },
        session_updated: (r) => ({ status: 200, body: r.session }),
    });
}));

sessionRouter.delete("/sessions/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session not found" },
        session_has_exams: { blocked: { type: "Deletion", reason: "Session has session exams" } },
        session_has_absences: { blocked: { type: "Deletion", reason: "Session has absences" } },
        session_deleted: { status: 200, body: { message: "Session deleted" } },
    });
}));

sessionRouter.get("/courses/:courseId/sessions", ...authed(async (req, res) => {
    const result = await sessionUseCases.listByCourse(String(req.params.courseId));
    send(res, { status: 200, body: result.sessions });
}));

sessionRouter.get("/classrooms/:classroomId/sessions", ...authed(async (req, res) => {
    const result = await sessionUseCases.listByClassroom(String(req.params.classroomId));
    send(res, { status: 200, body: result.sessions });
}));
