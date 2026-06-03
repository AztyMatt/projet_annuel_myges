import { type SessionExamStudent } from "@domain/session/session-exam/session-exam-student/session-exam-student.entity"

export interface SessionExamStudentRepository {
  findById(id: string): Promise<SessionExamStudent | undefined>
  findBySessionExamId(sessionExamId: string): Promise<SessionExamStudent[]>
  findByStudentId(studentId: string): Promise<SessionExamStudent[]>
  save(sessionExamStudent: SessionExamStudent): Promise<void>
  deleteById(id: string): Promise<void>
}
