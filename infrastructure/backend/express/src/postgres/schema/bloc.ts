import { pgTable, text } from "drizzle-orm/pg-core"
import { program } from "./program"

export const bloc = pgTable("bloc", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  programId: text("program_id")
    .notNull()
    .references(() => program.id),
})
