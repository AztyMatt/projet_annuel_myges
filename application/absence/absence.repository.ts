import { type Absence } from "../../domain/absence/absence.entity"

export interface AbsenceRepository {
  findById(id: string): Promise<Absence | undefined>
  findByStudentId(studentId: string): Promise<Absence[]>
  findBySessionId(sessionId: string): Promise<Absence[]>
  save(absence: Absence): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<Absence[]>
}
