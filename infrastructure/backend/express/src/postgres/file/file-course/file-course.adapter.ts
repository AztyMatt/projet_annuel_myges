import { eq } from "drizzle-orm"
import { type FileCourseRepository } from "../../../../../../../application/file/file-course/file-course.repository"
import { type FileCourse } from "../../../../../../../domain/file/file-course/file-course.entity"
import { db } from "../../db"
import { fileCourse as fileCourseTable } from "../../schema/file"

function rowToFileCourse(row: typeof fileCourseTable.$inferSelect): FileCourse {
  return {
    id: row.id,
    name: row.name,
    fileId: row.fileId,
    courseId: row.courseId,
  }
}

export const fileCourseRepository: FileCourseRepository = {
  async findById(id) {
    const result = await db.select().from(fileCourseTable).where(eq(fileCourseTable.id, id)).limit(1)
    return result[0] ? rowToFileCourse(result[0]) : undefined
  },
  async findByCourseId(courseId) {
    const result = await db.select().from(fileCourseTable).where(eq(fileCourseTable.courseId, courseId))
    return result.map(rowToFileCourse)
  },
  async findByFileId(fileId) {
    const result = await db.select().from(fileCourseTable).where(eq(fileCourseTable.fileId, fileId))
    return result.map(rowToFileCourse)
  },
  async save(fileCourse) {
    await db
      .insert(fileCourseTable)
      .values({
        id: fileCourse.id,
        name: fileCourse.name,
        fileId: fileCourse.fileId,
        courseId: fileCourse.courseId,
      })
      .onConflictDoUpdate({
        target: fileCourseTable.id,
        set: {
          name: fileCourse.name,
          fileId: fileCourse.fileId,
          courseId: fileCourse.courseId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(fileCourseTable).where(eq(fileCourseTable.id, id))
  },
}
