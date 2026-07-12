import { type Class } from "@domain/class/class.entity";

export interface ClassRepository {
    findById(id: string): Promise<Class | undefined>;
    findByProgramId(programId: string): Promise<Class[]>;
    existsByProgramId(programId: string): Promise<boolean>;
    findByProgramAndNumber(programId: string, number: number): Promise<Class | undefined>;
    findByConversationId(conversationId: string): Promise<Class | undefined>;
    save(cls: Class): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Class[]>;
}
