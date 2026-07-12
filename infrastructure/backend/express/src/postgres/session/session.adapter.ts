import { and, asc, eq, gt, lt, ne } from "drizzle-orm";
import { type SessionRepository } from "@application/session/session.repository";
import { type Session } from "@domain/session/session.entity";
import { type SessionMode } from "@domain/session/session.enums";
import { db } from "@express/src/postgres/db";
import { session as sessionTable } from "@express/src/postgres/schema/session";
import { course as courseTable } from "@express/src/postgres/schema/course";

function rowToSession(row: typeof sessionTable.$inferSelect): Session {
    return {
        id: row.id,
        courseId: row.courseId,
        startTime: row.startTime,
        endTime: row.endTime,
        mode: row.mode as SessionMode,
        classroomId: row.classroomId,
    };
}

export const sessionRepository: SessionRepository = {
    async findById(id) {
        const result = await db.select().from(sessionTable).where(eq(sessionTable.id, id)).limit(1);
        return result[0] ? rowToSession(result[0]) : undefined;
    },
    async findByCourseId(courseId) {
        const result = await db
            .select()
            .from(sessionTable)
            .where(eq(sessionTable.courseId, courseId))
            .orderBy(asc(sessionTable.startTime));
        return result.map(rowToSession);
    },
    async existsByCourseId(courseId) {
        const rows = await db.select({ id: sessionTable.id }).from(sessionTable).where(eq(sessionTable.courseId, courseId)).limit(1);
        return rows.length > 0;
    },
    async findByClassroomId(classroomId) {
        const result = await db
            .select()
            .from(sessionTable)
            .where(eq(sessionTable.classroomId, classroomId))
            .orderBy(asc(sessionTable.startTime));
        return result.map(rowToSession);
    },
    async existsByClassroomId(classroomId) {
        const rows = await db.select({ id: sessionTable.id }).from(sessionTable).where(eq(sessionTable.classroomId, classroomId)).limit(1);
        return rows.length > 0;
    },
    async findClassroomOverlap(classroomId, startTime, endTime, excludeId) {
        const conditions = [
            eq(sessionTable.classroomId, classroomId),
            lt(sessionTable.startTime, endTime),
            gt(sessionTable.endTime, startTime),
        ];
        if (excludeId) conditions.push(ne(sessionTable.id, excludeId));
        const result = await db.select().from(sessionTable).where(and(...conditions)).limit(1);
        return result[0] ? rowToSession(result[0]) : undefined;
    },
    async findInstructorOverlap(instructorId, startTime, endTime, excludeId) {
        const conditions = [
            eq(courseTable.instructorId, instructorId),
            lt(sessionTable.startTime, endTime),
            gt(sessionTable.endTime, startTime),
        ];
        if (excludeId) conditions.push(ne(sessionTable.id, excludeId));
        const result = await db
            .select({
                id: sessionTable.id,
                courseId: sessionTable.courseId,
                startTime: sessionTable.startTime,
                endTime: sessionTable.endTime,
                mode: sessionTable.mode,
                classroomId: sessionTable.classroomId,
            })
            .from(sessionTable)
            .innerJoin(courseTable, eq(sessionTable.courseId, courseTable.id))
            .where(and(...conditions))
            .limit(1);
        return result[0] ? rowToSession(result[0]) : undefined;
    },
    async save(session) {
        await db
            .insert(sessionTable)
            .values({
                id: session.id,
                courseId: session.courseId,
                startTime: session.startTime,
                endTime: session.endTime,
                mode: session.mode,
                classroomId: session.classroomId,
            })
            .onConflictDoUpdate({
                target: sessionTable.id,
                set: {
                    courseId: session.courseId,
                    startTime: session.startTime,
                    endTime: session.endTime,
                    mode: session.mode,
                    classroomId: session.classroomId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(sessionTable).where(eq(sessionTable.id, id));
    },
    async list() {
        const result = await db.select().from(sessionTable).orderBy(asc(sessionTable.startTime));
        return result.map(rowToSession);
    },
};
