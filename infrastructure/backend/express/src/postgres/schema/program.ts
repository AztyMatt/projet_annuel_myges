import { pgTable, text } from "drizzle-orm/pg-core";
import { period } from "@express/src/postgres/schema/period";

export const program = pgTable("program", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code"),
    periodId: text("period_id")
        .notNull()
        .references(() => period.id),
});
