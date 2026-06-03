import { desc, eq } from "drizzle-orm";
import { type ConversationRepository } from "@application/conversation/conversation.repository";
import { type Conversation } from "@domain/conversation/conversation.entity";
import { db } from "@express/src/postgres/db";
import { conversation as conversationTable } from "@express/src/postgres/schema/conversation";

function rowToConversation(row: typeof conversationTable.$inferSelect): Conversation {
    return {
        id: row.id,
        createdAt: row.createdAt,
    };
}

export const conversationRepository: ConversationRepository = {
    async findById(id) {
        const result = await db.select().from(conversationTable).where(eq(conversationTable.id, id)).limit(1);
        return result[0] ? rowToConversation(result[0]) : undefined;
    },
    async save(conversation) {
        await db
            .insert(conversationTable)
            .values({
                id: conversation.id,
                createdAt: conversation.createdAt,
            })
            .onConflictDoUpdate({
                target: conversationTable.id,
                set: {
                    createdAt: conversation.createdAt,
                },
            });
    },
    async deleteById(id) {
        await db.delete(conversationTable).where(eq(conversationTable.id, id));
    },
    async list() {
        const result = await db.select().from(conversationTable).orderBy(desc(conversationTable.createdAt));
        return result.map(rowToConversation);
    },
};
