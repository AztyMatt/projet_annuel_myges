import { randomUUID } from "node:crypto";
import { type Program } from "@domain/program/program.entity";
import { type ProgramModule } from "@domain/program/program-module/program-module.entity";
import { type ProgramRepository } from "@application/program/program.repository";
import { type ProgramModuleRepository } from "@application/program/program-module/program-module.repository";
import { type ClassRepository } from "@application/class/class.repository";
import { type BlocRepository } from "@application/bloc/bloc.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type PeriodRepository } from "@application/period/period.repository";
import { type ModuleRepository } from "@application/module/module.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden } from "@application/types/results";

export type ProgramView = { id: string; name: string; code: string; periodId: string };
export type ProgramModuleView = { id: string; programId: string; moduleId: string; coefficient: number; ectsCredits: number };

export type CreateProgramResult = Forbidden | { kind: "period_not_found" } | { kind: "program_already_exists" } | { kind: "program_created"; program: ProgramView };

export type UpdateProgramResult =
    | NotFound
    | Forbidden
    | { kind: "period_not_found" }
    | { kind: "program_already_exists" }
    | { kind: "program_updated"; program: ProgramView };

export type DeleteProgramResult = NotFound | Forbidden | { kind: "program_has_modules" } | { kind: "program_has_classes" } | { kind: "program_has_blocs" } | { kind: "program_has_students" } | { kind: "program_deleted" };

export type GetProgramResult = NotFound | { kind: "program_found"; program: ProgramView };

export type ListProgramsResult = { kind: "programs_listed"; programs: ProgramView[] };

export type AddProgramModuleResult =
    | Forbidden
    | { kind: "program_not_found" }
    | { kind: "module_not_found" }
    | { kind: "program_module_already_exists" }
    | { kind: "program_module_created"; programModule: ProgramModuleView };

export type RemoveProgramModuleResult = NotFound | Forbidden | { kind: "program_module_deleted" };

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
        private readonly classes: ClassRepository,
        private readonly blocs: BlocRepository,
        private readonly students: StudentRepository,
        private readonly periods: PeriodRepository,
        private readonly modules: ModuleRepository,
    ) {}

    async create(input: { name: string; code?: string; periodId: string }, auth: AuthContext): Promise<CreateProgramResult> {
        if (!auth.isAdmin) return Forbidden;
        const { name, code, periodId } = input;

        if (!(await this.periods.findById(periodId))) return { kind: "period_not_found" };
        if (await this.programs.findByNameAndCode(name, code ?? "")) return { kind: "program_already_exists" };
        const program: Program = { id: randomUUID(), name, code: code ?? "", periodId };
        await this.programs.save(program);
        return { kind: "program_created", program: toProgramView(program) };
    }

    async update(
        id: string,
        input: { name?: string; code?: string; periodId?: string },
        auth: AuthContext,
    ): Promise<UpdateProgramResult> {
        if (!auth.isAdmin) return Forbidden;
        const program = await this.programs.findById(id);
        if (!program) return NotFound;
        const newName = input.name !== undefined ? input.name : program.name;
        const newCode = input.code !== undefined ? (input.code ?? "") : program.code;
        const existing = await this.programs.findByNameAndCode(newName, newCode);
        if (existing && existing.id !== id) return { kind: "program_already_exists" };

        if (input.periodId !== undefined && !(await this.periods.findById(input.periodId))) return { kind: "period_not_found" };
        program.name = newName;
        program.code = newCode;
        if (input.periodId !== undefined) program.periodId = input.periodId;
        await this.programs.save(program);
        return { kind: "program_updated", program: toProgramView(program) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteProgramResult> {
        if (!auth.isAdmin) return Forbidden;
        const program = await this.programs.findById(id);
        if (!program) return NotFound;
        const [hasModules, hasClasses, hasBlocs, hasStudents] = await Promise.all([
            this.programModules.existsByProgramId(id),
            this.classes.existsByProgramId(id),
            this.blocs.existsByProgramId(id),
            this.students.existsByProgramId(id),
        ]);
        if (hasModules) return { kind: "program_has_modules" };
        if (hasClasses) return { kind: "program_has_classes" };
        if (hasBlocs) return { kind: "program_has_blocs" };
        if (hasStudents) return { kind: "program_has_students" };
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

    async addModule(input: { programId: string; moduleId: string; coefficient: number; ectsCredits: number }, auth: AuthContext): Promise<AddProgramModuleResult> {
        if (!auth.isAdmin) return Forbidden;
        const { programId, moduleId, coefficient, ectsCredits } = input;

        if (!(await this.programs.findById(programId))) return { kind: "program_not_found" };
        if (!(await this.modules.findById(moduleId))) return { kind: "module_not_found" };

        if (await this.programModules.findByProgramAndModule(programId, moduleId)) return { kind: "program_module_already_exists" };
        const programModule: ProgramModule = { id: randomUUID(), programId, moduleId, coefficient, ectsCredits };
        await this.programModules.save(programModule);
        return { kind: "program_module_created", programModule: toProgramModuleView(programModule) };
    }

    async removeModule(id: string, auth: AuthContext): Promise<RemoveProgramModuleResult> {
        if (!auth.isAdmin) return Forbidden;
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
