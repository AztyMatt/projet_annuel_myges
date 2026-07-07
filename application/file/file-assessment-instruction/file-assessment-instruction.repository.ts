import { type FileAssessmentInstruction } from "@domain/file/file-assessment-instruction/file-assessment-instruction.entity";

export interface FileAssessmentInstructionRepository {
    findById(id: string): Promise<FileAssessmentInstruction | undefined>;
    findByAssessmentId(assessmentId: string): Promise<FileAssessmentInstruction[]>;
    findByFileId(fileId: string): Promise<FileAssessmentInstruction[]>;
    findByAssessmentAndFile(assessmentId: string, fileId: string): Promise<FileAssessmentInstruction | undefined>;
    save(instruction: FileAssessmentInstruction): Promise<void>;
    deleteById(id: string): Promise<void>;
}
