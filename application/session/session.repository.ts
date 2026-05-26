import { type Session } from "../../domain/session/session.entity"

export interface SessionRepository {
  findById(id: string): Promise<Session | undefined>
  findByCourseId(courseId: string): Promise<Session[]>
  findByClassroomId(classroomId: string): Promise<Session[]>
  save(session: Session): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<Session[]>
}
