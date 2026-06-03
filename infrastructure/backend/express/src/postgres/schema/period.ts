import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { academicYear } from "@express/src/postgres/schema/academic-year"

export const period = pgTable("period", {
  id: text("id").primaryKey(),
  order: integer("order").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  academicYearId: text("academic_year_id")
    .notNull()
    .references(() => academicYear.id),
})
