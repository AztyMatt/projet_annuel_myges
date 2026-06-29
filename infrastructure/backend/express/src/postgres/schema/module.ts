import { pgTable, text, unique } from "drizzle-orm/pg-core";

export const module = pgTable("module", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code").notNull().default(""),
}, (table) => ({
    nameCodeUnique: unique().on(table.name, table.code),
}));
