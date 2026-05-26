import { pgTable, text } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { program } from "./program"

export const student = pgTable("student", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  programId: text("program_id")
    .notNull()
    .references(() => program.id),
})
