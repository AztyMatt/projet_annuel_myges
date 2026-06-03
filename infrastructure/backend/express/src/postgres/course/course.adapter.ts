import { eq } from "drizzle-orm"
import { type CourseRepository } from "../../../../../../application/course/course.repository"
import { type Course } from "../../../../../../domain/course/course.entity"
import { db } from "../db"
import { course as courseTable } from "../schema/course"

function rowToCourse(row: typeof courseTable.$inferSelect): Course {
  return {
    id: row.id,
    instructorId: row.instructorId,
    moduleId: row.moduleId,
    groupId: row.groupId,
    blocId: row.blocId,
    conversationId: row.conversationId,
  }
}

export const courseRepository: CourseRepository = {
  async findById(id) {
    const result = await db.select().from(courseTable).where(eq(courseTable.id, id)).limit(1)
    return result[0] ? rowToCourse(result[0]) : undefined
  },
  async findByInstructorId(instructorId) {
    const result = await db.select().from(courseTable).where(eq(courseTable.instructorId, instructorId))
    return result.map(rowToCourse)
  },
  async findByModuleId(moduleId) {
    const result = await db.select().from(courseTable).where(eq(courseTable.moduleId, moduleId))
    return result.map(rowToCourse)
  },
  async findByGroupId(groupId) {
    const result = await db.select().from(courseTable).where(eq(courseTable.groupId, groupId))
    return result.map(rowToCourse)
  },
  async findByBlocId(blocId) {
    const result = await db.select().from(courseTable).where(eq(courseTable.blocId, blocId))
    return result.map(rowToCourse)
  },
  async save(course) {
    await db
      .insert(courseTable)
      .values({
        id: course.id,
        instructorId: course.instructorId,
        moduleId: course.moduleId,
        groupId: course.groupId,
        blocId: course.blocId,
        conversationId: course.conversationId,
      })
      .onConflictDoUpdate({
        target: courseTable.id,
        set: {
          instructorId: course.instructorId,
          moduleId: course.moduleId,
          groupId: course.groupId,
          blocId: course.blocId,
          conversationId: course.conversationId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(courseTable).where(eq(courseTable.id, id))
  },
  async list() {
    const result = await db.select().from(courseTable)
    return result.map(rowToCourse)
  },
}
