import { type AssessmentGroup } from "../../../domain/assessment/assessment-group/assessment-group.entity"

export interface AssessmentGroupRepository {
  findById(id: string): Promise<AssessmentGroup | undefined>
  findByAssessmentId(assessmentId: string): Promise<AssessmentGroup[]>
  save(assessmentGroup: AssessmentGroup): Promise<void>
  deleteById(id: string): Promise<void>
}
