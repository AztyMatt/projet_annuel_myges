import { type Course } from "@domain/course/course.entity"

export interface CourseRepository {
  findById(id: string): Promise<Course | undefined>
  findByInstructorId(instructorId: string): Promise<Course[]>
  findByModuleId(moduleId: string): Promise<Course[]>
  findByGroupId(groupId: string): Promise<Course[]>
  findByBlocId(blocId: string): Promise<Course[]>
  save(course: Course): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<Course[]>
}
