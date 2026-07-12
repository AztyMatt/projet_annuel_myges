import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { type StorageService } from "@application/file/storage.service";

const UPLOADS_DIR = resolve(process.env.UPLOADS_DIR ?? "uploads");

function resolvePath(storagePath: string): string {
    return join(UPLOADS_DIR, storagePath);
}

export const storageService: StorageService = {
    async save(storagePath: string, content: Buffer): Promise<void> {
        const absolutePath = resolvePath(storagePath);
        await mkdir(dirname(absolutePath), { recursive: true });
        await writeFile(absolutePath, content);
    },
    async read(storagePath: string): Promise<Buffer> {
        return readFile(resolvePath(storagePath));
    },
    async delete(storagePath: string): Promise<void> {
        await rm(resolvePath(storagePath), { force: true });
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
