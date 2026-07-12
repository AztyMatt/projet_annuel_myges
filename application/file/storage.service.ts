export interface StorageService {
    save(storagePath: string, content: Buffer): Promise<void>;
    read(storagePath: string): Promise<Buffer>;
    delete(storagePath: string): Promise<void>;
    deleteMany(storagePaths: string[]): Promise<string[]>;
}
