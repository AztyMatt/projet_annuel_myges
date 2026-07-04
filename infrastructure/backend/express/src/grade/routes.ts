import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { Role } from "@domain/auth/user.enums";
import { gradeUseCases, studentUseCases } from "@express/src/container";

export const gradeRouter = Router();

gradeRouter.get("/grades", requireAuth, requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN), async (_req, res) => {
    const result = await gradeUseCases.list();
    res.status(200).json(result.grades);
});

gradeRouter.get(
    "/grades/student/:studentId",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await gradeUseCases.listByStudent(String(req.params.studentId));
        res.status(200).json(result.grades);
    },
);

gradeRouter.get("/grades/mine", requireAuth, async (req: AuthRequest, res) => {
    if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
    if (req.auth.role !== Role.STUDENT)
        return void res.status(403).json({ error: "Only students can access this endpoint" });
    const student = await studentUseCases.findByUserId(req.auth.userId);
    if (student.kind === "not_found") return void res.status(404).json({ error: "Student profile not found" });
    const result = await gradeUseCases.listByStudent(student.student.id);
    res.status(200).json(result.grades);
});

gradeRouter.get("/grades/:id", requireAuth, async (req, res) => {
    const result = await gradeUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Grade not found" });
    res.status(200).json(result.grade);
});

gradeRouter.post(
    "/grades",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req: AuthRequest, res) => {
        if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
        const result = await gradeUseCases.create({ ...req.body, enteredBy: req.auth.userId });
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "studentId and value are required" });
        res.status(201).json(result.grade);
    },
);

gradeRouter.patch(
    "/grades/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req: AuthRequest, res) => {
        if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
        const result = await gradeUseCases.update(String(req.params.id), { ...req.body, enteredBy: req.auth.userId });
        if (result.kind === "not_found") return void res.status(404).json({ error: "Grade not found" });
        res.status(200).json(result.grade);
    },
);

gradeRouter.post(
    "/grades/:id/lock",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await gradeUseCases.lock(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Grade not found" });
        res.status(200).json(result.grade);
    },
);

gradeRouter.delete(
    "/grades/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await gradeUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Grade not found" });
        res.status(200).json({ message: "Grade deleted" });
    },
);

// grade-assessment routes
gradeRouter.get("/grade-assessments/grade/:gradeId", requireAuth, async (req, res) => {
    const result = await gradeUseCases.listAssessmentLinksByGrade(String(req.params.gradeId));
    res.status(200).json(result.gradeAssessments);
});

gradeRouter.get(
    "/grade-assessments/assessment/:assessmentId",
    requireAuth,
    async (req, res) => {
        const result = await gradeUseCases.listAssessmentLinksByAssessment(String(req.params.assessmentId));
        res.status(200).json(result.gradeAssessments);
    },
);

gradeRouter.get("/grade-assessments/:id", requireAuth, async (req, res) => {
    const result = await gradeUseCases.findAssessmentLinkById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Grade assessment not found" });
    res.status(200).json(result.gradeAssessment);
});

gradeRouter.post(
    "/grade-assessments",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await gradeUseCases.linkAssessment(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "gradeId and assessmentId are required" });
        if (result.kind === "grade_assessment_already_exists")
            return void res.status(409).json({ error: "This grade is already linked to this assessment" });
        res.status(201).json(result.gradeAssessment);
    },
);

gradeRouter.delete(
    "/grade-assessments/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await gradeUseCases.deleteAssessmentLink(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Grade assessment not found" });
        res.status(200).json({ message: "Grade assessment deleted" });
    },
);

// grade-session-exam routes
gradeRouter.get("/grade-session-exams/grade/:gradeId", requireAuth, async (req, res) => {
    const result = await gradeUseCases.listSessionExamLinksByGrade(String(req.params.gradeId));
    res.status(200).json(result.gradeSessionExams);
});

gradeRouter.get(
    "/grade-session-exams/session-exam/:sessionExamId",
    requireAuth,
    async (req, res) => {
        const result = await gradeUseCases.listSessionExamLinksBySessionExam(
            String(req.params.sessionExamId),
        );
        res.status(200).json(result.gradeSessionExams);
    },
);

gradeRouter.get("/grade-session-exams/:id", requireAuth, async (req, res) => {
    const result = await gradeUseCases.findSessionExamLinkById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Grade session exam not found" });
    res.status(200).json(result.gradeSessionExam);
});

gradeRouter.post(
    "/grade-session-exams",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await gradeUseCases.linkSessionExam(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "gradeId and sessionExamId are required" });
        if (result.kind === "grade_session_exam_already_exists")
            return void res.status(409).json({ error: "This grade is already linked to this session exam" });
        res.status(201).json(result.gradeSessionExam);
    },
);

gradeRouter.delete(
    "/grade-session-exams/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await gradeUseCases.deleteSessionExamLink(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Grade session exam not found" });
        res.status(200).json({ message: "Grade session exam deleted" });
    },
);

// grade-manual-notation routes
gradeRouter.get(
    "/grade-manual-notations/grade/:gradeId",
    requireAuth,
    async (req, res) => {
        const result = await gradeUseCases.listManualNotationLinksByGrade(String(req.params.gradeId));
        res.status(200).json(result.gradeManualNotations);
    },
);

gradeRouter.get(
    "/grade-manual-notations/manual/:gradeManualId",
    requireAuth,
    async (req, res) => {
        const result = await gradeUseCases.listManualNotationLinksByGradeManual(
            String(req.params.gradeManualId),
        );
        res.status(200).json(result.gradeManualNotations);
    },
);

gradeRouter.get("/grade-manual-notations/:id", requireAuth, async (req, res) => {
    const result = await gradeUseCases.findManualNotationLinkById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Grade manual notation not found" });
    res.status(200).json(result.gradeManualNotation);
});

gradeRouter.post(
    "/grade-manual-notations",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await gradeUseCases.linkManualNotation(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "gradeId and gradeManualId are required" });
        if (result.kind === "grade_manual_notation_already_exists")
            return void res.status(409).json({ error: "This grade is already linked to this manual notation" });
        res.status(201).json(result.gradeManualNotation);
    },
);

gradeRouter.delete(
    "/grade-manual-notations/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await gradeUseCases.deleteManualNotationLink(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Grade manual notation not found" });
        res.status(200).json({ message: "Grade manual notation deleted" });
    },
);

// manual-notation routes
gradeRouter.get(
    "/manual-notations",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await gradeUseCases.listManualNotations();
        res.status(200).json(result.manualNotations);
    },
);

gradeRouter.get("/manual-notations/module/:moduleId", requireAuth, async (req, res) => {
    const result = await gradeUseCases.listManualNotationsByModule(String(req.params.moduleId));
    res.status(200).json(result.manualNotations);
});

gradeRouter.get("/manual-notations/:id", requireAuth, async (req, res) => {
    const result = await gradeUseCases.findManualNotationById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Manual notation not found" });
    res.status(200).json(result.manualNotation);
});

gradeRouter.post(
    "/manual-notations",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await gradeUseCases.createManualNotation(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "moduleId and name are required" });
        if (result.kind === "notation_already_exists")
            return void res.status(409).json({ error: "A manual notation with this name already exists for this module" });
        res.status(201).json(result.manualNotation);
    },
);

gradeRouter.patch(
    "/manual-notations/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await gradeUseCases.updateManualNotation(String(req.params.id), req.body);
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Manual notation not found" });
        res.status(200).json(result.manualNotation);
    },
);

gradeRouter.delete(
    "/manual-notations/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await gradeUseCases.deleteManualNotation(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Manual notation not found" });
        res.status(200).json({ message: "Manual notation deleted" });
    },
);
