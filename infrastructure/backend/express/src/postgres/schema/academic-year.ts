import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const academicYear = pgTable("academic_year", {
    id: text("id").primaryKey(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    isCurrent: boolean("is_current").notNull(),
});
