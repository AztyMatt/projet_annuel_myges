import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, unique, uniqueIndex } from "drizzle-orm/pg-core";

export const academicYear = pgTable("academic_year", {
    id: text("id").primaryKey(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    isCurrent: boolean("is_current").notNull(),
}, (table) => ({
    datesUnique: unique().on(table.startDate, table.endDate),

    onlyOneCurrent: uniqueIndex("academic_year_only_one_current")
        .on(table.isCurrent)
        .where(sql`${table.isCurrent} = true`),
}));
