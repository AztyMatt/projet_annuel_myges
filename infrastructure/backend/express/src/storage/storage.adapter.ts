import { type StorageService } from "@application/file/storage.service";

export const storageService: StorageService = {
    async delete(_storagePath: string): Promise<void> {
        
    },
    async deleteMany(storagePaths: string[]): Promise<string[]> {
        const failedPaths: string[] = [];
        for (const path of storagePaths) {
            try {
                await this.delete(path);
            } catch {
                failedPaths.push(path);
            }
        }
        return failedPaths;
    },
};
