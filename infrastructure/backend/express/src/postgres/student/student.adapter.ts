import { eq, inArray } from "drizzle-orm";
import { type StudentRepository } from "@application/student/student.repository";
import { type Student } from "@domain/student/student.entity";
import { db } from "@express/src/postgres/db";
import { student as studentTable } from "@express/src/postgres/schema/student";
import { studentGroup } from "@express/src/postgres/schema/group";

function rowToStudent(row: typeof studentTable.$inferSelect): Student {
    return {
        id: row.id,
        userId: row.userId,
        programId: row.programId,
    };
}

export const studentRepository: StudentRepository = {
    async findById(id) {
        const result = await db.select().from(studentTable).where(eq(studentTable.id, id)).limit(1);
        return result[0] ? rowToStudent(result[0]) : undefined;
    },
    async findByUserId(userId) {
        const result = await db.select().from(studentTable).where(eq(studentTable.userId, userId)).limit(1);
        return result[0] ? rowToStudent(result[0]) : undefined;
    },
    async findByProgramId(programId) {
        const result = await db.select().from(studentTable).where(eq(studentTable.programId, programId));
        return result.map(rowToStudent);
    },
    async existsByProgramId(programId) {
        const rows = await db.select({ id: studentTable.id }).from(studentTable).where(eq(studentTable.programId, programId)).limit(1);
        return rows.length > 0;
    },
    async save(student) {
        await db
            .insert(studentTable)
            .values({
                id: student.id,
                userId: student.userId,
                programId: student.programId,
            })
            .onConflictDoUpdate({
                target: studentTable.id,
                set: {
                    userId: student.userId,
                    programId: student.programId,
                },
            });
    },
    async findUserIdsByGroupIds(groupIds) {
        if (groupIds.length === 0) return [];
        const rows = await db
            .selectDistinct({ userId: studentTable.userId })
            .from(studentGroup)
            .innerJoin(studentTable, eq(studentGroup.studentId, studentTable.id))
            .where(inArray(studentGroup.groupId, groupIds));
        return rows.map((row) => row.userId);
    },
    async deleteById(id) {
        await db.delete(studentTable).where(eq(studentTable.id, id));
    },
    async list() {
        const result = await db.select().from(studentTable);
        return result.map(rowToStudent);
    },
};
