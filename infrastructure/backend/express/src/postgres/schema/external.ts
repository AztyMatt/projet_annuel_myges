import { pgTable, text } from "drizzle-orm/pg-core";

export const external = pgTable("external", {
    id: text("id").primaryKey(),
    firstname: text("firstname").notNull(),
    lastname: text("lastname").notNull(),
    email: text("email").unique().notNull(),
    type: text("type").notNull(),
});
