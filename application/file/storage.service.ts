export interface StorageService {
    delete(storagePath: string): Promise<void>;
    deleteMany(storagePaths: string[]): Promise<string[]>;
}
