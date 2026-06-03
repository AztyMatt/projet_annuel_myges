import { asc, desc, eq } from "drizzle-orm"
import { type MessageRepository } from "@application/message/message.repository"
import { type Message } from "@domain/message/message.entity"
import { db } from "@express/src/postgres/db"
import { message as messageTable } from "@express/src/postgres/schema/message"

function rowToMessage(row: typeof messageTable.$inferSelect): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: row.content,
    createdAt: row.createdAt,
  }
}

export const messageRepository: MessageRepository = {
  async findById(id) {
    const result = await db.select().from(messageTable).where(eq(messageTable.id, id)).limit(1)
    return result[0] ? rowToMessage(result[0]) : undefined
  },
  async findByConversationId(conversationId) {
    const result = await db.select().from(messageTable).where(eq(messageTable.conversationId, conversationId)).orderBy(asc(messageTable.createdAt))
    return result.map(rowToMessage)
  },
  async findBySenderId(senderId) {
    const result = await db.select().from(messageTable).where(eq(messageTable.senderId, senderId)).orderBy(desc(messageTable.createdAt))
    return result.map(rowToMessage)
  },
  async save(message) {
    await db
      .insert(messageTable)
      .values({
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        createdAt: message.createdAt,
      })
      .onConflictDoUpdate({
        target: messageTable.id,
        set: {
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          createdAt: message.createdAt,
        },
      })
  },
  async deleteById(id) {
    await db.delete(messageTable).where(eq(messageTable.id, id))
  },
}
