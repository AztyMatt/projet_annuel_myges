import { type AcademicYear } from "../../domain/academic-year/academic-year.entity"

export interface AcademicYearRepository {
  findById(id: string): Promise<AcademicYear | undefined>
  findCurrent(): Promise<AcademicYear | undefined>
  save(academicYear: AcademicYear): Promise<void>
  deleteById(id: string): Promise<void>
  list(): Promise<AcademicYear[]>
}
