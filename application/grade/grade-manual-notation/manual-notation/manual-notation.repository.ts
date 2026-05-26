import { type ManualNotation } from "../../../../domain/grade/grade-manual-notation/manual-notation/manual-notation.entity"

export interface ManualNotationRepository {
  findById(id: string): Promise<ManualNotation | undefined>
  findByModuleId(moduleId: string): Promise<ManualNotation[]>
  save(manualNotation: ManualNotation): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<ManualNotation[]>
}
