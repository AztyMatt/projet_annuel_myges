import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { authed, getAuthFlags, requireAuth, sendForbidden } from "@express/src/auth/middleware";
import { adminUseCases, fileUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";
import { storageCleanupWarning } from "@express/src/storage/storage-warning";
import { storageService } from "@express/src/storage/storage.adapter";
import { MAX_FILE_SIZE_BYTES } from "@domain/file/file.policy";

export const fileRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_BYTES } });

const createFileSchema = z.object({
    name: z.string().min(1),
    originalName: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
});

const attachFileCourseSchema = z.object({
    name: z.string().min(1),
    fileId: z.string().min(1),
    courseId: z.string().min(1),
});

const attachFileDocumentSchema = z.object({
    fileId: z.string().min(1),
    studentId: z.string().min(1),
});

const attachFileJustificationSchema = z.object({
    absenceId: z.string().min(1),
    fileId: z.string().min(1),
});

const submitFileAssessmentSchema = z.object({
    assessmentId: z.string().min(1),
    assessmentGroupId: z.string().min(1),
    fileId: z.string().min(1),
});

const uploadInstructionSchema = z.object({
    assessmentId: z.string().min(1),
    fileId: z.string().min(1),
});

fileRouter.get("/files", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.list(auth);
    respond(res, result, {
        files_listed: (r) => ({ status: 200, body: r.files }),
    });
}));

fileRouter.get("/files/uploaded-by/:userId", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.listByUploadedBy(String(req.params.userId), auth);
    respond(res, result, {
        files_listed: (r) => ({ status: 200, body: r.files }),
    });
}));

fileRouter.get("/files/mine", ...authed(async (req, res) => {
    const result = await fileUseCases.listMine(getAuthFlags(req.auth));
    respond(res, result, {
        files_listed: (r) => ({ status: 200, body: r.files }),
    });
}));

fileRouter.get("/files/:id", ...authed(async (req, res) => {
    const result = await fileUseCases.findById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Fichier introuvable" },
        file_found: (r) => ({ status: 200, body: r.file }),
    });
}));

fileRouter.post("/files", ...authed(async (req, res) => {
    const result = await fileUseCases.create({ ...req.body, uploadedBy: req.auth.userId });
    respond(res, result, {
        invalid_size: { status: 400, error: "sizeBytes doit être un entier positif" },
        file_too_large: { status: 400, error: "Le fichier dépasse la taille maximale autorisée" },
        mime_type_not_allowed: { status: 400, error: "Ce type de fichier n'est pas autorisé" },
        file_created: (r) => ({ status: 201, body: r.file }),
    });
}, createFileSchema));

fileRouter.post("/files/upload", requireAuth, upload.single("file"), ...authed(async (req, res) => {
    const uploaded = (req as unknown as { file?: Express.Multer.File }).file;
    if (!uploaded) return void send(res, { status: 400, error: "Aucun fichier fourni (champ multipart \"file\" attendu)" });

    const result = await fileUseCases.create({
        name: uploaded.originalname,
        originalName: uploaded.originalname,
        mimeType: uploaded.mimetype,
        sizeBytes: uploaded.size,
        uploadedBy: req.auth.userId,
    });
    if (result.kind === "file_created") await storageService.save(result.file.storagePath, uploaded.buffer);
    respond(res, result, {
        invalid_size: { status: 400, error: "sizeBytes doit être un entier positif" },
        file_too_large: { status: 400, error: "Le fichier dépasse la taille maximale autorisée" },
        mime_type_not_allowed: { status: 400, error: "Ce type de fichier n'est pas autorisé" },
        file_created: (r) => ({ status: 201, body: r.file }),
    });
}));

fileRouter.get("/files/:id/download", ...authed(async (req, res) => {
    const result = await fileUseCases.findById(String(req.params.id), getAuthFlags(req.auth));
    if (result.kind === "not_found") return void send(res, { status: 404, error: "Fichier introuvable" });

    let content: Buffer;
    try {
        content = await storageService.read(result.file.storagePath);
    } catch {
        return void send(res, { status: 404, error: "Contenu du fichier introuvable dans le stockage" });
    }
    res.setHeader("Content-Type", result.file.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(result.file.originalName)}"`);
    res.send(content);
}));

fileRouter.delete("/files/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Fichier introuvable" },
        file_has_contextual_links: { blocked: { type: "Deletion", reason: "Ce fichier a des liens contextuels" } },
        file_deleted_with_warnings: (r) => storageCleanupWarning("Fichier supprimé", r.failedPaths),
        file_deleted: { status: 200, body: { message: "Fichier supprimé" } },
    });
}));

fileRouter.get("/file-courses/course/:courseId", ...authed(async (req, res) => {
    const result = await fileUseCases.listFileCoursesByCourse(String(req.params.courseId));
    send(res, { status: 200, body: result.fileCourses });
}));

fileRouter.get("/file-courses/file/:fileId", ...authed(async (req, res) => {
    const result = await fileUseCases.listFileCoursesByFile(String(req.params.fileId));
    send(res, { status: 200, body: result.fileCourses });
}));

fileRouter.get("/file-courses/:id", ...authed(async (req, res) => {
    const result = await fileUseCases.findFileCourseById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Support de cours introuvable" },
        file_course_found: (r) => ({ status: 200, body: r.fileCourse }),
    });
}));

fileRouter.post("/file-courses", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.attachToCourse(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Fichier ou cours introuvable" },
        file_too_large: { status: 400, error: "Le fichier dépasse la taille maximale autorisée pour un support de cours" },
        mime_type_not_allowed: { status: 400, error: "Ce type de fichier n'est pas autorisé pour un support de cours" },
        file_course_already_exists: { blocked: { type: "Creation", reason: "Ce fichier est déjà rattaché à ce cours" } },
        file_already_linked: { blocked: { type: "Creation", reason: "Ce fichier est déjà lié à un autre contexte" } },
        file_course_attached: (r) => ({ status: 201, body: r.fileCourse }),
    });
}, attachFileCourseSchema));

fileRouter.delete("/file-courses/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.detachFromCourse(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Support de cours introuvable" },
        orphan_super_admin_only: { blocked: { type: "Operation", reason: "Le fichier lié est manquant, seul un super administrateur peut supprimer ce lien orphelin" } },
        file_course_deleted_with_warnings: (r) => storageCleanupWarning("Support de cours supprimé", r.failedPaths),
        file_course_deleted: { status: 200, body: { message: "Support de cours supprimé" } },
    });
}));

fileRouter.get("/file-documents", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.listFileDocuments(auth);
    respond(res, result, {
        file_documents_listed: (r) => ({ status: 200, body: r.fileDocuments }),
    });
}));

fileRouter.get("/file-documents/mine", ...authed(async (req, res) => {
    const result = await fileUseCases.listMineFileDocuments(getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Profil étudiant introuvable" },
        file_documents_listed: (r) => ({ status: 200, body: r.fileDocuments }),
    });
}));

fileRouter.get("/file-documents/student/:studentId", ...authed(async (req, res) => {
    const result = await fileUseCases.listFileDocumentsByStudent(String(req.params.studentId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Documents introuvables" },
        file_documents_listed: (r) => ({ status: 200, body: r.fileDocuments }),
    });
}));

fileRouter.get("/file-documents/:id", ...authed(async (req, res) => {
    const result = await fileUseCases.findFileDocumentById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Document introuvable" },
        file_document_found: (r) => ({ status: 200, body: r.fileDocument }),
    });
}));

fileRouter.post("/file-documents", ...authed(async (req, res) => {
    const result = await fileUseCases.attachAsDocument(req.body, getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Fichier ou étudiant introuvable" },
        file_document_already_exists: { blocked: { type: "Creation", reason: "Ce fichier est déjà lié en tant que document pour cet étudiant" } },
        file_already_linked: { blocked: { type: "Creation", reason: "Ce fichier est déjà lié à un autre contexte" } },
        file_document_attached: (r) => ({ status: 201, body: r.fileDocument }),
    });
}, attachFileDocumentSchema));

fileRouter.post("/file-documents/:id/validate", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.validateDocument(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Document introuvable" },
        file_document_has_no_doc_type: { blocked: { type: "Operation", reason: "Ce document n'a pas de type de document associé" } },
        document_already_valid: { blocked: { type: "Operation", reason: "Ce document est déjà valide" } },
        file_document_expired: { blocked: { type: "Operation", reason: "Un document expiré ne peut pas être validé à nouveau" } },
        document_already_expired: { blocked: { type: "Operation", reason: "La date d'expiration de ce document est déjà passée, il ne peut pas être validé" } },
        valid_document_of_type_exists: { blocked: { type: "Operation", reason: "Cet étudiant a déjà un document valide de ce type" } },
        file_document_validated: (r) => ({ status: 200, body: r.fileDocument }),
    });
}));

fileRouter.post("/file-documents/:id/expire", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.expireDocument(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Document introuvable" },
        document_already_expired: { blocked: { type: "Operation", reason: "Ce document est déjà expiré" } },
        file_document_expired: (r) => ({ status: 200, body: r.fileDocument }),
    });
}));

fileRouter.delete("/file-documents/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.deleteFileDocument(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Document introuvable" },
        orphan_super_admin_only: { blocked: { type: "Operation", reason: "Le fichier lié est manquant, seul un super administrateur peut supprimer ce lien orphelin" } },
        file_document_has_doc_type: { blocked: { type: "Deletion", reason: "Ce document a un type de document associé" } },
        file_document_is_valid: { blocked: { type: "Operation", reason: "Ce document est validé" } },
        file_document_deleted_with_warnings: (r) => storageCleanupWarning("Document supprimé", r.failedPaths),
        file_document_deleted: { status: 200, body: { message: "Document supprimé" } },
    });
}));

fileRouter.get("/file-justifications/absence/:absenceId", ...authed(async (req, res) => {
    const result = await fileUseCases.listJustificationsByAbsence(String(req.params.absenceId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Justificatifs introuvables" },
        file_justifications_listed: (r) => ({ status: 200, body: r.fileJustifications }),
    });
}));

fileRouter.get("/file-justifications/mine", ...authed(async (req, res) => {
    const result = await fileUseCases.listMineJustifications(getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Profil étudiant introuvable" },
        file_justifications_listed: (r) => ({ status: 200, body: r.fileJustifications }),
    });
}));

fileRouter.get("/file-justifications/:id", ...authed(async (req, res) => {
    const result = await fileUseCases.findJustificationById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Justificatif introuvable" },
        file_justification_found: (r) => ({ status: 200, body: r.fileJustification }),
    });
}));

fileRouter.post("/file-justifications", ...authed(async (req, res) => {
    const result = await fileUseCases.attachAsJustification(req.body, getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Fichier introuvable" },
        absence_not_found: { status: 404, error: "Absence introuvable" },
        absence_already_processed: { blocked: { type: "Creation", reason: "Une absence validée ou rejetée ne peut plus recevoir de justificatif" } },
        file_too_large: { status: 400, error: "Le fichier dépasse la taille maximale autorisée pour un justificatif" },
        mime_type_not_allowed: { status: 400, error: "Ce type de fichier n'est pas autorisé pour un justificatif" },
        file_justification_already_exists: { blocked: { type: "Creation", reason: "Ce fichier est déjà rattaché en tant que justificatif pour cette absence" } },
        file_already_linked: { blocked: { type: "Creation", reason: "Ce fichier est déjà lié à un autre contexte" } },
        file_justification_attached: (r) => ({ status: 201, body: r.fileJustification }),
    });
}, attachFileJustificationSchema));

fileRouter.post("/file-justifications/:id/validate", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const admin = await adminUseCases.resolveOwnAdmin(auth);
    if (admin.kind === "not_found") return void sendForbidden(res);
    const result = await fileUseCases.validateJustification(String(req.params.id), auth, admin.admin.id);
    respond(res, result, {
        not_found: { status: 404, error: "Justificatif introuvable" },
        file_justification_validated: (r) => ({ status: 200, body: r.fileJustification }),
    });
}));

fileRouter.post("/file-justifications/:id/reject", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const admin = await adminUseCases.resolveOwnAdmin(auth);
    if (admin.kind === "not_found") return void sendForbidden(res);
    const result = await fileUseCases.rejectJustification(String(req.params.id), auth, admin.admin.id);
    respond(res, result, {
        not_found: { status: 404, error: "Justificatif introuvable" },
        file_justification_rejected: (r) => ({ status: 200, body: r.fileJustification }),
    });
}));

fileRouter.delete("/file-justifications/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.deleteJustification(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Justificatif introuvable" },
        orphan_super_admin_only: { blocked: { type: "Operation", reason: "Le fichier lié est manquant, seul un super administrateur peut supprimer ce lien orphelin" } },
        justification_already_validated: { blocked: { type: "Operation", reason: "Ce justificatif est validé" } },
        file_justification_deleted_with_warnings: (r) => storageCleanupWarning("Justificatif supprimé", r.failedPaths),
        file_justification_deleted: { status: 200, body: { message: "Justificatif supprimé" } },
    });
}));

fileRouter.get("/file-assessments/assessment/:assessmentId", ...authed(async (req, res) => {
    const result = await fileUseCases.listAssessmentFilesByAssessment(String(req.params.assessmentId));
    send(res, { status: 200, body: result.fileAssessments });
}));

fileRouter.get("/file-assessments/group/:assessmentGroupId", ...authed(async (req, res) => {
    const result = await fileUseCases.listAssessmentFilesByGroup(String(req.params.assessmentGroupId));
    send(res, { status: 200, body: result.fileAssessments });
}));

fileRouter.get("/file-assessments/:id", ...authed(async (req, res) => {
    const result = await fileUseCases.findAssessmentFileById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Rendu introuvable" },
        file_assessment_found: (r) => ({ status: 200, body: r.fileAssessment }),
    });
}));

fileRouter.post("/file-assessments", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.submitForAssessment(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Fichier introuvable" },
        assessment_group_missing: { status: 404, error: "Groupe d'évaluation introuvable pour cette évaluation" },
        assessment_missing: { status: 404, error: "Évaluation introuvable" },
        assessment_not_published: { blocked: { type: "Creation", reason: "Cette évaluation n'est pas encore publiée" } },
        assessment_past_due_date: { blocked: { type: "Creation", reason: "La date limite de l'évaluation est dépassée" } },
        submission_limit_reached: { blocked: { type: "Creation", reason: "Un groupe d'évaluation ne peut pas soumettre plus de 5 fichiers" } },
        file_too_large: { status: 400, error: "Le fichier dépasse la taille maximale autorisée pour un rendu" },
        mime_type_not_allowed: { status: 400, error: "Ce type de fichier n'est pas autorisé pour un rendu" },
        file_assessment_already_exists: { blocked: { type: "Creation", reason: "Ce fichier a déjà été soumis pour ce groupe d'évaluation" } },
        file_already_linked: { blocked: { type: "Creation", reason: "Ce fichier est déjà lié à un autre contexte" } },
        file_assessment_submitted: (r) => ({ status: 201, body: r.fileAssessment }),
    });
}, submitFileAssessmentSchema));

fileRouter.delete("/file-assessments/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.deleteAssessmentFile(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Rendu introuvable" },
        assessment_missing: { blocked: { type: "Operation", reason: "L'évaluation liée est manquante, impossible de vérifier la date limite" } },
        assessment_past_due_date: { blocked: { type: "Operation", reason: "La date limite de l'évaluation est dépassée" } },
        file_missing: { blocked: { type: "Operation", reason: "Le fichier du rendu est manquant, seul un super administrateur peut supprimer ce rendu orphelin" } },
        file_assessment_deleted_with_warnings: (r) => storageCleanupWarning("Rendu supprimé", r.failedPaths),
        file_assessment_deleted: { status: 200, body: { message: "Rendu supprimé" } },
    });
}));

fileRouter.get("/file-assessment-instructions/assessment/:assessmentId", ...authed(async (req, res) => {
    const result = await fileUseCases.listInstructionsByAssessment(String(req.params.assessmentId));
    send(res, { status: 200, body: result.instructions });
}));

fileRouter.get("/file-assessment-instructions/:id", ...authed(async (req, res) => {
    const result = await fileUseCases.findInstructionById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "Consigne d'évaluation introuvable" },
        instruction_found: (r) => ({ status: 200, body: r.instruction }),
    });
}));

fileRouter.post("/file-assessment-instructions", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.uploadInstruction(req.body, auth);
    respond(res, result, {
        not_found: { status: 404, error: "Évaluation ou fichier introuvable" },
        file_too_large: { status: 400, error: "Le fichier dépasse la taille maximale autorisée pour une consigne" },
        mime_type_not_allowed: { status: 400, error: "Ce type de fichier n'est pas autorisé pour une consigne" },
        file_assessment_instruction_already_exists: { blocked: { type: "Creation", reason: "Ce fichier est déjà rattaché en tant que consigne pour cette évaluation" } },
        file_already_linked: { blocked: { type: "Creation", reason: "Ce fichier est déjà lié à un autre contexte" } },
        instruction_uploaded: (r) => ({ status: 201, body: r.instruction }),
    });
}, uploadInstructionSchema));

fileRouter.delete("/file-assessment-instructions/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.deleteInstruction(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "Consigne d'évaluation introuvable" },
        orphan_super_admin_only: { blocked: { type: "Operation", reason: "Le fichier lié est manquant, seul un super administrateur peut supprimer ce lien orphelin" } },
        instruction_deleted_with_warnings: (r) => storageCleanupWarning("Consigne d'évaluation supprimée", r.failedPaths),
        instruction_deleted: { status: 200, body: { message: "Consigne d'évaluation supprimée" } },
    });
}));
