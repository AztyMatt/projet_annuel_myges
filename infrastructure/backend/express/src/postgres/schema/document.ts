import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { fileDocument } from "@express/src/postgres/schema/file"
import { company } from "@express/src/postgres/schema/company"

export const documentAdministrative = pgTable("document_administrative", {
  id: text("id").primaryKey(),
  fileDocumentId: text("file_document_id")
    .notNull()
    .references(() => fileDocument.id),
  type: text("type").notNull(),
  expiration: timestamp("expiration", { withTimezone: true }),
})

export const documentApprenticeshipContract = pgTable("document_apprenticeship_contract", {
  id: text("id").primaryKey(),
  fileDocumentId: text("file_document_id")
    .notNull()
    .references(() => fileDocument.id),
  companyId: text("company_id")
    .notNull()
    .references(() => company.id),
  type: text("type").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
})
