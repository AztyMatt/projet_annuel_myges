import { randomUUID } from "node:crypto";
import { type Grade } from "@domain/grade/grade.entity";
import { type GradeAssessment } from "@domain/grade/grade-assessment/grade-assessment.entity";
import { type GradeSessionExam } from "@domain/grade/grade-session-exam/grade-session-exam.entity";
import { type GradeManualNotation } from "@domain/grade/grade-manual-notation/grade-manual-notation.entity";
import { type ManualNotation } from "@domain/grade/grade-manual-notation/manual-notation/manual-notation.entity";
import { type GradeRepository } from "@application/grade/grade.repository";
import { type GradeAssessmentRepository } from "@application/grade/grade-assessment/grade-assessment.repository";
import { type GradeSessionExamRepository } from "@application/grade/grade-session-exam/grade-session-exam.repository";
import { type GradeManualNotationRepository } from "@application/grade/grade-manual-notation/grade-manual-notation.repository";
import { type ManualNotationRepository } from "@application/grade/grade-manual-notation/manual-notation/manual-notation.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type GradeView = {
    id: string;
    studentId: string;
    value: number;
    isLocked: boolean;
    enteredAt: string;
    enteredBy: string;
};

export type GradeAssessmentView = {
    id: string;
    gradeId: string;
    assessmentId: string;
};

export type GradeSessionExamView = {
    id: string;
    gradeId: string;
    sessionExamId: string;
};

export type GradeManualNotationView = {
    id: string;
    gradeId: string;
    gradeManualId: string;
};

export type ManualNotationView = {
    id: string;
    moduleId: string;
    name: string;
};

export type CreateGradeResult = MissingFields | { kind: "grade_created"; grade: GradeView };

export type UpdateGradeResult =
    | NotFound
    | { kind: "grade_updated"; grade: GradeView };

export type LockGradeResult = NotFound | { kind: "grade_locked_ok"; grade: GradeView };

export type DeleteGradeResult = NotFound | { kind: "grade_deleted" };

export type GetGradeResult = NotFound | { kind: "grade_found"; grade: GradeView };

export type ListGradesResult = { kind: "grades_listed"; grades: GradeView[] };

export type LinkGradeAssessmentResult =
    | MissingFields
    | { kind: "grade_assessment_linked"; gradeAssessment: GradeAssessmentView };

export type DeleteGradeAssessmentResult =
    | NotFound
    | { kind: "grade_assessment_deleted" };

export type GetGradeAssessmentResult =
    | NotFound
    | { kind: "grade_assessment_found"; gradeAssessment: GradeAssessmentView };

export type ListGradeAssessmentsResult = {
    kind: "grade_assessments_listed";
    gradeAssessments: GradeAssessmentView[];
};

export type LinkGradeSessionExamResult =
    | MissingFields
    | { kind: "grade_session_exam_linked"; gradeSessionExam: GradeSessionExamView };

export type DeleteGradeSessionExamResult =
    | NotFound
    | { kind: "grade_session_exam_deleted" };

export type GetGradeSessionExamResult =
    | NotFound
    | { kind: "grade_session_exam_found"; gradeSessionExam: GradeSessionExamView };

export type ListGradeSessionExamsResult = {
    kind: "grade_session_exams_listed";
    gradeSessionExams: GradeSessionExamView[];
};

export type LinkGradeManualNotationResult =
    | MissingFields
    | { kind: "grade_manual_notation_linked"; gradeManualNotation: GradeManualNotationView };

export type DeleteGradeManualNotationResult =
    | NotFound
    | { kind: "grade_manual_notation_deleted" };

export type GetGradeManualNotationResult =
    | NotFound
    | { kind: "grade_manual_notation_found"; gradeManualNotation: GradeManualNotationView };

export type ListGradeManualNotationsResult = {
    kind: "grade_manual_notations_listed";
    gradeManualNotations: GradeManualNotationView[];
};

export type CreateManualNotationResult =
    | MissingFields
    | { kind: "manual_notation_created"; manualNotation: ManualNotationView };

export type UpdateManualNotationResult =
    | NotFound
    | { kind: "manual_notation_updated"; manualNotation: ManualNotationView };

export type DeleteManualNotationResult =
    | NotFound
    | { kind: "manual_notation_deleted" };

export type GetManualNotationResult =
    | NotFound
    | { kind: "manual_notation_found"; manualNotation: ManualNotationView };

export type ListManualNotationsResult = {
    kind: "manual_notations_listed";
    manualNotations: ManualNotationView[];
};

const toGradeView = (g: Grade): GradeView => ({
    id: g.id,
    studentId: g.studentId,
    value: g.value,
    isLocked: g.isLocked,
    enteredAt: g.enteredAt.toISOString(),
    enteredBy: g.enteredBy,
});

const toGradeAssessmentView = (g: GradeAssessment): GradeAssessmentView => ({
    id: g.id,
    gradeId: g.gradeId,
    assessmentId: g.assessmentId,
});

const toGradeSessionExamView = (g: GradeSessionExam): GradeSessionExamView => ({
    id: g.id,
    gradeId: g.gradeId,
    sessionExamId: g.sessionExamId,
});

const toGradeManualNotationView = (g: GradeManualNotation): GradeManualNotationView => ({
    id: g.id,
    gradeId: g.gradeId,
    gradeManualId: g.gradeManualId,
});

const toManualNotationView = (m: ManualNotation): ManualNotationView => ({
    id: m.id,
    moduleId: m.moduleId,
    name: m.name,
});

export class GradeUseCases {
    constructor(
        private readonly grades: GradeRepository,
        private readonly gradeAssessments: GradeAssessmentRepository,
        private readonly gradeSessionExams: GradeSessionExamRepository,
        private readonly gradeManualNotations: GradeManualNotationRepository,
        private readonly manualNotations: ManualNotationRepository,
    ) {}

    async create(input: {
        studentId?: string;
        value?: number;
        enteredBy?: string;
    }): Promise<CreateGradeResult> {
        const { studentId, value, enteredBy } = input;
        if (!studentId || value === undefined || !enteredBy) return MissingFields;
        const grade: Grade = {
            id: randomUUID(),
            studentId,
            value,
            isLocked: false,
            enteredAt: new Date(),
            enteredBy,
        };
        await this.grades.save(grade);
        return { kind: "grade_created", grade: toGradeView(grade) };
    }

    async update(
        id: string,
        input: { value?: number; enteredBy?: string },
    ): Promise<UpdateGradeResult> {
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;
        if (input.value !== undefined) grade.value = input.value;
        if (input.enteredBy !== undefined) grade.enteredBy = input.enteredBy;
        await this.grades.save(grade);
        return { kind: "grade_updated", grade: toGradeView(grade) };
    }

    async lock(id: string): Promise<LockGradeResult> {
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;
        grade.isLocked = true;
        await this.grades.save(grade);
        return { kind: "grade_locked_ok", grade: toGradeView(grade) };
    }

    async delete(id: string): Promise<DeleteGradeResult> {
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;
        await this.grades.deleteById(id);
        return { kind: "grade_deleted" };
    }

    async list(): Promise<ListGradesResult> {
        const grades = await this.grades.list();
        return { kind: "grades_listed", grades: grades.map(toGradeView) };
    }

    async listByStudent(studentId: string): Promise<ListGradesResult> {
        const grades = await this.grades.findByStudentId(studentId);
        return { kind: "grades_listed", grades: grades.map(toGradeView) };
    }

    async findById(id: string): Promise<GetGradeResult> {
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;
        return { kind: "grade_found", grade: toGradeView(grade) };
    }

    async linkAssessment(input: {
        gradeId?: string;
        assessmentId?: string;
    }): Promise<LinkGradeAssessmentResult> {
        const { gradeId, assessmentId } = input;
        if (!gradeId || !assessmentId) return MissingFields;
        const entry: GradeAssessment = { id: randomUUID(), gradeId, assessmentId };
        await this.gradeAssessments.save(entry);
        return { kind: "grade_assessment_linked", gradeAssessment: toGradeAssessmentView(entry) };
    }

    async deleteAssessmentLink(id: string): Promise<DeleteGradeAssessmentResult> {
        const entry = await this.gradeAssessments.findById(id);
        if (!entry) return NotFound;
        await this.gradeAssessments.deleteById(id);
        return { kind: "grade_assessment_deleted" };
    }

    async findAssessmentLinkById(id: string): Promise<GetGradeAssessmentResult> {
        const entry = await this.gradeAssessments.findById(id);
        if (!entry) return NotFound;
        return { kind: "grade_assessment_found", gradeAssessment: toGradeAssessmentView(entry) };
    }

    async listAssessmentLinksByGrade(gradeId: string): Promise<ListGradeAssessmentsResult> {
        const entries = await this.gradeAssessments.findByGradeId(gradeId);
        return { kind: "grade_assessments_listed", gradeAssessments: entries.map(toGradeAssessmentView) };
    }

    async listAssessmentLinksByAssessment(assessmentId: string): Promise<ListGradeAssessmentsResult> {
        const entries = await this.gradeAssessments.findByAssessmentId(assessmentId);
        return { kind: "grade_assessments_listed", gradeAssessments: entries.map(toGradeAssessmentView) };
    }

    async linkSessionExam(input: {
        gradeId?: string;
        sessionExamId?: string;
    }): Promise<LinkGradeSessionExamResult> {
        const { gradeId, sessionExamId } = input;
        if (!gradeId || !sessionExamId) return MissingFields;
        const entry: GradeSessionExam = { id: randomUUID(), gradeId, sessionExamId };
        await this.gradeSessionExams.save(entry);
        return { kind: "grade_session_exam_linked", gradeSessionExam: toGradeSessionExamView(entry) };
    }

    async deleteSessionExamLink(id: string): Promise<DeleteGradeSessionExamResult> {
        const entry = await this.gradeSessionExams.findById(id);
        if (!entry) return NotFound;
        await this.gradeSessionExams.deleteById(id);
        return { kind: "grade_session_exam_deleted" };
    }

    async findSessionExamLinkById(id: string): Promise<GetGradeSessionExamResult> {
        const entry = await this.gradeSessionExams.findById(id);
        if (!entry) return NotFound;
        return { kind: "grade_session_exam_found", gradeSessionExam: toGradeSessionExamView(entry) };
    }

    async listSessionExamLinksByGrade(gradeId: string): Promise<ListGradeSessionExamsResult> {
        const entries = await this.gradeSessionExams.findByGradeId(gradeId);
        return { kind: "grade_session_exams_listed", gradeSessionExams: entries.map(toGradeSessionExamView) };
    }

    async listSessionExamLinksBySessionExam(sessionExamId: string): Promise<ListGradeSessionExamsResult> {
        const entries = await this.gradeSessionExams.findBySessionExamId(sessionExamId);
        return { kind: "grade_session_exams_listed", gradeSessionExams: entries.map(toGradeSessionExamView) };
    }

    async linkManualNotation(input: {
        gradeId?: string;
        gradeManualId?: string;
    }): Promise<LinkGradeManualNotationResult> {
        const { gradeId, gradeManualId } = input;
        if (!gradeId || !gradeManualId) return MissingFields;
        const entry: GradeManualNotation = { id: randomUUID(), gradeId, gradeManualId };
        await this.gradeManualNotations.save(entry);
        return {
            kind: "grade_manual_notation_linked",
            gradeManualNotation: toGradeManualNotationView(entry),
        };
    }

    async deleteManualNotationLink(id: string): Promise<DeleteGradeManualNotationResult> {
        const entry = await this.gradeManualNotations.findById(id);
        if (!entry) return NotFound;
        await this.gradeManualNotations.deleteById(id);
        return { kind: "grade_manual_notation_deleted" };
    }

    async findManualNotationLinkById(id: string): Promise<GetGradeManualNotationResult> {
        const entry = await this.gradeManualNotations.findById(id);
        if (!entry) return NotFound;
        return {
            kind: "grade_manual_notation_found",
            gradeManualNotation: toGradeManualNotationView(entry),
        };
    }

    async listManualNotationLinksByGrade(gradeId: string): Promise<ListGradeManualNotationsResult> {
        const entries = await this.gradeManualNotations.findByGradeId(gradeId);
        return {
            kind: "grade_manual_notations_listed",
            gradeManualNotations: entries.map(toGradeManualNotationView),
        };
    }

    async listManualNotationLinksByGradeManual(gradeManualId: string): Promise<ListGradeManualNotationsResult> {
        const entries = await this.gradeManualNotations.findByGradeManualId(gradeManualId);
        return {
            kind: "grade_manual_notations_listed",
            gradeManualNotations: entries.map(toGradeManualNotationView),
        };
    }

    async createManualNotation(input: {
        moduleId?: string;
        name?: string;
    }): Promise<CreateManualNotationResult> {
        const { moduleId, name } = input;
        if (!moduleId || !name) return MissingFields;
        const entry: ManualNotation = { id: randomUUID(), moduleId, name };
        await this.manualNotations.save(entry);
        return { kind: "manual_notation_created", manualNotation: toManualNotationView(entry) };
    }

    async updateManualNotation(
        id: string,
        input: { moduleId?: string; name?: string },
    ): Promise<UpdateManualNotationResult> {
        const entry = await this.manualNotations.findById(id);
        if (!entry) return NotFound;
        if (input.moduleId !== undefined) entry.moduleId = input.moduleId;
        if (input.name !== undefined) entry.name = input.name;
        await this.manualNotations.save(entry);
        return { kind: "manual_notation_updated", manualNotation: toManualNotationView(entry) };
    }

    async deleteManualNotation(id: string): Promise<DeleteManualNotationResult> {
        const entry = await this.manualNotations.findById(id);
        if (!entry) return NotFound;
        await this.manualNotations.deleteById(id);
        return { kind: "manual_notation_deleted" };
    }

    async findManualNotationById(id: string): Promise<GetManualNotationResult> {
        const entry = await this.manualNotations.findById(id);
        if (!entry) return NotFound;
        return { kind: "manual_notation_found", manualNotation: toManualNotationView(entry) };
    }

    async listManualNotations(): Promise<ListManualNotationsResult> {
        const entries = await this.manualNotations.list();
        return { kind: "manual_notations_listed", manualNotations: entries.map(toManualNotationView) };
    }

    async listManualNotationsByModule(moduleId: string): Promise<ListManualNotationsResult> {
        const entries = await this.manualNotations.findByModuleId(moduleId);
        return { kind: "manual_notations_listed", manualNotations: entries.map(toManualNotationView) };
    }
}
