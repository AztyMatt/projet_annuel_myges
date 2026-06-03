import { type Assessment } from "@domain/assessment/assessment.entity"

export interface AssessmentRepository {
  findById(id: string): Promise<Assessment | undefined>
  findByCourseId(courseId: string): Promise<Assessment[]>
  save(assessment: Assessment): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<Assessment[]>
}
