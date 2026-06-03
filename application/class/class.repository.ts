import { type Class } from "@domain/class/class.entity";

export interface ClassRepository {
    findById(id: string): Promise<Class | undefined>;
    findByProgramId(programId: string): Promise<Class[]>;
    save(cls: Class): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Class[]>;
}
