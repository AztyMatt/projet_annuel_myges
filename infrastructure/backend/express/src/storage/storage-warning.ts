import { type SendOptions } from "@express/src/http/responses";

export function storageCleanupWarning(message: string, failedPaths: string[]): SendOptions {
    console.error(`[storage] cleanup failed after DB deletion — orphan path(s): ${failedPaths.join(", ")}`);
    return { status: 200, body: { message, storageCleanupFailed: true } };
}
