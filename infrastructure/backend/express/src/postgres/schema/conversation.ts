import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const conversation = pgTable("conversation", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
})
