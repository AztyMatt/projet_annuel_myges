import { pgTable, text, unique } from "drizzle-orm/pg-core";
import { program } from "@express/src/postgres/schema/program";

export const bloc = pgTable("bloc", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    programId: text("program_id")
        .notNull()
        .references(() => program.id),
}, (table) => ({
    nameUnique: unique().on(table.programId, table.name),
}));
