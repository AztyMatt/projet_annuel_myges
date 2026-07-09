import { type MessageRead } from "@domain/message/message-read/message-read.entity";

export interface MessageReadRepository {
    findByMessageIdAndUserId(messageId: string, userId: string): Promise<MessageRead | undefined>;
    findByMessageId(messageId: string): Promise<MessageRead[]>;
    findByUserId(userId: string): Promise<MessageRead[]>;
    existsByUserId(userId: string): Promise<boolean>;
    save(messageRead: MessageRead): Promise<void>;
    deleteByMessageIdAndUserId(messageId: string, userId: string): Promise<void>;
}
