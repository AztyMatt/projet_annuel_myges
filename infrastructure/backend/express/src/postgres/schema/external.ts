import { pgTable, text } from "drizzle-orm/pg-core"

export const external = pgTable("external", {
  id: text("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  type: text("type").notNull(),
})
