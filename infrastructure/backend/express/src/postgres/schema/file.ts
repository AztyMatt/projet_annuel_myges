import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { users } from "./auth"
import { assessment, assessmentGroup } from "./assessment"
import { admin } from "./admin"
import { course } from "./course"
import { student } from "./student"
import { absence } from "./absence"

export const file = pgTable("file", {
  id: text("id").primaryKey(),
  storagePath: text("storage_path").notNull(),
  name: text("name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull(),
})

export const fileAssessment = pgTable("file_assessment", {
  id: text("id").primaryKey(),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessment.id),
  assessmentGroupId: text("assessment_group_id")
    .notNull()
    .references(() => assessmentGroup.id),
  fileId: text("file_id")
    .notNull()
    .references(() => file.id),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull(),
})

export const fileCourse = pgTable("file_course", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  fileId: text("file_id")
    .notNull()
    .references(() => file.id),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id),
})

export const fileDocument = pgTable("file_document", {
  id: text("id").primaryKey(),
  fileId: text("file_id")
    .notNull()
    .references(() => file.id),
  studentId: text("student_id")
    .notNull()
    .references(() => student.id),
  status: text("status").notNull(),
})

export const fileJustification = pgTable("file_justification", {
  id: text("id").primaryKey(),
  absenceId: text("absence_id")
    .notNull()
    .references(() => absence.id),
  fileId: text("file_id")
    .notNull()
    .references(() => file.id),
  validationStatus: text("validation_status").notNull(),
  processedBy: text("processed_by")
    .notNull()
    .references(() => admin.id),
})
