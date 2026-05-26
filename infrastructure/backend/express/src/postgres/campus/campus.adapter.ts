import { asc, eq } from "drizzle-orm"
import { type CampusRepository } from "../../../../../../application/campus/campus.repository"
import { type Campus } from "../../../../../../domain/campus/campus.entity"
import { db } from "../db"
import { campus as campusTable } from "../schema/campus"

function rowToCampus(row: typeof campusTable.$inferSelect): Campus {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
  }
}

export const campusRepository: CampusRepository = {
  async findById(id) {
    const result = await db.select().from(campusTable).where(eq(campusTable.id, id)).limit(1)
    return result[0] ? rowToCampus(result[0]) : undefined
  },
  async save(campus) {
    await db
      .insert(campusTable)
      .values({
        id: campus.id,
        name: campus.name,
        address: campus.address,
      })
      .onConflictDoUpdate({
        target: campusTable.id,
        set: {
          name: campus.name,
          address: campus.address,
        },
      })
  },
  async deleteById(id) {
    await db.delete(campusTable).where(eq(campusTable.id, id))
  },
  async list() {
    const result = await db.select().from(campusTable).orderBy(asc(campusTable.name))
    return result.map(rowToCampus)
  },
}
