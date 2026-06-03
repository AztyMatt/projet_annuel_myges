import { type Program } from "@domain/program/program.entity";

export interface ProgramRepository {
    findById(id: string): Promise<Program | undefined>;
    findByPeriodId(periodId: string): Promise<Program[]>;
    save(program: Program): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Program[]>;
}
