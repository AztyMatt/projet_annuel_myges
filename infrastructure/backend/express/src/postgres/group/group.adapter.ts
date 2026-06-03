import { asc, eq } from "drizzle-orm"
import { type GroupRepository } from "../../../../../../application/group/group.repository"
import { type Group } from "../../../../../../domain/group/group.entity"
import { db } from "../db"
import { group as groupTable } from "../schema/group"

function rowToGroup(row: typeof groupTable.$inferSelect): Group {
  return {
    id: row.id,
    classId: row.classId,
    name: row.name,
  }
}

export const groupRepository: GroupRepository = {
  async findById(id) {
    const result = await db.select().from(groupTable).where(eq(groupTable.id, id)).limit(1)
    return result[0] ? rowToGroup(result[0]) : undefined
  },
  async findByClassId(classId) {
    const result = await db.select().from(groupTable).where(eq(groupTable.classId, classId))
    return result.map(rowToGroup)
  },
  async save(group) {
    await db
      .insert(groupTable)
      .values({
        id: group.id,
        classId: group.classId,
        name: group.name,
      })
      .onConflictDoUpdate({
        target: groupTable.id,
        set: {
          classId: group.classId,
          name: group.name,
        },
      })
  },
  async deleteById(id) {
    await db.delete(groupTable).where(eq(groupTable.id, id))
  },
  async list() {
    const result = await db.select().from(groupTable).orderBy(asc(groupTable.name))
    return result.map(rowToGroup)
  },
}
