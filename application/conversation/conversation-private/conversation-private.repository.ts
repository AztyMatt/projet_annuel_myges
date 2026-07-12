import { type ConversationPrivate } from "@domain/conversation/conversation-private/conversation-private.entity";

export interface ConversationPrivateRepository {
    findById(id: string): Promise<ConversationPrivate | undefined>;
    findByConversationId(conversationId: string): Promise<ConversationPrivate | undefined>;
    findByUserId(userId: string): Promise<ConversationPrivate[]>;
    findByUsers(userAId: string, userBId: string): Promise<ConversationPrivate | undefined>;
    save(conversationPrivate: ConversationPrivate): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<ConversationPrivate[]>;
}
