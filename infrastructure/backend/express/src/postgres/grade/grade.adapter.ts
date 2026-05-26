import { desc, eq } from "drizzle-orm"
import { type GradeRepository } from "../../../../../../application/grade/grade.repository"
import { type Grade } from "../../../../../../domain/grade/grade.entity"
import { db } from "../db"
import { grade as gradeTable } from "../schema/grade"

function rowToGrade(row: typeof gradeTable.$inferSelect): Grade {
  return {
    id: row.id,
    studentId: row.studentId,
    value: row.value,
    isLocked: row.isLocked,
    enteredAt: row.enteredAt,
    enteredBy: row.enteredBy,
  }
}

export const gradeRepository: GradeRepository = {
  async findById(id) {
    const result = await db.select().from(gradeTable).where(eq(gradeTable.id, id)).limit(1)
    return result[0] ? rowToGrade(result[0]) : undefined
  },
  async findByStudentId(studentId) {
    const result = await db.select().from(gradeTable).where(eq(gradeTable.studentId, studentId)).orderBy(desc(gradeTable.enteredAt))
    return result.map(rowToGrade)
  },
  async save(grade) {
    await db
      .insert(gradeTable)
      .values({
        id: grade.id,
        studentId: grade.studentId,
        value: grade.value,
        isLocked: grade.isLocked,
        enteredAt: grade.enteredAt,
        enteredBy: grade.enteredBy,
      })
      .onConflictDoUpdate({
        target: gradeTable.id,
        set: {
          studentId: grade.studentId,
          value: grade.value,
          isLocked: grade.isLocked,
          enteredAt: grade.enteredAt,
          enteredBy: grade.enteredBy,
        },
      })
  },
  async deleteById(id) {
    await db.delete(gradeTable).where(eq(gradeTable.id, id))
  },
  async list() {
    const result = await db.select().from(gradeTable).orderBy(desc(gradeTable.enteredAt))
    return result.map(rowToGrade)
  },
}
