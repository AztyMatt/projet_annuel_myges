import { randomUUID } from "node:crypto";
import { type Campus } from "@domain/campus/campus.entity";
import { type CampusRepository } from "@application/campus/campus.repository";
import { type ClassroomRepository } from "@application/classroom/classroom.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden } from "@application/types/results";

export type CampusView = { id: string; name: string; address: string };

export type CreateCampusResult =
    | Forbidden
    | { kind: "campus_already_exists" }
    | { kind: "campus_created"; campus: CampusView };

export type UpdateCampusResult =
    | NotFound
    | Forbidden
    | { kind: "campus_already_exists" }
    | { kind: "campus_updated"; campus: CampusView };

export type DeleteCampusResult =
    | NotFound
    | Forbidden
    | { kind: "campus_has_classrooms" }
    | { kind: "campus_deleted" };

export type GetCampusResult = NotFound | { kind: "campus_found"; campus: CampusView };

export type ListCampusesResult = { kind: "campuses_listed"; campuses: CampusView[] };

const toView = (c: Campus): CampusView => ({ id: c.id, name: c.name, address: c.address });

export class CampusUseCases {
    constructor(
        private readonly campuses: CampusRepository,
        private readonly classrooms: ClassroomRepository,
    ) {}

    async create(input: { name: string; address: string }, auth: AuthContext): Promise<CreateCampusResult> {
        if (!auth.isAdmin) return Forbidden;
        const { name, address } = input;
        if (await this.campuses.findByName(name)) return { kind: "campus_already_exists" };
        const campus: Campus = { id: randomUUID(), name, address };
        await this.campuses.save(campus);
        return { kind: "campus_created", campus: toView(campus) };
    }

    async update(id: string, input: { name?: string; address?: string }, auth: AuthContext): Promise<UpdateCampusResult> {
        if (!auth.isAdmin) return Forbidden;
        const campus = await this.campuses.findById(id);
        if (!campus) return NotFound;

        if (input.name !== undefined && input.name !== campus.name) {
            const duplicate = await this.campuses.findByName(input.name);
            if (duplicate && duplicate.id !== id) return { kind: "campus_already_exists" };
        }
        if (input.name !== undefined) campus.name = input.name;
        if (input.address !== undefined) campus.address = input.address;
        await this.campuses.save(campus);
        return { kind: "campus_updated", campus: toView(campus) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteCampusResult> {
        if (!auth.isAdmin) return Forbidden;
        const campus = await this.campuses.findById(id);
        if (!campus) return NotFound;
        if (await this.classrooms.existsByCampusId(id)) return { kind: "campus_has_classrooms" };
        await this.campuses.deleteById(id);
        return { kind: "campus_deleted" };
    }

    async list(): Promise<ListCampusesResult> {
        const campuses = await this.campuses.list();
        return { kind: "campuses_listed", campuses: campuses.map(toView) };
    }

    async findById(id: string): Promise<GetCampusResult> {
        const campus = await this.campuses.findById(id);
        if (!campus) return NotFound;
        return { kind: "campus_found", campus: toView(campus) };
    }
}
