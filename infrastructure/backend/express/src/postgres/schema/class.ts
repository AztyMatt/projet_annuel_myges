import { integer, pgTable, text } from "drizzle-orm/pg-core"
import { program } from "./program"
import { conversation } from "./conversation"

export const classTable = pgTable("class", {
  id: text("id").primaryKey(),
  number: integer("number").notNull(),
  programId: text("program_id")
    .notNull()
    .references(() => program.id),
  size: integer("size").notNull(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id),
})
