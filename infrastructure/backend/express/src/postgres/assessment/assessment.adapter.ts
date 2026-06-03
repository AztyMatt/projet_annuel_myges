import { asc, eq } from "drizzle-orm"
import { type AssessmentRepository } from "@application/assessment/assessment.repository"
import { type Assessment } from "@domain/assessment/assessment.entity"
import { AssessmentType } from "@domain/assessment/assessment.enums"
import { assertEnum } from "@express/src/postgres/assert-enum"
import { db } from "@express/src/postgres/db"
import { assessment as assessmentTable } from "@express/src/postgres/schema/assessment"

function rowToAssessment(row: typeof assessmentTable.$inferSelect): Assessment {
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    type: assertEnum(row.type, AssessmentType),
    isPublished: row.isPublished,
    dueDate: row.dueDate,
    maxGroupSize: row.maxGroupSize,
  }
}

export const assessmentRepository: AssessmentRepository = {
  async findById(id) {
    const result = await db.select().from(assessmentTable).where(eq(assessmentTable.id, id)).limit(1)
    return result[0] ? rowToAssessment(result[0]) : undefined
  },
  async findByCourseId(courseId) {
    const result = await db.select().from(assessmentTable).where(eq(assessmentTable.courseId, courseId)).orderBy(asc(assessmentTable.dueDate))
    return result.map(rowToAssessment)
  },
  async save(assessment) {
    await db
      .insert(assessmentTable)
      .values({
        id: assessment.id,
        courseId: assessment.courseId,
        title: assessment.title,
        type: assessment.type,
        isPublished: assessment.isPublished,
        dueDate: assessment.dueDate,
        maxGroupSize: assessment.maxGroupSize,
      })
      .onConflictDoUpdate({
        target: assessmentTable.id,
        set: {
          courseId: assessment.courseId,
          title: assessment.title,
          type: assessment.type,
          isPublished: assessment.isPublished,
          dueDate: assessment.dueDate,
          maxGroupSize: assessment.maxGroupSize,
        },
      })
  },
  async deleteById(id) {
    await db.delete(assessmentTable).where(eq(assessmentTable.id, id))
  },
  async list() {
    const result = await db.select().from(assessmentTable).orderBy(asc(assessmentTable.dueDate))
    return result.map(rowToAssessment)
  },
}
