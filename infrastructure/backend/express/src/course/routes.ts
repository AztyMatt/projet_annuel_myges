import { Router } from "express";
import { authed, getAuthFlags, sendForbidden } from "@express/src/auth/middleware";
import { Role } from "@domain/auth/user.enums";
import { courseUseCases, instructorUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";

export const courseRouter = Router();

courseRouter.get("/courses", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await courseUseCases.list(auth);
    respond(res, result, {
        courses_listed: (r) => ({ status: 200, body: r.courses }),
    });
}));

courseRouter.get("/courses/mine", ...authed(async (req, res) => {
    if (req.auth.role !== Role.INSTRUCTOR)
        return void sendForbidden(res, "Forbidden: only instructors can access this");
    const instructor = await instructorUseCases.findByUserId(req.auth.userId);
    if (instructor.kind === "not_found") return void send(res, { status: 404, error: "Instructor profile not found" });
    if (instructor.kind === "forbidden") return void sendForbidden(res);
    const result = await courseUseCases.listByInstructor(instructor.instructor.id);
    respond(res, result, {
        courses_listed: (r) => ({ status: 200, body: r.courses }),
    });
}));

courseRouter.get("/courses/:id", ...authed(async (req, res) => {
    const result = await courseUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Course not found" },
        course_found: (r) => ({ status: 200, body: r.course }),
    });
}));

courseRouter.post("/courses", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await courseUseCases.create(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "instructorId, moduleId, groupId and blocId are required" },
        course_already_exists: { blocked: { type: "Creation", reason: "A course with this instructor, module and group already exists" } },
        course_created: (r) => ({ status: 201, body: r.course }),
    });
}));

courseRouter.patch("/courses/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await courseUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Course not found" },
        course_updated: (r) => ({ status: 200, body: r.course }),
    });
}));

courseRouter.delete("/courses/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await courseUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Course not found" },
        course_has_sessions: { blocked: { type: "Deletion", reason: "Course has sessions" } },
        course_has_assessments: { blocked: { type: "Deletion", reason: "Course has assessments" } },
        course_deleted_with_warnings: (r) => ({ status: 200, body: { message: "Course deleted", storageWarnings: r.failedPaths } }),
        course_deleted: { status: 200, body: { message: "Course deleted" } },
    });
}));
