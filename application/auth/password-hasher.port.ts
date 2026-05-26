export interface PasswordHasher {
  hash(value: string): Promise<string>
  verify(hash: string, raw: string): Promise<boolean>
}
