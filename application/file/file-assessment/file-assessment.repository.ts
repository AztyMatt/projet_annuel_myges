import { type FileAssessment } from "@domain/file/file-assessment/file-assessment.entity";

export interface FileAssessmentRepository {
    findById(id: string): Promise<FileAssessment | undefined>;
    findByFileId(fileId: string): Promise<FileAssessment | undefined>;
    findByAssessmentId(assessmentId: string): Promise<FileAssessment[]>;
    existsByAssessmentId(assessmentId: string): Promise<boolean>;
    findByAssessmentGroupId(assessmentGroupId: string): Promise<FileAssessment[]>;
    existsByAssessmentGroupId(assessmentGroupId: string): Promise<boolean>;
    findByGroupAndFile(assessmentGroupId: string, fileId: string): Promise<FileAssessment | undefined>;
    save(fileAssessment: FileAssessment): Promise<void>;
    deleteById(id: string): Promise<void>;
}
