import { randomUUID } from "node:crypto";
import { type Period } from "@domain/period/period.entity";
import { type PeriodRepository } from "@application/period/period.repository";
import { type ProgramRepository } from "@application/program/program.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";

export type PeriodView = {
    id: string;
    order: number;
    startDate: string;
    endDate: string;
    academicYearId: string;
};

export type CreatePeriodResult = MissingFields | Forbidden | { kind: "period_order_already_exists" } | { kind: "period_created"; period: PeriodView };

export type UpdatePeriodResult =
    | NotFound
    | Forbidden
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
    ) {}

    async create(input: {
        order?: number;
        startDate?: string;
        endDate?: string;
        academicYearId?: string;
    }, auth: AuthContext): Promise<CreatePeriodResult> {
        if (!auth.isAdmin) return Forbidden;
        const { order, startDate, endDate, academicYearId } = input;
        if (order === undefined || !startDate || !endDate || !academicYearId) return MissingFields;
        if (await this.periods.findByAcademicYearAndOrder(academicYearId, order)) return { kind: "period_order_already_exists" };
        const period: Period = {
            id: randomUUID(),
            order,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
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
        if (input.order !== undefined) period.order = input.order;
        if (input.startDate !== undefined) period.startDate = new Date(input.startDate);
        if (input.endDate !== undefined) period.endDate = new Date(input.endDate);
        if (input.academicYearId !== undefined) period.academicYearId = input.academicYearId;
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
