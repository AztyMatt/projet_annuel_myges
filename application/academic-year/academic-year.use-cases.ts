import { randomUUID } from "node:crypto";
import { type AcademicYear } from "@domain/academic-year/academic-year.entity";
import { type AcademicYearRepository } from "@application/academic-year/academic-year.repository";
import { type PeriodRepository } from "@application/period/period.repository";
import { type UnitOfWork } from "@application/types/unit-of-work";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden } from "@application/types/results";

export type AcademicYearView = {
    id: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
};

export type CreateAcademicYearResult =
    | Forbidden
    | { kind: "invalid_date_range" }
    | { kind: "academic_year_already_exists" }
    | { kind: "academic_year_created"; academicYear: AcademicYearView };

export type UpdateAcademicYearResult =
    | NotFound
    | Forbidden
    | { kind: "invalid_date_range" }
    | { kind: "academic_year_already_exists" }
    | { kind: "academic_year_periods_out_of_range" }
    | { kind: "academic_year_updated"; academicYear: AcademicYearView };

export type SetCurrentAcademicYearResult =
    | NotFound
    | Forbidden
    | { kind: "academic_year_current_set"; academicYear: AcademicYearView };

export type DeleteAcademicYearResult =
    | NotFound
    | Forbidden
    | { kind: "academic_year_is_current" }
    | { kind: "academic_year_has_periods" }
    | { kind: "academic_year_deleted" };

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
    constructor(
        private readonly academicYears: AcademicYearRepository,
        private readonly periods: PeriodRepository,
        private readonly unitOfWork: UnitOfWork,
    ) {}

    async create(input: {
        startDate: string;
        endDate: string;
    }, auth: AuthContext): Promise<CreateAcademicYearResult> {
        if (!auth.isAdmin) return Forbidden;
        const { startDate, endDate } = input;
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) return { kind: "invalid_date_range" };
        if (await this.academicYears.findByDates(start, end)) return { kind: "academic_year_already_exists" };

        const academicYear: AcademicYear = {
            id: randomUUID(),
            startDate: start,
            endDate: end,
            isCurrent: false,
        };
        await this.academicYears.save(academicYear);
        return { kind: "academic_year_created", academicYear: toView(academicYear) };
    }

    async update(
        id: string,
        input: { startDate?: string; endDate?: string },
        auth: AuthContext,
    ): Promise<UpdateAcademicYearResult> {
        if (!auth.isAdmin) return Forbidden;
        const academicYear = await this.academicYears.findById(id);
        if (!academicYear) return NotFound;

        const start = input.startDate !== undefined ? new Date(input.startDate) : academicYear.startDate;
        const end = input.endDate !== undefined ? new Date(input.endDate) : academicYear.endDate;
        if (start >= end) return { kind: "invalid_date_range" };

        const existing = await this.academicYears.findByDates(start, end);
        if (existing && existing.id !== id) return { kind: "academic_year_already_exists" };

        if (input.startDate !== undefined || input.endDate !== undefined) {
            const periods = await this.periods.findByAcademicYearId(id);
            if (periods.some((p) => p.startDate < start || p.endDate > end)) return { kind: "academic_year_periods_out_of_range" };
        }
        academicYear.startDate = start;
        academicYear.endDate = end;
        await this.academicYears.save(academicYear);
        return { kind: "academic_year_updated", academicYear: toView(academicYear) };
    }

    async setCurrent(id: string, auth: AuthContext): Promise<SetCurrentAcademicYearResult> {
        if (!auth.isSuperAdmin) return Forbidden;
        const academicYear = await this.academicYears.findById(id);
        if (!academicYear) return NotFound;
        academicYear.isCurrent = true;
        await this.unitOfWork.run(async () => {
            await this.academicYears.clearCurrent(id);
            await this.academicYears.save(academicYear);
        });
        return { kind: "academic_year_current_set", academicYear: toView(academicYear) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteAcademicYearResult> {
        if (!auth.isAdmin) return Forbidden;
        const academicYear = await this.academicYears.findById(id);
        if (!academicYear) return NotFound;
        if (academicYear.isCurrent) return { kind: "academic_year_is_current" };
        if (await this.periods.existsByAcademicYearId(id)) return { kind: "academic_year_has_periods" };
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
