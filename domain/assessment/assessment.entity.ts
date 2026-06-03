import { type AssessmentType } from "./assessment.enums"

export type Assessment = {
  id: string
  courseId: string
  title: string
  type: AssessmentType
  isPublished: boolean
  dueDate: Date
  maxGroupSize: number
}
