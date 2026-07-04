import { pgTable, text } from "drizzle-orm/pg-core";

export const company = pgTable("company", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    siret: text("siret").unique().notNull(),
    address: text("address").notNull(),
    contactName: text("contact_name").notNull(),
    contactNumber: text("contact_number"),
    contactEmail: text("contact_email"),
});
