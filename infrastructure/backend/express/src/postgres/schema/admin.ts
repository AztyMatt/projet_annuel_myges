import { pgTable, text } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { instructor } from "./instructor"

export const admin = pgTable("admin", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  instructorId: text("instructor_id").references(() => instructor.id),
  role: text("role").notNull(),
})
