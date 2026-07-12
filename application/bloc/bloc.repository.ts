import { type Bloc } from "@domain/bloc/bloc.entity";

export interface BlocRepository {
    findById(id: string): Promise<Bloc | undefined>;
    findByProgramId(programId: string): Promise<Bloc[]>;
    existsByProgramId(programId: string): Promise<boolean>;
    findByProgramAndName(programId: string, name: string): Promise<Bloc | undefined>;
    save(bloc: Bloc): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Bloc[]>;
}
