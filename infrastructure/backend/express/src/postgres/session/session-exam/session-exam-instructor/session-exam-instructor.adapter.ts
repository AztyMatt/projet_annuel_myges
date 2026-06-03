import { eq } from "drizzle-orm"
import { type SessionExamInstructorRepository } from "@application/session/session-exam/session-exam-instructor/session-exam-instructor.repository"
import { type SessionExamInstructor } from "@domain/session/session-exam/session-exam-instructor/session-exam-instructor.entity"
import { db } from "@express/src/postgres/db"
import { sessionExamInstructor as sessionExamInstructorTable } from "@express/src/postgres/schema/session"

function rowToSessionExamInstructor(row: typeof sessionExamInstructorTable.$inferSelect): SessionExamInstructor {
  return {
    id: row.id,
    sessionExamId: row.sessionExamId,
    instructorId: row.instructorId,
  }
}

export const sessionExamInstructorRepository: SessionExamInstructorRepository = {
  async findById(id) {
    const result = await db.select().from(sessionExamInstructorTable).where(eq(sessionExamInstructorTable.id, id)).limit(1)
    return result[0] ? rowToSessionExamInstructor(result[0]) : undefined
  },
  async findBySessionExamId(sessionExamId) {
    const result = await db.select().from(sessionExamInstructorTable).where(eq(sessionExamInstructorTable.sessionExamId, sessionExamId))
    return result.map(rowToSessionExamInstructor)
  },
  async findByInstructorId(instructorId) {
    const result = await db.select().from(sessionExamInstructorTable).where(eq(sessionExamInstructorTable.instructorId, instructorId))
    return result.map(rowToSessionExamInstructor)
  },
  async save(sessionExamInstructor) {
    await db
      .insert(sessionExamInstructorTable)
      .values({
        id: sessionExamInstructor.id,
        sessionExamId: sessionExamInstructor.sessionExamId,
        instructorId: sessionExamInstructor.instructorId,
      })
      .onConflictDoUpdate({
        target: sessionExamInstructorTable.id,
        set: {
          sessionExamId: sessionExamInstructor.sessionExamId,
          instructorId: sessionExamInstructor.instructorId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(sessionExamInstructorTable).where(eq(sessionExamInstructorTable.id, id))
  },
}
