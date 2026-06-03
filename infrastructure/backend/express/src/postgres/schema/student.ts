import { pgTable, text } from "drizzle-orm/pg-core"
import { users } from "@express/src/postgres/schema/auth"
import { program } from "@express/src/postgres/schema/program"

export const student = pgTable("student", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  programId: text("program_id")
    .notNull()
    .references(() => program.id),
})
