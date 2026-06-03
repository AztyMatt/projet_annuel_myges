import { asc, eq } from "drizzle-orm"
import { type ProgramRepository } from "@application/program/program.repository"
import { type Program } from "@domain/program/program.entity"
import { db } from "@express/src/postgres/db"
import { program as programTable } from "@express/src/postgres/schema/program"

function rowToProgram(row: typeof programTable.$inferSelect): Program {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    periodId: row.periodId,
  }
}

export const programRepository: ProgramRepository = {
  async findById(id) {
    const result = await db.select().from(programTable).where(eq(programTable.id, id)).limit(1)
    return result[0] ? rowToProgram(result[0]) : undefined
  },
  async findByPeriodId(periodId) {
    const result = await db.select().from(programTable).where(eq(programTable.periodId, periodId))
    return result.map(rowToProgram)
  },
  async save(program) {
    await db
      .insert(programTable)
      .values({
        id: program.id,
        name: program.name,
        code: program.code,
        periodId: program.periodId,
      })
      .onConflictDoUpdate({
        target: programTable.id,
        set: {
          name: program.name,
          code: program.code,
          periodId: program.periodId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(programTable).where(eq(programTable.id, id))
  },
  async list() {
    const result = await db.select().from(programTable).orderBy(asc(programTable.name))
    return result.map(rowToProgram)
  },
}
