import { desc, eq } from "drizzle-orm"
import { type AbsenceRepository } from "../../../../../../application/absence/absence.repository"
import { type Absence } from "../../../../../../domain/absence/absence.entity"
import { BasicStatus } from "../../../../../../domain/absence/absence.enums"
import { assertEnum } from "../assert-enum"
import { db } from "../db"
import { absence as absenceTable } from "../schema/absence"

function rowToAbsence(row: typeof absenceTable.$inferSelect): Absence {
  return {
    id: row.id,
    studentId: row.studentId,
    sessionId: row.sessionId,
    reason: row.reason,
    status: assertEnum(row.status, BasicStatus),
    declaredAt: row.declaredAt,
  }
}

export const absenceRepository: AbsenceRepository = {
  async findById(id) {
    const result = await db.select().from(absenceTable).where(eq(absenceTable.id, id)).limit(1)
    return result[0] ? rowToAbsence(result[0]) : undefined
  },
  async findByStudentId(studentId) {
    const result = await db.select().from(absenceTable).where(eq(absenceTable.studentId, studentId)).orderBy(desc(absenceTable.declaredAt))
    return result.map(rowToAbsence)
  },
  async findBySessionId(sessionId) {
    const result = await db.select().from(absenceTable).where(eq(absenceTable.sessionId, sessionId))
    return result.map(rowToAbsence)
  },
  async save(absence) {
    await db
      .insert(absenceTable)
      .values({
        id: absence.id,
        studentId: absence.studentId,
        sessionId: absence.sessionId,
        reason: absence.reason,
        status: absence.status,
        declaredAt: absence.declaredAt,
      })
      .onConflictDoUpdate({
        target: absenceTable.id,
        set: {
          studentId: absence.studentId,
          sessionId: absence.sessionId,
          reason: absence.reason,
          status: absence.status,
          declaredAt: absence.declaredAt,
        },
      })
  },
  async deleteById(id) {
    await db.delete(absenceTable).where(eq(absenceTable.id, id))
  },
  async list() {
    const result = await db.select().from(absenceTable).orderBy(desc(absenceTable.declaredAt))
    return result.map(rowToAbsence)
  },
}
