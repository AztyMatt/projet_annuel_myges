import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { InstructorContractType } from "@domain/instructor/instructor.enums";
import { instructorUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createInstructorSchema = z.object({
    userId: z.string().min(1),
    contractType: z.enum(Object.values(InstructorContractType) as [string, ...string[]]),
    specialties: z.array(z.string()).optional(),
});
const updateInstructorSchema = patchBody({
    contractType: z.enum(Object.values(InstructorContractType) as [string, ...string[]]).optional(),
    specialties: z.array(z.string()).optional(),
});

export const instructorRouter = Router();

instructorRouter.get("/instructors", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await instructorUseCases.list(auth);
    respond(res, result, {
        instructors_listed: (r) => ({ status: 200, body: r.instructors }),
    });
}));

instructorRouter.get("/instructors/me", ...authed(async (req, res) => {
    const result = await instructorUseCases.findByUserId(req.auth.userId);
    respond(res, result, {
        not_found: { status: 404, error: "Instructor profile not found" },
        instructor_found: (r) => ({ status: 200, body: r.instructor }),
    });
}));

instructorRouter.get("/instructors/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await instructorUseCases.findById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Instructor not found" },
        instructor_found: (r) => ({ status: 200, body: r.instructor }),
    });
}));

instructorRouter.post("/instructors", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await instructorUseCases.create(req.body, auth);
    respond(res, result, {
        user_not_found: { status: 404, error: "User not found" },
        user_already_instructor: { blocked: { type: "Creation", reason: "This user is already an instructor" } },
        instructor_created: (r) => ({ status: 201, body: r.instructor }),
    });
}, createInstructorSchema));

instructorRouter.patch("/instructors/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await instructorUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Instructor not found" },
        instructor_updated: (r) => ({ status: 200, body: r.instructor }),
    });
}, updateInstructorSchema));

instructorRouter.delete("/instructors/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await instructorUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Instructor not found" },
        instructor_has_courses: { blocked: { type: "Deletion", reason: "Instructor has courses" } },
        instructor_has_session_exams: { blocked: { type: "Deletion", reason: "Instructor has session exam assignments" } },
        instructor_deleted: { status: 200, body: { message: "Instructor deleted" } },
    });
}));

instructorRouter.get("/instructors/:id/courses", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const { courseUseCases } = await import("@express/src/container");
    const result = await courseUseCases.listByInstructor(String(req.params.id), auth);
    respond(res, result, {
        courses_listed: (r) => ({ status: 200, body: r.courses }),
    });
}));
