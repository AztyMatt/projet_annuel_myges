import { and, eq } from "drizzle-orm";
import { type GradeAssessmentRepository } from "@application/grade/grade-assessment/grade-assessment.repository";
import { type GradeAssessment } from "@domain/grade/grade-assessment/grade-assessment.entity";
import { db } from "@express/src/postgres/db";
import { gradeAssessment as gradeAssessmentTable } from "@express/src/postgres/schema/grade";

function rowToGradeAssessment(row: typeof gradeAssessmentTable.$inferSelect): GradeAssessment {
    return {
        id: row.id,
        gradeId: row.gradeId,
        assessmentId: row.assessmentId,
    };
}

export const gradeAssessmentRepository: GradeAssessmentRepository = {
    async findById(id) {
        const result = await db.select().from(gradeAssessmentTable).where(eq(gradeAssessmentTable.id, id)).limit(1);
        return result[0] ? rowToGradeAssessment(result[0]) : undefined;
    },
    async findByGradeId(gradeId) {
        const result = await db.select().from(gradeAssessmentTable).where(eq(gradeAssessmentTable.gradeId, gradeId));
        return result.map(rowToGradeAssessment);
    },
    async findByAssessmentId(assessmentId) {
        const result = await db
            .select()
            .from(gradeAssessmentTable)
            .where(eq(gradeAssessmentTable.assessmentId, assessmentId));
        return result.map(rowToGradeAssessment);
    },
    async findByGradeAndAssessment(gradeId, assessmentId) {
        const result = await db
            .select()
            .from(gradeAssessmentTable)
            .where(and(eq(gradeAssessmentTable.gradeId, gradeId), eq(gradeAssessmentTable.assessmentId, assessmentId)))
            .limit(1);
        return result[0] ? rowToGradeAssessment(result[0]) : undefined;
    },
    async save(gradeAssessment) {
        await db
            .insert(gradeAssessmentTable)
            .values({
                id: gradeAssessment.id,
                gradeId: gradeAssessment.gradeId,
                assessmentId: gradeAssessment.assessmentId,
            })
            .onConflictDoUpdate({
                target: gradeAssessmentTable.id,
                set: {
                    gradeId: gradeAssessment.gradeId,
                    assessmentId: gradeAssessment.assessmentId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(gradeAssessmentTable).where(eq(gradeAssessmentTable.id, id));
    },
};
