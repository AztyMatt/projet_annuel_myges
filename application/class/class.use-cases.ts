import { randomUUID } from "node:crypto";
import { type Class } from "@domain/class/class.entity";
import { type ClassRepository } from "@application/class/class.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type ClassView = {
    id: string;
    number: number;
    programId: string;
    size: number;
    conversationId: string;
};

export type CreateClassResult = MissingFields | { kind: "class_created"; class: ClassView };

export type UpdateClassResult =
    | NotFound
    | { kind: "class_updated"; class: ClassView };

export type DeleteClassResult = NotFound | { kind: "class_deleted" };

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
    constructor(private readonly classes: ClassRepository) {}

    async create(input: {
        number?: number;
        programId?: string;
        size?: number;
        conversationId?: string;
    }): Promise<CreateClassResult> {
        const { number, programId, size, conversationId } = input;
        if (number === undefined || !programId || size === undefined || !conversationId)
            return MissingFields;
        const cls: Class = { id: randomUUID(), number, programId, size, conversationId };
        await this.classes.save(cls);
        return { kind: "class_created", class: toView(cls) };
    }

    async update(
        id: string,
        input: { number?: number; programId?: string; size?: number; conversationId?: string },
    ): Promise<UpdateClassResult> {
        const cls = await this.classes.findById(id);
        if (!cls) return NotFound;
        if (input.number !== undefined) cls.number = input.number;
        if (input.programId !== undefined) cls.programId = input.programId;
        if (input.size !== undefined) cls.size = input.size;
        if (input.conversationId !== undefined) cls.conversationId = input.conversationId;
        await this.classes.save(cls);
        return { kind: "class_updated", class: toView(cls) };
    }

    async delete(id: string): Promise<DeleteClassResult> {
        const cls = await this.classes.findById(id);
        if (!cls) return NotFound;
        await this.classes.deleteById(id);
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
