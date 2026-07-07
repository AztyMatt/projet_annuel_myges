import { randomUUID } from "node:crypto";
import { type Program } from "@domain/program/program.entity";
import { type ProgramModule } from "@domain/program/program-module/program-module.entity";
import { type ProgramRepository } from "@application/program/program.repository";
import { type ProgramModuleRepository } from "@application/program/program-module/program-module.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type ProgramView = { id: string; name: string; code: string; periodId: string };
export type ProgramModuleView = { id: string; programId: string; moduleId: string; coefficient: number; ectsCredits: number };

export type CreateProgramResult = MissingFields | { kind: "program_already_exists" } | { kind: "program_created"; program: ProgramView };

export type UpdateProgramResult =
    | NotFound
    | { kind: "program_already_exists" }
    | { kind: "program_updated"; program: ProgramView };

export type DeleteProgramResult = NotFound | { kind: "program_deleted" };

export type GetProgramResult = NotFound | { kind: "program_found"; program: ProgramView };

export type ListProgramsResult = { kind: "programs_listed"; programs: ProgramView[] };

export type AddProgramModuleResult =
    | MissingFields
    | { kind: "program_module_created"; programModule: ProgramModuleView };

export type RemoveProgramModuleResult = NotFound | { kind: "program_module_deleted" };

export type ListProgramModulesResult = { kind: "program_modules_listed"; programModules: ProgramModuleView[] };

const toProgramView = (p: Program): ProgramView => ({
    id: p.id,
    name: p.name,
    code: p.code,
    periodId: p.periodId,
});

const toProgramModuleView = (pm: ProgramModule): ProgramModuleView => ({
    id: pm.id,
    programId: pm.programId,
    moduleId: pm.moduleId,
    coefficient: pm.coefficient,
    ectsCredits: pm.ectsCredits,
});

export class ProgramUseCases {
    constructor(
        private readonly programs: ProgramRepository,
        private readonly programModules: ProgramModuleRepository,
    ) {}

    async create(input: { name?: string; code?: string; periodId?: string }): Promise<CreateProgramResult> {
        const { name, code, periodId } = input;
        if (!name || !periodId) return MissingFields;
        if (await this.programs.findByNameAndCode(name, code ?? "")) return { kind: "program_already_exists" };
        const program: Program = { id: randomUUID(), name, code: code ?? "", periodId };
        await this.programs.save(program);
        return { kind: "program_created", program: toProgramView(program) };
    }

    async update(
        id: string,
        input: { name?: string; code?: string; periodId?: string },
    ): Promise<UpdateProgramResult> {
        const program = await this.programs.findById(id);
        if (!program) return NotFound;
        const newName = input.name !== undefined ? input.name : program.name;
        const newCode = input.code !== undefined ? (input.code ?? "") : program.code;
        const existing = await this.programs.findByNameAndCode(newName, newCode);
        if (existing && existing.id !== id) return { kind: "program_already_exists" };
        program.name = newName;
        program.code = newCode;
        if (input.periodId !== undefined) program.periodId = input.periodId;
        await this.programs.save(program);
        return { kind: "program_updated", program: toProgramView(program) };
    }

    async delete(id: string): Promise<DeleteProgramResult> {
        const program = await this.programs.findById(id);
        if (!program) return NotFound;
        await this.programs.deleteById(id);
        return { kind: "program_deleted" };
    }

    async list(): Promise<ListProgramsResult> {
        const programs = await this.programs.list();
        return { kind: "programs_listed", programs: programs.map(toProgramView) };
    }

    async listByPeriod(periodId: string): Promise<ListProgramsResult> {
        const programs = await this.programs.findByPeriodId(periodId);
        return { kind: "programs_listed", programs: programs.map(toProgramView) };
    }

    async findById(id: string): Promise<GetProgramResult> {
        const program = await this.programs.findById(id);
        if (!program) return NotFound;
        return { kind: "program_found", program: toProgramView(program) };
    }

    async addModule(input: { programId?: string; moduleId?: string; coefficient?: number; ectsCredits?: number }): Promise<AddProgramModuleResult> {
        const { programId, moduleId, coefficient, ectsCredits } = input;
        if (!programId || !moduleId || coefficient === undefined || ectsCredits === undefined) return MissingFields;
        const programModule: ProgramModule = { id: randomUUID(), programId, moduleId, coefficient, ectsCredits };
        await this.programModules.save(programModule);
        return { kind: "program_module_created", programModule: toProgramModuleView(programModule) };
    }

    async removeModule(id: string): Promise<RemoveProgramModuleResult> {
        const programModule = await this.programModules.findById(id);
        if (!programModule) return NotFound;
        await this.programModules.deleteById(id);
        return { kind: "program_module_deleted" };
    }

    async listModulesByProgram(programId: string): Promise<ListProgramModulesResult> {
        const programModules = await this.programModules.findByProgramId(programId);
        return { kind: "program_modules_listed", programModules: programModules.map(toProgramModuleView) };
    }

    async listProgramsByModule(moduleId: string): Promise<ListProgramModulesResult> {
        const programModules = await this.programModules.findByModuleId(moduleId);
        return { kind: "program_modules_listed", programModules: programModules.map(toProgramModuleView) };
    }
}
