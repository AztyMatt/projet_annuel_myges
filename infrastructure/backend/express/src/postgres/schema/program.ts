import { sql } from "drizzle-orm";
import { pgTable, text, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { period } from "@express/src/postgres/schema/period";

export const program = pgTable("program", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull().default(""),
    periodId: text("period_id")
        .notNull()
        .references(() => period.id),
}, (table) => ({
    nameCodeUnique: unique().on(table.name, table.code),
    codeUnique: uniqueIndex("program_code_unique").on(table.code).where(sql`${table.code} != ''`),
}));
