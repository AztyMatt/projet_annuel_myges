import { randomUUID } from "node:crypto";
import { type Absence } from "@domain/absence/absence.entity";
import { BasicStatus } from "@domain/absence/absence.enums";
import { type AbsenceRepository } from "@application/absence/absence.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type AbsenceView = {
    id: string;
    studentId: string;
    sessionId: string;
    reason: string;
    status: string;
    declaredAt: string;
};

export type DeclareAbsenceResult =
    | MissingFields
    | { kind: "absence_already_exists" }
    | { kind: "absence_declared"; absence: AbsenceView };

export type ValidateAbsenceResult = NotFound | { kind: "absence_validated"; absence: AbsenceView };

export type RejectAbsenceResult = NotFound | { kind: "absence_rejected"; absence: AbsenceView };

export type DeleteAbsenceResult = NotFound | { kind: "absence_deleted" };

export type GetAbsenceResult = NotFound | { kind: "absence_found"; absence: AbsenceView };

export type ListAbsencesResult = { kind: "absences_listed"; absences: AbsenceView[] };

const toView = (a: Absence): AbsenceView => ({
    id: a.id,
    studentId: a.studentId,
    sessionId: a.sessionId,
    reason: a.reason,
    status: a.status,
    declaredAt: a.declaredAt.toISOString(),
});

export class AbsenceUseCases {
    constructor(private readonly absences: AbsenceRepository) {}

    async declare(input: { studentId?: string; sessionId?: string; reason?: string }): Promise<DeclareAbsenceResult> {
        const { studentId, sessionId, reason } = input;
        if (!studentId || !sessionId || !reason) return MissingFields;
        if (await this.absences.findByStudentAndSession(studentId, sessionId)) return { kind: "absence_already_exists" };
        const absence: Absence = {
            id: randomUUID(),
            studentId,
            sessionId,
            reason,
            status: BasicStatus.PENDING,
            declaredAt: new Date(),
        };
        await this.absences.save(absence);
        return { kind: "absence_declared", absence: toView(absence) };
    }

    async validate(id: string): Promise<ValidateAbsenceResult> {
        const absence = await this.absences.findById(id);
        if (!absence) return NotFound;
        absence.status = BasicStatus.VALIDATED;
        await this.absences.save(absence);
        return { kind: "absence_validated", absence: toView(absence) };
    }

    async reject(id: string): Promise<RejectAbsenceResult> {
        const absence = await this.absences.findById(id);
        if (!absence) return NotFound;
        absence.status = BasicStatus.REJECTED;
        await this.absences.save(absence);
        return { kind: "absence_rejected", absence: toView(absence) };
    }

    async delete(id: string): Promise<DeleteAbsenceResult> {
        const absence = await this.absences.findById(id);
        if (!absence) return NotFound;
        await this.absences.deleteById(id);
        return { kind: "absence_deleted" };
    }

    async list(): Promise<ListAbsencesResult> {
        const absences = await this.absences.list();
        return { kind: "absences_listed", absences: absences.map(toView) };
    }

    async listByStudent(studentId: string): Promise<ListAbsencesResult> {
        const absences = await this.absences.findByStudentId(studentId);
        return { kind: "absences_listed", absences: absences.map(toView) };
    }

    async listBySession(sessionId: string): Promise<ListAbsencesResult> {
        const absences = await this.absences.findBySessionId(sessionId);
        return { kind: "absences_listed", absences: absences.map(toView) };
    }

    async findById(id: string): Promise<GetAbsenceResult> {
        const absence = await this.absences.findById(id);
        if (!absence) return NotFound;
        return { kind: "absence_found", absence: toView(absence) };
    }
}
