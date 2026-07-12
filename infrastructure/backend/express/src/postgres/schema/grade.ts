import { boolean, integer, pgTable, real, text, timestamp, unique } from "drizzle-orm/pg-core";
import { student } from "@express/src/postgres/schema/student";
import { users } from "@express/src/postgres/schema/auth";
import { assessment } from "@express/src/postgres/schema/assessment";
import { sessionExam } from "@express/src/postgres/schema/session";
import { module } from "@express/src/postgres/schema/module";

export const manualNotation = pgTable("manual_notation", {
    id: text("id").primaryKey(),
    moduleId: text("module_id")
        .notNull()
        .references(() => module.id),
    name: text("name").notNull(),
}, (table) => ({
    nameUnique: unique().on(table.moduleId, table.name),
}));

export const grade = pgTable("grade", {
    id: text("id").primaryKey(),
    studentId: text("student_id")
        .notNull()
        .references(() => student.id, { onDelete: "cascade" }),
    value: real("value").notNull(),
    isRetake: boolean("is_retake").notNull().default(false),
    isLocked: boolean("is_locked").notNull().default(false),
    enteredAt: timestamp("entered_at", { withTimezone: true }).notNull(),
    enteredBy: text("entered_by")
        .references(() => users.id, { onDelete: "set null" }),
});

export const gradeAssessment = pgTable("grade_assessment", {
    id: text("id").primaryKey(),
    gradeId: text("grade_id")
        .notNull()
        .references(() => grade.id, { onDelete: "cascade" }),
    assessmentId: text("assessment_id")
        .notNull()
        .references(() => assessment.id),
    studentId: text("student_id")
        .notNull()
        .references(() => student.id, { onDelete: "cascade" }),
    isRetake: boolean("is_retake").notNull().default(false),
}, (table) => ({
    linkUnique: unique().on(table.gradeId, table.assessmentId),
    studentRetakeUnique: unique().on(table.assessmentId, table.studentId, table.isRetake),
}));

export const gradeManualNotation = pgTable("grade_manual_notation", {
    id: text("id").primaryKey(),
    gradeId: text("grade_id")
        .notNull()
        .references(() => grade.id, { onDelete: "cascade" }),
    gradeManualId: text("grade_manual_id")
        .notNull()
        .references(() => manualNotation.id),
}, (table) => ({
    linkUnique: unique().on(table.gradeId, table.gradeManualId),
}));

export const gradeSessionExam = pgTable("grade_session_exam", {
    id: text("id").primaryKey(),
    gradeId: text("grade_id")
        .notNull()
        .references(() => grade.id, { onDelete: "cascade" }),
    sessionExamId: text("session_exam_id")
        .notNull()
        .references(() => sessionExam.id),
}, (table) => ({
    linkUnique: unique().on(table.gradeId, table.sessionExamId),
}));
