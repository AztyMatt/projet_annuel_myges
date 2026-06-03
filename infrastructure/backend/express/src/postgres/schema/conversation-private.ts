import { pgTable, text } from "drizzle-orm/pg-core"
import { admin } from "@express/src/postgres/schema/admin"
import { student } from "@express/src/postgres/schema/student"
import { conversation } from "@express/src/postgres/schema/conversation"

export const conversationPrivate = pgTable("conversation_private", {
  id: text("id").primaryKey(),
  adminId: text("admin_id")
    .notNull()
    .references(() => admin.id),
  studentId: text("student_id")
    .notNull()
    .references(() => student.id),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id),
})
