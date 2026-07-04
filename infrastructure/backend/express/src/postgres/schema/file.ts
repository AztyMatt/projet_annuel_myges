import { integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "@express/src/postgres/schema/auth";
import { assessment, assessmentGroup } from "@express/src/postgres/schema/assessment";
import { admin } from "@express/src/postgres/schema/admin";
import { course } from "@express/src/postgres/schema/course";
import { student } from "@express/src/postgres/schema/student";
import { absence } from "@express/src/postgres/schema/absence";

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
});

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
}, (table) => ({
    submissionUnique: unique().on(table.assessmentGroupId, table.fileId),
}));

export const fileCourse = pgTable("file_course", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    fileId: text("file_id")
        .notNull()
        .references(() => file.id),
    courseId: text("course_id")
        .notNull()
        .references(() => course.id),
}, (table) => ({
    linkUnique: unique().on(table.fileId, table.courseId),
}));

export const fileDocument = pgTable("file_document", {
    id: text("id").primaryKey(),
    fileId: text("file_id")
        .notNull()
        .references(() => file.id),
    studentId: text("student_id")
        .notNull()
        .references(() => student.id),
    status: text("status").notNull(),
}, (table) => ({
    linkUnique: unique().on(table.fileId, table.studentId),
}));

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
        .references(() => admin.id),
}, (table) => ({
    linkUnique: unique().on(table.absenceId, table.fileId),
}));

export const fileAssessmentInstruction = pgTable("file_assessment_instruction", {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id")
        .notNull()
        .references(() => assessment.id),
    fileId: text("file_id")
        .notNull()
        .references(() => file.id),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull(),
}, (table) => ({
    linkUnique: unique().on(table.assessmentId, table.fileId),
}));
