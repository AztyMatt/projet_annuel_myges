import { type Notification } from "@domain/notification/notification.entity";

export interface NotificationRepository {
    findById(id: string): Promise<Notification | undefined>;
    findByUserId(userId: string, limit: number): Promise<Notification[]>;
    countUnreadByUserId(userId: string): Promise<number>;
    save(notification: Notification): Promise<void>;
    markAsRead(id: string): Promise<void>;
    markAllAsReadByUserId(userId: string): Promise<void>;
}
