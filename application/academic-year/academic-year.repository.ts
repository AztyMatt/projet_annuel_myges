import { type AcademicYear } from "@domain/academic-year/academic-year.entity";

export interface AcademicYearRepository {
    findById(id: string): Promise<AcademicYear | undefined>;
    findCurrent(): Promise<AcademicYear | undefined>;
    findByDates(startDate: Date, endDate: Date): Promise<AcademicYear | undefined>;
    clearCurrent(exceptId?: string): Promise<void>;
    save(academicYear: AcademicYear): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<AcademicYear[]>;
}
