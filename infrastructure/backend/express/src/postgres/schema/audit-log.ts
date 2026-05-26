import { json, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { users } from "./auth"

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  action: text("action").notNull(),
  entityName: text("entity_name").notNull(),
  entityId: text("entity_id").notNull(),
  oldValue: json("old_value"),
  newValue: json("new_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
})
