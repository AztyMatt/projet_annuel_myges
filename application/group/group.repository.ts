import { type Group } from "@domain/group/group.entity"

export interface GroupRepository {
  findById(id: string): Promise<Group | undefined>
  findByClassId(classId: string): Promise<Group[]>
  save(group: Group): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<Group[]>
}
