import { and, eq } from "drizzle-orm";
import { type SessionExamExternalRepository } from "@application/session/session-exam/session-exam-external/session-exam-external.repository";
import { type SessionExamExternal } from "@domain/session/session-exam/session-exam-external/session-exam-external.entity";
import { db } from "@express/src/postgres/db";
import { sessionExamExternal as sessionExamExternalTable } from "@express/src/postgres/schema/session";

function rowToSessionExamExternal(row: typeof sessionExamExternalTable.$inferSelect): SessionExamExternal {
    return {
        id: row.id,
        sessionExamId: row.sessionExamId,
        externalId: row.externalId,
    };
}

export const sessionExamExternalRepository: SessionExamExternalRepository = {
    async findById(id) {
        const result = await db
            .select()
            .from(sessionExamExternalTable)
            .where(eq(sessionExamExternalTable.id, id))
            .limit(1);
        return result[0] ? rowToSessionExamExternal(result[0]) : undefined;
    },
    async findBySessionExamId(sessionExamId) {
        const result = await db
            .select()
            .from(sessionExamExternalTable)
            .where(eq(sessionExamExternalTable.sessionExamId, sessionExamId));
        return result.map(rowToSessionExamExternal);
    },
    async findByExternalId(externalId) {
        const result = await db
            .select()
            .from(sessionExamExternalTable)
            .where(eq(sessionExamExternalTable.externalId, externalId));
        return result.map(rowToSessionExamExternal);
    },
    async existsByExternalId(externalId) {
        const rows = await db
            .select({ id: sessionExamExternalTable.id })
            .from(sessionExamExternalTable)
            .where(eq(sessionExamExternalTable.externalId, externalId))
            .limit(1);
        return rows.length > 0;
    },
    async findByExamAndExternal(sessionExamId, externalId) {
        const result = await db
            .select()
            .from(sessionExamExternalTable)
            .where(and(eq(sessionExamExternalTable.sessionExamId, sessionExamId), eq(sessionExamExternalTable.externalId, externalId)))
            .limit(1);
        return result[0] ? rowToSessionExamExternal(result[0]) : undefined;
    },
    async save(sessionExamExternal) {
        await db
            .insert(sessionExamExternalTable)
            .values({
                id: sessionExamExternal.id,
                sessionExamId: sessionExamExternal.sessionExamId,
                externalId: sessionExamExternal.externalId,
            })
            .onConflictDoUpdate({
                target: sessionExamExternalTable.id,
                set: {
                    sessionExamId: sessionExamExternal.sessionExamId,
                    externalId: sessionExamExternal.externalId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(sessionExamExternalTable).where(eq(sessionExamExternalTable.id, id));
    },
};
