import { sql } from "drizzle-orm";
import { pgTable, text, unique, uniqueIndex } from "drizzle-orm/pg-core";

export const module = pgTable("module", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull().default(""),
}, (table) => ({
    nameCodeUnique: unique().on(table.name, table.code),
    codeUnique: uniqueIndex("module_code_unique").on(table.code).where(sql`${table.code} != ''`),
}));
