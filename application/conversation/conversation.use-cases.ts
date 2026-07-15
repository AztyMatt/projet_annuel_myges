import { randomUUID } from "node:crypto";
import { type Conversation } from "@domain/conversation/conversation.entity";
import { GENERAL_GROUP_NAME } from "@domain/group/group.entity";
import { type ConversationPrivate } from "@domain/conversation/conversation-private/conversation-private.entity";
import { type Message } from "@domain/message/message.entity";
import { type ConversationRepository } from "@application/conversation/conversation.repository";
import { type ConversationPrivateRepository } from "@application/conversation/conversation-private/conversation-private.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type ClassRepository } from "@application/class/class.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type GroupRepository } from "@application/group/group.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type ModuleRepository } from "@application/module/module.repository";
import { type MessageRepository } from "@application/message/message.repository";
import { type MessageReadRepository } from "@application/message/message-read/message-read.repository";
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

export type ConversationKind = "class" | "course" | "private";

export type ConversationSummaryView = {
    conversationId: string;
    kind: ConversationKind;
    title: string;
    subtitle: string;
    lastMessage: { content: string; senderId: string; createdAt: string } | null;
    unreadCount: number;
};

export type ListMineConversationsResult = { kind: "conversations_listed_mine"; conversations: ConversationSummaryView[] };

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
        private readonly studentGroups: StudentGroupRepository,
        private readonly modules: ModuleRepository,
        private readonly messages: MessageRepository,
        private readonly messageReads: MessageReadRepository,
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

    /**
     * Agrégat serveur des conversations de l'utilisateur (classe, cours, privées) avec dernier
     * message et compteur de non-lus — remplace la cascade d'appels que le front devait faire
     * lui-même (students/me → student-groups → groups → classes/courses → modules...). Voir
     * CLAUDE.md / PROJECT_AUDIT_AND_ROADMAP.md (API-001).
     */
    async listMine(auth: AuthContext): Promise<ListMineConversationsResult> {
        type Item = { conversationId: string; kind: ConversationKind; title: string; subtitle: string };
        const items: Item[] = [];

        const student = await this.students.findByUserId(auth.requesterId);
        if (student) {
            const studentGroups = await this.studentGroups.findByStudentId(student.id);
            const seenClassIds = new Set<string>();
            for (const sg of studentGroups) {
                const group = await this.groups.findById(sg.groupId);
                if (!group) continue;
                if (!seenClassIds.has(group.classId)) {
                    seenClassIds.add(group.classId);
                    const klass = await this.classes.findById(group.classId);
                    if (klass) {
                        items.push({ conversationId: klass.conversationId, kind: "class", title: `Classe ${klass.number}`, subtitle: "Groupe de classe" });
                    }
                }
                const courses = await this.courses.findByGroupId(sg.groupId);
                for (const course of courses) {
                    const courseModule = await this.modules.findById(course.moduleId);
                    items.push({
                        conversationId: course.conversationId,
                        kind: "course",
                        title: courseModule?.name ?? "Cours",
                        subtitle: "Cours avec l'intervenant",
                    });
                }
            }
        } else {
            const instructor = await this.instructors.findByUserId(auth.requesterId);
            if (instructor) {
                const courses = await this.courses.findByInstructorId(instructor.id);
                for (const course of courses) {
                    const courseModule = await this.modules.findById(course.moduleId);
                    items.push({
                        conversationId: course.conversationId,
                        kind: "course",
                        title: courseModule?.name ?? "Cours",
                        subtitle: "Cours",
                    });
                }
            }
        }

        const privates = await this.conversationPrivates.findByUserId(auth.requesterId);
        for (const priv of privates) {
            const otherUserId = priv.userAId === auth.requesterId ? priv.userBId : priv.userAId;
            const otherUser = otherUserId ? await this.users.findById(otherUserId) : undefined;
            items.push({
                conversationId: priv.conversationId,
                kind: "private",
                title: otherUser ? `${otherUser.firstname} ${otherUser.lastname}` : "Conversation privée",
                subtitle: "Message privé",
            });
        }

        const readMessageIds = new Set((await this.messageReads.findByUserId(auth.requesterId)).map((r) => r.messageId));
        const summaries: ConversationSummaryView[] = await Promise.all(
            items.map(async (item) => {
                const messages = await this.messages.findByConversationId(item.conversationId);
                const last = messages.reduce<Message | null>((latest, m) => (!latest || m.createdAt > latest.createdAt ? m : latest), null);
                const unreadCount = messages.filter((m) => m.senderId !== auth.requesterId && !readMessageIds.has(m.id)).length;
                return {
                    ...item,
                    lastMessage: last ? { content: last.content, senderId: last.senderId, createdAt: last.createdAt.toISOString() } : null,
                    unreadCount,
                };
            }),
        );

        summaries.sort((a, b) => {
            const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
            const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
            return bTime - aTime;
        });

        return { kind: "conversations_listed_mine", conversations: summaries };
    }
}
