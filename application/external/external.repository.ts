import { type External } from "@domain/external/external.entity";

export interface ExternalRepository {
    findById(id: string): Promise<External | undefined>;
    findByIdentity(firstname: string, lastname: string, email: string): Promise<External | undefined>;
    save(external: External): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<External[]>;
}
