import { and, eq } from "drizzle-orm";
import { type FileAssessmentRepository } from "@application/file/file-assessment/file-assessment.repository";
import { type FileAssessment } from "@domain/file/file-assessment/file-assessment.entity";
import { db } from "@express/src/postgres/db";
import { fileAssessment as fileAssessmentTable } from "@express/src/postgres/schema/file";

function rowToFileAssessment(row: typeof fileAssessmentTable.$inferSelect): FileAssessment {
    return {
        id: row.id,
        assessmentId: row.assessmentId,
        assessmentGroupId: row.assessmentGroupId,
        fileId: row.fileId,
    };
}

export const fileAssessmentRepository: FileAssessmentRepository = {
    async findById(id) {
        const result = await db.select().from(fileAssessmentTable).where(eq(fileAssessmentTable.id, id)).limit(1);
        return result[0] ? rowToFileAssessment(result[0]) : undefined;
    },
    async findByFileId(fileId) {
        const result = await db
            .select()
            .from(fileAssessmentTable)
            .where(eq(fileAssessmentTable.fileId, fileId))
            .limit(1);
        return result[0] ? rowToFileAssessment(result[0]) : undefined;
    },
    async findByAssessmentId(assessmentId) {
        const result = await db
            .select()
            .from(fileAssessmentTable)
            .where(eq(fileAssessmentTable.assessmentId, assessmentId));
        return result.map(rowToFileAssessment);
    },
    async existsByAssessmentId(assessmentId) {
        const rows = await db.select({ id: fileAssessmentTable.id }).from(fileAssessmentTable).where(eq(fileAssessmentTable.assessmentId, assessmentId)).limit(1);
        return rows.length > 0;
    },
    async findByAssessmentGroupId(assessmentGroupId) {
        const result = await db
            .select()
            .from(fileAssessmentTable)
            .where(eq(fileAssessmentTable.assessmentGroupId, assessmentGroupId));
        return result.map(rowToFileAssessment);
    },
    async existsByAssessmentGroupId(assessmentGroupId) {
        const rows = await db.select({ id: fileAssessmentTable.id }).from(fileAssessmentTable).where(eq(fileAssessmentTable.assessmentGroupId, assessmentGroupId)).limit(1);
        return rows.length > 0;
    },
    async findByGroupAndFile(assessmentGroupId, fileId) {
        const result = await db
            .select()
            .from(fileAssessmentTable)
            .where(and(eq(fileAssessmentTable.assessmentGroupId, assessmentGroupId), eq(fileAssessmentTable.fileId, fileId)))
            .limit(1);
        return result[0] ? rowToFileAssessment(result[0]) : undefined;
    },
    async save(fileAssessment) {
        await db
            .insert(fileAssessmentTable)
            .values({
                id: fileAssessment.id,
                assessmentId: fileAssessment.assessmentId,
                assessmentGroupId: fileAssessment.assessmentGroupId,
                fileId: fileAssessment.fileId,
            })
            .onConflictDoUpdate({
                target: fileAssessmentTable.id,
                set: {
                    assessmentId: fileAssessment.assessmentId,
                    assessmentGroupId: fileAssessment.assessmentGroupId,
                    fileId: fileAssessment.fileId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(fileAssessmentTable).where(eq(fileAssessmentTable.id, id));
    },
};
