import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { sessionUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";
import { patchBody, zDateString } from "@express/src/http/zod-schemas";
import { SessionMode } from "@domain/session/session.enums";

export const sessionRouter = Router();

const createSessionSchema = z.object({
    courseId: z.string().min(1),
    startTime: zDateString,
    endTime: zDateString,
    mode: z.enum(Object.values(SessionMode) as [string, ...string[]]),
    classroomId: z.string().min(1).nullish(),
});

const updateSessionSchema = patchBody({
    startTime: zDateString.optional(),
    endTime: zDateString.optional(),
    mode: z.enum(Object.values(SessionMode) as [string, ...string[]]).optional(),
    classroomId: z.string().min(1).nullable().optional(),
});

sessionRouter.get("/sessions", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionUseCases.list(auth);
    respond(res, result, {
        sessions_listed: (r) => ({ status: 200, body: r.sessions }),
    });
}));

sessionRouter.get("/sessions/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionUseCases.findById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session not found" },
        session_found: (r) => ({ status: 200, body: r.session }),
    });
}));

sessionRouter.post("/sessions", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionUseCases.create(req.body, auth);
    respond(res, result, {
        classroom_required: { status: 400, error: "classroomId is required for an ON_SITE session" },
        classroom_forbidden: { status: 400, error: "classroomId must be null for a REMOTE session" },
        invalid_time_range: { status: 400, error: "startTime must be before endTime" },
        course_not_found: { status: 404, error: "Course not found" },
        classroom_not_found: { status: 404, error: "Classroom not found" },
        classroom_conflict: { blocked: { type: "Creation", reason: "This classroom already has a session overlapping this time slot" } },
        instructor_conflict: { blocked: { type: "Creation", reason: "The instructor already has a session overlapping this time slot" } },
        classroom_capacity_exceeded: { blocked: { type: "Creation", reason: "Classroom capacity is lower than the group size" } },
        session_created: (r) => ({ status: 201, body: r.session }),
    });
}, createSessionSchema));

sessionRouter.patch("/sessions/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session not found" },
        classroom_required: { status: 400, error: "classroomId is required for an ON_SITE session" },
        invalid_time_range: { status: 400, error: "startTime must be before endTime" },
        classroom_not_found: { status: 404, error: "Classroom not found" },
        classroom_conflict: { blocked: { type: "Operation", reason: "This classroom already has a session overlapping this time slot" } },
        instructor_conflict: { blocked: { type: "Operation", reason: "The instructor already has a session overlapping this time slot" } },
        classroom_capacity_exceeded: { blocked: { type: "Operation", reason: "Classroom capacity is lower than the group size" } },
        session_updated: (r) => ({ status: 200, body: r.session }),
    });
}, updateSessionSchema));

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
    const auth = getAuthFlags(req.auth);
    const result = await sessionUseCases.listByCourse(String(req.params.courseId), auth);
    respond(res, result, {
        sessions_listed: (r) => ({ status: 200, body: r.sessions }),
    });
}));

sessionRouter.get("/classrooms/:classroomId/sessions", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionUseCases.listByClassroom(String(req.params.classroomId), auth);
    respond(res, result, {
        sessions_listed: (r) => ({ status: 200, body: r.sessions }),
    });
}));
