import { asc, eq } from "drizzle-orm"
import { type ClassroomRepository } from "../../../../../../application/classroom/classroom.repository"
import { type Classroom } from "../../../../../../domain/classroom/classroom.entity"
import { db } from "../db"
import { classroom as classroomTable } from "../schema/classroom"

function rowToClassroom(row: typeof classroomTable.$inferSelect): Classroom {
  return {
    id: row.id,
    name: row.name,
    capacity: row.capacity,
    campusId: row.campusId,
  }
}

export const classroomRepository: ClassroomRepository = {
  async findById(id) {
    const result = await db.select().from(classroomTable).where(eq(classroomTable.id, id)).limit(1)
    return result[0] ? rowToClassroom(result[0]) : undefined
  },
  async findByCampusId(campusId) {
    const result = await db.select().from(classroomTable).where(eq(classroomTable.campusId, campusId))
    return result.map(rowToClassroom)
  },
  async save(classroom) {
    await db
      .insert(classroomTable)
      .values({
        id: classroom.id,
        name: classroom.name,
        capacity: classroom.capacity,
        campusId: classroom.campusId,
      })
      .onConflictDoUpdate({
        target: classroomTable.id,
        set: {
          name: classroom.name,
          capacity: classroom.capacity,
          campusId: classroom.campusId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(classroomTable).where(eq(classroomTable.id, id))
  },
  async list() {
    const result = await db.select().from(classroomTable).orderBy(asc(classroomTable.name))
    return result.map(rowToClassroom)
  },
}
