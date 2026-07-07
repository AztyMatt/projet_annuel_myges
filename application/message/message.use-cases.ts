import { randomUUID } from "node:crypto";
import { type Message } from "@domain/message/message.entity";
import { type MessageRead } from "@domain/message/message-read/message-read.entity";
import { type MessageRepository } from "@application/message/message.repository";
import { type MessageReadRepository } from "@application/message/message-read/message-read.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type MessageView = {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string;
};

export type MessageReadView = {
    id: string;
    messageId: string;
    userId: string;
    readAt: string;
};

export type SendMessageResult = MissingFields | { kind: "message_sent"; message: MessageView };

export type DeleteMessageResult = NotFound | { kind: "message_deleted" };

export type GetMessageResult = NotFound | { kind: "message_found"; message: MessageView };

export type ListMessagesResult = { kind: "messages_listed"; messages: MessageView[] };

export type MarkAsReadResult =
    | MissingFields
    | { kind: "message_marked_as_read"; messageRead: MessageReadView };

export type MarkAsUnreadResult =
    | MissingFields
    | NotFound
    | { kind: "message_marked_as_unread" };

export type ListMessageReadsResult = { kind: "message_reads_listed"; messageReads: MessageReadView[] };

const toMessageView = (m: Message): MessageView => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
});

const toMessageReadView = (m: MessageRead): MessageReadView => ({
    id: m.id,
    messageId: m.messageId,
    userId: m.userId,
    readAt: m.readAt.toISOString(),
});

export class MessageUseCases {
    constructor(
        private readonly messages: MessageRepository,
        private readonly messageReads: MessageReadRepository,
    ) {}

    async send(input: {
        conversationId?: string;
        senderId?: string;
        content?: string;
    }): Promise<SendMessageResult> {
        const { conversationId, senderId, content } = input;
        if (!conversationId || !senderId || !content) return MissingFields;
        const message: Message = {
            id: randomUUID(),
            conversationId,
            senderId,
            content,
            createdAt: new Date(),
        };
        await this.messages.save(message);
        return { kind: "message_sent", message: toMessageView(message) };
    }

    async findById(id: string): Promise<GetMessageResult> {
        const message = await this.messages.findById(id);
        if (!message) return NotFound;
        return { kind: "message_found", message: toMessageView(message) };
    }

    async delete(id: string): Promise<DeleteMessageResult> {
        const message = await this.messages.findById(id);
        if (!message) return NotFound;
        await this.messages.deleteById(id);
        return { kind: "message_deleted" };
    }

    async listByConversation(conversationId: string): Promise<ListMessagesResult> {
        const messages = await this.messages.findByConversationId(conversationId);
        return { kind: "messages_listed", messages: messages.map(toMessageView) };
    }

    async listBySender(senderId: string): Promise<ListMessagesResult> {
        const messages = await this.messages.findBySenderId(senderId);
        return { kind: "messages_listed", messages: messages.map(toMessageView) };
    }

    async markAsRead(input: { messageId?: string; userId?: string }): Promise<MarkAsReadResult> {
        const { messageId, userId } = input;
        if (!messageId || !userId) return MissingFields;
        const entry: MessageRead = { id: randomUUID(), messageId, userId, readAt: new Date() };
        await this.messageReads.save(entry);
        return { kind: "message_marked_as_read", messageRead: toMessageReadView(entry) };
    }

    async markAsUnread(input: { messageId?: string; userId?: string }): Promise<MarkAsUnreadResult> {
        const { messageId, userId } = input;
        if (!messageId || !userId) return MissingFields;
        const entry = await this.messageReads.findByMessageIdAndUserId(messageId, userId);
        if (!entry) return NotFound;
        await this.messageReads.deleteByMessageIdAndUserId(messageId, userId);
        return { kind: "message_marked_as_unread" };
    }

    async listReadsByMessage(messageId: string): Promise<ListMessageReadsResult> {
        const entries = await this.messageReads.findByMessageId(messageId);
        return { kind: "message_reads_listed", messageReads: entries.map(toMessageReadView) };
    }

    async listReadsByUser(userId: string): Promise<ListMessageReadsResult> {
        const entries = await this.messageReads.findByUserId(userId);
        return { kind: "message_reads_listed", messageReads: entries.map(toMessageReadView) };
    }
}
