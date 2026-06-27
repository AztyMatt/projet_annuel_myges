import { eq } from "drizzle-orm";
import { type FileAssessmentInstructionRepository } from "@application/file/file-assessment-instruction/file-assessment-instruction.repository";
import { type FileAssessmentInstruction } from "@domain/file/file-assessment-instruction/file-assessment-instruction.entity";
import { db } from "@express/src/postgres/db";
import { fileAssessmentInstruction as fileAssessmentInstructionTable } from "@express/src/postgres/schema/file";

function rowToFileAssessmentInstruction(
    row: typeof fileAssessmentInstructionTable.$inferSelect,
): FileAssessmentInstruction {
    return {
        id: row.id,
        assessmentId: row.assessmentId,
        fileId: row.fileId,
        uploadedAt: row.uploadedAt,
    };
}

export const fileAssessmentInstructionRepository: FileAssessmentInstructionRepository = {
    async findById(id) {
        const result = await db
            .select()
            .from(fileAssessmentInstructionTable)
            .where(eq(fileAssessmentInstructionTable.id, id))
            .limit(1);
        return result[0] ? rowToFileAssessmentInstruction(result[0]) : undefined;
    },
    async findByAssessmentId(assessmentId) {
        const result = await db
            .select()
            .from(fileAssessmentInstructionTable)
            .where(eq(fileAssessmentInstructionTable.assessmentId, assessmentId));
        return result.map(rowToFileAssessmentInstruction);
    },
    async findByFileId(fileId) {
        const result = await db
            .select()
            .from(fileAssessmentInstructionTable)
            .where(eq(fileAssessmentInstructionTable.fileId, fileId));
        return result.map(rowToFileAssessmentInstruction);
    },
    async save(instruction) {
        await db
            .insert(fileAssessmentInstructionTable)
            .values({
                id: instruction.id,
                assessmentId: instruction.assessmentId,
                fileId: instruction.fileId,
                uploadedAt: instruction.uploadedAt,
            })
            .onConflictDoUpdate({
                target: fileAssessmentInstructionTable.id,
                set: {
                    assessmentId: instruction.assessmentId,
                    fileId: instruction.fileId,
                    uploadedAt: instruction.uploadedAt,
                },
            });
    },
    async deleteById(id) {
        await db.delete(fileAssessmentInstructionTable).where(eq(fileAssessmentInstructionTable.id, id));
    },
};
