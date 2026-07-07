import { randomUUID } from "node:crypto";
import { type Instructor } from "@domain/instructor/instructor.entity";
import { type InstructorContractType } from "@domain/instructor/instructor.enums";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type InstructorView = {
    id: string;
    userId: string;
    contractType: InstructorContractType;
    specialties: string[] | null;
};

export type CreateInstructorResult =
    | MissingFields
    | { kind: "user_already_instructor" }
    | { kind: "instructor_created"; instructor: InstructorView };

export type UpdateInstructorResult =
    | NotFound
    | { kind: "instructor_updated"; instructor: InstructorView };

export type DeleteInstructorResult = NotFound | { kind: "instructor_deleted" };

export type GetInstructorResult = NotFound | { kind: "instructor_found"; instructor: InstructorView };

export type ListInstructorsResult = { kind: "instructors_listed"; instructors: InstructorView[] };

const toView = (i: Instructor): InstructorView => ({
    id: i.id,
    userId: i.userId,
    contractType: i.contractType,
    specialties: i.specialties,
});

export class InstructorUseCases {
    constructor(private readonly instructors: InstructorRepository) {}

    async create(input: {
        userId?: string;
        contractType?: InstructorContractType;
        specialties?: string[];
    }): Promise<CreateInstructorResult> {
        const { userId, contractType, specialties } = input;
        if (!userId || !contractType) return MissingFields;
        if (await this.instructors.findByUserId(userId)) return { kind: "user_already_instructor" };
        const instructor: Instructor = {
            id: randomUUID(),
            userId,
            contractType,
            specialties: specialties ?? null,
        };
        await this.instructors.save(instructor);
        return { kind: "instructor_created", instructor: toView(instructor) };
    }

    async update(
        id: string,
        input: { contractType?: InstructorContractType; specialties?: string[] },
    ): Promise<UpdateInstructorResult> {
        const instructor = await this.instructors.findById(id);
        if (!instructor) return NotFound;
        if (input.contractType !== undefined) instructor.contractType = input.contractType;
        if (input.specialties !== undefined) instructor.specialties = input.specialties ?? null;
        await this.instructors.save(instructor);
        return { kind: "instructor_updated", instructor: toView(instructor) };
    }

    async delete(id: string): Promise<DeleteInstructorResult> {
        const instructor = await this.instructors.findById(id);
        if (!instructor) return NotFound;
        await this.instructors.deleteById(id);
        return { kind: "instructor_deleted" };
    }

    async list(): Promise<ListInstructorsResult> {
        const instructors = await this.instructors.list();
        return { kind: "instructors_listed", instructors: instructors.map(toView) };
    }

    async findById(id: string): Promise<GetInstructorResult> {
        const instructor = await this.instructors.findById(id);
        if (!instructor) return NotFound;
        return { kind: "instructor_found", instructor: toView(instructor) };
    }

    async findByUserId(userId: string): Promise<GetInstructorResult> {
        const instructor = await this.instructors.findByUserId(userId);
        if (!instructor) return NotFound;
        return { kind: "instructor_found", instructor: toView(instructor) };
    }
}
