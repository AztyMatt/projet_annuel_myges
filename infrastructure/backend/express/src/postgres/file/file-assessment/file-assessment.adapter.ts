import { eq } from "drizzle-orm"
import { type FileAssessmentRepository } from "../../../../../../../application/file/file-assessment/file-assessment.repository"
import { type FileAssessment } from "../../../../../../../domain/file/file-assessment/file-assessment.entity"
import { db } from "../../db"
import { fileAssessment as fileAssessmentTable } from "../../schema/file"

function rowToFileAssessment(row: typeof fileAssessmentTable.$inferSelect): FileAssessment {
  return {
    id: row.id,
    assessmentId: row.assessmentId,
    assessmentGroupId: row.assessmentGroupId,
    fileId: row.fileId,
    submittedAt: row.submittedAt,
  }
}

export const fileAssessmentRepository: FileAssessmentRepository = {
  async findById(id) {
    const result = await db.select().from(fileAssessmentTable).where(eq(fileAssessmentTable.id, id)).limit(1)
    return result[0] ? rowToFileAssessment(result[0]) : undefined
  },
  async findByAssessmentId(assessmentId) {
    const result = await db.select().from(fileAssessmentTable).where(eq(fileAssessmentTable.assessmentId, assessmentId))
    return result.map(rowToFileAssessment)
  },
  async findByAssessmentGroupId(assessmentGroupId) {
    const result = await db.select().from(fileAssessmentTable).where(eq(fileAssessmentTable.assessmentGroupId, assessmentGroupId))
    return result.map(rowToFileAssessment)
  },
  async save(fileAssessment) {
    await db
      .insert(fileAssessmentTable)
      .values({
        id: fileAssessment.id,
        assessmentId: fileAssessment.assessmentId,
        assessmentGroupId: fileAssessment.assessmentGroupId,
        fileId: fileAssessment.fileId,
        submittedAt: fileAssessment.submittedAt,
      })
      .onConflictDoUpdate({
        target: fileAssessmentTable.id,
        set: {
          assessmentId: fileAssessment.assessmentId,
          assessmentGroupId: fileAssessment.assessmentGroupId,
          fileId: fileAssessment.fileId,
          submittedAt: fileAssessment.submittedAt,
        },
      })
  },
  async deleteById(id) {
    await db.delete(fileAssessmentTable).where(eq(fileAssessmentTable.id, id))
  },
}
