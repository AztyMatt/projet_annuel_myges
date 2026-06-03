import { pgTable, text } from "drizzle-orm/pg-core"
import { instructor } from "./instructor"
import { module } from "./module"
import { group } from "./group"
import { bloc } from "./bloc"
import { conversation } from "./conversation"

export const course = pgTable("course", {
  id: text("id").primaryKey(),
  instructorId: text("instructor_id")
    .notNull()
    .references(() => instructor.id),
  moduleId: text("module_id")
    .notNull()
    .references(() => module.id),
  groupId: text("group_id")
    .notNull()
    .references(() => group.id),
  blocId: text("bloc_id")
    .notNull()
    .references(() => bloc.id),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversation.id),
})
