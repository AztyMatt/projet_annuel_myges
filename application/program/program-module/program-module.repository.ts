import { type ProgramModule } from "@domain/program/program-module/program-module.entity";

export interface ProgramModuleRepository {
    findById(id: string): Promise<ProgramModule | undefined>;
    findByProgramId(programId: string): Promise<ProgramModule[]>;
    findByModuleId(moduleId: string): Promise<ProgramModule[]>;
    findByProgramAndModule(programId: string, moduleId: string): Promise<ProgramModule | undefined>;
    save(programModule: ProgramModule): Promise<void>;
    deleteById(id: string): Promise<void>;
}
