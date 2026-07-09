import { and, eq } from "drizzle-orm";
import { type MessageReadRepository } from "@application/message/message-read/message-read.repository";
import { type MessageRead } from "@domain/message/message-read/message-read.entity";
import { db } from "@express/src/postgres/db";
import { messageRead as messageReadTable } from "@express/src/postgres/schema/message";

function rowToMessageRead(row: typeof messageReadTable.$inferSelect): MessageRead {
    return {
        id: row.id,
        messageId: row.messageId,
        userId: row.userId,
        readAt: row.readAt,
    };
}

export const messageReadRepository: MessageReadRepository = {
    async findByMessageIdAndUserId(messageId, userId) {
        const result = await db
            .select()
            .from(messageReadTable)
            .where(and(eq(messageReadTable.messageId, messageId), eq(messageReadTable.userId, userId)))
            .limit(1);
        return result[0] ? rowToMessageRead(result[0]) : undefined;
    },
    async findByMessageId(messageId) {
        const result = await db.select().from(messageReadTable).where(eq(messageReadTable.messageId, messageId));
        return result.map(rowToMessageRead);
    },
    async findByUserId(userId) {
        const result = await db.select().from(messageReadTable).where(eq(messageReadTable.userId, userId));
        return result.map(rowToMessageRead);
    },
    async existsByUserId(userId) {
        const rows = await db.select({ id: messageReadTable.id }).from(messageReadTable).where(eq(messageReadTable.userId, userId)).limit(1);
        return rows.length > 0;
    },
    async save(messageRead) {
        await db
            .insert(messageReadTable)
            .values({
                id: messageRead.id,
                messageId: messageRead.messageId,
                userId: messageRead.userId,
                readAt: messageRead.readAt,
            })
            .onConflictDoNothing();
    },
    async deleteByMessageIdAndUserId(messageId, userId) {
        await db
            .delete(messageReadTable)
            .where(and(eq(messageReadTable.messageId, messageId), eq(messageReadTable.userId, userId)));
    },
};
