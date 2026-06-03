import { type FileAssessment } from "@domain/file/file-assessment/file-assessment.entity";

export interface FileAssessmentRepository {
    findById(id: string): Promise<FileAssessment | undefined>;
    findByAssessmentId(assessmentId: string): Promise<FileAssessment[]>;
    findByAssessmentGroupId(assessmentGroupId: string): Promise<FileAssessment[]>;
    save(fileAssessment: FileAssessment): Promise<void>;
    deleteById(id: string): Promise<void>;
}
