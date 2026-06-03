import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const module = pgTable("module", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    code: text("code"),
    coefficient: integer("coefficient").notNull(),
    ectsCredits: integer("ects_credits").notNull(),
});
