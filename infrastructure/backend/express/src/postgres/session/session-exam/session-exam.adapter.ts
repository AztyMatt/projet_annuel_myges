import { eq } from "drizzle-orm";
import { type SessionExamRepository } from "@application/session/session-exam/session-exam.repository";
import { type SessionExam } from "@domain/session/session-exam/session-exam.entity";
import { SessionExamType } from "@domain/session/session-exam/session-exam.enums";
import { assertEnum } from "@express/src/postgres/assert-enum";
import { db } from "@express/src/postgres/db";
import { sessionExam as sessionExamTable } from "@express/src/postgres/schema/session";

function rowToSessionExam(row: typeof sessionExamTable.$inferSelect): SessionExam {
    return {
        id: row.id,
        sessionId: row.sessionId,
        type: assertEnum(row.type, SessionExamType),
        isRetake: row.isRetake,
        assessmentId: row.assessmentId,
    };
}

export const sessionExamRepository: SessionExamRepository = {
    async findById(id) {
        const result = await db.select().from(sessionExamTable).where(eq(sessionExamTable.id, id)).limit(1);
        return result[0] ? rowToSessionExam(result[0]) : undefined;
    },
    async findBySessionId(sessionId) {
        const result = await db.select().from(sessionExamTable).where(eq(sessionExamTable.sessionId, sessionId));
        return result.map(rowToSessionExam);
    },
    async existsBySessionId(sessionId) {
        const rows = await db.select({ id: sessionExamTable.id }).from(sessionExamTable).where(eq(sessionExamTable.sessionId, sessionId)).limit(1);
        return rows.length > 0;
    },
    async findByAssessmentId(assessmentId) {
        const result = await db.select().from(sessionExamTable).where(eq(sessionExamTable.assessmentId, assessmentId));
        return result.map(rowToSessionExam);
    },
    async existsByAssessmentId(assessmentId) {
        const rows = await db.select({ id: sessionExamTable.id }).from(sessionExamTable).where(eq(sessionExamTable.assessmentId, assessmentId)).limit(1);
        return rows.length > 0;
    },
    async save(sessionExam) {
        await db
            .insert(sessionExamTable)
            .values({
                id: sessionExam.id,
                sessionId: sessionExam.sessionId,
                type: sessionExam.type,
                isRetake: sessionExam.isRetake,
                assessmentId: sessionExam.assessmentId,
            })
            .onConflictDoUpdate({
                target: sessionExamTable.id,
                set: {
                    sessionId: sessionExam.sessionId,
                    type: sessionExam.type,
                    isRetake: sessionExam.isRetake,
                    assessmentId: sessionExam.assessmentId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(sessionExamTable).where(eq(sessionExamTable.id, id));
    },
    async list() {
        const result = await db.select().from(sessionExamTable);
        return result.map(rowToSessionExam);
    },
};
