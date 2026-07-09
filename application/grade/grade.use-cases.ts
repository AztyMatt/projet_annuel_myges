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
import { type StudentRepository } from "@application/student/student.repository";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";

export type GradeView = {
    id: string;
    studentId: string;
    value: number;
    isLocked: boolean;
    enteredAt: string;
    enteredBy: string | null;
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

export type CreateGradeResult = MissingFields | Forbidden | { kind: "grade_created"; grade: GradeView };

export type UpdateGradeResult =
    | NotFound
    | Forbidden
    | { kind: "grade_is_locked" }
    | { kind: "grade_updated"; grade: GradeView };

export type LockGradeResult = NotFound | Forbidden | { kind: "grade_locked_ok"; grade: GradeView };

export type DeleteGradeResult = NotFound | Forbidden | { kind: "not_owner" } | { kind: "grade_has_no_owner" } | { kind: "grade_is_locked" } | { kind: "grade_deleted" };

export type GetGradeResult = NotFound | { kind: "grade_found"; grade: GradeView };

export type ListGradesResult = Forbidden | { kind: "grades_listed"; grades: GradeView[] };

export type LinkGradeAssessmentResult =
    | MissingFields
    | Forbidden
    | { kind: "grade_assessment_already_exists" }
    | { kind: "grade_already_has_source" }
    | { kind: "grade_assessment_linked"; gradeAssessment: GradeAssessmentView };

export type GetGradeAssessmentResult =
    | NotFound
    | { kind: "grade_assessment_found"; gradeAssessment: GradeAssessmentView };

export type ListGradeAssessmentsResult = {
    kind: "grade_assessments_listed";
    gradeAssessments: GradeAssessmentView[];
};

export type LinkGradeSessionExamResult =
    | MissingFields
    | Forbidden
    | { kind: "grade_session_exam_already_exists" }
    | { kind: "grade_already_has_source" }
    | { kind: "grade_session_exam_linked"; gradeSessionExam: GradeSessionExamView };

export type GetGradeSessionExamResult =
    | NotFound
    | { kind: "grade_session_exam_found"; gradeSessionExam: GradeSessionExamView };

export type ListGradeSessionExamsResult = {
    kind: "grade_session_exams_listed";
    gradeSessionExams: GradeSessionExamView[];
};

export type LinkGradeManualNotationResult =
    | MissingFields
    | Forbidden
    | { kind: "grade_manual_notation_already_exists" }
    | { kind: "grade_already_has_source" }
    | { kind: "grade_manual_notation_linked"; gradeManualNotation: GradeManualNotationView };

export type GetGradeManualNotationResult =
    | NotFound
    | { kind: "grade_manual_notation_found"; gradeManualNotation: GradeManualNotationView };

export type ListGradeManualNotationsResult = {
    kind: "grade_manual_notations_listed";
    gradeManualNotations: GradeManualNotationView[];
};

export type CreateManualNotationResult =
    | MissingFields
    | Forbidden
    | { kind: "notation_already_exists" }
    | { kind: "manual_notation_created"; manualNotation: ManualNotationView };

export type UpdateManualNotationResult =
    | NotFound
    | Forbidden
    | { kind: "manual_notation_updated"; manualNotation: ManualNotationView };

export type DeleteManualNotationResult =
    | NotFound
    | Forbidden
    | { kind: "manual_notation_has_grades" }
    | { kind: "manual_notation_deleted" };

export type GetManualNotationResult =
    | NotFound
    | { kind: "manual_notation_found"; manualNotation: ManualNotationView };

export type ListManualNotationsResult = Forbidden | {
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
        private readonly students: StudentRepository,
    ) {}

    async create(input: {
        studentId?: string;
        value?: number;
        enteredBy?: string;
    }, auth: AuthContext): Promise<CreateGradeResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
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
        input: { value?: number },
        auth: AuthContext,
    ): Promise<UpdateGradeResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;
        if (!auth.isSuperAdmin && grade.enteredBy !== auth.requesterId) return Forbidden;
        if (grade.isLocked) return { kind: "grade_is_locked" };
        if (input.value !== undefined) grade.value = input.value;
        await this.grades.save(grade);
        return { kind: "grade_updated", grade: toGradeView(grade) };
    }

    async lock(id: string, auth: AuthContext): Promise<LockGradeResult> {
        if (!auth.isAdmin) return Forbidden;
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;
        grade.isLocked = true;
        await this.grades.save(grade);
        return { kind: "grade_locked_ok", grade: toGradeView(grade) };
    }

    async unlock(id: string, auth: AuthContext): Promise<LockGradeResult> {
        if (!auth.isAdmin) return Forbidden;
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;
        grade.isLocked = false;
        await this.grades.save(grade);
        return { kind: "grade_locked_ok", grade: toGradeView(grade) };
    }

    async delete(
        id: string,
        auth: AuthContext,
    ): Promise<DeleteGradeResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;
        if (!auth.isSuperAdmin) {
            if (grade.enteredBy === null) return { kind: "grade_has_no_owner" };
            if (grade.enteredBy !== auth.requesterId) return { kind: "not_owner" };
        }
        if (grade.isLocked && !auth.isSuperAdmin) return { kind: "grade_is_locked" };
        await this.grades.deleteById(id);
        return { kind: "grade_deleted" };
    }

    async list(auth: AuthContext): Promise<ListGradesResult> {
        if (!auth.isAdmin) return Forbidden;
        const grades = await this.grades.list();
        return { kind: "grades_listed", grades: grades.map(toGradeView) };
    }

    async listByStudent(studentId: string, auth: AuthContext): Promise<ListGradesResult> {
        if (!auth.isAdmin) return Forbidden;
        const grades = await this.grades.findByStudentId(studentId);
        return { kind: "grades_listed", grades: grades.map(toGradeView) };
    }

    async listMine(auth: AuthContext): Promise<NotFound | { kind: "grades_listed"; grades: GradeView[] }> {
        const student = await this.students.findByUserId(auth.requesterId);
        if (!student) return NotFound;
        const grades = await this.grades.findByStudentId(student.id);
        return { kind: "grades_listed", grades: grades.map(toGradeView) };
    }

    async findById(id: string, auth: AuthContext): Promise<GetGradeResult> {
        if (!auth.isAdmin) return NotFound;
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;
        return { kind: "grade_found", grade: toGradeView(grade) };
    }

    private async gradeHasAnySource(gradeId: string): Promise<boolean> {
        const [assessments, sessionExams, manuals] = await Promise.all([
            this.gradeAssessments.findByGradeId(gradeId),
            this.gradeSessionExams.findByGradeId(gradeId),
            this.gradeManualNotations.findByGradeId(gradeId),
        ]);
        return assessments.length > 0 || sessionExams.length > 0 || manuals.length > 0;
    }

    async linkAssessment(input: {
        gradeId?: string;
        assessmentId?: string;
    }, auth: AuthContext): Promise<LinkGradeAssessmentResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
        const { gradeId, assessmentId } = input;
        if (!gradeId || !assessmentId) return MissingFields;
        if (await this.gradeAssessments.findByGradeAndAssessment(gradeId, assessmentId)) return { kind: "grade_assessment_already_exists" };
        if (await this.gradeHasAnySource(gradeId)) return { kind: "grade_already_has_source" };
        const entry: GradeAssessment = { id: randomUUID(), gradeId, assessmentId };
        await this.gradeAssessments.save(entry);
        return { kind: "grade_assessment_linked", gradeAssessment: toGradeAssessmentView(entry) };
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
    }, auth: AuthContext): Promise<LinkGradeSessionExamResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
        const { gradeId, sessionExamId } = input;
        if (!gradeId || !sessionExamId) return MissingFields;
        if (await this.gradeSessionExams.findByGradeAndSessionExam(gradeId, sessionExamId)) return { kind: "grade_session_exam_already_exists" };
        if (await this.gradeHasAnySource(gradeId)) return { kind: "grade_already_has_source" };
        const entry: GradeSessionExam = { id: randomUUID(), gradeId, sessionExamId };
        await this.gradeSessionExams.save(entry);
        return { kind: "grade_session_exam_linked", gradeSessionExam: toGradeSessionExamView(entry) };
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
    }, auth: AuthContext): Promise<LinkGradeManualNotationResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
        const { gradeId, gradeManualId } = input;
        if (!gradeId || !gradeManualId) return MissingFields;
        if (await this.gradeManualNotations.findByGradeAndManualNotation(gradeId, gradeManualId)) return { kind: "grade_manual_notation_already_exists" };
        if (await this.gradeHasAnySource(gradeId)) return { kind: "grade_already_has_source" };
        const entry: GradeManualNotation = { id: randomUUID(), gradeId, gradeManualId };
        await this.gradeManualNotations.save(entry);
        return {
            kind: "grade_manual_notation_linked",
            gradeManualNotation: toGradeManualNotationView(entry),
        };
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
    }, auth: AuthContext): Promise<CreateManualNotationResult> {
        if (!auth.isAdmin) return Forbidden;
        const { moduleId, name } = input;
        if (!moduleId || !name) return MissingFields;
        if (await this.manualNotations.findByModuleAndName(moduleId, name)) return { kind: "notation_already_exists" };
        const entry: ManualNotation = { id: randomUUID(), moduleId, name };
        await this.manualNotations.save(entry);
        return { kind: "manual_notation_created", manualNotation: toManualNotationView(entry) };
    }

    async updateManualNotation(
        id: string,
        input: { moduleId?: string; name?: string },
        auth: AuthContext,
    ): Promise<UpdateManualNotationResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.manualNotations.findById(id);
        if (!entry) return NotFound;
        if (input.moduleId !== undefined) entry.moduleId = input.moduleId;
        if (input.name !== undefined) entry.name = input.name;
        await this.manualNotations.save(entry);
        return { kind: "manual_notation_updated", manualNotation: toManualNotationView(entry) };
    }

    async deleteManualNotation(id: string, auth: AuthContext): Promise<DeleteManualNotationResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.manualNotations.findById(id);
        if (!entry) return NotFound;
        if (await this.gradeManualNotations.existsByGradeManualId(id)) return { kind: "manual_notation_has_grades" };
        await this.manualNotations.deleteById(id);
        return { kind: "manual_notation_deleted" };
    }

    async findManualNotationById(id: string): Promise<GetManualNotationResult> {
        const entry = await this.manualNotations.findById(id);
        if (!entry) return NotFound;
        return { kind: "manual_notation_found", manualNotation: toManualNotationView(entry) };
    }

    async listManualNotations(auth: AuthContext): Promise<ListManualNotationsResult> {
        if (!auth.isAdmin) return Forbidden;
        const entries = await this.manualNotations.list();
        return { kind: "manual_notations_listed", manualNotations: entries.map(toManualNotationView) };
    }

    async listManualNotationsByModule(moduleId: string): Promise<ListManualNotationsResult> {
        const entries = await this.manualNotations.findByModuleId(moduleId);
        return { kind: "manual_notations_listed", manualNotations: entries.map(toManualNotationView) };
    }
}
