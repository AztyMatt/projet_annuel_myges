import { and, eq } from "drizzle-orm";
import { BasicStatus } from "@domain/absence/absence.enums";
import { assertEnum } from "@express/src/postgres/assert-enum";
import { type FileJustificationRepository } from "@application/file/file-justification/file-justification.repository";
import { type FileJustification } from "@domain/file/file-justification/file-justification.entity";
import { db } from "@express/src/postgres/db";
import { fileJustification as fileJustificationTable } from "@express/src/postgres/schema/file";
import { absence as absenceTable } from "@express/src/postgres/schema/absence";

function rowToFileJustification(row: typeof fileJustificationTable.$inferSelect): FileJustification {
    return {
        id: row.id,
        absenceId: row.absenceId,
        fileId: row.fileId,
        validationStatus: assertEnum(row.validationStatus, BasicStatus),
        processedBy: row.processedBy,
    };
}

export const fileJustificationRepository: FileJustificationRepository = {
    async findById(id) {
        const result = await db.select().from(fileJustificationTable).where(eq(fileJustificationTable.id, id)).limit(1);
        return result[0] ? rowToFileJustification(result[0]) : undefined;
    },
    async findByAbsenceId(absenceId) {
        const result = await db
            .select()
            .from(fileJustificationTable)
            .where(eq(fileJustificationTable.absenceId, absenceId));
        return result.map(rowToFileJustification);
    },
    async findByStudentId(studentId) {
        const rows = await db
            .select({ justification: fileJustificationTable })
            .from(fileJustificationTable)
            .innerJoin(absenceTable, eq(fileJustificationTable.absenceId, absenceTable.id))
            .where(eq(absenceTable.studentId, studentId));
        return rows.map((row) => rowToFileJustification(row.justification));
    },
    async findByFileId(fileId) {
        const result = await db
            .select()
            .from(fileJustificationTable)
            .where(eq(fileJustificationTable.fileId, fileId))
            .limit(1);
        return result[0] ? rowToFileJustification(result[0]) : undefined;
    },
    async findByProcessedBy(adminId) {
        const result = await db
            .select()
            .from(fileJustificationTable)
            .where(eq(fileJustificationTable.processedBy, adminId));
        return result.map(rowToFileJustification);
    },
    async findByAbsenceAndFile(absenceId, fileId) {
        const result = await db
            .select()
            .from(fileJustificationTable)
            .where(and(eq(fileJustificationTable.absenceId, absenceId), eq(fileJustificationTable.fileId, fileId)))
            .limit(1);
        return result[0] ? rowToFileJustification(result[0]) : undefined;
    },
    async save(fileJustification) {
        await db
            .insert(fileJustificationTable)
            .values({
                id: fileJustification.id,
                absenceId: fileJustification.absenceId,
                fileId: fileJustification.fileId,
                validationStatus: fileJustification.validationStatus,
                processedBy: fileJustification.processedBy,
            })
            .onConflictDoUpdate({
                target: fileJustificationTable.id,
                set: {
                    absenceId: fileJustification.absenceId,
                    fileId: fileJustification.fileId,
                    validationStatus: fileJustification.validationStatus,
                    processedBy: fileJustification.processedBy,
                },
            });
    },
    async deleteById(id) {
        await db.delete(fileJustificationTable).where(eq(fileJustificationTable.id, id));
    },
};
