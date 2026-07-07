import { type GradeAssessment } from "@domain/grade/grade-assessment/grade-assessment.entity";

export interface GradeAssessmentRepository {
    findById(id: string): Promise<GradeAssessment | undefined>;
    findByGradeId(gradeId: string): Promise<GradeAssessment[]>;
    findByAssessmentId(assessmentId: string): Promise<GradeAssessment[]>;
    findByGradeAndAssessment(gradeId: string, assessmentId: string): Promise<GradeAssessment | undefined>;
    save(gradeAssessment: GradeAssessment): Promise<void>;
    deleteById(id: string): Promise<void>;
}
