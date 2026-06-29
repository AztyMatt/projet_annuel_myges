import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { program } from "@express/src/postgres/schema/program";
import { module } from "@express/src/postgres/schema/module";

export const programModule = pgTable("program_module", {
    id: text("id").primaryKey(),
    programId: text("program_id")
        .notNull()
        .references(() => program.id),
    moduleId: text("module_id")
        .notNull()
        .references(() => module.id),
    coefficient: integer("coefficient").notNull(),
    ectsCredits: integer("ects_credits").notNull(),
});
