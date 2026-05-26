import { asc, eq } from "drizzle-orm"
import { type PeriodRepository } from "../../../../../../application/period/period.repository"
import { type Period } from "../../../../../../domain/period/period.entity"
import { db } from "../db"
import { period as periodTable } from "../schema/period"

function rowToPeriod(row: typeof periodTable.$inferSelect): Period {
  return {
    id: row.id,
    order: row.order,
    startDate: row.startDate,
    endDate: row.endDate,
    academicYearId: row.academicYearId,
  }
}

export const periodRepository: PeriodRepository = {
  async findById(id) {
    const result = await db.select().from(periodTable).where(eq(periodTable.id, id)).limit(1)
    return result[0] ? rowToPeriod(result[0]) : undefined
  },
  async findByAcademicYearId(academicYearId) {
    const result = await db.select().from(periodTable).where(eq(periodTable.academicYearId, academicYearId)).orderBy(asc(periodTable.order))
    return result.map(rowToPeriod)
  },
  async save(period) {
    await db
      .insert(periodTable)
      .values({
        id: period.id,
        order: period.order,
        startDate: period.startDate,
        endDate: period.endDate,
        academicYearId: period.academicYearId,
      })
      .onConflictDoUpdate({
        target: periodTable.id,
        set: {
          order: period.order,
          startDate: period.startDate,
          endDate: period.endDate,
          academicYearId: period.academicYearId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(periodTable).where(eq(periodTable.id, id))
  },
  async list() {
    const result = await db.select().from(periodTable).orderBy(asc(periodTable.order))
    return result.map(rowToPeriod)
  },
}
