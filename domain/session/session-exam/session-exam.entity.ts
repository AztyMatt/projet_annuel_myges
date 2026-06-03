import { type SessionExamType } from "./session-exam.enums"

export type SessionExam = {
  id: string
  sessionId: string
  type: SessionExamType
  assessmentId: string | null
}
