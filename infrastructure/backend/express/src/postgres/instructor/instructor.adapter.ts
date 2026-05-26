import { eq } from "drizzle-orm"
import { type InstructorRepository } from "../../../../../../application/instructor/instructor.repository"
import { type Instructor } from "../../../../../../domain/instructor/instructor.entity"
import { InstructorContractType } from "../../../../../../domain/instructor/instructor.enums"
import { assertEnum } from "../assert-enum"
import { db } from "../db"
import { instructor as instructorTable } from "../schema/instructor"

function rowToInstructor(row: typeof instructorTable.$inferSelect): Instructor {
  return {
    id: row.id,
    userId: row.userId,
    contractType: assertEnum(row.contractType, InstructorContractType),
    specialties: (row.specialties as string[]) ?? null,
  }
}

export const instructorRepository: InstructorRepository = {
  async findById(id) {
    const result = await db.select().from(instructorTable).where(eq(instructorTable.id, id)).limit(1)
    return result[0] ? rowToInstructor(result[0]) : undefined
  },
  async findByUserId(userId) {
    const result = await db.select().from(instructorTable).where(eq(instructorTable.userId, userId)).limit(1)
    return result[0] ? rowToInstructor(result[0]) : undefined
  },
  async save(instructor) {
    await db
      .insert(instructorTable)
      .values({
        id: instructor.id,
        userId: instructor.userId,
        contractType: instructor.contractType,
        specialties: instructor.specialties,
      })
      .onConflictDoUpdate({
        target: instructorTable.id,
        set: {
          userId: instructor.userId,
          contractType: instructor.contractType,
          specialties: instructor.specialties,
        },
      })
  },
  async deleteById(id) {
    await db.delete(instructorTable).where(eq(instructorTable.id, id))
  },
  async list() {
    const result = await db.select().from(instructorTable)
    return result.map(rowToInstructor)
  },
}
