import { type Message } from "@domain/message/message.entity";

export interface MessageRepository {
    findById(id: string): Promise<Message | undefined>;
    findByConversationId(conversationId: string): Promise<Message[]>;
    findBySenderId(senderId: string): Promise<Message[]>;
    save(message: Message): Promise<void>;
    deleteById(id: string): Promise<void>;
}
