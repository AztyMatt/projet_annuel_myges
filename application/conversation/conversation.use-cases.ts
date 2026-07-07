import { randomUUID } from "node:crypto";
import { type Conversation } from "@domain/conversation/conversation.entity";
import { type ConversationPrivate } from "@domain/conversation/conversation-private/conversation-private.entity";
import { type ConversationRepository } from "@application/conversation/conversation.repository";
import { type ConversationPrivateRepository } from "@application/conversation/conversation-private/conversation-private.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type ConversationView = { id: string; createdAt: string };

export type ConversationPrivateView = {
    id: string;
    adminId: string;
    studentId: string;
    conversationId: string;
};

export type CreateConversationResult = { kind: "conversation_created"; conversation: ConversationView };

export type DeleteConversationResult = NotFound | { kind: "conversation_deleted" };

export type GetConversationResult =
    | NotFound
    | { kind: "conversation_found"; conversation: ConversationView };

export type ListConversationsResult = { kind: "conversations_listed"; conversations: ConversationView[] };

export type CreateConversationPrivateResult =
    | MissingFields
    | { kind: "conversation_already_exists" }
    | { kind: "conversation_private_created"; conversationPrivate: ConversationPrivateView };

export type DeleteConversationPrivateResult =
    | NotFound
    | { kind: "conversation_private_deleted" };

export type GetConversationPrivateResult =
    | NotFound
    | { kind: "conversation_private_found"; conversationPrivate: ConversationPrivateView };

export type ListConversationPrivatesResult = {
    kind: "conversation_privates_listed";
    conversationPrivates: ConversationPrivateView[];
};

const toConversationView = (c: Conversation): ConversationView => ({
    id: c.id,
    createdAt: c.createdAt.toISOString(),
});

const toConversationPrivateView = (c: ConversationPrivate): ConversationPrivateView => ({
    id: c.id,
    adminId: c.adminId,
    studentId: c.studentId,
    conversationId: c.conversationId,
});

export class ConversationUseCases {
    constructor(
        private readonly conversations: ConversationRepository,
        private readonly conversationPrivates: ConversationPrivateRepository,
    ) {}

    async create(): Promise<CreateConversationResult> {
        const conversation: Conversation = { id: randomUUID(), createdAt: new Date() };
        await this.conversations.save(conversation);
        return { kind: "conversation_created", conversation: toConversationView(conversation) };
    }

    async delete(id: string): Promise<DeleteConversationResult> {
        const conversation = await this.conversations.findById(id);
        if (!conversation) return NotFound;
        await this.conversations.deleteById(id);
        return { kind: "conversation_deleted" };
    }

    async list(): Promise<ListConversationsResult> {
        const conversations = await this.conversations.list();
        return { kind: "conversations_listed", conversations: conversations.map(toConversationView) };
    }

    async findById(id: string): Promise<GetConversationResult> {
        const conversation = await this.conversations.findById(id);
        if (!conversation) return NotFound;
        return { kind: "conversation_found", conversation: toConversationView(conversation) };
    }

    async createPrivate(input: {
        adminId?: string;
        studentId?: string;
        conversationId?: string;
    }): Promise<CreateConversationPrivateResult> {
        const { adminId, studentId, conversationId } = input;
        if (!adminId || !studentId || !conversationId) return MissingFields;
        if (await this.conversationPrivates.findByAdminAndStudent(adminId, studentId)) return { kind: "conversation_already_exists" };
        const entry: ConversationPrivate = { id: randomUUID(), adminId, studentId, conversationId };
        await this.conversationPrivates.save(entry);
        return { kind: "conversation_private_created", conversationPrivate: toConversationPrivateView(entry) };
    }

    async deletePrivate(id: string): Promise<DeleteConversationPrivateResult> {
        const entry = await this.conversationPrivates.findById(id);
        if (!entry) return NotFound;
        await this.conversationPrivates.deleteById(id);
        return { kind: "conversation_private_deleted" };
    }

    async findPrivateById(id: string): Promise<GetConversationPrivateResult> {
        const entry = await this.conversationPrivates.findById(id);
        if (!entry) return NotFound;
        return { kind: "conversation_private_found", conversationPrivate: toConversationPrivateView(entry) };
    }

    async findPrivateByConversation(conversationId: string): Promise<GetConversationPrivateResult> {
        const entry = await this.conversationPrivates.findByConversationId(conversationId);
        if (!entry) return NotFound;
        return { kind: "conversation_private_found", conversationPrivate: toConversationPrivateView(entry) };
    }

    async listPrivates(): Promise<ListConversationPrivatesResult> {
        const entries = await this.conversationPrivates.list();
        return {
            kind: "conversation_privates_listed",
            conversationPrivates: entries.map(toConversationPrivateView),
        };
    }

    async listPrivatesByAdmin(adminId: string): Promise<ListConversationPrivatesResult> {
        const entries = await this.conversationPrivates.findByAdminId(adminId);
        return {
            kind: "conversation_privates_listed",
            conversationPrivates: entries.map(toConversationPrivateView),
        };
    }

    async listPrivatesByStudent(studentId: string): Promise<ListConversationPrivatesResult> {
        const entries = await this.conversationPrivates.findByStudentId(studentId);
        return {
            kind: "conversation_privates_listed",
            conversationPrivates: entries.map(toConversationPrivateView),
        };
    }
}
