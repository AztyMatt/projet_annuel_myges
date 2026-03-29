export function readEnv(key: string): string {
    const value = process.env[key]
    if (!value) {
        throw new Error(`${key} required environment variable is missing.`)
    }
    return value
}