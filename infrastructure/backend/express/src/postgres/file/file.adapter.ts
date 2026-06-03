import { desc, eq } from "drizzle-orm";
import { type FileRepository } from "@application/file/file.repository";
import { type File } from "@domain/file/file.entity";
import { db } from "@express/src/postgres/db";
import { file as fileTable } from "@express/src/postgres/schema/file";

function rowToFile(row: typeof fileTable.$inferSelect): File {
    return {
        id: row.id,
        storagePath: row.storagePath,
        name: row.name,
        originalName: row.originalName,
        mimeType: row.mimeType,
        sizeBytes: row.sizeBytes,
        uploadedBy: row.uploadedBy,
        uploadedAt: row.uploadedAt,
    };
}

export const fileRepository: FileRepository = {
    async findById(id) {
        const result = await db.select().from(fileTable).where(eq(fileTable.id, id)).limit(1);
        return result[0] ? rowToFile(result[0]) : undefined;
    },
    async findByUploadedBy(userId) {
        const result = await db
            .select()
            .from(fileTable)
            .where(eq(fileTable.uploadedBy, userId))
            .orderBy(desc(fileTable.uploadedAt));
        return result.map(rowToFile);
    },
    async save(fileEntity) {
        await db
            .insert(fileTable)
            .values({
                id: fileEntity.id,
                storagePath: fileEntity.storagePath,
                name: fileEntity.name,
                originalName: fileEntity.originalName,
                mimeType: fileEntity.mimeType,
                sizeBytes: fileEntity.sizeBytes,
                uploadedBy: fileEntity.uploadedBy,
                uploadedAt: fileEntity.uploadedAt,
            })
            .onConflictDoUpdate({
                target: fileTable.id,
                set: {
                    storagePath: fileEntity.storagePath,
                    name: fileEntity.name,
                    originalName: fileEntity.originalName,
                    mimeType: fileEntity.mimeType,
                    sizeBytes: fileEntity.sizeBytes,
                    uploadedBy: fileEntity.uploadedBy,
                    uploadedAt: fileEntity.uploadedAt,
                },
            });
    },
    async deleteById(id) {
        await db.delete(fileTable).where(eq(fileTable.id, id));
    },
    async list() {
        const result = await db.select().from(fileTable).orderBy(desc(fileTable.uploadedAt));
        return result.map(rowToFile);
    },
};
