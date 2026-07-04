import { randomUUID } from "node:crypto";
import { type Bloc } from "@domain/bloc/bloc.entity";
import { type BlocRepository } from "@application/bloc/bloc.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type BlocView = { id: string; name: string; programId: string };

export type CreateBlocResult = MissingFields | { kind: "bloc_already_exists" } | { kind: "bloc_created"; bloc: BlocView };

export type UpdateBlocResult =
    | NotFound
    | { kind: "bloc_updated"; bloc: BlocView };

export type DeleteBlocResult = NotFound | { kind: "bloc_deleted" };

export type GetBlocResult = NotFound | { kind: "bloc_found"; bloc: BlocView };

export type ListBlocsResult = { kind: "blocs_listed"; blocs: BlocView[] };

const toView = (b: Bloc): BlocView => ({ id: b.id, name: b.name, programId: b.programId });

export class BlocUseCases {
    constructor(private readonly blocs: BlocRepository) {}

    async create(input: { name?: string; programId?: string }): Promise<CreateBlocResult> {
        const { name, programId } = input;
        if (!name || !programId) return MissingFields;
        if (await this.blocs.findByProgramAndName(programId, name)) return { kind: "bloc_already_exists" };
        const bloc: Bloc = { id: randomUUID(), name, programId };
        await this.blocs.save(bloc);
        return { kind: "bloc_created", bloc: toView(bloc) };
    }

    async update(id: string, input: { name?: string; programId?: string }): Promise<UpdateBlocResult> {
        const bloc = await this.blocs.findById(id);
        if (!bloc) return NotFound;
        if (input.name !== undefined) bloc.name = input.name;
        if (input.programId !== undefined) bloc.programId = input.programId;
        await this.blocs.save(bloc);
        return { kind: "bloc_updated", bloc: toView(bloc) };
    }

    async delete(id: string): Promise<DeleteBlocResult> {
        const bloc = await this.blocs.findById(id);
        if (!bloc) return NotFound;
        await this.blocs.deleteById(id);
        return { kind: "bloc_deleted" };
    }

    async list(): Promise<ListBlocsResult> {
        const blocs = await this.blocs.list();
        return { kind: "blocs_listed", blocs: blocs.map(toView) };
    }

    async listByProgram(programId: string): Promise<ListBlocsResult> {
        const blocs = await this.blocs.findByProgramId(programId);
        return { kind: "blocs_listed", blocs: blocs.map(toView) };
    }

    async findById(id: string): Promise<GetBlocResult> {
        const bloc = await this.blocs.findById(id);
        if (!bloc) return NotFound;
        return { kind: "bloc_found", bloc: toView(bloc) };
    }
}
