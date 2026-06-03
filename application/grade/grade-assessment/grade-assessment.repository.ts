import { type GradeAssessment } from "@domain/grade/grade-assessment/grade-assessment.entity"

export interface GradeAssessmentRepository {
  findById(id: string): Promise<GradeAssessment | undefined>
  findByGradeId(gradeId: string): Promise<GradeAssessment[]>
  findByAssessmentId(assessmentId: string): Promise<GradeAssessment[]>
  save(gradeAssessment: GradeAssessment): Promise<void>
  deleteById(id: string): Promise<void>
}
