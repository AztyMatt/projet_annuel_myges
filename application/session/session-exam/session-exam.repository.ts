import { type SessionExam } from "@domain/session/session-exam/session-exam.entity"

export interface SessionExamRepository {
  findById(id: string): Promise<SessionExam | undefined>
  findBySessionId(sessionId: string): Promise<SessionExam[]>
  findByAssessmentId(assessmentId: string): Promise<SessionExam[]>
  save(sessionExam: SessionExam): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<SessionExam[]>
}
