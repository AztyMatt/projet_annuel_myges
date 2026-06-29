import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { course } from "@express/src/postgres/schema/course";
import { classroom } from "@express/src/postgres/schema/classroom";
import { assessment } from "@express/src/postgres/schema/assessment";
import { external } from "@express/src/postgres/schema/external";
import { instructor } from "@express/src/postgres/schema/instructor";
import { student } from "@express/src/postgres/schema/student";

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    courseId: text("course_id")
        .notNull()
        .references(() => course.id),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    mode: text("mode").notNull(),
    classroomId: text("classroom_id")
        .references(() => classroom.id),
}, (table) => ({
    slotWithClassroom: uniqueIndex("session_slot_with_classroom_unique")
        .on(table.courseId, table.classroomId, table.startTime, table.endTime)
        .where(sql`${table.classroomId} IS NOT NULL`),
    slotWithoutClassroom: uniqueIndex("session_slot_without_classroom_unique")
        .on(table.courseId, table.startTime, table.endTime)
        .where(sql`${table.classroomId} IS NULL`),
}));

export const sessionExam = pgTable("session_exam", {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
        .notNull()
        .references(() => session.id),
    type: text("type").notNull(),
    isRetake: boolean("is_retake").notNull().default(false),
    assessmentId: text("assessment_id").references(() => assessment.id),
});

export const sessionExamExternal = pgTable("session_exam_external", {
    id: text("id").primaryKey(),
    sessionExamId: text("session_exam_id")
        .notNull()
        .references(() => sessionExam.id),
    externalId: text("external_id")
        .notNull()
        .references(() => external.id),
});

export const sessionExamInstructor = pgTable("session_exam_instructor", {
    id: text("id").primaryKey(),
    sessionExamId: text("session_exam_id")
        .notNull()
        .references(() => sessionExam.id),
    instructorId: text("instructor_id")
        .notNull()
        .references(() => instructor.id),
});

export const sessionExamStudent = pgTable("session_exam_student", {
    id: text("id").primaryKey(),
    sessionExamId: text("session_exam_id")
        .notNull()
        .references(() => sessionExam.id),
    studentId: text("student_id")
        .notNull()
        .references(() => student.id),
});
