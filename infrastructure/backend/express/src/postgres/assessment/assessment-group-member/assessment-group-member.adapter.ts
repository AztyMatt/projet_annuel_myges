import { and, eq } from "drizzle-orm";
import { type AssessmentGroupMemberRepository } from "@application/assessment/assessment-group-member/assessment-group-member.repository";
import { type AssessmentGroupMember } from "@domain/assessment/assessment-group-member/assessment-group-member.entity";
import { db } from "@express/src/postgres/db";
import { assessmentGroupMember as assessmentGroupMemberTable } from "@express/src/postgres/schema/assessment";

function rowToAssessmentGroupMember(row: typeof assessmentGroupMemberTable.$inferSelect): AssessmentGroupMember {
    return {
        id: row.id,
        assessmentGroupId: row.assessmentGroupId,
        studentId: row.studentId,
    };
}

export const assessmentGroupMemberRepository: AssessmentGroupMemberRepository = {
    async findById(id) {
        const result = await db
            .select()
            .from(assessmentGroupMemberTable)
            .where(eq(assessmentGroupMemberTable.id, id))
            .limit(1);
        return result[0] ? rowToAssessmentGroupMember(result[0]) : undefined;
    },
    async findByAssessmentGroupId(assessmentGroupId) {
        const result = await db
            .select()
            .from(assessmentGroupMemberTable)
            .where(eq(assessmentGroupMemberTable.assessmentGroupId, assessmentGroupId));
        return result.map(rowToAssessmentGroupMember);
    },
    async findByStudentId(studentId) {
        const result = await db
            .select()
            .from(assessmentGroupMemberTable)
            .where(eq(assessmentGroupMemberTable.studentId, studentId));
        return result.map(rowToAssessmentGroupMember);
    },
    async existsByStudentId(studentId) {
        const rows = await db.select({ id: assessmentGroupMemberTable.id }).from(assessmentGroupMemberTable).where(eq(assessmentGroupMemberTable.studentId, studentId)).limit(1);
        return rows.length > 0;
    },
    async findByGroupAndStudent(assessmentGroupId, studentId) {
        const result = await db
            .select()
            .from(assessmentGroupMemberTable)
            .where(and(eq(assessmentGroupMemberTable.assessmentGroupId, assessmentGroupId), eq(assessmentGroupMemberTable.studentId, studentId)))
            .limit(1);
        return result[0] ? rowToAssessmentGroupMember(result[0]) : undefined;
    },
    async save(assessmentGroupMember) {
        await db
            .insert(assessmentGroupMemberTable)
            .values({
                id: assessmentGroupMember.id,
                assessmentGroupId: assessmentGroupMember.assessmentGroupId,
                studentId: assessmentGroupMember.studentId,
            })
            .onConflictDoUpdate({
                target: assessmentGroupMemberTable.id,
                set: {
                    assessmentGroupId: assessmentGroupMember.assessmentGroupId,
                    studentId: assessmentGroupMember.studentId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(assessmentGroupMemberTable).where(eq(assessmentGroupMemberTable.id, id));
    },
};
