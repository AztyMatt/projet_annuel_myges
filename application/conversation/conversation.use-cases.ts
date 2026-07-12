import { randomUUID } from "node:crypto";
import { type Conversation } from "@domain/conversation/conversation.entity";
import { GENERAL_GROUP_NAME } from "@domain/group/group.entity";
import { type ConversationPrivate } from "@domain/conversation/conversation-private/conversation-private.entity";
import { type ConversationRepository } from "@application/conversation/conversation.repository";
import { type ConversationPrivateRepository } from "@application/conversation/conversation-private/conversation-private.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type ClassRepository } from "@application/class/class.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type GroupRepository } from "@application/group/group.repository";
import { type UserRepository } from "@application/auth/user.repository";
import { type UnitOfWork } from "@application/types/unit-of-work";
import { NotFound, Forbidden, ForbiddenOwnership } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";

export type ConversationView = { id: string; createdAt: string };

export type ConversationPrivateView = {
    id: string;
    userAId: string | null;
    userBId: string | null;
    conversationId: string;
};

export type DeleteConversationResult = NotFound | Forbidden | { kind: "conversation_is_private" } | { kind: "conversation_in_use" } | { kind: "conversation_deleted" };

export type ConversationDetailView = { id: string; createdAt: string; participants: string[] };

export type GetConversationResult =
    | NotFound
    | { kind: "conversation_found"; conversation: ConversationDetailView };

export type ListConversationsResult = Forbidden | { kind: "conversations_listed"; conversations: ConversationView[] };

export type CreateConversationPrivateResult =
    | { kind: "same_user" }
    | NotFound
    | Forbidden
    | { kind: "conversation_already_exists" }
    | { kind: "conversation_private_created"; conversationPrivate: ConversationPrivateView };

export type DeleteConversationPrivateResult =
    | NotFound
    | Forbidden
    | { kind: "conversation_private_deleted" };

export type GetConversationPrivateResult =
    | NotFound
    | { kind: "conversation_private_found"; conversationPrivate: ConversationPrivateView };

export type ListConversationPrivatesResult = Forbidden | {
    kind: "conversation_privates_listed";
    conversationPrivates: ConversationPrivateView[];
};

const toConversationView = (c: Conversation): ConversationView => ({
    id: c.id,
    createdAt: c.createdAt.toISOString(),
});

const toConversationPrivateView = (c: ConversationPrivate): ConversationPrivateView => ({
    id: c.id,
    userAId: c.userAId,
    userBId: c.userBId,
    conversationId: c.conversationId,
});

export class ConversationUseCases {
    constructor(
        private readonly conversations: ConversationRepository,
        private readonly conversationPrivates: ConversationPrivateRepository,
        private readonly courses: CourseRepository,
        private readonly classes: ClassRepository,
        private readonly unitOfWork: UnitOfWork,
        private readonly instructors: InstructorRepository,
        private readonly students: StudentRepository,
        private readonly groups: GroupRepository,
        private readonly users: UserRepository,
    ) {}

    private async resolveParticipants(conversationId: string): Promise<string[]> {
        const priv = await this.conversationPrivates.findByConversationId(conversationId);
        if (priv) return [priv.userAId, priv.userBId].filter((x): x is string => x !== null);

        const course = await this.courses.findByConversationId(conversationId);
        if (course) {
            const instructor = await this.instructors.findById(course.instructorId);
            const studentUserIds = await this.students.findUserIdsByGroupIds([course.groupId]);
            return [...new Set([...(instructor ? [instructor.userId] : []), ...studentUserIds])];
        }

        const klass = await this.classes.findByConversationId(conversationId);
        if (klass) {
            const general = await this.groups.findByClassAndName(klass.id, GENERAL_GROUP_NAME);
            return general ? this.students.findUserIdsByGroupIds([general.id]) : [];
        }

        return [];
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteConversationResult> {
        if (!auth.isAdmin) return Forbidden;
        const conversation = await this.conversations.findById(id);
        if (!conversation) return NotFound;

        const privateConversation = await this.conversationPrivates.findByConversationId(id);
        if (privateConversation && !auth.isSuperAdmin) return { kind: "conversation_is_private" };
        const [linkedCourse, linkedClass] = await Promise.all([
            this.courses.findByConversationId(id),
            this.classes.findByConversationId(id),
        ]);
        if (linkedCourse || linkedClass) return { kind: "conversation_in_use" };
        await this.conversations.deleteById(id);
        return { kind: "conversation_deleted" };
    }

    async list(auth: AuthContext): Promise<ListConversationsResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const conversations = await this.conversations.list();
        return { kind: "conversations_listed", conversations: conversations.map(toConversationView) };
    }

    async findById(id: string, auth: AuthContext): Promise<GetConversationResult> {
        const conversation = await this.conversations.findById(id);
        if (!conversation) return NotFound;

        const participants = await this.resolveParticipants(id);
        if (!auth.isAdmin && !participants.includes(auth.requesterId)) return NotFound;
        return {
            kind: "conversation_found",
            conversation: { id: conversation.id, createdAt: conversation.createdAt.toISOString(), participants },
        };
    }

    async createPrivate(input: {
        userAId?: string;
        userBId?: string;
    }, auth: AuthContext): Promise<CreateConversationPrivateResult> {
        const { userAId, userBId } = input as { userAId: string; userBId: string };

        if (userAId === userBId) return { kind: "same_user" };
        if (auth.requesterId !== userAId && auth.requesterId !== userBId) return ForbiddenOwnership;

        const otherId = auth.requesterId === userAId ? userBId : userAId;
        if (!(await this.users.findById(otherId))) return NotFound;
        const [first, second] = [userAId, userBId].sort();
        if (await this.conversationPrivates.findByUsers(first, second)) return { kind: "conversation_already_exists" };
        const conversation: Conversation = { id: randomUUID(), createdAt: new Date() };
        const entry: ConversationPrivate = { id: randomUUID(), userAId: first, userBId: second, conversationId: conversation.id };
        await this.unitOfWork.run(async () => {
            await this.conversations.save(conversation);
            await this.conversationPrivates.save(entry);
        });
        return { kind: "conversation_private_created", conversationPrivate: toConversationPrivateView(entry) };
    }

    async deletePrivate(id: string, auth: AuthContext): Promise<DeleteConversationPrivateResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const entry = await this.conversationPrivates.findById(id);
        if (!entry) return NotFound;
        await this.conversations.deleteById(entry.conversationId);
        return { kind: "conversation_private_deleted" };
    }

    async findPrivateById(id: string, auth: AuthContext): Promise<GetConversationPrivateResult> {
        const entry = await this.conversationPrivates.findById(id);
        if (!entry) return NotFound;
        if (entry.userAId !== auth.requesterId && entry.userBId !== auth.requesterId) return NotFound;
        return { kind: "conversation_private_found", conversationPrivate: toConversationPrivateView(entry) };
    }

    async findPrivateByConversation(conversationId: string, auth: AuthContext): Promise<GetConversationPrivateResult> {
        const entry = await this.conversationPrivates.findByConversationId(conversationId);
        if (!entry) return NotFound;
        if (entry.userAId !== auth.requesterId && entry.userBId !== auth.requesterId) return NotFound;
        return { kind: "conversation_private_found", conversationPrivate: toConversationPrivateView(entry) };
    }

    async listPrivates(auth: AuthContext): Promise<ListConversationPrivatesResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const entries = await this.conversationPrivates.list();
        return {
            kind: "conversation_privates_listed",
            conversationPrivates: entries.map(toConversationPrivateView),
        };
    }

    async listMinePrivates(auth: AuthContext): Promise<ListConversationPrivatesResult> {
        const entries = await this.conversationPrivates.findByUserId(auth.requesterId);
        return {
            kind: "conversation_privates_listed",
            conversationPrivates: entries.map(toConversationPrivateView),
        };
    }
}
