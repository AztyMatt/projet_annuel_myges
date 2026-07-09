import { and, eq } from "drizzle-orm";
import { type GradeSessionExamRepository } from "@application/grade/grade-session-exam/grade-session-exam.repository";
import { type GradeSessionExam } from "@domain/grade/grade-session-exam/grade-session-exam.entity";
import { db } from "@express/src/postgres/db";
import { gradeSessionExam as gradeSessionExamTable, grade as gradeTable } from "@express/src/postgres/schema/grade";

function rowToGradeSessionExam(row: typeof gradeSessionExamTable.$inferSelect): GradeSessionExam {
    return {
        id: row.id,
        gradeId: row.gradeId,
        sessionExamId: row.sessionExamId,
    };
}

export const gradeSessionExamRepository: GradeSessionExamRepository = {
    async findById(id) {
        const result = await db.select().from(gradeSessionExamTable).where(eq(gradeSessionExamTable.id, id)).limit(1);
        return result[0] ? rowToGradeSessionExam(result[0]) : undefined;
    },
    async findByGradeId(gradeId) {
        const result = await db.select().from(gradeSessionExamTable).where(eq(gradeSessionExamTable.gradeId, gradeId));
        return result.map(rowToGradeSessionExam);
    },
    async findBySessionExamId(sessionExamId) {
        const result = await db
            .select()
            .from(gradeSessionExamTable)
            .where(eq(gradeSessionExamTable.sessionExamId, sessionExamId));
        return result.map(rowToGradeSessionExam);
    },
    async existsBySessionExamId(sessionExamId) {
        const rows = await db.select({ id: gradeSessionExamTable.id }).from(gradeSessionExamTable).where(eq(gradeSessionExamTable.sessionExamId, sessionExamId)).limit(1);
        return rows.length > 0;
    },
    async findByGradeAndSessionExam(gradeId, sessionExamId) {
        const result = await db
            .select()
            .from(gradeSessionExamTable)
            .where(and(eq(gradeSessionExamTable.gradeId, gradeId), eq(gradeSessionExamTable.sessionExamId, sessionExamId)))
            .limit(1);
        return result[0] ? rowToGradeSessionExam(result[0]) : undefined;
    },
    async existsBySessionExamIdAndStudentId(sessionExamId, studentId) {
        const result = await db
            .select({ id: gradeSessionExamTable.id })
            .from(gradeSessionExamTable)
            .innerJoin(gradeTable, eq(gradeSessionExamTable.gradeId, gradeTable.id))
            .where(and(eq(gradeSessionExamTable.sessionExamId, sessionExamId), eq(gradeTable.studentId, studentId)))
            .limit(1);
        return result.length > 0;
    },
    async save(gradeSessionExam) {
        await db
            .insert(gradeSessionExamTable)
            .values({
                id: gradeSessionExam.id,
                gradeId: gradeSessionExam.gradeId,
                sessionExamId: gradeSessionExam.sessionExamId,
            })
            .onConflictDoUpdate({
                target: gradeSessionExamTable.id,
                set: {
                    gradeId: gradeSessionExam.gradeId,
                    sessionExamId: gradeSessionExam.sessionExamId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(gradeSessionExamTable).where(eq(gradeSessionExamTable.id, id));
    },
};
