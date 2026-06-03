import { type Admin } from "../../domain/admin/admin.entity"

export interface AdminRepository {
  findById(id: string): Promise<Admin | undefined>
  findByUserId(userId: string): Promise<Admin | undefined>
  save(admin: Admin): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<Admin[]>
}
