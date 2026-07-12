import { Router } from "express";
import { z } from "zod";
import { authed, getAuthFlags } from "@express/src/auth/middleware";
import { sessionExamUseCases } from "@express/src/container";
import { respond } from "@express/src/http/responses";
import { patchBody } from "@express/src/http/zod-schemas";
import { SessionExamType } from "@domain/session/session-exam/session-exam.enums";

export const sessionExamRouter = Router();

const createSessionExamSchema = z.object({
    sessionId: z.string().min(1),
    type: z.enum(Object.values(SessionExamType) as [string, ...string[]]),
    isRetake: z.boolean().optional(),
    assessmentId: z.string().nullish(),
});

const updateSessionExamSchema = patchBody({
    type: z.enum(Object.values(SessionExamType) as [string, ...string[]]).optional(),
    isRetake: z.boolean().optional(),
    assessmentId: z.string().nullish(),
});

const addSessionExamStudentSchema = z.object({
    sessionExamId: z.string().min(1),
    studentId: z.string().min(1),
});

const addSessionExamInstructorSchema = z.object({
    sessionExamId: z.string().min(1),
    instructorId: z.string().min(1),
});

const addSessionExamExternalSchema = z.object({
    sessionExamId: z.string().min(1),
    externalId: z.string().min(1),
});

sessionExamRouter.get("/session-exams", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.list(auth);
    respond(res, result, {
        session_exams_listed: (r) => ({ status: 200, body: r.sessionExams }),
    });
}));

sessionExamRouter.get("/session-exams/session/:sessionId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.listBySession(String(req.params.sessionId), auth);
    respond(res, result, {
        session_exams_listed: (r) => ({ status: 200, body: r.sessionExams }),
    });
}));

sessionExamRouter.get("/session-exams/assessment/:assessmentId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.listByAssessment(String(req.params.assessmentId), auth);
    respond(res, result, {
        session_exams_listed: (r) => ({ status: 200, body: r.sessionExams }),
    });
}));

sessionExamRouter.get("/session-exams/mine", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.listMine(auth);
    respond(res, result, {
        not_found: { status: 404, error: "Aucun profil étudiant ou intervenant pour ce compte" },
        session_exams_listed: (r) => ({ status: 200, body: r.sessionExams }),
    });
}));

sessionExamRouter.get("/session-exams/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.findById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session d'examen introuvable" },
        session_exam_found: (r) => ({ status: 200, body: r.sessionExam }),
    });
}));

sessionExamRouter.post("/session-exams", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.create(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session ou évaluation liée introuvable" },
        session_exam_already_started: { blocked: { type: "Creation", reason: "La session d'examen a déjà commencé" } },
        assessment_course_mismatch: { blocked: { type: "Creation", reason: "L'évaluation liée n'appartient pas au cours de cette session" } },
        session_exam_created: (r) => ({ status: 201, body: r.sessionExam }),
    });
}, createSessionExamSchema));

sessionExamRouter.patch("/session-exams/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.update(String(req.params.id), req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session d'examen ou évaluation liée introuvable" },
        session_exam_already_started: { blocked: { type: "Operation", reason: "La session d'examen a déjà commencé" } },
        assessment_course_mismatch: { blocked: { type: "Operation", reason: "L'évaluation liée n'appartient pas au cours de cette session" } },
        session_exam_updated: (r) => ({ status: 200, body: r.sessionExam }),
    });
}, updateSessionExamSchema));

sessionExamRouter.delete("/session-exams/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session d'examen introuvable" },
        session_exam_already_started: { blocked: { type: "Operation", reason: "La session d'examen a déjà commencé" } },
        session_exam_has_grades: { blocked: { type: "Deletion", reason: "La session d'examen a des notes" } },
        session_exam_deleted: { status: 200, body: { message: "Session d'examen supprimée" } },
    });
}));

sessionExamRouter.get("/session-exam-students/session-exam/:sessionExamId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.listStudentsBySessionExam(String(req.params.sessionExamId), auth);
    respond(res, result, {
        session_exam_students_listed: (r) => ({ status: 200, body: r.sessionExamStudents }),
    });
}));

sessionExamRouter.get("/session-exam-students/student/:studentId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.listSessionExamsByStudent(String(req.params.studentId), auth);
    respond(res, result, {
        session_exam_students_listed: (r) => ({ status: 200, body: r.sessionExamStudents }),
    });
}));

sessionExamRouter.get("/session-exam-students/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.findStudentById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Étudiant de session d'examen introuvable" },
        session_exam_student_found: (r) => ({ status: 200, body: r.sessionExamStudent }),
    });
}));

sessionExamRouter.post("/session-exam-students", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.addStudent(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session d'examen ou étudiant introuvable" },
        session_exam_already_started: { blocked: { type: "Creation", reason: "La session d'examen a déjà commencé" } },
        student_already_registered: { blocked: { type: "Creation", reason: "Cet étudiant est déjà inscrit à cette session d'examen" } },
        session_exam_student_added: (r) => ({ status: 201, body: r.sessionExamStudent }),
    });
}, addSessionExamStudentSchema));

sessionExamRouter.delete("/session-exam-students/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.removeStudent(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Étudiant de session d'examen introuvable" },
        session_exam_already_started: { blocked: { type: "Operation", reason: "La session d'examen a déjà commencé" } },
        session_exam_has_grades: { blocked: { type: "Operation", reason: "Cet étudiant a déjà une note pour cet examen" } },
        session_exam_student_deleted: { status: 200, body: { message: "Étudiant de session d'examen supprimé" } },
    });
}));

sessionExamRouter.get("/session-exam-instructors/session-exam/:sessionExamId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.listInstructorsBySessionExam(String(req.params.sessionExamId), auth);
    respond(res, result, {
        session_exam_instructors_listed: (r) => ({ status: 200, body: r.sessionExamInstructors }),
    });
}));

sessionExamRouter.get("/session-exam-instructors/instructor/:instructorId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.listSessionExamsByInstructor(String(req.params.instructorId), auth);
    respond(res, result, {
        session_exam_instructors_listed: (r) => ({ status: 200, body: r.sessionExamInstructors }),
    });
}));

sessionExamRouter.get("/session-exam-instructors/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.findInstructorById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Intervenant de session d'examen introuvable" },
        session_exam_instructor_found: (r) => ({ status: 200, body: r.sessionExamInstructor }),
    });
}));

sessionExamRouter.post("/session-exam-instructors", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.addInstructor(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session d'examen ou intervenant introuvable" },
        session_exam_already_started: { blocked: { type: "Creation", reason: "La session d'examen a déjà commencé" } },
        instructor_already_in_jury: { blocked: { type: "Creation", reason: "Cet intervenant est déjà membre du jury de cette session d'examen" } },
        session_exam_instructor_added: (r) => ({ status: 201, body: r.sessionExamInstructor }),
    });
}, addSessionExamInstructorSchema));

sessionExamRouter.delete("/session-exam-instructors/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.removeInstructor(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Intervenant de session d'examen introuvable" },
        session_exam_already_started: { blocked: { type: "Operation", reason: "La session d'examen a déjà commencé" } },
        session_exam_instructor_deleted: { status: 200, body: { message: "Intervenant de session d'examen supprimé" } },
    });
}));

sessionExamRouter.get("/session-exam-externals/session-exam/:sessionExamId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.listExternalsBySessionExam(String(req.params.sessionExamId), auth);
    respond(res, result, {
        session_exam_externals_listed: (r) => ({ status: 200, body: r.sessionExamExternals }),
    });
}));

sessionExamRouter.get("/session-exam-externals/external/:externalId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.listSessionExamsByExternal(String(req.params.externalId), auth);
    respond(res, result, {
        session_exam_externals_listed: (r) => ({ status: 200, body: r.sessionExamExternals }),
    });
}));

sessionExamRouter.get("/session-exam-externals/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.findExternalById(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Externe de session d'examen introuvable" },
        session_exam_external_found: (r) => ({ status: 200, body: r.sessionExamExternal }),
    });
}));

sessionExamRouter.post("/session-exam-externals", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.addExternal(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Session d'examen ou externe introuvable" },
        session_exam_already_started: { blocked: { type: "Creation", reason: "La session d'examen a déjà commencé" } },
        external_already_in_jury: { blocked: { type: "Creation", reason: "Cet externe est déjà membre du jury de cette session d'examen" } },
        session_exam_external_added: (r) => ({ status: 201, body: r.sessionExamExternal }),
    });
}, addSessionExamExternalSchema));

sessionExamRouter.delete("/session-exam-externals/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await sessionExamUseCases.removeExternal(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Externe de session d'examen introuvable" },
        session_exam_already_started: { blocked: { type: "Operation", reason: "La session d'examen a déjà commencé" } },
        session_exam_external_deleted: { status: 200, body: { message: "Externe de session d'examen supprimé" } },
    });
}));
