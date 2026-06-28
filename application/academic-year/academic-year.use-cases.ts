import { randomUUID } from "node:crypto";
import { type AcademicYear } from "@domain/academic-year/academic-year.entity";
import { type AcademicYearRepository } from "@application/academic-year/academic-year.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type AcademicYearView = {
    id: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
};

export type CreateAcademicYearResult =
    | MissingFields
    | { kind: "academic_year_created"; academicYear: AcademicYearView };

export type UpdateAcademicYearResult =
    | NotFound
    | { kind: "academic_year_updated"; academicYear: AcademicYearView };

export type DeleteAcademicYearResult = NotFound | { kind: "academic_year_deleted" };

export type GetAcademicYearResult =
    | NotFound
    | { kind: "academic_year_found"; academicYear: AcademicYearView };

export type ListAcademicYearsResult = { kind: "academic_years_listed"; academicYears: AcademicYearView[] };

const toView = (a: AcademicYear): AcademicYearView => ({
    id: a.id,
    startDate: a.startDate.toISOString(),
    endDate: a.endDate.toISOString(),
    isCurrent: a.isCurrent,
});

export class AcademicYearUseCases {
    constructor(private readonly academicYears: AcademicYearRepository) {}

    async create(input: {
        startDate?: string;
        endDate?: string;
        isCurrent?: boolean;
    }): Promise<CreateAcademicYearResult> {
        const { startDate, endDate, isCurrent = false } = input;
        if (!startDate || !endDate) return MissingFields;
        const academicYear: AcademicYear = {
            id: randomUUID(),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isCurrent,
        };
        await this.academicYears.save(academicYear);
        return { kind: "academic_year_created", academicYear: toView(academicYear) };
    }

    async update(
        id: string,
        input: { startDate?: string; endDate?: string; isCurrent?: boolean },
    ): Promise<UpdateAcademicYearResult> {
        const academicYear = await this.academicYears.findById(id);
        if (!academicYear) return NotFound;
        if (input.startDate !== undefined) academicYear.startDate = new Date(input.startDate);
        if (input.endDate !== undefined) academicYear.endDate = new Date(input.endDate);
        if (input.isCurrent !== undefined) academicYear.isCurrent = input.isCurrent;
        await this.academicYears.save(academicYear);
        return { kind: "academic_year_updated", academicYear: toView(academicYear) };
    }

    async delete(id: string): Promise<DeleteAcademicYearResult> {
        const academicYear = await this.academicYears.findById(id);
        if (!academicYear) return NotFound;
        await this.academicYears.deleteById(id);
        return { kind: "academic_year_deleted" };
    }

    async list(): Promise<ListAcademicYearsResult> {
        const academicYears = await this.academicYears.list();
        return { kind: "academic_years_listed", academicYears: academicYears.map(toView) };
    }

    async getCurrent(): Promise<GetAcademicYearResult> {
        const academicYear = await this.academicYears.findCurrent();
        if (!academicYear) return NotFound;
        return { kind: "academic_year_found", academicYear: toView(academicYear) };
    }

    async findById(id: string): Promise<GetAcademicYearResult> {
        const academicYear = await this.academicYears.findById(id);
        if (!academicYear) return NotFound;
        return { kind: "academic_year_found", academicYear: toView(academicYear) };
    }
}
