import { and, desc, eq } from "drizzle-orm";
import { type NotificationRepository } from "@application/notification/notification.repository";
import { type Notification } from "@domain/notification/notification.entity";
import { NotificationType } from "@domain/notification/notification.enums";
import { assertEnum } from "@express/src/postgres/assert-enum";
import { db } from "@express/src/postgres/db";
import { notification as notificationTable } from "@express/src/postgres/schema/notification";

function rowToNotification(row: typeof notificationTable.$inferSelect): Notification {
    return {
        id: row.id,
        userId: row.userId,
        type: assertEnum(row.type, NotificationType),
        title: row.title,
        body: row.body,
        entityName: row.entityName,
        entityId: row.entityId,
        isRead: row.isRead,
        createdAt: row.createdAt,
    };
}

export const notificationRepository: NotificationRepository = {
    async findById(id) {
        const result = await db.select().from(notificationTable).where(eq(notificationTable.id, id)).limit(1);
        return result[0] ? rowToNotification(result[0]) : undefined;
    },
    async findByUserId(userId, limit) {
        const result = await db
            .select()
            .from(notificationTable)
            .where(eq(notificationTable.userId, userId))
            .orderBy(desc(notificationTable.createdAt))
            .limit(limit);
        return result.map(rowToNotification);
    },
    async countUnreadByUserId(userId) {
        const rows = await db
            .select({ id: notificationTable.id })
            .from(notificationTable)
            .where(and(eq(notificationTable.userId, userId), eq(notificationTable.isRead, false)));
        return rows.length;
    },
    async save(notificationEntry) {
        await db
            .insert(notificationTable)
            .values({
                id: notificationEntry.id,
                userId: notificationEntry.userId,
                type: notificationEntry.type,
                title: notificationEntry.title,
                body: notificationEntry.body,
                entityName: notificationEntry.entityName,
                entityId: notificationEntry.entityId,
                isRead: notificationEntry.isRead,
                createdAt: notificationEntry.createdAt,
            })
            .onConflictDoUpdate({
                target: notificationTable.id,
                set: {
                    isRead: notificationEntry.isRead,
                },
            });
    },
    async markAsRead(id) {
        await db.update(notificationTable).set({ isRead: true }).where(eq(notificationTable.id, id));
    },
    async markAllAsReadByUserId(userId) {
        await db
            .update(notificationTable)
            .set({ isRead: true })
            .where(and(eq(notificationTable.userId, userId), eq(notificationTable.isRead, false)));
    },
};
