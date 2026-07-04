import { pgTable, text, unique } from "drizzle-orm/pg-core";
import { classTable } from "@express/src/postgres/schema/class";
import { student } from "@express/src/postgres/schema/student";

export const group = pgTable("group", {
    id: text("id").primaryKey(),
    classId: text("class_id")
        .notNull()
        .references(() => classTable.id),
    name: text("name").notNull(),
}, (table) => ({
    nameUnique: unique().on(table.classId, table.name),
}));

export const studentGroup = pgTable("student_group", {
    id: text("id").primaryKey(),
    studentId: text("student_id")
        .notNull()
        .references(() => student.id),
    groupId: text("group_id")
        .notNull()
        .references(() => group.id),
}, (table) => ({
    membershipUnique: unique().on(table.studentId, table.groupId),
}));
