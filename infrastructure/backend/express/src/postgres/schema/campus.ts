import { pgTable, text } from "drizzle-orm/pg-core";

export const campus = pgTable("campus", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    address: text("address").notNull(),
});
