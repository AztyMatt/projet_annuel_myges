import { pgTable, text } from "drizzle-orm/pg-core";
import { users } from "@express/src/postgres/schema/auth";

export const admin = pgTable("admin", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .unique()
        .notNull()
        .references(() => users.id),
    role: text("role").notNull(),
});
