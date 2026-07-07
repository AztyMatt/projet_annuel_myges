import { randomUUID } from "node:crypto";
import { type Campus } from "@domain/campus/campus.entity";
import { type CampusRepository } from "@application/campus/campus.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type CampusView = { id: string; name: string; address: string };

export type CreateCampusResult =
    | MissingFields
    | { kind: "campus_already_exists" }
    | { kind: "campus_created"; campus: CampusView };

export type UpdateCampusResult =
    | NotFound
    | { kind: "campus_updated"; campus: CampusView };

export type DeleteCampusResult = NotFound | { kind: "campus_deleted" };

export type GetCampusResult = NotFound | { kind: "campus_found"; campus: CampusView };

export type ListCampusesResult = { kind: "campuses_listed"; campuses: CampusView[] };

const toView = (c: Campus): CampusView => ({ id: c.id, name: c.name, address: c.address });

export class CampusUseCases {
    constructor(private readonly campuses: CampusRepository) {}

    async create(input: { name?: string; address?: string }): Promise<CreateCampusResult> {
        const { name, address } = input;
        if (!name || !address) return MissingFields;
        if (await this.campuses.findByName(name)) return { kind: "campus_already_exists" };
        const campus: Campus = { id: randomUUID(), name, address };
        await this.campuses.save(campus);
        return { kind: "campus_created", campus: toView(campus) };
    }

    async update(id: string, input: { name?: string; address?: string }): Promise<UpdateCampusResult> {
        const campus = await this.campuses.findById(id);
        if (!campus) return NotFound;
        if (input.name !== undefined) campus.name = input.name;
        if (input.address !== undefined) campus.address = input.address;
        await this.campuses.save(campus);
        return { kind: "campus_updated", campus: toView(campus) };
    }

    async delete(id: string): Promise<DeleteCampusResult> {
        const campus = await this.campuses.findById(id);
        if (!campus) return NotFound;
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
