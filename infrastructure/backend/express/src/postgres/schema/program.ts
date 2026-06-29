import { pgTable, text, unique } from "drizzle-orm/pg-core";
import { period } from "@express/src/postgres/schema/period";

export const program = pgTable("program", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull().default(""),
    periodId: text("period_id")
        .notNull()
        .references(() => period.id),
}, (table) => ({
    nameUnique: unique().on(table.name, table.code),
}));
