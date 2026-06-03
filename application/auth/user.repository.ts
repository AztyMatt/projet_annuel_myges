import { type User } from "@domain/auth/user.entity"

export interface UserRepository {
  findByEmail(email: string): Promise<User | undefined>
  findById(id: string): Promise<User | undefined>
  save(user: User): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<User[]>
}
