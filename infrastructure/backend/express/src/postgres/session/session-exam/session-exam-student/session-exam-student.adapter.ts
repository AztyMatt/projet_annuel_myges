import { eq } from "drizzle-orm";
import { type SessionExamStudentRepository } from "@application/session/session-exam/session-exam-student/session-exam-student.repository";
import { type SessionExamStudent } from "@domain/session/session-exam/session-exam-student/session-exam-student.entity";
import { db } from "@express/src/postgres/db";
import { sessionExamStudent as sessionExamStudentTable } from "@express/src/postgres/schema/session";

function rowToSessionExamStudent(row: typeof sessionExamStudentTable.$inferSelect): SessionExamStudent {
    return {
        id: row.id,
        sessionExamId: row.sessionExamId,
        studentId: row.studentId,
    };
}

export const sessionExamStudentRepository: SessionExamStudentRepository = {
    async findById(id) {
        const result = await db
            .select()
            .from(sessionExamStudentTable)
            .where(eq(sessionExamStudentTable.id, id))
            .limit(1);
        return result[0] ? rowToSessionExamStudent(result[0]) : undefined;
    },
    async findBySessionExamId(sessionExamId) {
        const result = await db
            .select()
            .from(sessionExamStudentTable)
            .where(eq(sessionExamStudentTable.sessionExamId, sessionExamId));
        return result.map(rowToSessionExamStudent);
    },
    async findByStudentId(studentId) {
        const result = await db
            .select()
            .from(sessionExamStudentTable)
            .where(eq(sessionExamStudentTable.studentId, studentId));
        return result.map(rowToSessionExamStudent);
    },
    async save(sessionExamStudent) {
        await db
            .insert(sessionExamStudentTable)
            .values({
                id: sessionExamStudent.id,
                sessionExamId: sessionExamStudent.sessionExamId,
                studentId: sessionExamStudent.studentId,
            })
            .onConflictDoUpdate({
                target: sessionExamStudentTable.id,
                set: {
                    sessionExamId: sessionExamStudent.sessionExamId,
                    studentId: sessionExamStudent.studentId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(sessionExamStudentTable).where(eq(sessionExamStudentTable.id, id));
    },
};
