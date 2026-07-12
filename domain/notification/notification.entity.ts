import { type NotificationType } from "@domain/notification/notification.enums";

export type Notification = {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    entityName: string | null;
    entityId: string | null;
    isRead: boolean;
    createdAt: Date;
};
