import { type Instructor } from "@domain/instructor/instructor.entity"

export interface InstructorRepository {
  findById(id: string): Promise<Instructor | undefined>
  findByUserId(userId: string): Promise<Instructor | undefined>
  save(instructor: Instructor): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<Instructor[]>
}
