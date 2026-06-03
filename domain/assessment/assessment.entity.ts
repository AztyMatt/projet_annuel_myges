import { type AssessmentType } from "@domain/assessment/assessment.enums"

export type Assessment = {
  id: string
  courseId: string
  title: string
  type: AssessmentType
  isPublished: boolean
  dueDate: Date
  maxGroupSize: number
}
