import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { gradeUseCases } from "@express/src/container";
import { send, respond } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";
import { GRADE_MAX_VALUE } from "@domain/grade/grade.policy";

export const gradeRouter = Router();

const createGradeSchema = z.object({
    studentId: z.string().min(1),
    value: z.number(),
    isRetake: z.boolean().optional(),
});

const updateGradeSchema = patchBody({
    value: z.number().optional(),
});

const linkGradeAssessmentSchema = z.object({
    gradeId: z.string().min(1),
    assessmentId: z.string().min(1),
});

const linkGradeSessionExamSchema = z.object({
    gradeId: z.string().min(1),
    sessionExamId: z.string().min(1),
});

const linkGradeManualNotationSchema = z.object({
    gradeId: z.string().min(1),
    gradeManualId: z.string().min(1),
});

const createManualNotationSchema = z.object({
    moduleId: z.string().min(1),
    name: z.string().min(1),
});

const updateManualNotationSchema = patchBody({
    moduleId: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
});

gradeRouter.get("/grades", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.list(auth);
    respond(res, result, {
        grades_listed: (r) => ({ status: 200, body: r.grades }),
    });
}));

gradeRouter.get("/grades/student/:studentId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.listByStudent(String(req.params.studentId), auth);
    respond(res, result, {
        grades_listed: (r) => ({ status: 200, body: r.grades }),
    });
}));

gradeRouter.get("/grades/assessment/:assessmentId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.listByAssessment(String(req.params.assessmentId), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Évaluation introuvable" },
        grades_listed: (r) => ({ status: 200, body: r.grades }),
    });
}));

gradeRouter.get("/grades/mine", ...authed(async (req, res) => {
    const result = await gradeUseCases.listMine(getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Profil étudiant introuvable" },
        grades_listed: (r) => ({ status: 200, body: r.grades }),
    });
}));

gradeRouter.get("/grades/:id", ...authed(async (req, res) => {
    const result = await gradeUseCases.findById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Note introuvable" },
        grade_found: (r) => ({ status: 200, body: r.grade }),
    });
}));

gradeRouter.post("/grades", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.create(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Étudiant introuvable" },
        grade_out_of_range: { status: 400, error: `La note doit être comprise entre 0 et ${GRADE_MAX_VALUE}` },
        grade_created: (r) => ({ status: 201, body: r.grade }),
    });
}, createGradeSchema));

gradeRouter.patch("/grades/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.update(String(req.params.id), { value: req.body.value }, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Note introuvable" },
        grade_out_of_range: { status: 400, error: `La note doit être comprise entre 0 et ${GRADE_MAX_VALUE}` },
        grade_is_locked: { blocked: { type: "Operation", reason: "Cette note est verrouillée" } },
        grade_updated: (r) => ({ status: 200, body: r.grade }),
    });
}, updateGradeSchema));

gradeRouter.post("/grades/:id/lock", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.lock(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Note introuvable" },
        grade_locked_ok: (r) => ({ status: 200, body: r.grade }),
    });
}));

gradeRouter.post("/grades/:id/unlock", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.unlock(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Note introuvable" },
        grade_locked_ok: (r) => ({ status: 200, body: r.grade }),
    });
}));

gradeRouter.delete("/grades/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Note introuvable" },
        not_owner: { status: 403, error: "Accès refusé : vous ne pouvez supprimer qu'une note que vous avez saisie vous-même" },
        grade_has_no_owner: { status: 403, error: "Accès refusé : cette note n'a pas de propriétaire, seul un super administrateur peut la supprimer" },
        grade_is_locked: { blocked: { type: "Operation", reason: "Cette note est verrouillée" } },
        grade_deleted: { status: 200, body: { message: "Note supprimée" } },
    });
}));

gradeRouter.get("/grade-assessments/grade/:gradeId", ...authed(async (req, res) => {
    const result = await gradeUseCases.listAssessmentLinksByGrade(String(req.params.gradeId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Note introuvable" },
        grade_assessments_listed: (r) => ({ status: 200, body: r.gradeAssessments }),
    });
}));

gradeRouter.get("/grade-assessments/assessment/:assessmentId", ...authed(async (req, res) => {
    const result = await gradeUseCases.listAssessmentLinksByAssessment(String(req.params.assessmentId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Évaluation introuvable" },
        grade_assessments_listed: (r) => ({ status: 200, body: r.gradeAssessments }),
    });
}));

gradeRouter.get("/grade-assessments/:id", ...authed(async (req, res) => {
    const result = await gradeUseCases.findAssessmentLinkById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Lien de note introuvable" },
        grade_assessment_found: (r) => ({ status: 200, body: r.gradeAssessment }),
    });
}));

gradeRouter.post("/grade-assessments", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.linkAssessment(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Note ou évaluation introuvable" },
        grade_is_locked: { blocked: { type: "Creation", reason: "Cette note est verrouillée" } },
        grade_assessment_already_exists: { blocked: { type: "Creation", reason: "Cette note est déjà liée à cette évaluation" } },
        grade_already_has_source: { blocked: { type: "Creation", reason: "la note est déjà liée à une autre source" } },
        duplicate_grade_for_student: { blocked: { type: "Creation", reason: "Cet étudiant a déjà une note pour cette évaluation avec le même statut de rattrapage" } },
        grade_assessment_linked: (r) => ({ status: 201, body: r.gradeAssessment }),
    });
}, linkGradeAssessmentSchema));

gradeRouter.get("/grade-session-exams/grade/:gradeId", ...authed(async (req, res) => {
    const result = await gradeUseCases.listSessionExamLinksByGrade(String(req.params.gradeId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Note introuvable" },
        grade_session_exams_listed: (r) => ({ status: 200, body: r.gradeSessionExams }),
    });
}));

gradeRouter.get("/grade-session-exams/session-exam/:sessionExamId", ...authed(async (req, res) => {
    const result = await gradeUseCases.listSessionExamLinksBySessionExam(String(req.params.sessionExamId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Session d'examen introuvable" },
        grade_session_exams_listed: (r) => ({ status: 200, body: r.gradeSessionExams }),
    });
}));

gradeRouter.get("/grade-session-exams/:id", ...authed(async (req, res) => {
    const result = await gradeUseCases.findSessionExamLinkById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Lien de note de session d'examen introuvable" },
        grade_session_exam_found: (r) => ({ status: 200, body: r.gradeSessionExam }),
    });
}));

gradeRouter.post("/grade-session-exams", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.linkSessionExam(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Note ou session d'examen introuvable" },
        exam_session_not_found: { status: 404, error: "La session de l'examen n'existe plus" },
        grade_is_locked: { blocked: { type: "Creation", reason: "Cette note est verrouillée" } },
        session_not_started: { blocked: { type: "Creation", reason: "La session d'examen n'a pas encore commencé" } },
        student_not_registered_for_exam: { blocked: { type: "Creation", reason: "Cet étudiant n'est pas inscrit à cet examen" } },
        grade_session_exam_already_exists: { blocked: { type: "Creation", reason: "Cette note est déjà liée à cette session d'examen" } },
        grade_already_has_source: { blocked: { type: "Creation", reason: "la note est déjà liée à une autre source" } },
        grade_session_exam_linked: (r) => ({ status: 201, body: r.gradeSessionExam }),
    });
}, linkGradeSessionExamSchema));

gradeRouter.get("/grade-manual-notations/grade/:gradeId", ...authed(async (req, res) => {
    const result = await gradeUseCases.listManualNotationLinksByGrade(String(req.params.gradeId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Note introuvable" },
        grade_manual_notations_listed: (r) => ({ status: 200, body: r.gradeManualNotations }),
    });
}));

gradeRouter.get("/grade-manual-notations/manual/:gradeManualId", ...authed(async (req, res) => {
    const result = await gradeUseCases.listManualNotationLinksByGradeManual(String(req.params.gradeManualId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Notation manuelle introuvable" },
        grade_manual_notations_listed: (r) => ({ status: 200, body: r.gradeManualNotations }),
    });
}));

gradeRouter.get("/grade-manual-notations/:id", ...authed(async (req, res) => {
    const result = await gradeUseCases.findManualNotationLinkById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Lien de notation manuelle introuvable" },
        grade_manual_notation_found: (r) => ({ status: 200, body: r.gradeManualNotation }),
    });
}));

gradeRouter.post("/grade-manual-notations", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.linkManualNotation(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Note ou notation manuelle introuvable" },
        grade_is_locked: { blocked: { type: "Creation", reason: "Cette note est verrouillée" } },
        grade_manual_notation_already_exists: { blocked: { type: "Creation", reason: "Cette note est déjà liée à cette notation manuelle" } },
        grade_already_has_source: { blocked: { type: "Creation", reason: "la note est déjà liée à une autre source" } },
        grade_manual_notation_linked: (r) => ({ status: 201, body: r.gradeManualNotation }),
    });
}, linkGradeManualNotationSchema));

gradeRouter.get("/manual-notations", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.listManualNotations(auth);
    respond(res, result, {
        manual_notations_listed: (r) => ({ status: 200, body: r.manualNotations }),
    });
}));

gradeRouter.get("/manual-notations/module/:moduleId", ...authed(async (req, res) => {
    const result = await gradeUseCases.listManualNotationsByModule(String(req.params.moduleId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Module introuvable" },
        manual_notations_listed: (r) => ({ status: 200, body: r.manualNotations }),
    });
}));

gradeRouter.get("/manual-notations/:id", ...authed(async (req, res) => {
    const result = await gradeUseCases.findManualNotationById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Notation manuelle introuvable" },
        manual_notation_found: (r) => ({ status: 200, body: r.manualNotation }),
    });
}));

gradeRouter.post("/manual-notations", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.createManualNotation(req.body, auth);
    respond(res, result, {
        notation_already_exists: { blocked: { type: "Creation", reason: "Une notation manuelle avec ce nom existe déjà pour ce module" } },
        manual_notation_created: (r) => ({ status: 201, body: r.manualNotation }),
    });
}, createManualNotationSchema));

gradeRouter.patch("/manual-notations/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.updateManualNotation(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Notation manuelle introuvable" },
        notation_already_exists: { blocked: { type: "Operation", reason: "Une notation manuelle avec ce nom existe déjà pour ce module" } },
        manual_notation_updated: (r) => ({ status: 200, body: r.manualNotation }),
    });
}, updateManualNotationSchema));

gradeRouter.delete("/manual-notations/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await gradeUseCases.deleteManualNotation(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Notation manuelle introuvable" },
        manual_notation_has_grades: { blocked: { type: "Deletion", reason: "Cette notation manuelle a des notes" } },
        manual_notation_deleted: { status: 200, body: { message: "Notation manuelle supprimée" } },
    });
}));
