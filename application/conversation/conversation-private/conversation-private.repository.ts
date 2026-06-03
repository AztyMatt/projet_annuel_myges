import { type ConversationPrivate } from "@domain/conversation/conversation-private/conversation-private.entity";

export interface ConversationPrivateRepository {
    findById(id: string): Promise<ConversationPrivate | undefined>;
    findByConversationId(conversationId: string): Promise<ConversationPrivate | undefined>;
    findByAdminId(adminId: string): Promise<ConversationPrivate[]>;
    findByStudentId(studentId: string): Promise<ConversationPrivate[]>;
    save(conversationPrivate: ConversationPrivate): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<ConversationPrivate[]>;
}
