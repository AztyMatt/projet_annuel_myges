import { asc, eq } from "drizzle-orm";
import { type SessionRepository } from "@application/session/session.repository";
import { type Session } from "@domain/session/session.entity";
import { type SessionMode } from "@domain/session/session.enums";
import { db } from "@express/src/postgres/db";
import { session as sessionTable } from "@express/src/postgres/schema/session";

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
    async findByClassroomId(classroomId) {
        const result = await db
            .select()
            .from(sessionTable)
            .where(eq(sessionTable.classroomId, classroomId))
            .orderBy(asc(sessionTable.startTime));
        return result.map(rowToSession);
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
