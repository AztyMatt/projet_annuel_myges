import { type File } from "@domain/file/file.entity";

export interface FileRepository {
    findById(id: string): Promise<File | undefined>;
    findByUploadedBy(userId: string): Promise<File[]>;
    existsByUploadedBy(userId: string): Promise<boolean>;
    save(file: File): Promise<void>;
    deleteById(id: string): Promise<void>;
    deleteByIds(ids: string[]): Promise<void>;
    list(): Promise<File[]>;
}
