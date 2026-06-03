import { asc, eq } from "drizzle-orm"
import { type ModuleRepository } from "@application/module/module.repository"
import { type Module } from "@domain/module/module.entity"
import { db } from "@express/src/postgres/db"
import { module as moduleTable } from "@express/src/postgres/schema/module"

function rowToModule(row: typeof moduleTable.$inferSelect): Module {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    coefficient: row.coefficient,
    ectsCredits: row.ectsCredits,
  }
}

export const moduleRepository: ModuleRepository = {
  async findById(id) {
    const result = await db.select().from(moduleTable).where(eq(moduleTable.id, id)).limit(1)
    return result[0] ? rowToModule(result[0]) : undefined
  },
  async save(moduleEntity) {
    await db
      .insert(moduleTable)
      .values({
        id: moduleEntity.id,
        name: moduleEntity.name,
        code: moduleEntity.code,
        coefficient: moduleEntity.coefficient,
        ectsCredits: moduleEntity.ectsCredits,
      })
      .onConflictDoUpdate({
        target: moduleTable.id,
        set: {
          name: moduleEntity.name,
          code: moduleEntity.code,
          coefficient: moduleEntity.coefficient,
          ectsCredits: moduleEntity.ectsCredits,
        },
      })
  },
  async deleteById(id) {
    await db.delete(moduleTable).where(eq(moduleTable.id, id))
  },
  async list() {
    const result = await db.select().from(moduleTable).orderBy(asc(moduleTable.name))
    return result.map(rowToModule)
  },
}
