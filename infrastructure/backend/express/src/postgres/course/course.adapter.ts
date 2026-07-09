import { and, eq } from "drizzle-orm";
import { type CourseRepository } from "@application/course/course.repository";
import { type Course } from "@domain/course/course.entity";
import { db } from "@express/src/postgres/db";
import { course as courseTable } from "@express/src/postgres/schema/course";

function rowToCourse(row: typeof courseTable.$inferSelect): Course {
    return {
        id: row.id,
        instructorId: row.instructorId,
        moduleId: row.moduleId,
        groupId: row.groupId,
        blocId: row.blocId,
        conversationId: row.conversationId,
    };
}

export const courseRepository: CourseRepository = {
    async findById(id) {
        const result = await db.select().from(courseTable).where(eq(courseTable.id, id)).limit(1);
        return result[0] ? rowToCourse(result[0]) : undefined;
    },
    async findByInstructorId(instructorId) {
        const result = await db.select().from(courseTable).where(eq(courseTable.instructorId, instructorId));
        return result.map(rowToCourse);
    },
    async existsByInstructorId(instructorId) {
        const rows = await db.select({ id: courseTable.id }).from(courseTable).where(eq(courseTable.instructorId, instructorId)).limit(1);
        return rows.length > 0;
    },
    async findByModuleId(moduleId) {
        const result = await db.select().from(courseTable).where(eq(courseTable.moduleId, moduleId));
        return result.map(rowToCourse);
    },
    async existsByModuleId(moduleId) {
        const rows = await db.select({ id: courseTable.id }).from(courseTable).where(eq(courseTable.moduleId, moduleId)).limit(1);
        return rows.length > 0;
    },
    async findByGroupId(groupId) {
        const result = await db.select().from(courseTable).where(eq(courseTable.groupId, groupId));
        return result.map(rowToCourse);
    },
    async existsByGroupId(groupId) {
        const rows = await db.select({ id: courseTable.id }).from(courseTable).where(eq(courseTable.groupId, groupId)).limit(1);
        return rows.length > 0;
    },
    async findByBlocId(blocId) {
        const result = await db.select().from(courseTable).where(eq(courseTable.blocId, blocId));
        return result.map(rowToCourse);
    },
    async existsByBlocId(blocId) {
        const rows = await db.select({ id: courseTable.id }).from(courseTable).where(eq(courseTable.blocId, blocId)).limit(1);
        return rows.length > 0;
    },
    async findByConversationId(conversationId) {
        const result = await db.select().from(courseTable).where(eq(courseTable.conversationId, conversationId)).limit(1);
        return result[0] ? rowToCourse(result[0]) : undefined;
    },
    async findByInstructorModuleGroup(instructorId, moduleId, groupId) {
        const result = await db
            .select()
            .from(courseTable)
            .where(
                and(
                    eq(courseTable.instructorId, instructorId),
                    eq(courseTable.moduleId, moduleId),
                    eq(courseTable.groupId, groupId),
                ),
            )
            .limit(1);
        return result[0] ? rowToCourse(result[0]) : undefined;
    },
    async save(course) {
        await db
            .insert(courseTable)
            .values({
                id: course.id,
                instructorId: course.instructorId,
                moduleId: course.moduleId,
                groupId: course.groupId,
                blocId: course.blocId,
                conversationId: course.conversationId,
            })
            .onConflictDoUpdate({
                target: courseTable.id,
                set: {
                    instructorId: course.instructorId,
                    moduleId: course.moduleId,
                    groupId: course.groupId,
                    blocId: course.blocId,
                    conversationId: course.conversationId,
                },
            });
    },
    async deleteById(id) {
        await db.delete(courseTable).where(eq(courseTable.id, id));
    },
    async list() {
        const result = await db.select().from(courseTable);
        return result.map(rowToCourse);
    },
};
