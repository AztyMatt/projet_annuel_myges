import { randomUUID } from "node:crypto";
import { type Notification } from "@domain/notification/notification.entity";
import { type NotificationType } from "@domain/notification/notification.enums";
import { type NotificationRepository } from "@application/notification/notification.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, ForbiddenOwnership, type Forbidden } from "@application/types/results";

export type NotificationView = {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    entityName: string | null;
    entityId: string | null;
    isRead: boolean;
    createdAt: string;
};

export type ListNotificationsResult = { kind: "notifications_listed"; notifications: NotificationView[] };

export type UnreadCountResult = { kind: "unread_count"; count: number };

export type MarkAsReadResult = NotFound | Forbidden | { kind: "notification_marked_as_read" };

export type MarkAllAsReadResult = { kind: "all_notifications_marked_as_read" };

const MAX_LISTED = 30;

const toView = (n: Notification): NotificationView => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    entityName: n.entityName,
    entityId: n.entityId,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
});

export class NotificationUseCases {
    constructor(private readonly notifications: NotificationRepository) {}

    async listMine(auth: AuthContext): Promise<ListNotificationsResult> {
        const notifications = await this.notifications.findByUserId(auth.requesterId, MAX_LISTED);
        return { kind: "notifications_listed", notifications: notifications.map(toView) };
    }

    async unreadCount(auth: AuthContext): Promise<UnreadCountResult> {
        const count = await this.notifications.countUnreadByUserId(auth.requesterId);
        return { kind: "unread_count", count };
    }

    async markAsRead(id: string, auth: AuthContext): Promise<MarkAsReadResult> {
        const notification = await this.notifications.findById(id);
        if (!notification) return NotFound;
        if (notification.userId !== auth.requesterId) return ForbiddenOwnership;
        await this.notifications.markAsRead(id);
        return { kind: "notification_marked_as_read" };
    }

    async markAllAsRead(auth: AuthContext): Promise<MarkAllAsReadResult> {
        await this.notifications.markAllAsReadByUserId(auth.requesterId);
        return { kind: "all_notifications_marked_as_read" };
    }

    /**
     * Utilisé en interne par les autres use cases (note, absence, message, document) pour créer
     * une notification — pas exposé directement via une route HTTP dédiée.
     */
    async notify(input: {
        userId: string;
        type: NotificationType;
        title: string;
        body: string;
        entityName?: string;
        entityId?: string;
    }): Promise<void> {
        const notification: Notification = {
            id: randomUUID(),
            userId: input.userId,
            type: input.type,
            title: input.title,
            body: input.body,
            entityName: input.entityName ?? null,
            entityId: input.entityId ?? null,
            isRead: false,
            createdAt: new Date(),
        };
        await this.notifications.save(notification);
    }
}
