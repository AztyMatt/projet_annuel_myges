import { randomUUID } from "node:crypto";
import { type Classroom } from "@domain/classroom/classroom.entity";
import { type ClassroomRepository } from "@application/classroom/classroom.repository";
import { type CampusRepository } from "@application/campus/campus.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { NotFound, Forbidden } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";

export type ClassroomView = { id: string; name: string; capacity: number; campusId: string };

export type CreateClassroomResult =
    | Forbidden
    | { kind: "campus_not_found" }
    | { kind: "classroom_already_exists" }
    | { kind: "classroom_created"; classroom: ClassroomView };

export type UpdateClassroomResult =
    | NotFound
    | Forbidden
    | { kind: "campus_not_found" }
    | { kind: "classroom_already_exists" }
    | { kind: "classroom_updated"; classroom: ClassroomView };

export type DeleteClassroomResult =
    | NotFound
    | Forbidden
    | { kind: "classroom_has_sessions" }
    | { kind: "classroom_deleted" };

export type GetClassroomResult = NotFound | { kind: "classroom_found"; classroom: ClassroomView };

export type ListClassroomsResult = { kind: "classrooms_listed"; classrooms: ClassroomView[] };

const toView = (c: Classroom): ClassroomView => ({
    id: c.id,
    name: c.name,
    capacity: c.capacity,
    campusId: c.campusId,
});

export class ClassroomUseCases {
    constructor(
        private readonly classrooms: ClassroomRepository,
        private readonly sessions: SessionRepository,
        private readonly campuses: CampusRepository,
    ) {}

    async create(input: { name: string; capacity: number; campusId: string }, auth: AuthContext): Promise<CreateClassroomResult> {
        if (!auth.isAdmin) return Forbidden;
        const { name, capacity, campusId } = input;

        if (!(await this.campuses.findById(campusId))) return { kind: "campus_not_found" };
        if (await this.classrooms.findByCampusAndName(campusId, name)) return { kind: "classroom_already_exists" };
        const classroom: Classroom = { id: randomUUID(), name, capacity, campusId };
        await this.classrooms.save(classroom);
        return { kind: "classroom_created", classroom: toView(classroom) };
    }

    async update(
        id: string,
        input: { name?: string; capacity?: number; campusId?: string },
        auth: AuthContext,
    ): Promise<UpdateClassroomResult> {
        if (!auth.isAdmin) return Forbidden;
        const classroom = await this.classrooms.findById(id);
        if (!classroom) return NotFound;
        if (input.campusId !== undefined && !(await this.campuses.findById(input.campusId))) return { kind: "campus_not_found" };

        if (input.name !== undefined || input.campusId !== undefined) {
            const targetCampusId = input.campusId ?? classroom.campusId;
            const targetName = input.name ?? classroom.name;
            const duplicate = await this.classrooms.findByCampusAndName(targetCampusId, targetName);
            if (duplicate && duplicate.id !== id) return { kind: "classroom_already_exists" };
        }
        if (input.name !== undefined) classroom.name = input.name;
        if (input.capacity !== undefined) classroom.capacity = input.capacity;
        if (input.campusId !== undefined) classroom.campusId = input.campusId;
        await this.classrooms.save(classroom);
        return { kind: "classroom_updated", classroom: toView(classroom) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteClassroomResult> {
        if (!auth.isAdmin) return Forbidden;
        const classroom = await this.classrooms.findById(id);
        if (!classroom) return NotFound;
        if (await this.sessions.existsByClassroomId(id)) return { kind: "classroom_has_sessions" };
        await this.classrooms.deleteById(id);
        return { kind: "classroom_deleted" };
    }

    async list(): Promise<ListClassroomsResult> {
        const classrooms = await this.classrooms.list();
        return { kind: "classrooms_listed", classrooms: classrooms.map(toView) };
    }

    async listByCampus(campusId: string): Promise<ListClassroomsResult> {
        const classrooms = await this.classrooms.findByCampusId(campusId);
        return { kind: "classrooms_listed", classrooms: classrooms.map(toView) };
    }

    async findById(id: string): Promise<GetClassroomResult> {
        const classroom = await this.classrooms.findById(id);
        if (!classroom) return NotFound;
        return { kind: "classroom_found", classroom: toView(classroom) };
    }
}
