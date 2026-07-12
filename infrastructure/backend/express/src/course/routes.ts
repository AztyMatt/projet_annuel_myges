import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags, sendForbidden } from "@express/src/auth/middleware";
import { Role } from "@domain/auth/user.enums";
import { courseUseCases, instructorUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createCourseSchema = z.object({
    instructorId: z.string().min(1),
    moduleId: z.string().min(1),
    classId: z.string().min(1),
    groupId: z.string().optional(),
    blocId: z.string().min(1),
});
const updateCourseSchema = patchBody({
    instructorId: z.string().min(1).optional(),
    moduleId: z.string().min(1).optional(),
    groupId: z.string().optional(),
    blocId: z.string().min(1).optional(),
});

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
        return void sendForbidden(res, "Accès refusé : réservé aux intervenants");
    const instructor = await instructorUseCases.findByUserId(req.auth.userId);
    if (instructor.kind === "not_found") return void send(res, { status: 404, error: "Profil d'intervenant introuvable" });
    if (instructor.kind === "forbidden") return void sendForbidden(res);
    const result = await courseUseCases.listByInstructor(instructor.instructor.id, getAuthFlags(req.auth));
    respond(res, result, {
        courses_listed: (r) => ({ status: 200, body: r.courses }),
    });
}));

courseRouter.get("/courses/:id", ...authed(async (req, res) => {
    const result = await courseUseCases.findById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Cours introuvable" },
        course_found: (r) => ({ status: 200, body: r.course }),
    });
}));

courseRouter.post("/courses", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await courseUseCases.create(req.body, auth);
    respond(res, result, {
        group_not_found: { status: 404, error: "Groupe introuvable" },
        group_not_in_class: { blocked: { type: "Creation", reason: "Le groupe n'appartient pas à cette classe" } },
        class_not_found: { status: 404, error: "Classe introuvable" },
        instructor_not_found: { status: 404, error: "Intervenant introuvable" },
        module_not_in_program: { blocked: { type: "Creation", reason: "Le module n'appartient pas au programme du groupe" } },
        bloc_not_in_program: { blocked: { type: "Creation", reason: "Le bloc n'appartient pas au programme du groupe" } },
        course_already_exists: { blocked: { type: "Creation", reason: "Un cours avec cet intervenant, ce module et ce groupe existe déjà" } },
        course_created: (r) => ({ status: 201, body: r.course }),
    });
}, createCourseSchema));

courseRouter.patch("/courses/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await courseUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Cours introuvable" },
        group_not_found: { status: 404, error: "Groupe introuvable" },
        class_not_found: { status: 404, error: "Classe introuvable pour ce groupe" },
        instructor_not_found: { status: 404, error: "Intervenant introuvable" },
        module_not_in_program: { blocked: { type: "Operation", reason: "Le module n'appartient pas au programme du groupe" } },
        bloc_not_in_program: { blocked: { type: "Operation", reason: "Le bloc n'appartient pas au programme du groupe" } },
        course_already_exists: { blocked: { type: "Operation", reason: "Un cours avec cet intervenant, ce module et ce groupe existe déjà" } },
        course_updated: (r) => ({ status: 200, body: r.course }),
    });
}, updateCourseSchema));

courseRouter.delete("/courses/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await courseUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Cours introuvable" },
        course_has_sessions: { blocked: { type: "Deletion", reason: "Le cours a des sessions" } },
        course_has_assessments: { blocked: { type: "Deletion", reason: "Le cours a des évaluations" } },
        course_deleted_with_warnings: (r) => ({ status: 200, body: { message: "Cours supprimé", storageWarnings: r.failedPaths } }),
        course_deleted: { status: 200, body: { message: "Cours supprimé" } },
    });
}));
