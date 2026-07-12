import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { studentUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";

const createStudentSchema = z.object({ userId: z.string().min(1), programId: z.string().min(1) });
const updateStudentSchema = patchBody({ programId: z.string().min(1).optional() });

export const studentRouter = Router();

studentRouter.get("/students", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await studentUseCases.list(auth);
    respond(res, result, {
        students_listed: (r) => ({ status: 200, body: r.students }),
    });
}));

studentRouter.get("/students/me", ...authed(async (req, res) => {
    const result = await studentUseCases.findByUserId(req.auth.userId);
    respond(res, result, {
        not_found: { status: 404, error: "Profil étudiant introuvable" },
        student_found: (r) => ({ status: 200, body: r.student }),
    });
}));

studentRouter.get("/students/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await studentUseCases.findById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Étudiant introuvable" },
        student_found: (r) => ({ status: 200, body: r.student }),
    });
}));

studentRouter.post("/students", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await studentUseCases.create(req.body, auth);
    respond(res, result, {
        user_not_found: { status: 404, error: "Utilisateur introuvable" },
        program_not_found: { status: 404, error: "Filière introuvable" },
        user_already_student: { blocked: { type: "Creation", reason: "Cet utilisateur est déjà étudiant" } },
        student_created: (r) => ({ status: 201, body: r.student }),
    });
}, createStudentSchema));

studentRouter.patch("/students/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await studentUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Étudiant introuvable" },
        program_not_found: { status: 404, error: "Filière introuvable" },
        student_updated: (r) => ({ status: 200, body: r.student }),
    });
}, updateStudentSchema));

studentRouter.delete("/students/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await studentUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Étudiant introuvable" },
        student_in_groups: { blocked: { type: "Deletion", reason: "L'étudiant a des groupes" } },
        student_has_absences: { blocked: { type: "Deletion", reason: "L'étudiant a des absences" } },
        student_has_session_exams: { blocked: { type: "Deletion", reason: "L'étudiant a des inscriptions à des examens" } },
        student_in_assessment_groups: { blocked: { type: "Deletion", reason: "L'étudiant appartient à des groupes d'évaluation" } },
        student_has_documents: { blocked: { type: "Deletion", reason: "L'étudiant a des documents" } },
        student_deleted: { status: 200, body: { message: "Étudiant supprimé" } },
    });
}));
