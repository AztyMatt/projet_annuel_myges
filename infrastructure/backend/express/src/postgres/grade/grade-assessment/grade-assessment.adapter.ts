import { and, eq, inArray } from "drizzle-orm";
import { type GradeAssessmentRepository } from "@application/grade/grade-assessment/grade-assessment.repository";
import { type GradeAssessment } from "@domain/grade/grade-assessment/grade-assessment.entity";
import { db } from "@express/src/postgres/db";
import { gradeAssessment as gradeAssessmentTable, grade as gradeTable } from "@express/src/postgres/schema/grade";

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
    async existsByAssessmentId(assessmentId) {
        const rows = await db.select({ id: gradeAssessmentTable.id }).from(gradeAssessmentTable).where(eq(gradeAssessmentTable.assessmentId, assessmentId)).limit(1);
        return rows.length > 0;
    },
    async existsByAssessmentIdAndStudentIds(assessmentId, studentIds) {
        if (studentIds.length === 0) return false;
        const result = await db
            .select({ id: gradeAssessmentTable.id })
            .from(gradeAssessmentTable)
            .innerJoin(gradeTable, eq(gradeAssessmentTable.gradeId, gradeTable.id))
            .where(and(eq(gradeAssessmentTable.assessmentId, assessmentId), inArray(gradeTable.studentId, studentIds)))
            .limit(1);
        return result.length > 0;
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
        const [linked] = await db
            .select({ studentId: gradeTable.studentId, isRetake: gradeTable.isRetake })
            .from(gradeTable)
            .where(eq(gradeTable.id, gradeAssessment.gradeId))
            .limit(1);
        if (!linked) throw new Error(`grade ${gradeAssessment.gradeId} not found while saving grade_assessment`);
        await db
            .insert(gradeAssessmentTable)
            .values({
                id: gradeAssessment.id,
                gradeId: gradeAssessment.gradeId,
                assessmentId: gradeAssessment.assessmentId,
                studentId: linked.studentId,
                isRetake: linked.isRetake,
            })
            .onConflictDoUpdate({
                target: gradeAssessmentTable.id,
                set: {
                    gradeId: gradeAssessment.gradeId,
                    assessmentId: gradeAssessment.assessmentId,
                    studentId: linked.studentId,
                    isRetake: linked.isRetake,
                },
            });
    },
    async deleteById(id) {
        await db.delete(gradeAssessmentTable).where(eq(gradeAssessmentTable.id, id));
    },
};
