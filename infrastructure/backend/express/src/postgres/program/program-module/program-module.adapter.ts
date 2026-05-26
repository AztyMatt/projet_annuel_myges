import { eq } from "drizzle-orm"
import { type ProgramModuleRepository } from "../../../../../../../application/program/program-module/program-module.repository"
import { type ProgramModule } from "../../../../../../../domain/program/program-module/program-module.entity"
import { db } from "../../db"
import { programModule as programModuleTable } from "../../schema/program-module"

function rowToProgramModule(row: typeof programModuleTable.$inferSelect): ProgramModule {
  return {
    id: row.id,
    programId: row.programId,
    moduleId: row.moduleId,
  }
}

export const programModuleRepository: ProgramModuleRepository = {
  async findById(id) {
    const result = await db.select().from(programModuleTable).where(eq(programModuleTable.id, id)).limit(1)
    return result[0] ? rowToProgramModule(result[0]) : undefined
  },
  async findByProgramId(programId) {
    const result = await db.select().from(programModuleTable).where(eq(programModuleTable.programId, programId))
    return result.map(rowToProgramModule)
  },
  async findByModuleId(moduleId) {
    const result = await db.select().from(programModuleTable).where(eq(programModuleTable.moduleId, moduleId))
    return result.map(rowToProgramModule)
  },
  async save(programModule) {
    await db
      .insert(programModuleTable)
      .values({
        id: programModule.id,
        programId: programModule.programId,
        moduleId: programModule.moduleId,
      })
      .onConflictDoUpdate({
        target: programModuleTable.id,
        set: {
          programId: programModule.programId,
          moduleId: programModule.moduleId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(programModuleTable).where(eq(programModuleTable.id, id))
  },
}
