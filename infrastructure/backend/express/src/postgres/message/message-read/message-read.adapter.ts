import { and, eq } from "drizzle-orm";
import { type MessageReadRepository } from "@application/message/message-read/message-read.repository";
import { type MessageRead } from "@domain/message/message-read/message-read.entity";
import { db } from "@express/src/postgres/db";
import { messageRead as messageReadTable } from "@express/src/postgres/schema/message";

function rowToMessageRead(row: typeof messageReadTable.$inferSelect): MessageRead {
    return {
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
    async save(messageRead) {
        await db
            .insert(messageReadTable)
            .values({
                messageId: messageRead.messageId,
                userId: messageRead.userId,
                readAt: messageRead.readAt,
            })
            .onConflictDoUpdate({
                target: [messageReadTable.messageId, messageReadTable.userId],
                set: {
                    readAt: messageRead.readAt,
                },
            });
    },
    async deleteByMessageIdAndUserId(messageId, userId) {
        await db
            .delete(messageReadTable)
            .where(and(eq(messageReadTable.messageId, messageId), eq(messageReadTable.userId, userId)));
    },
};
