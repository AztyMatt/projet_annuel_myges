import { Router } from "express";
import { requireAuth, requireRole } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { sessionExamUseCases } from "@express/src/container";

export const sessionExamRouter = Router();

sessionExamRouter.get(
    "/session-exams",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await sessionExamUseCases.list();
        res.status(200).json(result.sessionExams);
    },
);

sessionExamRouter.get("/session-exams/session/:sessionId", requireAuth, async (req, res) => {
    const result = await sessionExamUseCases.listBySession(String(req.params.sessionId));
    res.status(200).json(result.sessionExams);
});

sessionExamRouter.get("/session-exams/assessment/:assessmentId", requireAuth, async (req, res) => {
    const result = await sessionExamUseCases.listByAssessment(String(req.params.assessmentId));
    res.status(200).json(result.sessionExams);
});

sessionExamRouter.get("/session-exams/:id", requireAuth, async (req, res) => {
    const result = await sessionExamUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "Session exam not found" });
    res.status(200).json(result.sessionExam);
});

sessionExamRouter.post(
    "/session-exams",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await sessionExamUseCases.create(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "sessionId and type are required" });
        res.status(201).json(result.sessionExam);
    },
);

sessionExamRouter.patch(
    "/session-exams/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await sessionExamUseCases.update(String(req.params.id), req.body);
        if (result.kind === "not_found") return void res.status(404).json({ error: "Session exam not found" });
        res.status(200).json(result.sessionExam);
    },
);

sessionExamRouter.delete(
    "/session-exams/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await sessionExamUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "Session exam not found" });
        res.status(200).json({ message: "Session exam deleted" });
    },
);

// session-exam-student routes
sessionExamRouter.get(
    "/session-exam-students/session-exam/:sessionExamId",
    requireAuth,
    async (req, res) => {
        const result = await sessionExamUseCases.listStudentsBySessionExam(
            String(req.params.sessionExamId),
        );
        res.status(200).json(result.sessionExamStudents);
    },
);

sessionExamRouter.get(
    "/session-exam-students/student/:studentId",
    requireAuth,
    async (req, res) => {
        const result = await sessionExamUseCases.listSessionExamsByStudent(String(req.params.studentId));
        res.status(200).json(result.sessionExamStudents);
    },
);

sessionExamRouter.get("/session-exam-students/:id", requireAuth, async (req, res) => {
    const result = await sessionExamUseCases.findStudentById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Session exam student not found" });
    res.status(200).json(result.sessionExamStudent);
});

sessionExamRouter.post(
    "/session-exam-students",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await sessionExamUseCases.addStudent(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "sessionExamId and studentId are required" });
        if (result.kind === "student_already_registered")
            return void res.status(409).json({ error: "Student is already registered for this session exam" });
        res.status(201).json(result.sessionExamStudent);
    },
);

sessionExamRouter.delete(
    "/session-exam-students/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await sessionExamUseCases.removeStudent(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Session exam student not found" });
        res.status(200).json({ message: "Session exam student deleted" });
    },
);

// session-exam-instructor routes
sessionExamRouter.get(
    "/session-exam-instructors/session-exam/:sessionExamId",
    requireAuth,
    async (req, res) => {
        const result = await sessionExamUseCases.listInstructorsBySessionExam(
            String(req.params.sessionExamId),
        );
        res.status(200).json(result.sessionExamInstructors);
    },
);

sessionExamRouter.get(
    "/session-exam-instructors/instructor/:instructorId",
    requireAuth,
    async (req, res) => {
        const result = await sessionExamUseCases.listSessionExamsByInstructor(
            String(req.params.instructorId),
        );
        res.status(200).json(result.sessionExamInstructors);
    },
);

sessionExamRouter.get("/session-exam-instructors/:id", requireAuth, async (req, res) => {
    const result = await sessionExamUseCases.findInstructorById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Session exam instructor not found" });
    res.status(200).json(result.sessionExamInstructor);
});

sessionExamRouter.post(
    "/session-exam-instructors",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await sessionExamUseCases.addInstructor(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "sessionExamId and instructorId are required" });
        if (result.kind === "instructor_already_in_jury")
            return void res.status(409).json({ error: "Instructor is already in the jury for this session exam" });
        res.status(201).json(result.sessionExamInstructor);
    },
);

sessionExamRouter.delete(
    "/session-exam-instructors/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await sessionExamUseCases.removeInstructor(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Session exam instructor not found" });
        res.status(200).json({ message: "Session exam instructor deleted" });
    },
);

// session-exam-external routes
sessionExamRouter.get(
    "/session-exam-externals/session-exam/:sessionExamId",
    requireAuth,
    async (req, res) => {
        const result = await sessionExamUseCases.listExternalsBySessionExam(
            String(req.params.sessionExamId),
        );
        res.status(200).json(result.sessionExamExternals);
    },
);

sessionExamRouter.get(
    "/session-exam-externals/external/:externalId",
    requireAuth,
    async (req, res) => {
        const result = await sessionExamUseCases.listSessionExamsByExternal(String(req.params.externalId));
        res.status(200).json(result.sessionExamExternals);
    },
);

sessionExamRouter.get("/session-exam-externals/:id", requireAuth, async (req, res) => {
    const result = await sessionExamUseCases.findExternalById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "Session exam external not found" });
    res.status(200).json(result.sessionExamExternal);
});

sessionExamRouter.post(
    "/session-exam-externals",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await sessionExamUseCases.addExternal(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "sessionExamId and externalId are required" });
        if (result.kind === "external_already_in_jury")
            return void res.status(409).json({ error: "External is already in the jury for this session exam" });
        res.status(201).json(result.sessionExamExternal);
    },
);

sessionExamRouter.delete(
    "/session-exam-externals/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await sessionExamUseCases.removeExternal(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "Session exam external not found" });
        res.status(200).json({ message: "Session exam external deleted" });
    },
);
