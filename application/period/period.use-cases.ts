import { randomUUID } from "node:crypto";
import { type Period } from "@domain/period/period.entity";
import { type PeriodRepository } from "@application/period/period.repository";
import { type ProgramRepository } from "@application/program/program.repository";
import { type AcademicYearRepository } from "@application/academic-year/academic-year.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden } from "@application/types/results";

export type PeriodView = {
    id: string;
    order: number;
    startDate: string;
    endDate: string;
    academicYearId: string;
};

type PeriodDateError =
    | { kind: "academic_year_not_found" }
    | { kind: "invalid_date_range" }
    | { kind: "period_out_of_academic_year" }
    | { kind: "period_overlap" };

export type CreatePeriodResult =
    | Forbidden
    | PeriodDateError
    | { kind: "period_order_already_exists" }
    | { kind: "period_created"; period: PeriodView };

export type UpdatePeriodResult =
    | NotFound
    | Forbidden
    | PeriodDateError
    | { kind: "period_order_already_exists" }
    | { kind: "period_updated"; period: PeriodView };

export type DeletePeriodResult =
    | NotFound
    | Forbidden
    | { kind: "period_has_programs" }
    | { kind: "period_deleted" };

export type GetPeriodResult = NotFound | { kind: "period_found"; period: PeriodView };

export type ListPeriodsResult = { kind: "periods_listed"; periods: PeriodView[] };

const toView = (p: Period): PeriodView => ({
    id: p.id,
    order: p.order,
    startDate: p.startDate.toISOString(),
    endDate: p.endDate.toISOString(),
    academicYearId: p.academicYearId,
});

export class PeriodUseCases {
    constructor(
        private readonly periods: PeriodRepository,
        private readonly programs: ProgramRepository,
        private readonly academicYears: AcademicYearRepository,
    ) {}

    private async validateDates(
        academicYearId: string,
        start: Date,
        end: Date,
        excludeId?: string,
    ): Promise<PeriodDateError | null> {
        if (start >= end) return { kind: "invalid_date_range" };
        const year = await this.academicYears.findById(academicYearId);
        if (!year) return { kind: "academic_year_not_found" };
        if (start < year.startDate || end > year.endDate) return { kind: "period_out_of_academic_year" };
        const siblings = await this.periods.findByAcademicYearId(academicYearId);
        if (siblings.some((p) => p.id !== excludeId && start < p.endDate && end > p.startDate))
            return { kind: "period_overlap" };
        return null;
    }

    async create(input: {
        order: number;
        startDate: string;
        endDate: string;
        academicYearId: string;
    }, auth: AuthContext): Promise<CreatePeriodResult> {
        if (!auth.isAdmin) return Forbidden;
        const { order, startDate, endDate, academicYearId } = input;
        const parsedStart = new Date(startDate);
        const parsedEnd = new Date(endDate);
        const dateError = await this.validateDates(academicYearId, parsedStart, parsedEnd);
        if (dateError) return dateError;
        if (await this.periods.findByAcademicYearAndOrder(academicYearId, order)) return { kind: "period_order_already_exists" };
        const period: Period = {
            id: randomUUID(),
            order,
            startDate: parsedStart,
            endDate: parsedEnd,
            academicYearId,
        };
        await this.periods.save(period);
        return { kind: "period_created", period: toView(period) };
    }

    async update(
        id: string,
        input: { order?: number; startDate?: string; endDate?: string; academicYearId?: string },
        auth: AuthContext,
    ): Promise<UpdatePeriodResult> {
        if (!auth.isAdmin) return Forbidden;
        const period = await this.periods.findById(id);
        if (!period) return NotFound;
        const newStart = input.startDate !== undefined ? new Date(input.startDate) : period.startDate;
        const newEnd = input.endDate !== undefined ? new Date(input.endDate) : period.endDate;
        const newAcademicYearId = input.academicYearId !== undefined ? input.academicYearId : period.academicYearId;
        const dateError = await this.validateDates(newAcademicYearId, newStart, newEnd, id);
        if (dateError) return dateError;

        const newOrder = input.order !== undefined ? input.order : period.order;
        if (input.order !== undefined || input.academicYearId !== undefined) {
            const existing = await this.periods.findByAcademicYearAndOrder(newAcademicYearId, newOrder);
            if (existing && existing.id !== id) return { kind: "period_order_already_exists" };
        }
        period.order = newOrder;
        period.startDate = newStart;
        period.endDate = newEnd;
        period.academicYearId = newAcademicYearId;
        await this.periods.save(period);
        return { kind: "period_updated", period: toView(period) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeletePeriodResult> {
        if (!auth.isAdmin) return Forbidden;
        const period = await this.periods.findById(id);
        if (!period) return NotFound;
        if (await this.programs.existsByPeriodId(id)) return { kind: "period_has_programs" };
        await this.periods.deleteById(id);
        return { kind: "period_deleted" };
    }

    async list(): Promise<ListPeriodsResult> {
        const periods = await this.periods.list();
        return { kind: "periods_listed", periods: periods.map(toView) };
    }

    async listByAcademicYear(academicYearId: string): Promise<ListPeriodsResult> {
        const periods = await this.periods.findByAcademicYearId(academicYearId);
        return { kind: "periods_listed", periods: periods.map(toView) };
    }

    async findById(id: string): Promise<GetPeriodResult> {
        const period = await this.periods.findById(id);
        if (!period) return NotFound;
        return { kind: "period_found", period: toView(period) };
    }
}
