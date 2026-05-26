import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"
import { conversation } from "./conversation"
import { users } from "./auth"

export const message = pgTable("message", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
})

export const messageRead = pgTable(
  "message_read",
  {
    messageId: text("message_id")
      .notNull()
      .references(() => message.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    readAt: timestamp("read_at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.messageId, t.userId] })]
)
