import { eq } from "drizzle-orm"
import { type AssessmentGroupRepository } from "../../../../../../../application/assessment/assessment-group/assessment-group.repository"
import { type AssessmentGroup } from "../../../../../../../domain/assessment/assessment-group/assessment-group.entity"
import { db } from "../../db"
import { assessmentGroup as assessmentGroupTable } from "../../schema/assessment"

function rowToAssessmentGroup(row: typeof assessmentGroupTable.$inferSelect): AssessmentGroup {
  return {
    id: row.id,
    assessmentId: row.assessmentId,
  }
}

export const assessmentGroupRepository: AssessmentGroupRepository = {
  async findById(id) {
    const result = await db.select().from(assessmentGroupTable).where(eq(assessmentGroupTable.id, id)).limit(1)
    return result[0] ? rowToAssessmentGroup(result[0]) : undefined
  },
  async findByAssessmentId(assessmentId) {
    const result = await db.select().from(assessmentGroupTable).where(eq(assessmentGroupTable.assessmentId, assessmentId))
    return result.map(rowToAssessmentGroup)
  },
  async save(assessmentGroup) {
    await db
      .insert(assessmentGroupTable)
      .values({
        id: assessmentGroup.id,
        assessmentId: assessmentGroup.assessmentId,
      })
      .onConflictDoUpdate({
        target: assessmentGroupTable.id,
        set: {
          assessmentId: assessmentGroup.assessmentId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(assessmentGroupTable).where(eq(assessmentGroupTable.id, id))
  },
}
