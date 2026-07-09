import { Router } from "express";
import { authed, getAuthFlags, sendForbidden } from "@express/src/auth/middleware";
import { adminUseCases, fileUseCases } from "@express/src/container";
import { respond, send } from "@express/src/http/responses";
import { storageCleanupWarning } from "@express/src/storage/storage-warning";

export const fileRouter = Router();

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
        not_found: { status: 404, error: "File not found" },
        file_found: (r) => ({ status: 200, body: r.file }),
    });
}));

fileRouter.post("/files", ...authed(async (req, res) => {
    const result = await fileUseCases.create({ ...req.body, uploadedBy: req.auth.userId });
    respond(res, result, {
        missing_fields: { status: 400, error: "name, originalName, mimeType and sizeBytes are required" },
        file_created: (r) => ({ status: 201, body: r.file }),
    });
}));

fileRouter.delete("/files/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.delete(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "File not found" },
        file_has_contextual_links: { blocked: { type: "Deletion", reason: "File has contextual links" } },
        file_deleted_with_warnings: (r) => storageCleanupWarning("File deleted", r.failedPaths),
        file_deleted: { status: 200, body: { message: "File deleted" } },
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
        not_found: { status: 404, error: "File course not found" },
        file_course_found: (r) => ({ status: 200, body: r.fileCourse }),
    });
}));

fileRouter.post("/file-courses", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.attachToCourse(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "name, fileId and courseId are required" },
        file_course_already_exists: { blocked: { type: "Creation", reason: "This file is already attached to this course" } },
        file_already_linked: { blocked: { type: "Operation", reason: "File is already linked to another context" } },
        file_course_attached: (r) => ({ status: 201, body: r.fileCourse }),
    });
}));

fileRouter.delete("/file-courses/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.detachFromCourse(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "File course not found" },
        orphan_super_admin_only: { blocked: { type: "Operation", reason: "Linked file is missing, only a super admin can delete this orphan link" } },
        file_course_deleted_with_warnings: (r) => storageCleanupWarning("File course deleted", r.failedPaths),
        file_course_deleted: { status: 200, body: { message: "File course deleted" } },
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
        not_found: { status: 404, error: "Student profile not found" },
        file_documents_listed: (r) => ({ status: 200, body: r.fileDocuments }),
    });
}));

fileRouter.get("/file-documents/student/:studentId", ...authed(async (req, res) => {
    const result = await fileUseCases.listFileDocumentsByStudent(String(req.params.studentId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "File documents not found" },
        file_documents_listed: (r) => ({ status: 200, body: r.fileDocuments }),
    });
}));

fileRouter.get("/file-documents/:id", ...authed(async (req, res) => {
    const result = await fileUseCases.findFileDocumentById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "File document not found" },
        file_document_found: (r) => ({ status: 200, body: r.fileDocument }),
    });
}));

fileRouter.post("/file-documents", ...authed(async (req, res) => {
    const result = await fileUseCases.attachAsDocument(req.body);
    respond(res, result, {
        missing_fields: { status: 400, error: "fileId, studentId and status are required" },
        file_document_already_exists: { blocked: { type: "Creation", reason: "This file is already linked as a document for this student" } },
        file_already_linked: { blocked: { type: "Operation", reason: "File is already linked to another context" } },
        file_document_attached: (r) => ({ status: 201, body: r.fileDocument }),
    });
}));

fileRouter.post("/file-documents/:id/validate", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.validateDocument(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "File document not found" },
        file_document_has_no_doc_type: { blocked: { type: "Operation", reason: "File document has no associated document type" } },
        file_document_validated: (r) => ({ status: 200, body: r.fileDocument }),
    });
}));

fileRouter.post("/file-documents/:id/expire", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.expireDocument(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "File document not found" },
        file_document_expired: (r) => ({ status: 200, body: r.fileDocument }),
    });
}));

fileRouter.delete("/file-documents/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.deleteFileDocument(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "File document not found" },
        orphan_super_admin_only: { blocked: { type: "Operation", reason: "Linked file is missing, only a super admin can delete this orphan link" } },
        file_document_has_doc_type: { blocked: { type: "Deletion", reason: "File document has an associated document type" } },
        file_document_is_valid: { blocked: { type: "Operation", reason: "File document is validated" } },
        file_document_deleted_with_warnings: (r) => storageCleanupWarning("File document deleted", r.failedPaths),
        file_document_deleted: { status: 200, body: { message: "File document deleted" } },
    });
}));


fileRouter.get("/file-justifications/absence/:absenceId", ...authed(async (req, res) => {
    const result = await fileUseCases.listJustificationsByAbsence(String(req.params.absenceId), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "File justifications not found" },
        file_justifications_listed: (r) => ({ status: 200, body: r.fileJustifications }),
    });
}));

fileRouter.get("/file-justifications/mine", ...authed(async (req, res) => {
    const result = await fileUseCases.listMineJustifications(getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "Student profile not found" },
        file_justifications_listed: (r) => ({ status: 200, body: r.fileJustifications }),
    });
}));

fileRouter.get("/file-justifications/:id", ...authed(async (req, res) => {
    const result = await fileUseCases.findJustificationById(String(req.params.id), getAuthFlags(req.auth));
    respond(res, result, {
        not_found: { status: 404, error: "File justification not found" },
        file_justification_found: (r) => ({ status: 200, body: r.fileJustification }),
    });
}));

fileRouter.post("/file-justifications", ...authed(async (req, res) => {
    const result = await fileUseCases.attachAsJustification(req.body);
    respond(res, result, {
        missing_fields: { status: 400, error: "absenceId and fileId are required" },
        file_justification_already_exists: { blocked: { type: "Creation", reason: "This file is already attached as a justification for this absence" } },
        file_already_linked: { blocked: { type: "Operation", reason: "File is already linked to another context" } },
        file_justification_attached: (r) => ({ status: 201, body: r.fileJustification }),
    });
}));

fileRouter.post("/file-justifications/:id/validate", ...authed(async (req, res) => {
    const admin = await adminUseCases.resolveOwnAdmin(getAuthFlags(req.auth));
    if (admin.kind === "not_found") return void sendForbidden(res);
    const result = await fileUseCases.validateJustification(String(req.params.id), admin.admin.id);
    respond(res, result, {
        not_found: { status: 404, error: "File justification not found" },
        file_justification_validated: (r) => ({ status: 200, body: r.fileJustification }),
    });
}));

fileRouter.post("/file-justifications/:id/reject", ...authed(async (req, res) => {
    const admin = await adminUseCases.resolveOwnAdmin(getAuthFlags(req.auth));
    if (admin.kind === "not_found") return void sendForbidden(res);
    const result = await fileUseCases.rejectJustification(String(req.params.id), admin.admin.id);
    respond(res, result, {
        not_found: { status: 404, error: "File justification not found" },
        file_justification_rejected: (r) => ({ status: 200, body: r.fileJustification }),
    });
}));

fileRouter.delete("/file-justifications/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.deleteJustification(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "File justification not found" },
        orphan_super_admin_only: { blocked: { type: "Operation", reason: "Linked file is missing, only a super admin can delete this orphan link" } },
        justification_already_validated: { blocked: { type: "Operation", reason: "File justification is validated" } },
        file_justification_deleted_with_warnings: (r) => storageCleanupWarning("File justification deleted", r.failedPaths),
        file_justification_deleted: { status: 200, body: { message: "File justification deleted" } },
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
        not_found: { status: 404, error: "File assessment not found" },
        file_assessment_found: (r) => ({ status: 200, body: r.fileAssessment }),
    });
}));

fileRouter.post("/file-assessments", ...authed(async (req, res) => {
    const result = await fileUseCases.submitForAssessment(req.body);
    respond(res, result, {
        missing_fields: { status: 400, error: "assessmentId, assessmentGroupId and fileId are required" },
        file_assessment_already_exists: { blocked: { type: "Creation", reason: "This file has already been submitted for this assessment group" } },
        file_already_linked: { blocked: { type: "Operation", reason: "File is already linked to another context" } },
        file_assessment_submitted: (r) => ({ status: 201, body: r.fileAssessment }),
    });
}));

fileRouter.delete("/file-assessments/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.deleteAssessmentFile(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "File assessment not found" },
        assessment_missing: { blocked: { type: "Operation", reason: "Linked assessment is missing, cannot verify due date" } },
        assessment_past_due_date: { blocked: { type: "Operation", reason: "Assessment due date has passed" } },
        file_missing: { blocked: { type: "Operation", reason: "Submission file is missing, only a super admin can delete this orphan submission" } },
        file_assessment_deleted_with_warnings: (r) => storageCleanupWarning("File assessment deleted", r.failedPaths),
        file_assessment_deleted: { status: 200, body: { message: "File assessment deleted" } },
    });
}));


fileRouter.get("/file-assessment-instructions/assessment/:assessmentId", ...authed(async (req, res) => {
    const result = await fileUseCases.listInstructionsByAssessment(String(req.params.assessmentId));
    send(res, { status: 200, body: result.instructions });
}));

fileRouter.get("/file-assessment-instructions/:id", ...authed(async (req, res) => {
    const result = await fileUseCases.findInstructionById(String(req.params.id));
    respond(res, result, {
        not_found: { status: 404, error: "File assessment instruction not found" },
        instruction_found: (r) => ({ status: 200, body: r.instruction }),
    });
}));

fileRouter.post("/file-assessment-instructions", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.uploadInstruction(req.body, auth);
    respond(res, result, {
        missing_fields: { status: 400, error: "assessmentId and fileId are required" },
        file_assessment_instruction_already_exists: { blocked: { type: "Creation", reason: "This file is already attached as an instruction for this assessment" } },
        file_already_linked: { blocked: { type: "Operation", reason: "File is already linked to another context" } },
        instruction_uploaded: (r) => ({ status: 201, body: r.instruction }),
    });
}));

fileRouter.delete("/file-assessment-instructions/:id", ...authed(async (req, res) => {
    const auth = getAuthFlags(req.auth);
    const result = await fileUseCases.deleteInstruction(String(req.params.id), auth);
    respond(res, result, {
        not_found: { status: 404, error: "File assessment instruction not found" },
        orphan_super_admin_only: { blocked: { type: "Operation", reason: "Linked file is missing, only a super admin can delete this orphan link" } },
        instruction_deleted_with_warnings: (r) => storageCleanupWarning("File assessment instruction deleted", r.failedPaths),
        instruction_deleted: { status: 200, body: { message: "File assessment instruction deleted" } },
    });
}));
