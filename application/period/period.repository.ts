import { type Period } from "@domain/period/period.entity";

export interface PeriodRepository {
    findById(id: string): Promise<Period | undefined>;
    findByAcademicYearId(academicYearId: string): Promise<Period[]>;
    findByAcademicYearAndOrder(academicYearId: string, order: number): Promise<Period | undefined>;
    save(period: Period): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Period[]>;
}
