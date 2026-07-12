import { and, eq, or } from "drizzle-orm";
import { type ConversationPrivateRepository } from "@application/conversation/conversation-private/conversation-private.repository";
import { type ConversationPrivate } from "@domain/conversation/conversation-private/conversation-private.entity";
import { db } from "@express/src/postgres/db";
import { conversationPrivate as conversationPrivateTable } from "@express/src/postgres/schema/conversation-private";

function rowToConversationPrivate(row: typeof conversationPrivateTable.$inferSelect): ConversationPrivate {
    return {
        id: row.id,
        userAId: row.userAId ?? null,
        userBId: row.userBId ?? null,
        conversationId: row.conversationId,
    };
}

export const conversationPrivateRepository: ConversationPrivateRepository = {
    async findById(id) {
        const result = await db
            .select()
            .from(conversationPrivateTable)
            .where(eq(conversationPrivateTable.id, id))
            .limit(1);
        return result[0] ? rowToConversationPrivate(result[0]) : undefined;
    },
    async findByConversationId(conversationId) {
        const result = await db
            .select()
            .from(conversationPrivateTable)
            .where(eq(conversationPrivateTable.conversationId, conversationId))
            .limit(1);
        return result[0] ? rowToConversationPrivate(result[0]) : undefined;
    },
    async findByUserId(userId) {
        const result = await db
            .select()
            .from(conversationPrivateTable)
            .where(or(eq(conversationPrivateTable.userAId, userId), eq(conversationPrivateTable.userBId, userId)));
        return result.map(rowToConversationPrivate);
    },
    async findByUsers(userAId, userBId) {
        const result = await db
            .select()
            .from(conversationPrivateTable)
            .where(and(eq(conversationPrivateTable.userAId, userAId), eq(conversationPrivateTable.userBId, userBId)))
            .limit(1);
        return result[0] ? rowToConversationPrivate(result[0]) : undefined;
    },
    async save(conversationPrivate) {
        await db
            .insert(conversationPrivateTable)
            .values({
                id: conversationPrivate.id,
                userAId: conversationPrivate.userAId,
                userBId: conversationPrivate.userBId,
                conversationId: conversationPrivate.conversationId,
            })
            .onConflictDoUpdate({
                target: conversationPrivateTable.id,
                set: {
                    userAId: conversationPrivate.userAId,
                    userBId: conversationPrivate.userBId,
                    conversationId: conversationPrivate.conversationId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(conversationPrivateTable).where(eq(conversationPrivateTable.id, id));
    },
    async list() {
        const result = await db.select().from(conversationPrivateTable);
        return result.map(rowToConversationPrivate);
    },
};
