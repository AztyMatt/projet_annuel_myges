import { eq } from "drizzle-orm"
import { type GradeSessionExamRepository } from "../../../../../../../application/grade/grade-session-exam/grade-session-exam.repository"
import { type GradeSessionExam } from "../../../../../../../domain/grade/grade-session-exam/grade-session-exam.entity"
import { db } from "../../db"
import { gradeSessionExam as gradeSessionExamTable } from "../../schema/grade"

function rowToGradeSessionExam(row: typeof gradeSessionExamTable.$inferSelect): GradeSessionExam {
  return {
    id: row.id,
    gradeId: row.gradeId,
    sessionExamId: row.sessionExamId,
  }
}

export const gradeSessionExamRepository: GradeSessionExamRepository = {
  async findById(id) {
    const result = await db.select().from(gradeSessionExamTable).where(eq(gradeSessionExamTable.id, id)).limit(1)
    return result[0] ? rowToGradeSessionExam(result[0]) : undefined
  },
  async findByGradeId(gradeId) {
    const result = await db.select().from(gradeSessionExamTable).where(eq(gradeSessionExamTable.gradeId, gradeId))
    return result.map(rowToGradeSessionExam)
  },
  async findBySessionExamId(sessionExamId) {
    const result = await db.select().from(gradeSessionExamTable).where(eq(gradeSessionExamTable.sessionExamId, sessionExamId))
    return result.map(rowToGradeSessionExam)
  },
  async save(gradeSessionExam) {
    await db
      .insert(gradeSessionExamTable)
      .values({
        id: gradeSessionExam.id,
        gradeId: gradeSessionExam.gradeId,
        sessionExamId: gradeSessionExam.sessionExamId,
      })
      .onConflictDoUpdate({
        target: gradeSessionExamTable.id,
        set: {
          gradeId: gradeSessionExam.gradeId,
          sessionExamId: gradeSessionExam.sessionExamId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(gradeSessionExamTable).where(eq(gradeSessionExamTable.id, id))
  },
}
