import { randomUUID } from "node:crypto";
import { type Message } from "@domain/message/message.entity";
import { type MessageRead } from "@domain/message/message-read/message-read.entity";
import { type MessageRepository } from "@application/message/message.repository";
import { type MessageReadRepository } from "@application/message/message-read/message-read.repository";
import { type ConversationPrivateRepository } from "@application/conversation/conversation-private/conversation-private.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";

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

export type SendMessageResult = MissingFields | Forbidden | { kind: "message_sent"; message: MessageView };

export type DeleteMessageResult = NotFound | Forbidden | { kind: "message_deleted" };

export type GetMessageResult = NotFound | { kind: "message_found"; message: MessageView };

export type ListMessagesResult = { kind: "messages_listed"; messages: MessageView[] };

export type MarkAsReadResult =
    | MissingFields
    | NotFound
    | Forbidden
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
        private readonly conversationPrivates: ConversationPrivateRepository,
        private readonly courses: CourseRepository,
        private readonly studentGroups: StudentGroupRepository,
        private readonly students: StudentRepository,
        private readonly instructors: InstructorRepository,
    ) {}

    private async isParticipant(userId: string, conversationId: string): Promise<boolean> {
        const priv = await this.conversationPrivates.findByConversationId(conversationId);
        if (priv) return priv.userAId === userId || priv.userBId === userId;

        const course = await this.courses.findByConversationId(conversationId);
        if (course) {
            const instructor = await this.instructors.findByUserId(userId);
            if (instructor && instructor.id === course.instructorId) return true;
            const student = await this.students.findByUserId(userId);
            return !!student && !!(await this.studentGroups.findByStudentAndGroup(student.id, course.groupId));
        }

        return false;
    }

    async send(input: {
        conversationId?: string;
        senderId?: string;
        content?: string;
    }): Promise<SendMessageResult> {
        const { conversationId, senderId, content } = input;
        if (!conversationId || !senderId || !content) return MissingFields;
        if (!(await this.isParticipant(senderId, conversationId))) return Forbidden;
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

    async findById(id: string, auth: AuthContext): Promise<GetMessageResult> {
        const message = await this.messages.findById(id);
        if (!message) return NotFound;
        if (!(await this.isParticipant(auth.requesterId, message.conversationId))) return NotFound;
        return { kind: "message_found", message: toMessageView(message) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteMessageResult> {
        const message = await this.messages.findById(id);
        if (!message) return NotFound;
        if (!auth.isAdmin && message.senderId !== auth.requesterId) return Forbidden;
        await this.messages.deleteById(id);
        return { kind: "message_deleted" };
    }

    async listByConversation(conversationId: string, auth: AuthContext): Promise<NotFound | ListMessagesResult> {
        if (!(await this.isParticipant(auth.requesterId, conversationId))) return NotFound;
        const messages = await this.messages.findByConversationId(conversationId);
        return { kind: "messages_listed", messages: messages.map(toMessageView) };
    }

    async listBySender(senderId: string, auth: AuthContext): Promise<NotFound | ListMessagesResult> {
        if (senderId !== auth.requesterId) return NotFound;
        const messages = await this.messages.findBySenderId(senderId);
        return { kind: "messages_listed", messages: messages.map(toMessageView) };
    }

    async markAsRead(input: { messageId?: string }, auth: AuthContext): Promise<MarkAsReadResult> {
        const { messageId } = input;
        if (!messageId) return MissingFields;
        const message = await this.messages.findById(messageId);
        if (!message) return NotFound;
        if (!(await this.isParticipant(auth.requesterId, message.conversationId))) return Forbidden;
        const existing = await this.messageReads.findByMessageIdAndUserId(messageId, auth.requesterId);
        if (existing) return { kind: "message_marked_as_read", messageRead: toMessageReadView(existing) };
        const entry: MessageRead = { id: randomUUID(), messageId, userId: auth.requesterId, readAt: new Date() };
        await this.messageReads.save(entry);
        return { kind: "message_marked_as_read", messageRead: toMessageReadView(entry) };
    }

    async markAsUnread(input: { messageId?: string }, auth: AuthContext): Promise<MarkAsUnreadResult> {
        const { messageId } = input;
        if (!messageId) return MissingFields;
        const entry = await this.messageReads.findByMessageIdAndUserId(messageId, auth.requesterId);
        if (!entry) return NotFound;
        await this.messageReads.deleteByMessageIdAndUserId(messageId, auth.requesterId);
        return { kind: "message_marked_as_unread" };
    }

    async listReadsByMessage(messageId: string, auth: AuthContext): Promise<NotFound | ListMessageReadsResult> {
        const message = await this.messages.findById(messageId);
        if (!message) return NotFound;
        if (!(await this.isParticipant(auth.requesterId, message.conversationId))) return NotFound;
        const entries = await this.messageReads.findByMessageId(messageId);
        return { kind: "message_reads_listed", messageReads: entries.map(toMessageReadView) };
    }

    async listReadsByUser(userId: string, auth: AuthContext): Promise<NotFound | ListMessageReadsResult> {
        if (userId !== auth.requesterId) return NotFound;
        const entries = await this.messageReads.findByUserId(userId);
        return { kind: "message_reads_listed", messageReads: entries.map(toMessageReadView) };
    }
}
