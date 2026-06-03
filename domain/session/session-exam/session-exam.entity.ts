import { type SessionExamType } from "@domain/session/session-exam/session-exam.enums"

export type SessionExam = {
  id: string
  sessionId: string
  type: SessionExamType
  assessmentId: string | null
}
