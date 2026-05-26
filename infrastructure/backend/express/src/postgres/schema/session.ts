import { pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { course } from "./course"
import { classroom } from "./classroom"
import { assessment } from "./assessment"
import { external } from "./external"
import { instructor } from "./instructor"
import { student } from "./student"

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => course.id),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  mode: text("mode").notNull(),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classroom.id),
})

export const sessionExam = pgTable("session_exam", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => session.id),
  type: text("type").notNull(),
  assessmentId: text("assessment_id").references(() => assessment.id),
})

export const sessionExamExternal = pgTable("session_exam_external", {
  id: text("id").primaryKey(),
  sessionExamId: text("session_exam_id")
    .notNull()
    .references(() => sessionExam.id),
  externalId: text("external_id")
    .notNull()
    .references(() => external.id),
})

export const sessionExamInstructor = pgTable("session_exam_instructor", {
  id: text("id").primaryKey(),
  sessionExamId: text("session_exam_id")
    .notNull()
    .references(() => sessionExam.id),
  instructorId: text("instructor_id")
    .notNull()
    .references(() => instructor.id),
})

export const sessionExamStudent = pgTable("session_exam_student", {
  id: text("id").primaryKey(),
  sessionExamId: text("session_exam_id")
    .notNull()
    .references(() => sessionExam.id),
  studentId: text("student_id")
    .notNull()
    .references(() => student.id),
})
