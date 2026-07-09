import { and, eq } from "drizzle-orm";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type StudentGroup } from "@domain/group/student-group/student-group.entity";
import { db } from "@express/src/postgres/db";
import { studentGroup as studentGroupTable } from "@express/src/postgres/schema/group";

function rowToStudentGroup(row: typeof studentGroupTable.$inferSelect): StudentGroup {
    return {
        id: row.id,
        studentId: row.studentId,
        groupId: row.groupId,
    };
}

export const studentGroupRepository: StudentGroupRepository = {
    async findById(id) {
        const result = await db.select().from(studentGroupTable).where(eq(studentGroupTable.id, id)).limit(1);
        return result[0] ? rowToStudentGroup(result[0]) : undefined;
    },
    async findByStudentId(studentId) {
        const result = await db.select().from(studentGroupTable).where(eq(studentGroupTable.studentId, studentId));
        return result.map(rowToStudentGroup);
    },
    async existsByStudentId(studentId) {
        const rows = await db.select({ id: studentGroupTable.id }).from(studentGroupTable).where(eq(studentGroupTable.studentId, studentId)).limit(1);
        return rows.length > 0;
    },
    async findByGroupId(groupId) {
        const result = await db.select().from(studentGroupTable).where(eq(studentGroupTable.groupId, groupId));
        return result.map(rowToStudentGroup);
    },
    async existsByGroupId(groupId) {
        const rows = await db.select({ id: studentGroupTable.id }).from(studentGroupTable).where(eq(studentGroupTable.groupId, groupId)).limit(1);
        return rows.length > 0;
    },
    async findByStudentAndGroup(studentId, groupId) {
        const result = await db
            .select()
            .from(studentGroupTable)
            .where(and(eq(studentGroupTable.studentId, studentId), eq(studentGroupTable.groupId, groupId)))
            .limit(1);
        return result[0] ? rowToStudentGroup(result[0]) : undefined;
    },
    async save(studentGroup) {
        await db
            .insert(studentGroupTable)
            .values({
                id: studentGroup.id,
                studentId: studentGroup.studentId,
                groupId: studentGroup.groupId,
            })
            .onConflictDoUpdate({
                target: studentGroupTable.id,
                set: {
                    studentId: studentGroup.studentId,
                    groupId: studentGroup.groupId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(studentGroupTable).where(eq(studentGroupTable.id, id));
    },
    async deleteByGroupId(groupId) {
        await db.delete(studentGroupTable).where(eq(studentGroupTable.groupId, groupId));
    },
};
