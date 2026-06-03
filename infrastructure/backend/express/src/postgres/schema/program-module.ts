import { pgTable, text } from "drizzle-orm/pg-core"
import { program } from "./program"
import { module } from "./module"

export const programModule = pgTable("program_module", {
  id: text("id").primaryKey(),
  programId: text("program_id")
    .notNull()
    .references(() => program.id),
  moduleId: text("module_id")
    .notNull()
    .references(() => module.id),
})
