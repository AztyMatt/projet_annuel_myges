import { type DevSeedAccount, type Role, type User } from "../../domain/auth/user"

export interface UserRepository {
  findByEmail(email: string): Promise<User | undefined>
  findById(id: string): Promise<User | undefined>
  save(user: User): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<User[]>
  listDevSeedAccounts(): Promise<DevSeedAccount[]>
}

export interface PasswordHasher {
  hash(value: string): Promise<string>
  verify(hash: string, raw: string): Promise<boolean>
}

export interface TokenProvider {
  issue(user: User): string
  verify(token: string): { sub: string; role: Role; email: string }
}

export interface TotpProvider {
  generateSecret(email: string): string
  verify(secret: string, code: string): boolean
  buildProvisioningUri(email: string, secret: string): string
}
