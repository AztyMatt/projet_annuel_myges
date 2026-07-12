import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "@express/src/postgres/schema/auth";

export const notification = pgTable("notification", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    entityName: text("entity_name"),
    entityId: text("entity_id"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
