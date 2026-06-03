import { json, pgTable, text } from "drizzle-orm/pg-core";
import { users } from "@express/src/postgres/schema/auth";

export const instructor = pgTable("instructor", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id),
    contractType: text("contract_type").notNull(),
    specialties: json("specialties"),
});
