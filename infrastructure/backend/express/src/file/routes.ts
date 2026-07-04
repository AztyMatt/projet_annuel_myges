import { Router } from "express";
import { requireAuth, requireRole, type AuthRequest } from "@express/src/auth/middleware";
import { AdminRole } from "@domain/admin/admin.enums";
import { Role } from "@domain/auth/user.enums";
import { adminUseCases, fileUseCases } from "@express/src/container";

export const fileRouter = Router();

fileRouter.get(
    "/files",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await fileUseCases.list();
        res.status(200).json(result.files);
    },
);

fileRouter.get("/files/uploaded-by/:userId", requireAuth, async (req, res) => {
    const result = await fileUseCases.listByUploadedBy(String(req.params.userId));
    res.status(200).json(result.files);
});

fileRouter.get("/files/:id", requireAuth, async (req, res) => {
    const result = await fileUseCases.findById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "File not found" });
    res.status(200).json(result.file);
});

fileRouter.post("/files", requireAuth, async (req: AuthRequest, res) => {
    if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
    const result = await fileUseCases.create({ ...req.body, uploadedBy: req.auth.userId });
    if (result.kind === "missing_fields")
        return void res
            .status(400)
            .json({ error: "storagePath, name, originalName, mimeType and sizeBytes are required" });
    res.status(201).json(result.file);
});

fileRouter.delete(
    "/files/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await fileUseCases.delete(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "File not found" });
        res.status(200).json({ message: "File deleted" });
    },
);

// file-course routes
fileRouter.get("/file-courses/course/:courseId", requireAuth, async (req, res) => {
    const result = await fileUseCases.listFileCoursesByCourse(String(req.params.courseId));
    res.status(200).json(result.fileCourses);
});

fileRouter.get("/file-courses/file/:fileId", requireAuth, async (req, res) => {
    const result = await fileUseCases.listFileCoursesByFile(String(req.params.fileId));
    res.status(200).json(result.fileCourses);
});

fileRouter.get("/file-courses/:id", requireAuth, async (req, res) => {
    const result = await fileUseCases.findFileCourseById(String(req.params.id));
    if (result.kind === "not_found") return void res.status(404).json({ error: "File course not found" });
    res.status(200).json(result.fileCourse);
});

fileRouter.post(
    "/file-courses",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await fileUseCases.attachToCourse(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "name, fileId and courseId are required" });
        if (result.kind === "file_course_already_exists")
            return void res.status(409).json({ error: "This file is already attached to this course" });
        res.status(201).json(result.fileCourse);
    },
);

fileRouter.delete(
    "/file-courses/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await fileUseCases.detachFromCourse(String(req.params.id));
        if (result.kind === "not_found") return void res.status(404).json({ error: "File course not found" });
        res.status(200).json({ message: "File course deleted" });
    },
);

// file-document routes
fileRouter.get(
    "/file-documents",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (_req, res) => {
        const result = await fileUseCases.listFileDocuments();
        res.status(200).json(result.fileDocuments);
    },
);

fileRouter.get("/file-documents/student/:studentId", requireAuth, async (req, res) => {
    const result = await fileUseCases.listFileDocumentsByStudent(String(req.params.studentId));
    res.status(200).json(result.fileDocuments);
});

fileRouter.get("/file-documents/:id", requireAuth, async (req, res) => {
    const result = await fileUseCases.findFileDocumentById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "File document not found" });
    res.status(200).json(result.fileDocument);
});

fileRouter.post("/file-documents", requireAuth, async (req, res) => {
    const result = await fileUseCases.attachAsDocument(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "fileId, studentId and status are required" });
    if (result.kind === "file_document_already_exists")
        return void res.status(409).json({ error: "This file is already linked as a document for this student" });
    res.status(201).json(result.fileDocument);
});

fileRouter.post(
    "/file-documents/:id/validate",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await fileUseCases.validateDocument(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "File document not found" });
        res.status(200).json(result.fileDocument);
    },
);

fileRouter.post(
    "/file-documents/:id/expire",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await fileUseCases.expireDocument(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "File document not found" });
        res.status(200).json(result.fileDocument);
    },
);

fileRouter.delete(
    "/file-documents/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await fileUseCases.deleteFileDocument(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "File document not found" });
        res.status(200).json({ message: "File document deleted" });
    },
);

// file-justification routes
fileRouter.get("/file-justifications/absence/:absenceId", requireAuth, async (req, res) => {
    const result = await fileUseCases.listJustificationsByAbsence(String(req.params.absenceId));
    res.status(200).json(result.fileJustifications);
});

fileRouter.get("/file-justifications/:id", requireAuth, async (req, res) => {
    const result = await fileUseCases.findJustificationById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "File justification not found" });
    res.status(200).json(result.fileJustification);
});

fileRouter.post("/file-justifications", requireAuth, async (req, res) => {
    const result = await fileUseCases.attachAsJustification(req.body);
    if (result.kind === "missing_fields")
        return void res.status(400).json({ error: "absenceId and fileId are required" });
    if (result.kind === "file_justification_already_exists")
        return void res.status(409).json({ error: "This file is already attached as a justification for this absence" });
    res.status(201).json(result.fileJustification);
});

fileRouter.post(
    "/file-justifications/:id/validate",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req: AuthRequest, res) => {
        if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
        const admin = await adminUseCases.findByUserId(req.auth.userId);
        if (admin.kind === "not_found") return void res.status(403).json({ error: "Admin profile not found" });
        const result = await fileUseCases.validateJustification(String(req.params.id), admin.admin.id);
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "File justification not found" });
        res.status(200).json(result.fileJustification);
    },
);

fileRouter.post(
    "/file-justifications/:id/reject",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req: AuthRequest, res) => {
        if (!req.auth) return void res.status(401).json({ error: "Unauthorized" });
        const admin = await adminUseCases.findByUserId(req.auth.userId);
        if (admin.kind === "not_found") return void res.status(403).json({ error: "Admin profile not found" });
        const result = await fileUseCases.rejectJustification(String(req.params.id), admin.admin.id);
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "File justification not found" });
        res.status(200).json(result.fileJustification);
    },
);

fileRouter.delete(
    "/file-justifications/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await fileUseCases.deleteJustification(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "File justification not found" });
        res.status(200).json({ message: "File justification deleted" });
    },
);

// file-assessment routes
fileRouter.get("/file-assessments/assessment/:assessmentId", requireAuth, async (req, res) => {
    const result = await fileUseCases.listAssessmentFilesByAssessment(
        String(req.params.assessmentId),
    );
    res.status(200).json(result.fileAssessments);
});

fileRouter.get("/file-assessments/group/:assessmentGroupId", requireAuth, async (req, res) => {
    const result = await fileUseCases.listAssessmentFilesByGroup(
        String(req.params.assessmentGroupId),
    );
    res.status(200).json(result.fileAssessments);
});

fileRouter.get("/file-assessments/:id", requireAuth, async (req, res) => {
    const result = await fileUseCases.findAssessmentFileById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "File assessment not found" });
    res.status(200).json(result.fileAssessment);
});

fileRouter.post("/file-assessments", requireAuth, async (req, res) => {
    const result = await fileUseCases.submitForAssessment(req.body);
    if (result.kind === "missing_fields")
        return void res
            .status(400)
            .json({ error: "assessmentId, assessmentGroupId and fileId are required" });
    if (result.kind === "file_assessment_already_exists")
        return void res.status(409).json({ error: "This file has already been submitted for this assessment group" });
    res.status(201).json(result.fileAssessment);
});

fileRouter.delete(
    "/file-assessments/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN),
    async (req, res) => {
        const result = await fileUseCases.deleteAssessmentFile(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "File assessment not found" });
        res.status(200).json({ message: "File assessment deleted" });
    },
);

// file-assessment-instruction routes
fileRouter.get(
    "/file-assessment-instructions/assessment/:assessmentId",
    requireAuth,
    async (req, res) => {
        const result = await fileUseCases.listInstructionsByAssessment(
            String(req.params.assessmentId),
        );
        res.status(200).json(result.instructions);
    },
);

fileRouter.get("/file-assessment-instructions/:id", requireAuth, async (req, res) => {
    const result = await fileUseCases.findInstructionById(String(req.params.id));
    if (result.kind === "not_found")
        return void res.status(404).json({ error: "File assessment instruction not found" });
    res.status(200).json(result.instruction);
});

fileRouter.post(
    "/file-assessment-instructions",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await fileUseCases.uploadInstruction(req.body);
        if (result.kind === "missing_fields")
            return void res.status(400).json({ error: "assessmentId and fileId are required" });
        if (result.kind === "file_assessment_instruction_already_exists")
            return void res.status(409).json({ error: "This file is already attached as an instruction for this assessment" });
        res.status(201).json(result.instruction);
    },
);

fileRouter.delete(
    "/file-assessment-instructions/:id",
    requireAuth,
    requireRole(AdminRole.ADMIN, AdminRole.SUPER_ADMIN, Role.INSTRUCTOR),
    async (req, res) => {
        const result = await fileUseCases.deleteInstruction(String(req.params.id));
        if (result.kind === "not_found")
            return void res.status(404).json({ error: "File assessment instruction not found" });
        res.status(200).json({ message: "File assessment instruction deleted" });
    },
);
