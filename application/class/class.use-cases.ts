import { randomUUID } from "node:crypto";
import { type Class } from "@domain/class/class.entity";
import { type Conversation } from "@domain/conversation/conversation.entity";
import { type Group, GENERAL_GROUP_NAME } from "@domain/group/group.entity";
import { type ClassRepository } from "@application/class/class.repository";
import { type GroupRepository } from "@application/group/group.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type ConversationRepository } from "@application/conversation/conversation.repository";
import { type UnitOfWork } from "@application/types/unit-of-work";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";

export type ClassView = {
    id: string;
    number: number;
    programId: string;
    size: number;
    conversationId: string;
};

export type CreateClassResult = MissingFields | Forbidden | { kind: "class_number_already_exists" } | { kind: "class_created"; class: ClassView };

export type UpdateClassResult =
    | NotFound
    | Forbidden
    | { kind: "class_updated"; class: ClassView };

export type DeleteClassResult =
    | NotFound
    | Forbidden
    | { kind: "class_has_groups_with_courses" }
    | { kind: "class_deleted" };

export type GetClassResult = NotFound | { kind: "class_found"; class: ClassView };

export type ListClassesResult = { kind: "classes_listed"; classes: ClassView[] };

const toView = (c: Class): ClassView => ({
    id: c.id,
    number: c.number,
    programId: c.programId,
    size: c.size,
    conversationId: c.conversationId,
});

export class ClassUseCases {
    constructor(
        private readonly classes: ClassRepository,
        private readonly groups: GroupRepository,
        private readonly studentGroups: StudentGroupRepository,
        private readonly courses: CourseRepository,
        private readonly conversations: ConversationRepository,
        private readonly unitOfWork: UnitOfWork,
    ) {}

    async create(input: {
        number?: number;
        programId?: string;
        size?: number;
    }, auth: AuthContext): Promise<CreateClassResult> {
        if (!auth.isAdmin) return Forbidden;
        const { number, programId, size } = input;
        if (number === undefined || !programId || size === undefined)
            return MissingFields;
        if (await this.classes.findByProgramAndNumber(programId, number)) return { kind: "class_number_already_exists" };
        const conversation: Conversation = { id: randomUUID(), createdAt: new Date() };
        const cls: Class = { id: randomUUID(), number, programId, size, conversationId: conversation.id };
        const generalGroup: Group = { id: randomUUID(), classId: cls.id, name: GENERAL_GROUP_NAME };
        await this.unitOfWork.run(async () => {
            await this.conversations.save(conversation);
            await this.classes.save(cls);
            await this.groups.save(generalGroup);
        });
        return { kind: "class_created", class: toView(cls) };
    }

    async update(
        id: string,
        input: { number?: number; programId?: string; size?: number },
        auth: AuthContext,
    ): Promise<UpdateClassResult> {
        if (!auth.isAdmin) return Forbidden;
        const cls = await this.classes.findById(id);
        if (!cls) return NotFound;
        if (input.number !== undefined) cls.number = input.number;
        if (input.programId !== undefined) cls.programId = input.programId;
        if (input.size !== undefined) cls.size = input.size;
        await this.classes.save(cls);
        return { kind: "class_updated", class: toView(cls) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteClassResult> {
        if (!auth.isAdmin) return Forbidden;
        const cls = await this.classes.findById(id);
        if (!cls) return NotFound;
        const groups = await this.groups.findByClassId(id);
        for (const group of groups) {
            if (await this.courses.existsByGroupId(group.id)) return { kind: "class_has_groups_with_courses" };
        }
        await this.unitOfWork.run(async () => {
            for (const group of groups) {
                await this.studentGroups.deleteByGroupId(group.id);
                await this.groups.deleteById(group.id);
            }
            await this.classes.deleteById(id);
            await this.conversations.deleteById(cls.conversationId);
        });
        return { kind: "class_deleted" };
    }

    async list(): Promise<ListClassesResult> {
        const classes = await this.classes.list();
        return { kind: "classes_listed", classes: classes.map(toView) };
    }

    async listByProgram(programId: string): Promise<ListClassesResult> {
        const classes = await this.classes.findByProgramId(programId);
        return { kind: "classes_listed", classes: classes.map(toView) };
    }

    async findById(id: string): Promise<GetClassResult> {
        const cls = await this.classes.findById(id);
        if (!cls) return NotFound;
        return { kind: "class_found", class: toView(cls) };
    }
}
