import { randomUUID } from "node:crypto";
import { type File } from "@domain/file/file.entity";
import { type FileCourse } from "@domain/file/file-course/file-course.entity";
import { type FileDocument } from "@domain/file/file-document/file-document.entity";
import { DocumentStatus } from "@domain/file/file-document/file-document.enums";
import { type FileJustification } from "@domain/file/file-justification/file-justification.entity";
import { BasicStatus } from "@domain/absence/absence.enums";
import { type FileAssessment } from "@domain/file/file-assessment/file-assessment.entity";
import { type FileAssessmentInstruction } from "@domain/file/file-assessment-instruction/file-assessment-instruction.entity";
import { type FileRepository } from "@application/file/file.repository";
import { type FileCourseRepository } from "@application/file/file-course/file-course.repository";
import { type FileDocumentRepository } from "@application/file/file-document/file-document.repository";
import { type FileJustificationRepository } from "@application/file/file-justification/file-justification.repository";
import { type FileAssessmentRepository } from "@application/file/file-assessment/file-assessment.repository";
import { type FileAssessmentInstructionRepository } from "@application/file/file-assessment-instruction/file-assessment-instruction.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type FileView = {
    id: string;
    storagePath: string;
    name: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    uploadedBy: string;
    uploadedAt: string;
};

export type FileCourseView = {
    id: string;
    name: string;
    fileId: string;
    courseId: string;
};

export type FileDocumentView = {
    id: string;
    fileId: string;
    studentId: string;
    status: DocumentStatus;
};

export type FileJustificationView = {
    id: string;
    absenceId: string;
    fileId: string;
    validationStatus: string;
    processedBy: string | null;
};

export type FileAssessmentView = {
    id: string;
    assessmentId: string;
    assessmentGroupId: string;
    fileId: string;
};

export type CreateFileResult =
    | MissingFields
    | { kind: "file_created"; file: FileView };

export type DeleteFileResult = NotFound | { kind: "file_deleted" };

export type GetFileResult = NotFound | { kind: "file_found"; file: FileView };

export type ListFilesResult = { kind: "files_listed"; files: FileView[] };

export type AttachFileCourseResult =
    | MissingFields
    | { kind: "file_course_attached"; fileCourse: FileCourseView };

export type DeleteFileCourseResult = NotFound | { kind: "file_course_deleted" };

export type GetFileCourseResult =
    | NotFound
    | { kind: "file_course_found"; fileCourse: FileCourseView };

export type ListFileCoursesResult = { kind: "file_courses_listed"; fileCourses: FileCourseView[] };

export type AttachFileDocumentResult =
    | MissingFields
    | { kind: "file_document_attached"; fileDocument: FileDocumentView };

export type ValidateFileDocumentResult =
    | NotFound
    | { kind: "file_document_validated"; fileDocument: FileDocumentView };

export type ExpireFileDocumentResult =
    | NotFound
    | { kind: "file_document_expired"; fileDocument: FileDocumentView };

export type DeleteFileDocumentResult = NotFound | { kind: "file_document_deleted" };

export type GetFileDocumentResult =
    | NotFound
    | { kind: "file_document_found"; fileDocument: FileDocumentView };

export type ListFileDocumentsResult = {
    kind: "file_documents_listed";
    fileDocuments: FileDocumentView[];
};

export type AttachFileJustificationResult =
    | MissingFields
    | { kind: "file_justification_attached"; fileJustification: FileJustificationView };

export type ValidateFileJustificationResult =
    | NotFound
    | { kind: "file_justification_validated"; fileJustification: FileJustificationView };

export type RejectFileJustificationResult =
    | NotFound
    | { kind: "file_justification_rejected"; fileJustification: FileJustificationView };

export type DeleteFileJustificationResult =
    | NotFound
    | { kind: "file_justification_deleted" };

export type GetFileJustificationResult =
    | NotFound
    | { kind: "file_justification_found"; fileJustification: FileJustificationView };

export type ListFileJustificationsResult = {
    kind: "file_justifications_listed";
    fileJustifications: FileJustificationView[];
};

export type SubmitFileAssessmentResult =
    | MissingFields
    | { kind: "file_assessment_submitted"; fileAssessment: FileAssessmentView };

export type DeleteFileAssessmentResult =
    | NotFound
    | { kind: "file_assessment_deleted" };

export type GetFileAssessmentResult =
    | NotFound
    | { kind: "file_assessment_found"; fileAssessment: FileAssessmentView };

export type ListFileAssessmentsResult = {
    kind: "file_assessments_listed";
    fileAssessments: FileAssessmentView[];
};

export type FileAssessmentInstructionView = {
    id: string;
    assessmentId: string;
    fileId: string;
    uploadedAt: string;
};

export type UploadAssessmentInstructionResult =
    | MissingFields
    | { kind: "instruction_uploaded"; instruction: FileAssessmentInstructionView };

export type DeleteAssessmentInstructionResult =
    | NotFound
    | { kind: "instruction_deleted" };

export type GetAssessmentInstructionResult =
    | NotFound
    | { kind: "instruction_found"; instruction: FileAssessmentInstructionView };

export type ListAssessmentInstructionsResult = {
    kind: "instructions_listed";
    instructions: FileAssessmentInstructionView[];
};

const toFileView = (f: File): FileView => ({
    id: f.id,
    storagePath: f.storagePath,
    name: f.name,
    originalName: f.originalName,
    mimeType: f.mimeType,
    sizeBytes: f.sizeBytes,
    uploadedBy: f.uploadedBy,
    uploadedAt: f.uploadedAt.toISOString(),
});

const toFileCourseView = (f: FileCourse): FileCourseView => ({
    id: f.id,
    name: f.name,
    fileId: f.fileId,
    courseId: f.courseId,
});

const toFileDocumentView = (f: FileDocument): FileDocumentView => ({
    id: f.id,
    fileId: f.fileId,
    studentId: f.studentId,
    status: f.status,
});

const toFileJustificationView = (f: FileJustification): FileJustificationView => ({
    id: f.id,
    absenceId: f.absenceId,
    fileId: f.fileId,
    validationStatus: f.validationStatus,
    processedBy: f.processedBy,
});

const toFileAssessmentView = (f: FileAssessment): FileAssessmentView => ({
    id: f.id,
    assessmentId: f.assessmentId,
    assessmentGroupId: f.assessmentGroupId,
    fileId: f.fileId,
});

const toFileAssessmentInstructionView = (f: FileAssessmentInstruction): FileAssessmentInstructionView => ({
    id: f.id,
    assessmentId: f.assessmentId,
    fileId: f.fileId,
    uploadedAt: f.uploadedAt.toISOString(),
});

export class FileUseCases {
    constructor(
        private readonly files: FileRepository,
        private readonly fileCourses: FileCourseRepository,
        private readonly fileDocuments: FileDocumentRepository,
        private readonly fileJustifications: FileJustificationRepository,
        private readonly fileAssessments: FileAssessmentRepository,
        private readonly fileAssessmentInstructions: FileAssessmentInstructionRepository,
    ) {}

    async create(input: {
        storagePath?: string;
        name?: string;
        originalName?: string;
        mimeType?: string;
        sizeBytes?: number;
        uploadedBy?: string;
    }): Promise<CreateFileResult> {
        const { storagePath, name, originalName, mimeType, sizeBytes, uploadedBy } = input;
        if (!storagePath || !name || !originalName || !mimeType || sizeBytes === undefined || !uploadedBy)
            return MissingFields;
        const file: File = {
            id: randomUUID(),
            storagePath,
            name,
            originalName,
            mimeType,
            sizeBytes,
            uploadedBy,
            uploadedAt: new Date(),
        };
        await this.files.save(file);
        return { kind: "file_created", file: toFileView(file) };
    }

    async delete(id: string): Promise<DeleteFileResult> {
        const file = await this.files.findById(id);
        if (!file) return NotFound;
        await this.files.deleteById(id);
        return { kind: "file_deleted" };
    }

    async findById(id: string): Promise<GetFileResult> {
        const file = await this.files.findById(id);
        if (!file) return NotFound;
        return { kind: "file_found", file: toFileView(file) };
    }

    async list(): Promise<ListFilesResult> {
        const files = await this.files.list();
        return { kind: "files_listed", files: files.map(toFileView) };
    }

    async listByUploadedBy(userId: string): Promise<ListFilesResult> {
        const files = await this.files.findByUploadedBy(userId);
        return { kind: "files_listed", files: files.map(toFileView) };
    }

    async attachToCourse(input: {
        name?: string;
        fileId?: string;
        courseId?: string;
    }): Promise<AttachFileCourseResult> {
        const { name, fileId, courseId } = input;
        if (!name || !fileId || !courseId) return MissingFields;
        const entry: FileCourse = { id: randomUUID(), name, fileId, courseId };
        await this.fileCourses.save(entry);
        return { kind: "file_course_attached", fileCourse: toFileCourseView(entry) };
    }

    async detachFromCourse(id: string): Promise<DeleteFileCourseResult> {
        const entry = await this.fileCourses.findById(id);
        if (!entry) return NotFound;
        await this.fileCourses.deleteById(id);
        return { kind: "file_course_deleted" };
    }

    async findFileCourseById(id: string): Promise<GetFileCourseResult> {
        const entry = await this.fileCourses.findById(id);
        if (!entry) return NotFound;
        return { kind: "file_course_found", fileCourse: toFileCourseView(entry) };
    }

    async listFileCoursesByCourse(courseId: string): Promise<ListFileCoursesResult> {
        const entries = await this.fileCourses.findByCourseId(courseId);
        return { kind: "file_courses_listed", fileCourses: entries.map(toFileCourseView) };
    }

    async listFileCoursesByFile(fileId: string): Promise<ListFileCoursesResult> {
        const entries = await this.fileCourses.findByFileId(fileId);
        return { kind: "file_courses_listed", fileCourses: entries.map(toFileCourseView) };
    }

    async attachAsDocument(input: {
        fileId?: string;
        studentId?: string;
        status?: DocumentStatus;
    }): Promise<AttachFileDocumentResult> {
        const { fileId, studentId, status } = input;
        if (!fileId || !studentId || !status) return MissingFields;
        const entry: FileDocument = { id: randomUUID(), fileId, studentId, status };
        await this.fileDocuments.save(entry);
        return { kind: "file_document_attached", fileDocument: toFileDocumentView(entry) };
    }

    async validateDocument(id: string): Promise<ValidateFileDocumentResult> {
        const entry = await this.fileDocuments.findById(id);
        if (!entry) return NotFound;
        entry.status = DocumentStatus.VALID;
        await this.fileDocuments.save(entry);
        return { kind: "file_document_validated", fileDocument: toFileDocumentView(entry) };
    }

    async expireDocument(id: string): Promise<ExpireFileDocumentResult> {
        const entry = await this.fileDocuments.findById(id);
        if (!entry) return NotFound;
        entry.status = DocumentStatus.EXPIRED;
        await this.fileDocuments.save(entry);
        return { kind: "file_document_expired", fileDocument: toFileDocumentView(entry) };
    }

    async deleteFileDocument(id: string): Promise<DeleteFileDocumentResult> {
        const entry = await this.fileDocuments.findById(id);
        if (!entry) return NotFound;
        await this.fileDocuments.deleteById(id);
        return { kind: "file_document_deleted" };
    }

    async findFileDocumentById(id: string): Promise<GetFileDocumentResult> {
        const entry = await this.fileDocuments.findById(id);
        if (!entry) return NotFound;
        return { kind: "file_document_found", fileDocument: toFileDocumentView(entry) };
    }

    async listFileDocuments(): Promise<ListFileDocumentsResult> {
        const entries = await this.fileDocuments.list();
        return { kind: "file_documents_listed", fileDocuments: entries.map(toFileDocumentView) };
    }

    async listFileDocumentsByStudent(studentId: string): Promise<ListFileDocumentsResult> {
        const entries = await this.fileDocuments.findByStudentId(studentId);
        return { kind: "file_documents_listed", fileDocuments: entries.map(toFileDocumentView) };
    }

    async attachAsJustification(input: {
        absenceId?: string;
        fileId?: string;
    }): Promise<AttachFileJustificationResult> {
        const { absenceId, fileId } = input;
        if (!absenceId || !fileId) return MissingFields;
        const entry: FileJustification = {
            id: randomUUID(),
            absenceId,
            fileId,
            validationStatus: BasicStatus.PENDING,
            processedBy: null,
        };
        await this.fileJustifications.save(entry);
        return { kind: "file_justification_attached", fileJustification: toFileJustificationView(entry) };
    }

    async validateJustification(id: string, adminId: string): Promise<ValidateFileJustificationResult> {
        const entry = await this.fileJustifications.findById(id);
        if (!entry) return NotFound;
        entry.validationStatus = BasicStatus.VALIDATED;
        entry.processedBy = adminId;
        await this.fileJustifications.save(entry);
        return { kind: "file_justification_validated", fileJustification: toFileJustificationView(entry) };
    }

    async rejectJustification(id: string, adminId: string): Promise<RejectFileJustificationResult> {
        const entry = await this.fileJustifications.findById(id);
        if (!entry) return NotFound;
        entry.validationStatus = BasicStatus.REJECTED;
        entry.processedBy = adminId;
        await this.fileJustifications.save(entry);
        return { kind: "file_justification_rejected", fileJustification: toFileJustificationView(entry) };
    }

    async deleteJustification(id: string): Promise<DeleteFileJustificationResult> {
        const entry = await this.fileJustifications.findById(id);
        if (!entry) return NotFound;
        await this.fileJustifications.deleteById(id);
        return { kind: "file_justification_deleted" };
    }

    async findJustificationById(id: string): Promise<GetFileJustificationResult> {
        const entry = await this.fileJustifications.findById(id);
        if (!entry) return NotFound;
        return { kind: "file_justification_found", fileJustification: toFileJustificationView(entry) };
    }

    async listJustificationsByAbsence(absenceId: string): Promise<ListFileJustificationsResult> {
        const entries = await this.fileJustifications.findByAbsenceId(absenceId);
        return { kind: "file_justifications_listed", fileJustifications: entries.map(toFileJustificationView) };
    }

    async submitForAssessment(input: {
        assessmentId?: string;
        assessmentGroupId?: string;
        fileId?: string;
    }): Promise<SubmitFileAssessmentResult> {
        const { assessmentId, assessmentGroupId, fileId } = input;
        if (!assessmentId || !assessmentGroupId || !fileId) return MissingFields;
        const entry: FileAssessment = {
            id: randomUUID(),
            assessmentId,
            assessmentGroupId,
            fileId,
        };
        await this.fileAssessments.save(entry);
        return { kind: "file_assessment_submitted", fileAssessment: toFileAssessmentView(entry) };
    }

    async deleteAssessmentFile(id: string): Promise<DeleteFileAssessmentResult> {
        const entry = await this.fileAssessments.findById(id);
        if (!entry) return NotFound;
        await this.fileAssessments.deleteById(id);
        return { kind: "file_assessment_deleted" };
    }

    async findAssessmentFileById(id: string): Promise<GetFileAssessmentResult> {
        const entry = await this.fileAssessments.findById(id);
        if (!entry) return NotFound;
        return { kind: "file_assessment_found", fileAssessment: toFileAssessmentView(entry) };
    }

    async listAssessmentFilesByAssessment(assessmentId: string): Promise<ListFileAssessmentsResult> {
        const entries = await this.fileAssessments.findByAssessmentId(assessmentId);
        return { kind: "file_assessments_listed", fileAssessments: entries.map(toFileAssessmentView) };
    }

    async listAssessmentFilesByGroup(assessmentGroupId: string): Promise<ListFileAssessmentsResult> {
        const entries = await this.fileAssessments.findByAssessmentGroupId(assessmentGroupId);
        return { kind: "file_assessments_listed", fileAssessments: entries.map(toFileAssessmentView) };
    }

    async uploadInstruction(input: {
        assessmentId?: string;
        fileId?: string;
    }): Promise<UploadAssessmentInstructionResult> {
        const { assessmentId, fileId } = input;
        if (!assessmentId || !fileId) return MissingFields;
        const entry: FileAssessmentInstruction = {
            id: randomUUID(),
            assessmentId,
            fileId,
            uploadedAt: new Date(),
        };
        await this.fileAssessmentInstructions.save(entry);
        return { kind: "instruction_uploaded", instruction: toFileAssessmentInstructionView(entry) };
    }

    async deleteInstruction(id: string): Promise<DeleteAssessmentInstructionResult> {
        const entry = await this.fileAssessmentInstructions.findById(id);
        if (!entry) return NotFound;
        await this.fileAssessmentInstructions.deleteById(id);
        return { kind: "instruction_deleted" };
    }

    async findInstructionById(id: string): Promise<GetAssessmentInstructionResult> {
        const entry = await this.fileAssessmentInstructions.findById(id);
        if (!entry) return NotFound;
        return { kind: "instruction_found", instruction: toFileAssessmentInstructionView(entry) };
    }

    async listInstructionsByAssessment(assessmentId: string): Promise<ListAssessmentInstructionsResult> {
        const entries = await this.fileAssessmentInstructions.findByAssessmentId(assessmentId);
        return { kind: "instructions_listed", instructions: entries.map(toFileAssessmentInstructionView) };
    }
}
