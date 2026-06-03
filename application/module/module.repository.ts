import { type Module } from "../../domain/module/module.entity"

export interface ModuleRepository {
  findById(id: string): Promise<Module | undefined>
  save(module: Module): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<Module[]>
}
