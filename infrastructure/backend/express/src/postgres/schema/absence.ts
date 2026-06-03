import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { student } from "@express/src/postgres/schema/student";
import { session } from "@express/src/postgres/schema/session";

export const absence = pgTable("absence", {
    id: text("id").primaryKey(),
    studentId: text("student_id")
        .notNull()
        .references(() => student.id),
    sessionId: text("session_id")
        .notNull()
        .references(() => session.id),
    reason: text("reason").notNull(),
    status: text("status").notNull(),
    declaredAt: timestamp("declared_at", { withTimezone: true }).notNull(),
});
