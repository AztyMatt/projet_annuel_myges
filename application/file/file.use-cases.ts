import { randomUUID } from "node:crypto";
import { type File } from "@domain/file/file.entity";
import { type FileCourse } from "@domain/file/file-course/file-course.entity";
import { type FileDocument } from "@domain/file/file-document/file-document.entity";
import { DocumentStatus } from "@domain/file/file-document/file-document.enums";
import { type FileJustification } from "@domain/file/file-justification/file-justification.entity";
import { type Absence } from "@domain/absence/absence.entity";
import { BasicStatus } from "@domain/absence/absence.enums";
import { type FileAssessment } from "@domain/file/file-assessment/file-assessment.entity";
import { type FileAssessmentInstruction } from "@domain/file/file-assessment-instruction/file-assessment-instruction.entity";
import { type FileRepository } from "@application/file/file.repository";
import { type FileCourseRepository } from "@application/file/file-course/file-course.repository";
import { type FileDocumentRepository } from "@application/file/file-document/file-document.repository";
import { type FileJustificationRepository } from "@application/file/file-justification/file-justification.repository";
import { type FileAssessmentRepository } from "@application/file/file-assessment/file-assessment.repository";
import { type FileAssessmentInstructionRepository } from "@application/file/file-assessment-instruction/file-assessment-instruction.repository";
import { type AssessmentRepository } from "@application/assessment/assessment.repository";
import { type AssessmentGroupRepository } from "@application/assessment/assessment-group/assessment-group.repository";
import { type AssessmentGroupMemberRepository } from "@application/assessment/assessment-group-member/assessment-group-member.repository";
import { type AbsenceRepository } from "@application/absence/absence.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type DocumentAdministrativeRepository } from "@application/document/document-administrative/document-administrative.repository";
import { type DocumentApprenticeshipContractRepository } from "@application/document/document-apprenticeship-contract/document-apprenticeship-contract.repository";
import { type StorageService } from "@application/file/storage.service";
import { type UnitOfWork } from "@application/types/unit-of-work";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { NotFound, Forbidden, ForbiddenOwnership } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";
import { isFileOwner } from "@application/file/file-access";
import { isCourseInstructor } from "@application/course/course-access";
import { canReadAbsence } from "@application/absence/absence-access";
import { MAX_FILE_SIZE_BYTES, isAllowedMimeType, checkAgainstPolicy, CONTEXT_POLICIES } from "@domain/file/file.policy";

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
    | { kind: "invalid_size" }
    | { kind: "file_too_large" }
    | { kind: "mime_type_not_allowed" }
    | { kind: "file_created"; file: FileView };

export type DeleteFileResult =
    | NotFound
    | Forbidden
    | { kind: "file_has_contextual_links" }
    | { kind: "file_deleted" }
    | { kind: "file_deleted_with_warnings"; failedPaths: string[] };

export type GetFileResult = NotFound | { kind: "file_found"; file: FileView };

export type ListFilesResult = Forbidden | { kind: "files_listed"; files: FileView[] };

export type AttachFileCourseResult =
    | NotFound
    | Forbidden
    | { kind: "file_too_large" }
    | { kind: "mime_type_not_allowed" }
    | { kind: "file_course_already_exists" }
    | { kind: "file_already_linked" }
    | { kind: "file_course_attached"; fileCourse: FileCourseView };

export type DeleteFileCourseResult =
    | NotFound
    | Forbidden
    | { kind: "orphan_super_admin_only" }
    | { kind: "file_course_deleted" }
    | { kind: "file_course_deleted_with_warnings"; failedPaths: string[] };

export type GetFileCourseResult =
    | NotFound
    | { kind: "file_course_found"; fileCourse: FileCourseView };

export type ListFileCoursesResult = { kind: "file_courses_listed"; fileCourses: FileCourseView[] };

export type AttachFileDocumentResult =
    | NotFound
    | Forbidden
    | { kind: "file_document_already_exists" }
    | { kind: "file_already_linked" }
    | { kind: "file_document_attached"; fileDocument: FileDocumentView };

export type ValidateFileDocumentResult =
    | NotFound
    | Forbidden
    | { kind: "file_document_has_no_doc_type" }
    | { kind: "file_document_expired" }
    | { kind: "document_already_expired" }
    | { kind: "document_already_valid" }
    | { kind: "valid_document_of_type_exists" }
    | { kind: "file_document_validated"; fileDocument: FileDocumentView };

export type ExpireFileDocumentResult =
    | NotFound
    | Forbidden
    | { kind: "document_already_expired" }
    | { kind: "file_document_expired"; fileDocument: FileDocumentView };

export type DeleteFileDocumentResult =
    | NotFound
    | Forbidden
    | { kind: "orphan_super_admin_only" }
    | { kind: "file_document_has_doc_type" }
    | { kind: "file_document_is_valid" }
    | { kind: "file_document_deleted" }
    | { kind: "file_document_deleted_with_warnings"; failedPaths: string[] };

export type GetFileDocumentResult =
    | NotFound
    | { kind: "file_document_found"; fileDocument: FileDocumentView };

export type ListFileDocumentsResult = Forbidden | {
    kind: "file_documents_listed";
    fileDocuments: FileDocumentView[];
};

export type AttachFileJustificationResult =
    | NotFound
    | Forbidden
    | { kind: "absence_not_found" }
    | { kind: "absence_already_processed" }
    | { kind: "file_too_large" }
    | { kind: "mime_type_not_allowed" }
    | { kind: "file_justification_already_exists" }
    | { kind: "file_already_linked" }
    | { kind: "file_justification_attached"; fileJustification: FileJustificationView };

export type ValidateFileJustificationResult =
    | NotFound
    | Forbidden
    | { kind: "file_justification_validated"; fileJustification: FileJustificationView };

export type RejectFileJustificationResult =
    | NotFound
    | Forbidden
    | { kind: "file_justification_rejected"; fileJustification: FileJustificationView };

export type DeleteFileJustificationResult =
    | NotFound
    | Forbidden
    | { kind: "orphan_super_admin_only" }
    | { kind: "justification_already_validated" }
    | { kind: "file_justification_deleted" }
    | { kind: "file_justification_deleted_with_warnings"; failedPaths: string[] };

export type GetFileJustificationResult =
    | NotFound
    | { kind: "file_justification_found"; fileJustification: FileJustificationView };

export type ListFileJustificationsResult = {
    kind: "file_justifications_listed";
    fileJustifications: FileJustificationView[];
};

export type SubmitFileAssessmentResult =
    | NotFound
    | Forbidden
    | { kind: "assessment_group_missing" }
    | { kind: "assessment_missing" }
    | { kind: "assessment_not_published" }
    | { kind: "assessment_past_due_date" }
    | { kind: "submission_limit_reached" }
    | { kind: "file_too_large" }
    | { kind: "mime_type_not_allowed" }
    | { kind: "file_assessment_already_exists" }
    | { kind: "file_already_linked" }
    | { kind: "file_assessment_submitted"; fileAssessment: FileAssessmentView };

export type DeleteFileAssessmentResult =
    | NotFound
    | Forbidden
    | { kind: "assessment_missing" }
    | { kind: "assessment_past_due_date" }
    | { kind: "file_missing" }
    | { kind: "file_assessment_deleted" }
    | { kind: "file_assessment_deleted_with_warnings"; failedPaths: string[] };

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
    | NotFound
    | Forbidden
    | { kind: "file_too_large" }
    | { kind: "mime_type_not_allowed" }
    | { kind: "file_assessment_instruction_already_exists" }
    | { kind: "file_already_linked" }
    | { kind: "instruction_uploaded"; instruction: FileAssessmentInstructionView };

export type DeleteAssessmentInstructionResult =
    | NotFound
    | Forbidden
    | { kind: "orphan_super_admin_only" }
    | { kind: "instruction_deleted" }
    | { kind: "instruction_deleted_with_warnings"; failedPaths: string[] };

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
        private readonly assessments: AssessmentRepository,
        private readonly documentAdministratives: DocumentAdministrativeRepository,
        private readonly documentApprenticeshipContracts: DocumentApprenticeshipContractRepository,
        private readonly storage: StorageService,
        private readonly assessmentGroupMembers: AssessmentGroupMemberRepository,
        private readonly students: StudentRepository,
        private readonly assessmentGroups: AssessmentGroupRepository,
        private readonly absences: AbsenceRepository,
        private readonly unitOfWork: UnitOfWork,
        private readonly courses: CourseRepository,
        private readonly instructors: InstructorRepository,
        private readonly sessions: SessionRepository,
    ) {}

    private canReadAbsence(absence: Absence, auth: AuthContext): Promise<boolean> {
        return canReadAbsence(
            { students: this.students, sessions: this.sessions, courses: this.courses, instructors: this.instructors },
            absence,
            auth,
        );
    }

    async create(input: {
        name: string;
        originalName: string;
        mimeType: string;
        sizeBytes: number;
        uploadedBy: string;
    }): Promise<CreateFileResult> {
        const { name, originalName, mimeType, sizeBytes, uploadedBy } = input;

        if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) return { kind: "invalid_size" };
        if (sizeBytes > MAX_FILE_SIZE_BYTES) return { kind: "file_too_large" };
        if (!isAllowedMimeType(mimeType)) return { kind: "mime_type_not_allowed" };
        const id = randomUUID();
        const storagePath = `files/${id}`;
        const file: File = {
            id,
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

    async delete(id: string, auth: AuthContext): Promise<DeleteFileResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const file = await this.files.findById(id);
        if (!file) return NotFound;
        if (await this.isFileLinked(id)) return { kind: "file_has_contextual_links" };
        await this.unitOfWork.run(async () => {
            await this.files.deleteById(id);
        });
        const failedPaths = await this.storage.deleteMany([file.storagePath]);
        return failedPaths.length > 0
            ? { kind: "file_deleted_with_warnings", failedPaths }
            : { kind: "file_deleted" };
    }

    async findById(id: string, auth: AuthContext): Promise<GetFileResult> {
        if (!auth.isAdmin) return NotFound;
        const file = await this.files.findById(id);
        if (!file) return NotFound;
        return { kind: "file_found", file: toFileView(file) };
    }

    async list(auth: AuthContext): Promise<ListFilesResult> {
        if (!auth.isAdmin) return Forbidden;
        const files = await this.files.list();
        return { kind: "files_listed", files: files.map(toFileView) };
    }

    async listMine(auth: AuthContext): Promise<{ kind: "files_listed"; files: FileView[] }> {
        const files = await this.files.findByUploadedBy(auth.requesterId);
        return { kind: "files_listed", files: files.map(toFileView) };
    }

    async listByUploadedBy(userId: string, auth: AuthContext): Promise<ListFilesResult> {
        if (!auth.isAdmin) return Forbidden;
        const files = await this.files.findByUploadedBy(userId);
        return { kind: "files_listed", files: files.map(toFileView) };
    }

    private async isFileLinked(fileId: string): Promise<boolean> {
        const [courses, document, justification, assessment, instructions] = await Promise.all([
            this.fileCourses.findByFileId(fileId),
            this.fileDocuments.findByFileId(fileId),
            this.fileJustifications.findByFileId(fileId),
            this.fileAssessments.findByFileId(fileId),
            this.fileAssessmentInstructions.findByFileId(fileId),
        ]);
        return courses.length > 0 || !!document || !!justification || !!assessment || instructions.length > 0;
    }

    private authorizeFileDetach(
        file: File | undefined,
        auth: AuthContext,
    ): { kind: "ok" } | Forbidden | { kind: "orphan_super_admin_only" } {
        if (!auth.isAdmin && !isFileOwner(file, auth)) return ForbiddenOwnership;
        if (!file && !auth.isSuperAdmin) return { kind: "orphan_super_admin_only" };
        return { kind: "ok" };
    }

    private async cascadeDeleteLinkAndFile(
        file: File | undefined,
        deleteLink: () => Promise<void>,
    ): Promise<{ kind: "deleted" } | { kind: "deleted_with_warnings"; failedPaths: string[] }> {
        await this.unitOfWork.run(async () => {
            await deleteLink();
            if (file) await this.files.deleteById(file.id);
        });
        const failedPaths = file ? await this.storage.deleteMany([file.storagePath]) : [];
        return failedPaths.length > 0
            ? { kind: "deleted_with_warnings", failedPaths }
            : { kind: "deleted" };
    }

    async attachToCourse(input: {
        name: string;
        fileId: string;
        courseId: string;
    }, auth: AuthContext): Promise<AttachFileCourseResult> {
        const { name, fileId, courseId } = input;

        const file = await this.files.findById(fileId);
        if (!file) return NotFound;
        const course = await this.courses.findById(courseId);
        if (!course) return NotFound;

        if (!auth.isAdmin) {
            const instructor = await this.instructors.findByUserId(auth.requesterId);
            if (!instructor || course.instructorId !== instructor.id || !isFileOwner(file, auth)) return ForbiddenOwnership;
        }

        const policyError = checkAgainstPolicy(CONTEXT_POLICIES.FILE_COURSE, file.mimeType, file.sizeBytes);
        if (policyError) return { kind: policyError };
        if (await this.fileCourses.findByFileAndCourse(fileId, courseId)) return { kind: "file_course_already_exists" };
        if (await this.isFileLinked(fileId)) return { kind: "file_already_linked" };
        const entry: FileCourse = { id: randomUUID(), name, fileId, courseId };
        await this.fileCourses.save(entry);
        return { kind: "file_course_attached", fileCourse: toFileCourseView(entry) };
    }

    async detachFromCourse(id: string, auth: AuthContext): Promise<DeleteFileCourseResult> {
        const entry = await this.fileCourses.findById(id);
        if (!entry) return NotFound;
        const file = await this.files.findById(entry.fileId);
        const authResult = this.authorizeFileDetach(file, auth);
        if (authResult.kind !== "ok") return authResult;
        const outcome = await this.cascadeDeleteLinkAndFile(file, () => this.fileCourses.deleteById(id));
        return outcome.kind === "deleted"
            ? { kind: "file_course_deleted" }
            : { kind: "file_course_deleted_with_warnings", failedPaths: outcome.failedPaths };
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
        fileId: string;
        studentId: string;
    }, auth: AuthContext): Promise<AttachFileDocumentResult> {
        const { fileId, studentId } = input;
        const file = await this.files.findById(fileId);
        if (!file) return NotFound;

        if (!(await this.students.findById(studentId))) return NotFound;

        if (!auth.isAdmin) {
            const requester = await this.students.findByUserId(auth.requesterId);
            if (!isFileOwner(file, auth) || !requester || requester.id !== studentId) return ForbiddenOwnership;
        }

        if (await this.fileDocuments.findByFileAndStudent(fileId, studentId)) return { kind: "file_document_already_exists" };
        if (await this.isFileLinked(fileId)) return { kind: "file_already_linked" };
        const entry: FileDocument = { id: randomUUID(), fileId, studentId, status: DocumentStatus.PENDING };
        await this.fileDocuments.save(entry);
        return { kind: "file_document_attached", fileDocument: toFileDocumentView(entry) };
    }

    async validateDocument(id: string, auth: AuthContext): Promise<ValidateFileDocumentResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.fileDocuments.findById(id);
        if (!entry) return NotFound;

        if (entry.status === DocumentStatus.VALID) return { kind: "document_already_valid" };

        if (entry.status === DocumentStatus.EXPIRED) return { kind: "file_document_expired" };
        const [administrative, contract] = await Promise.all([
            this.documentAdministratives.findByFileDocumentId(id),
            this.documentApprenticeshipContracts.findByFileDocumentId(id),
        ]);
        if (!administrative && !contract) return { kind: "file_document_has_no_doc_type" };

        const now = new Date();
        if ((administrative?.expiration && administrative.expiration <= now) || (contract && contract.endDate <= now))
            return { kind: "document_already_expired" };

        const currentKey = administrative ? `admin:${administrative.type}` : `contract:${contract!.type}`;
        const siblings = await this.fileDocuments.findByStudentId(entry.studentId);
        for (const other of siblings) {
            if (other.id === entry.id || other.status !== DocumentStatus.VALID) continue;
            const [otherAdmin, otherContract] = await Promise.all([
                this.documentAdministratives.findByFileDocumentId(other.id),
                this.documentApprenticeshipContracts.findByFileDocumentId(other.id),
            ]);
            const otherKey = otherAdmin ? `admin:${otherAdmin.type}` : otherContract ? `contract:${otherContract.type}` : null;
            if (otherKey === currentKey) return { kind: "valid_document_of_type_exists" };
        }
        entry.status = DocumentStatus.VALID;
        await this.fileDocuments.save(entry);
        return { kind: "file_document_validated", fileDocument: toFileDocumentView(entry) };
    }

    async expireDocument(id: string, auth: AuthContext): Promise<ExpireFileDocumentResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.fileDocuments.findById(id);
        if (!entry) return NotFound;

        if (entry.status === DocumentStatus.EXPIRED) return { kind: "document_already_expired" };
        entry.status = DocumentStatus.EXPIRED;
        await this.fileDocuments.save(entry);
        return { kind: "file_document_expired", fileDocument: toFileDocumentView(entry) };
    }

    async deleteFileDocument(id: string, auth: AuthContext): Promise<DeleteFileDocumentResult> {
        const entry = await this.fileDocuments.findById(id);
        if (!entry) return NotFound;
        const file = await this.files.findById(entry.fileId);
        const authResult = this.authorizeFileDetach(file, auth);

        if (authResult.kind === "forbidden") return NotFound;
        if (authResult.kind !== "ok") return authResult;
        if (await this.documentAdministratives.findByFileDocumentId(id)) return { kind: "file_document_has_doc_type" };
        if (await this.documentApprenticeshipContracts.findByFileDocumentId(id)) return { kind: "file_document_has_doc_type" };
        if (entry.status === DocumentStatus.VALID) return { kind: "file_document_is_valid" };
        const outcome = await this.cascadeDeleteLinkAndFile(file, () => this.fileDocuments.deleteById(id));
        return outcome.kind === "deleted"
            ? { kind: "file_document_deleted" }
            : { kind: "file_document_deleted_with_warnings", failedPaths: outcome.failedPaths };
    }

    async findFileDocumentById(id: string, auth: AuthContext): Promise<GetFileDocumentResult> {
        const entry = await this.fileDocuments.findById(id);
        if (!entry) return NotFound;

        if (!auth.isAdmin) {
            const student = await this.students.findByUserId(auth.requesterId);
            if (!student || student.id !== entry.studentId) return NotFound;
        }
        return { kind: "file_document_found", fileDocument: toFileDocumentView(entry) };
    }

    async listFileDocuments(auth: AuthContext): Promise<ListFileDocumentsResult> {
        if (!auth.isAdmin) return Forbidden;
        const entries = await this.fileDocuments.list();
        return { kind: "file_documents_listed", fileDocuments: entries.map(toFileDocumentView) };
    }

    async listFileDocumentsByStudent(studentId: string, auth: AuthContext): Promise<NotFound | { kind: "file_documents_listed"; fileDocuments: FileDocumentView[] }> {
        if (!auth.isAdmin) return NotFound;
        const entries = await this.fileDocuments.findByStudentId(studentId);
        return { kind: "file_documents_listed", fileDocuments: entries.map(toFileDocumentView) };
    }

    async listMineFileDocuments(auth: AuthContext): Promise<NotFound | { kind: "file_documents_listed"; fileDocuments: FileDocumentView[] }> {
        const student = await this.students.findByUserId(auth.requesterId);
        if (!student) return NotFound;
        const entries = await this.fileDocuments.findByStudentId(student.id);
        return { kind: "file_documents_listed", fileDocuments: entries.map(toFileDocumentView) };
    }

    async attachAsJustification(input: {
        absenceId: string;
        fileId: string;
    }, auth: AuthContext): Promise<AttachFileJustificationResult> {
        const { absenceId, fileId } = input;

        const absence = await this.absences.findById(absenceId);
        if (!absence) return { kind: "absence_not_found" };

        const file = await this.files.findById(fileId);
        if (!file) return NotFound;

        if (!auth.isAdmin) {
            const requester = await this.students.findByUserId(auth.requesterId);

            if (!requester || absence.studentId !== requester.id) return { kind: "absence_not_found" };
            if (!isFileOwner(file, auth)) return ForbiddenOwnership;
        }
        if (absence.status !== BasicStatus.PENDING) return { kind: "absence_already_processed" };

        const policyError = checkAgainstPolicy(CONTEXT_POLICIES.FILE_JUSTIFICATION, file.mimeType, file.sizeBytes);
        if (policyError) return { kind: policyError };
        if (await this.fileJustifications.findByAbsenceAndFile(absenceId, fileId)) return { kind: "file_justification_already_exists" };
        if (await this.isFileLinked(fileId)) return { kind: "file_already_linked" };
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

    async validateJustification(id: string, auth: AuthContext, adminId: string): Promise<ValidateFileJustificationResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.fileJustifications.findById(id);
        if (!entry) return NotFound;
        entry.validationStatus = BasicStatus.VALIDATED;
        entry.processedBy = adminId;
        await this.fileJustifications.save(entry);
        return { kind: "file_justification_validated", fileJustification: toFileJustificationView(entry) };
    }

    async rejectJustification(id: string, auth: AuthContext, adminId: string): Promise<RejectFileJustificationResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.fileJustifications.findById(id);
        if (!entry) return NotFound;
        entry.validationStatus = BasicStatus.REJECTED;
        entry.processedBy = adminId;
        await this.fileJustifications.save(entry);
        return { kind: "file_justification_rejected", fileJustification: toFileJustificationView(entry) };
    }

    async deleteJustification(id: string, auth: AuthContext): Promise<DeleteFileJustificationResult> {
        const entry = await this.fileJustifications.findById(id);
        if (!entry) return NotFound;
        const file = await this.files.findById(entry.fileId);
        const authResult = this.authorizeFileDetach(file, auth);

        if (authResult.kind === "forbidden") return NotFound;
        if (authResult.kind !== "ok") return authResult;
        if (entry.validationStatus === BasicStatus.VALIDATED) return { kind: "justification_already_validated" };
        const outcome = await this.cascadeDeleteLinkAndFile(file, () => this.fileJustifications.deleteById(id));
        return outcome.kind === "deleted"
            ? { kind: "file_justification_deleted" }
            : { kind: "file_justification_deleted_with_warnings", failedPaths: outcome.failedPaths };
    }

    async findJustificationById(id: string, auth: AuthContext): Promise<GetFileJustificationResult> {
        const entry = await this.fileJustifications.findById(id);
        if (!entry) return NotFound;

        const absence = await this.absences.findById(entry.absenceId);
        if (!absence || !(await this.canReadAbsence(absence, auth))) return NotFound;
        return { kind: "file_justification_found", fileJustification: toFileJustificationView(entry) };
    }

    async listJustificationsByAbsence(absenceId: string, auth: AuthContext): Promise<NotFound | { kind: "file_justifications_listed"; fileJustifications: FileJustificationView[] }> {
        const absence = await this.absences.findById(absenceId);
        if (!absence || !(await this.canReadAbsence(absence, auth))) return NotFound;
        const entries = await this.fileJustifications.findByAbsenceId(absenceId);
        return { kind: "file_justifications_listed", fileJustifications: entries.map(toFileJustificationView) };
    }

    async listMineJustifications(auth: AuthContext): Promise<NotFound | { kind: "file_justifications_listed"; fileJustifications: FileJustificationView[] }> {
        const student = await this.students.findByUserId(auth.requesterId);
        if (!student) return NotFound;
        const entries = await this.fileJustifications.findByStudentId(student.id);
        return { kind: "file_justifications_listed", fileJustifications: entries.map(toFileJustificationView) };
    }

    async submitForAssessment(input: {
        assessmentId: string;
        assessmentGroupId: string;
        fileId: string;
    }, auth: AuthContext): Promise<SubmitFileAssessmentResult> {
        const { assessmentId, assessmentGroupId, fileId } = input;
        const group = await this.assessmentGroups.findById(assessmentGroupId);
        if (!group || group.assessmentId !== assessmentId) return { kind: "assessment_group_missing" };
        const assessment = await this.assessments.findById(assessmentId);
        if (!assessment) return { kind: "assessment_missing" };
        if (!auth.isSuperAdmin) {
            const student = await this.students.findByUserId(auth.requesterId);
            const membership = student && (await this.assessmentGroupMembers.findByGroupAndStudent(assessmentGroupId, student.id));
            if (!membership) return ForbiddenOwnership;
        }

        if (!assessment.isPublished) return { kind: "assessment_not_published" };

        const file = await this.files.findById(fileId);
        if (!file) return NotFound;

        if (!auth.isSuperAdmin && !isFileOwner(file, auth)) return ForbiddenOwnership;

        if (new Date() > assessment.dueDate) return { kind: "assessment_past_due_date" };

        const policyError = checkAgainstPolicy(CONTEXT_POLICIES.FILE_ASSESSMENT, file.mimeType, file.sizeBytes);
        if (policyError) return { kind: policyError };
        const existing = await this.fileAssessments.findByAssessmentGroupId(assessmentGroupId);
        if (existing.length >= 5) return { kind: "submission_limit_reached" };
        if (await this.fileAssessments.findByGroupAndFile(assessmentGroupId, fileId)) return { kind: "file_assessment_already_exists" };
        if (await this.isFileLinked(fileId)) return { kind: "file_already_linked" };
        const entry: FileAssessment = {
            id: randomUUID(),
            assessmentId,
            assessmentGroupId,
            fileId,
        };
        await this.fileAssessments.save(entry);
        return { kind: "file_assessment_submitted", fileAssessment: toFileAssessmentView(entry) };
    }

    async deleteAssessmentFile(id: string, auth: AuthContext): Promise<DeleteFileAssessmentResult> {
        const entry = await this.fileAssessments.findById(id);
        if (!entry) return NotFound;
        if (!auth.isSuperAdmin) {
            const student = await this.students.findByUserId(auth.requesterId);
            if (!student) return ForbiddenOwnership;
            const membership = await this.assessmentGroupMembers.findByGroupAndStudent(entry.assessmentGroupId, student.id);
            if (!membership) return ForbiddenOwnership;
        }
        const assessment = await this.assessments.findById(entry.assessmentId);
        if (!assessment) {
            if (!auth.isSuperAdmin) return { kind: "assessment_missing" };
        } else if (!auth.isSuperAdmin && new Date() > assessment.dueDate) {
            return { kind: "assessment_past_due_date" };
        }
        const file = await this.files.findById(entry.fileId);
        if (!file && !auth.isSuperAdmin) return { kind: "file_missing" };
        await this.unitOfWork.run(async () => {
            await this.fileAssessments.deleteById(id);
            if (file) await this.files.deleteById(file.id);
        });
        const failedPaths = file ? await this.storage.deleteMany([file.storagePath]) : [];
        return failedPaths.length > 0
            ? { kind: "file_assessment_deleted_with_warnings", failedPaths }
            : { kind: "file_assessment_deleted" };
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
        assessmentId: string;
        fileId: string;
    }, auth: AuthContext): Promise<UploadAssessmentInstructionResult> {
        const { assessmentId, fileId } = input;
        const assessment = await this.assessments.findById(assessmentId);
        if (!assessment) return NotFound;
        const file = await this.files.findById(fileId);
        if (!auth.isAdmin) {
            const responsible = await isCourseInstructor(
                { courses: this.courses, instructors: this.instructors },
                assessment.courseId,
                auth.requesterId,
            );
            if (!responsible) return ForbiddenOwnership;
            if (!isFileOwner(file, auth)) return ForbiddenOwnership;
        } else if (!file) {
            return NotFound;
        }

        if (!file) return NotFound;
        const policyError = checkAgainstPolicy(CONTEXT_POLICIES.FILE_ASSESSMENT_INSTRUCTION, file.mimeType, file.sizeBytes);
        if (policyError) return { kind: policyError };
        if (await this.fileAssessmentInstructions.findByAssessmentAndFile(assessmentId, fileId)) return { kind: "file_assessment_instruction_already_exists" };
        if (await this.isFileLinked(fileId)) return { kind: "file_already_linked" };
        const entry: FileAssessmentInstruction = {
            id: randomUUID(),
            assessmentId,
            fileId,
            uploadedAt: new Date(),
        };
        await this.fileAssessmentInstructions.save(entry);
        return { kind: "instruction_uploaded", instruction: toFileAssessmentInstructionView(entry) };
    }

    async deleteInstruction(id: string, auth: AuthContext): Promise<DeleteAssessmentInstructionResult> {
        const entry = await this.fileAssessmentInstructions.findById(id);
        if (!entry) return NotFound;
        const file = await this.files.findById(entry.fileId);
        const authResult = this.authorizeFileDetach(file, auth);
        if (authResult.kind !== "ok") return authResult;
        const outcome = await this.cascadeDeleteLinkAndFile(file, () => this.fileAssessmentInstructions.deleteById(id));
        return outcome.kind === "deleted"
            ? { kind: "instruction_deleted" }
            : { kind: "instruction_deleted_with_warnings", failedPaths: outcome.failedPaths };
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
