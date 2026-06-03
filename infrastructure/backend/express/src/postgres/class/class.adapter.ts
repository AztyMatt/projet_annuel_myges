import { asc, eq } from "drizzle-orm"
import { type ClassRepository } from "../../../../../../application/class/class.repository"
import { type Class } from "../../../../../../domain/class/class.entity"
import { db } from "../db"
import { classTable } from "../schema/class"

function rowToClass(row: typeof classTable.$inferSelect): Class {
  return {
    id: row.id,
    number: row.number,
    programId: row.programId,
    size: row.size,
    conversationId: row.conversationId,
  }
}

export const classRepository: ClassRepository = {
  async findById(id) {
    const result = await db.select().from(classTable).where(eq(classTable.id, id)).limit(1)
    return result[0] ? rowToClass(result[0]) : undefined
  },
  async findByProgramId(programId) {
    const result = await db.select().from(classTable).where(eq(classTable.programId, programId))
    return result.map(rowToClass)
  },
  async save(classInstance) {
    await db
      .insert(classTable)
      .values({
        id: classInstance.id,
        number: classInstance.number,
        programId: classInstance.programId,
        size: classInstance.size,
        conversationId: classInstance.conversationId,
      })
      .onConflictDoUpdate({
        target: classTable.id,
        set: {
          number: classInstance.number,
          programId: classInstance.programId,
          size: classInstance.size,
          conversationId: classInstance.conversationId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(classTable).where(eq(classTable.id, id))
  },
  async list() {
    const result = await db.select().from(classTable).orderBy(asc(classTable.number))
    return result.map(rowToClass)
  },
}
