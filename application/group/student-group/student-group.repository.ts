import { type StudentGroup } from "../../../domain/group/student-group/student-group.entity"

export interface StudentGroupRepository {
  findById(id: string): Promise<StudentGroup | undefined>
  findByStudentId(studentId: string): Promise<StudentGroup[]>
  findByGroupId(groupId: string): Promise<StudentGroup[]>
  save(studentGroup: StudentGroup): Promise<void>
  deleteById(id: string): Promise<void>
}
