import { eq } from "drizzle-orm"
import { type StudentRepository } from "@application/student/student.repository"
import { type Student } from "@domain/student/student.entity"
import { db } from "@express/src/postgres/db"
import { student as studentTable } from "@express/src/postgres/schema/student"

function rowToStudent(row: typeof studentTable.$inferSelect): Student {
  return {
    id: row.id,
    userId: row.userId,
    programId: row.programId,
  }
}

export const studentRepository: StudentRepository = {
  async findById(id) {
    const result = await db.select().from(studentTable).where(eq(studentTable.id, id)).limit(1)
    return result[0] ? rowToStudent(result[0]) : undefined
  },
  async findByUserId(userId) {
    const result = await db.select().from(studentTable).where(eq(studentTable.userId, userId)).limit(1)
    return result[0] ? rowToStudent(result[0]) : undefined
  },
  async findByProgramId(programId) {
    const result = await db.select().from(studentTable).where(eq(studentTable.programId, programId))
    return result.map(rowToStudent)
  },
  async save(student) {
    await db
      .insert(studentTable)
      .values({
        id: student.id,
        userId: student.userId,
        programId: student.programId,
      })
      .onConflictDoUpdate({
        target: studentTable.id,
        set: {
          userId: student.userId,
          programId: student.programId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(studentTable).where(eq(studentTable.id, id))
  },
  async list() {
    const result = await db.select().from(studentTable)
    return result.map(rowToStudent)
  },
}
