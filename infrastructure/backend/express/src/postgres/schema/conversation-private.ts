import { pgTable, text } from "drizzle-orm/pg-core"
import { admin } from "./admin"
import { student } from "./student"
import { conversation } from "./conversation"

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
