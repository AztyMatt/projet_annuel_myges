import { and, eq } from "drizzle-orm";
import { type FileDocumentRepository } from "@application/file/file-document/file-document.repository";
import { type FileDocument } from "@domain/file/file-document/file-document.entity";
import { DocumentStatus } from "@domain/file/file-document/file-document.enums";
import { assertEnum } from "@express/src/postgres/assert-enum";
import { db } from "@express/src/postgres/db";
import { fileDocument as fileDocumentTable } from "@express/src/postgres/schema/file";

function rowToFileDocument(row: typeof fileDocumentTable.$inferSelect): FileDocument {
    return {
        id: row.id,
        fileId: row.fileId,
        studentId: row.studentId,
        status: assertEnum(row.status, DocumentStatus),
    };
}

export const fileDocumentRepository: FileDocumentRepository = {
    async findById(id) {
        const result = await db.select().from(fileDocumentTable).where(eq(fileDocumentTable.id, id)).limit(1);
        return result[0] ? rowToFileDocument(result[0]) : undefined;
    },
    async findByStudentId(studentId) {
        const result = await db.select().from(fileDocumentTable).where(eq(fileDocumentTable.studentId, studentId));
        return result.map(rowToFileDocument);
    },
    async existsByStudentId(studentId) {
        const rows = await db.select({ id: fileDocumentTable.id }).from(fileDocumentTable).where(eq(fileDocumentTable.studentId, studentId)).limit(1);
        return rows.length > 0;
    },
    async findByFileId(fileId) {
        const result = await db.select().from(fileDocumentTable).where(eq(fileDocumentTable.fileId, fileId)).limit(1);
        return result[0] ? rowToFileDocument(result[0]) : undefined;
    },
    async findByFileAndStudent(fileId, studentId) {
        const result = await db
            .select()
            .from(fileDocumentTable)
            .where(and(eq(fileDocumentTable.fileId, fileId), eq(fileDocumentTable.studentId, studentId)))
            .limit(1);
        return result[0] ? rowToFileDocument(result[0]) : undefined;
    },
    async save(fileDocument) {
        await db
            .insert(fileDocumentTable)
            .values({
                id: fileDocument.id,
                fileId: fileDocument.fileId,
                studentId: fileDocument.studentId,
                status: fileDocument.status,
            })
            .onConflictDoUpdate({
                target: fileDocumentTable.id,
                set: {
                    fileId: fileDocument.fileId,
                    studentId: fileDocument.studentId,
                    status: fileDocument.status,
                },
            });
    },
    async deleteById(id) {
        await db.delete(fileDocumentTable).where(eq(fileDocumentTable.id, id));
    },
    async list() {
        const result = await db.select().from(fileDocumentTable);
        return result.map(rowToFileDocument);
    },
};
