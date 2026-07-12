import { randomUUID } from "node:crypto";
import { type Bloc } from "@domain/bloc/bloc.entity";
import { type BlocRepository } from "@application/bloc/bloc.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type ProgramRepository } from "@application/program/program.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden } from "@application/types/results";

export type BlocView = { id: string; name: string; programId: string };

export type CreateBlocResult = Forbidden | { kind: "program_not_found" } | { kind: "bloc_already_exists" } | { kind: "bloc_created"; bloc: BlocView };

export type UpdateBlocResult =
    | NotFound
    | Forbidden
    | { kind: "program_not_found" }
    | { kind: "bloc_already_exists" }
    | { kind: "bloc_updated"; bloc: BlocView };

export type DeleteBlocResult =
    | NotFound
    | Forbidden
    | { kind: "bloc_has_courses" }
    | { kind: "bloc_deleted" };

export type GetBlocResult = NotFound | { kind: "bloc_found"; bloc: BlocView };

export type ListBlocsResult = { kind: "blocs_listed"; blocs: BlocView[] };

const toView = (b: Bloc): BlocView => ({ id: b.id, name: b.name, programId: b.programId });

export class BlocUseCases {
    constructor(
        private readonly blocs: BlocRepository,
        private readonly courses: CourseRepository,
        private readonly programs: ProgramRepository,
    ) {}

    async create(input: { name: string; programId: string }, auth: AuthContext): Promise<CreateBlocResult> {
        if (!auth.isAdmin) return Forbidden;
        const { name, programId } = input;

        if (!(await this.programs.findById(programId))) return { kind: "program_not_found" };
        if (await this.blocs.findByProgramAndName(programId, name)) return { kind: "bloc_already_exists" };
        const bloc: Bloc = { id: randomUUID(), name, programId };
        await this.blocs.save(bloc);
        return { kind: "bloc_created", bloc: toView(bloc) };
    }

    async update(id: string, input: { name?: string; programId?: string }, auth: AuthContext): Promise<UpdateBlocResult> {
        if (!auth.isAdmin) return Forbidden;
        const bloc = await this.blocs.findById(id);
        if (!bloc) return NotFound;
        if (input.programId !== undefined && !(await this.programs.findById(input.programId))) return { kind: "program_not_found" };

        if (input.name !== undefined || input.programId !== undefined) {
            const targetProgramId = input.programId ?? bloc.programId;
            const targetName = input.name ?? bloc.name;
            const duplicate = await this.blocs.findByProgramAndName(targetProgramId, targetName);
            if (duplicate && duplicate.id !== id) return { kind: "bloc_already_exists" };
        }
        if (input.name !== undefined) bloc.name = input.name;
        if (input.programId !== undefined) bloc.programId = input.programId;
        await this.blocs.save(bloc);
        return { kind: "bloc_updated", bloc: toView(bloc) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteBlocResult> {
        if (!auth.isAdmin) return Forbidden;
        const bloc = await this.blocs.findById(id);
        if (!bloc) return NotFound;
        if (await this.courses.existsByBlocId(id)) return { kind: "bloc_has_courses" };
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
