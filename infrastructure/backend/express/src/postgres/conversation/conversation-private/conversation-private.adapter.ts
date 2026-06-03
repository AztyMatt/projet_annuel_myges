import { eq } from "drizzle-orm"
import { type ConversationPrivateRepository } from "@application/conversation/conversation-private/conversation-private.repository"
import { type ConversationPrivate } from "@domain/conversation/conversation-private/conversation-private.entity"
import { db } from "@express/src/postgres/db"
import { conversationPrivate as conversationPrivateTable } from "@express/src/postgres/schema/conversation-private"

function rowToConversationPrivate(row: typeof conversationPrivateTable.$inferSelect): ConversationPrivate {
  return {
    id: row.id,
    adminId: row.adminId,
    studentId: row.studentId,
    conversationId: row.conversationId,
  }
}

export const conversationPrivateRepository: ConversationPrivateRepository = {
  async findById(id) {
    const result = await db.select().from(conversationPrivateTable).where(eq(conversationPrivateTable.id, id)).limit(1)
    return result[0] ? rowToConversationPrivate(result[0]) : undefined
  },
  async findByConversationId(conversationId) {
    const result = await db.select().from(conversationPrivateTable).where(eq(conversationPrivateTable.conversationId, conversationId)).limit(1)
    return result[0] ? rowToConversationPrivate(result[0]) : undefined
  },
  async findByAdminId(adminId) {
    const result = await db.select().from(conversationPrivateTable).where(eq(conversationPrivateTable.adminId, adminId))
    return result.map(rowToConversationPrivate)
  },
  async findByStudentId(studentId) {
    const result = await db.select().from(conversationPrivateTable).where(eq(conversationPrivateTable.studentId, studentId))
    return result.map(rowToConversationPrivate)
  },
  async save(conversationPrivate) {
    await db
      .insert(conversationPrivateTable)
      .values({
        id: conversationPrivate.id,
        adminId: conversationPrivate.adminId,
        studentId: conversationPrivate.studentId,
        conversationId: conversationPrivate.conversationId,
      })
      .onConflictDoUpdate({
        target: conversationPrivateTable.id,
        set: {
          adminId: conversationPrivate.adminId,
          studentId: conversationPrivate.studentId,
          conversationId: conversationPrivate.conversationId,
        },
      })
  },
  async deleteById(id) {
    await db.delete(conversationPrivateTable).where(eq(conversationPrivateTable.id, id))
  },
  async list() {
    const result = await db.select().from(conversationPrivateTable)
    return result.map(rowToConversationPrivate)
  },
}
