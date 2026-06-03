import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { campus } from "@express/src/postgres/schema/campus";

export const classroom = pgTable("classroom", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    capacity: integer("capacity").notNull(),
    campusId: text("campus_id")
        .notNull()
        .references(() => campus.id),
});
