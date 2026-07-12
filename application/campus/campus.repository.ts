import { type Campus } from "@domain/campus/campus.entity";

export interface CampusRepository {
    findById(id: string): Promise<Campus | undefined>;
    findByName(name: string): Promise<Campus | undefined>;
    save(campus: Campus): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Campus[]>;
}
