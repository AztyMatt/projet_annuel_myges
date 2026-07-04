import { boolean, integer, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

import { course } from "@express/src/postgres/schema/course";
import { student } from "@express/src/postgres/schema/student";

export const assessment = pgTable("assessment", {
    id: text("id").primaryKey(),
    courseId: text("course_id")
        .notNull()
        .references(() => course.id),
    title: text("title").notNull(),
    type: text("type").notNull(),
    isPublished: boolean("is_published").notNull().default(false),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    maxGroupSize: integer("max_group_size").notNull().default(3),
}, (table) => ({
    assessmentUnique: unique().on(table.courseId, table.title, table.dueDate),
}));

export const assessmentGroup = pgTable("assessment_group", {
    id: text("id").primaryKey(),
    assessmentId: text("assessment_id")
        .notNull()
        .references(() => assessment.id),
});

export const assessmentGroupMember = pgTable("assessment_group_member", {
    id: text("id").primaryKey(),
    assessmentGroupId: text("assessment_group_id")
        .notNull()
        .references(() => assessmentGroup.id),
    studentId: text("student_id")
        .notNull()
        .references(() => student.id),
}, (table) => ({
    memberUnique: unique().on(table.assessmentGroupId, table.studentId),
}));
