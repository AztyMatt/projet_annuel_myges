import { randomUUID } from "node:crypto";
import { type Grade } from "@domain/grade/grade.entity";
import { isValidGradeValue } from "@domain/grade/grade.policy";
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
import { type AssessmentRepository } from "@application/assessment/assessment.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type SessionExamRepository } from "@application/session/session-exam/session-exam.repository";
import { type SessionExamStudentRepository } from "@application/session/session-exam/session-exam-student/session-exam-student.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type ModuleRepository } from "@application/module/module.repository";
import { sessionHasStarted } from "@domain/session/session.policy";
import { NotFound, Forbidden, ForbiddenOwnership } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";
import { isCourseInstructor } from "@application/course/course-access";

export type GradeView = {
    id: string;
    studentId: string;
    value: number;
    isRetake: boolean;
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

export type CreateGradeResult = NotFound | Forbidden | { kind: "grade_out_of_range" } | { kind: "grade_created"; grade: GradeView };

export type UpdateGradeResult =
    | NotFound
    | Forbidden
    | { kind: "grade_out_of_range" }
    | { kind: "grade_is_locked" }
    | { kind: "grade_updated"; grade: GradeView };

export type LockGradeResult = NotFound | Forbidden | { kind: "grade_locked_ok"; grade: GradeView };

export type DeleteGradeResult = NotFound | Forbidden | { kind: "not_owner" } | { kind: "grade_has_no_owner" } | { kind: "grade_is_locked" } | { kind: "grade_deleted" };

export type GetGradeResult = NotFound | { kind: "grade_found"; grade: GradeView };

export type ListGradesResult = Forbidden | { kind: "grades_listed"; grades: GradeView[] };

export type LinkGradeAssessmentResult =
    | NotFound
    | Forbidden
    | { kind: "grade_assessment_already_exists" }
    | { kind: "grade_is_locked" }
    | { kind: "grade_already_has_source" }
    | { kind: "duplicate_grade_for_student" }
    | { kind: "grade_assessment_linked"; gradeAssessment: GradeAssessmentView };

export type GetGradeAssessmentResult =
    | NotFound
    | { kind: "grade_assessment_found"; gradeAssessment: GradeAssessmentView };

export type ListGradeAssessmentsResult =
    | NotFound
    | Forbidden
    | {
          kind: "grade_assessments_listed";
          gradeAssessments: GradeAssessmentView[];
      };

export type LinkGradeSessionExamResult =
    | NotFound
    | Forbidden
    | { kind: "grade_session_exam_already_exists" }
    | { kind: "grade_is_locked" }
    | { kind: "grade_already_has_source" }
    | { kind: "exam_session_not_found" }
    | { kind: "session_not_started" }
    | { kind: "student_not_registered_for_exam" }
    | { kind: "grade_session_exam_linked"; gradeSessionExam: GradeSessionExamView };

export type GetGradeSessionExamResult =
    | NotFound
    | { kind: "grade_session_exam_found"; gradeSessionExam: GradeSessionExamView };

export type ListGradeSessionExamsResult =
    | NotFound
    | Forbidden
    | {
          kind: "grade_session_exams_listed";
          gradeSessionExams: GradeSessionExamView[];
      };

export type LinkGradeManualNotationResult =
    | NotFound
    | Forbidden
    | { kind: "grade_manual_notation_already_exists" }
    | { kind: "grade_is_locked" }
    | { kind: "grade_already_has_source" }
    | { kind: "grade_manual_notation_linked"; gradeManualNotation: GradeManualNotationView };

export type GetGradeManualNotationResult =
    | NotFound
    | { kind: "grade_manual_notation_found"; gradeManualNotation: GradeManualNotationView };

export type ListGradeManualNotationsResult =
    | NotFound
    | Forbidden
    | {
          kind: "grade_manual_notations_listed";
          gradeManualNotations: GradeManualNotationView[];
      };

export type CreateManualNotationResult =
    | Forbidden
    | { kind: "notation_already_exists" }
    | { kind: "manual_notation_created"; manualNotation: ManualNotationView };

export type UpdateManualNotationResult =
    | NotFound
    | Forbidden
    | { kind: "notation_already_exists" }
    | { kind: "manual_notation_updated"; manualNotation: ManualNotationView };

export type DeleteManualNotationResult =
    | NotFound
    | Forbidden
    | { kind: "manual_notation_has_grades" }
    | { kind: "manual_notation_deleted" };

export type GetManualNotationResult =
    | NotFound
    | Forbidden
    | { kind: "manual_notation_found"; manualNotation: ManualNotationView };

export type ListManualNotationsResult = Forbidden | {
    kind: "manual_notations_listed";
    manualNotations: ManualNotationView[];
};

export type ListManualNotationsByModuleResult = NotFound | ListManualNotationsResult;

const toGradeView = (g: Grade): GradeView => ({
    id: g.id,
    studentId: g.studentId,
    value: g.value,
    isRetake: g.isRetake,
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
        private readonly assessments: AssessmentRepository,
        private readonly courses: CourseRepository,
        private readonly instructors: InstructorRepository,
        private readonly sessionExams: SessionExamRepository,
        private readonly sessions: SessionRepository,
        private readonly sessionExamStudents: SessionExamStudentRepository,
        private readonly modules: ModuleRepository,
    ) {}

    async create(input: {
        studentId: string;
        value: number;
        isRetake?: boolean;
    }, auth: AuthContext): Promise<CreateGradeResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
        const { studentId, value } = input;

        if (!isValidGradeValue(value)) return { kind: "grade_out_of_range" };

        if (!(await this.students.findById(studentId))) return NotFound;

        const grade: Grade = {
            id: randomUUID(),
            studentId,
            value,
            isRetake: input.isRetake ?? false,
            isLocked: false,
            enteredAt: new Date(),
            enteredBy: auth.requesterId,
        };
        await this.grades.save(grade);
        return { kind: "grade_created", grade: toGradeView(grade) };
    }

    async update(
        id: string,
        input: { value: number },
        auth: AuthContext,
    ): Promise<UpdateGradeResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;

        if (!auth.isSuperAdmin && grade.enteredBy !== auth.requesterId) {
            return (await this.canReadGrade(grade, auth)) ? ForbiddenOwnership : NotFound;
        }
        if (grade.isLocked) return { kind: "grade_is_locked" };

        if (!isValidGradeValue(input.value)) return { kind: "grade_out_of_range" };
        grade.value = input.value;
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
        if (!auth.isSuperAdmin && grade.enteredBy !== auth.requesterId) {
            if (!(await this.canReadGrade(grade, auth))) return NotFound;
            return grade.enteredBy === null ? { kind: "grade_has_no_owner" } : { kind: "not_owner" };
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

    async listByAssessment(assessmentId: string, auth: AuthContext): Promise<ListGradesResult | NotFound> {
        const assessment = await this.assessments.findById(assessmentId);
        if (!auth.isAdmin) {
            if (!assessment || !(await isCourseInstructor({ courses: this.courses, instructors: this.instructors }, assessment.courseId, auth.requesterId)))
                return ForbiddenOwnership;
        } else if (!assessment) {
            return NotFound;
        }
        const links = await this.gradeAssessments.findByAssessmentId(assessmentId);
        const grades = await Promise.all(links.map((l) => this.grades.findById(l.gradeId)));
        return { kind: "grades_listed", grades: grades.filter((g): g is Grade => !!g).map(toGradeView) };
    }

    async listMine(auth: AuthContext): Promise<NotFound | { kind: "grades_listed"; grades: GradeView[] }> {
        const student = await this.students.findByUserId(auth.requesterId);
        if (!student) return NotFound;
        const grades = await this.grades.findByStudentId(student.id);
        return { kind: "grades_listed", grades: grades.map(toGradeView) };
    }

    private async isInstructorResponsibleForGrade(gradeId: string, instructorId: string): Promise<boolean> {
        const [assessmentLinks, sessionExamLinks, manualLinks] = await Promise.all([
            this.gradeAssessments.findByGradeId(gradeId),
            this.gradeSessionExams.findByGradeId(gradeId),
            this.gradeManualNotations.findByGradeId(gradeId),
        ]);
        for (const link of assessmentLinks) {
            const assessment = await this.assessments.findById(link.assessmentId);
            const course = assessment ? await this.courses.findById(assessment.courseId) : null;
            if (course && course.instructorId === instructorId) return true;
        }
        for (const link of sessionExamLinks) {
            const sessionExam = await this.sessionExams.findById(link.sessionExamId);
            const session = sessionExam ? await this.sessions.findById(sessionExam.sessionId) : null;
            const course = session ? await this.courses.findById(session.courseId) : null;
            if (course && course.instructorId === instructorId) return true;
        }
        for (const link of manualLinks) {
            const notation = await this.manualNotations.findById(link.gradeManualId);
            if (!notation) continue;
            const moduleCourses = await this.courses.findByModuleId(notation.moduleId);
            if (moduleCourses.some((c) => c.instructorId === instructorId)) return true;
        }
        return false;
    }

    private async canReadGrade(grade: Grade, auth: AuthContext): Promise<boolean> {
        if (auth.isAdmin) return true;
        if (grade.enteredBy && grade.enteredBy === auth.requesterId) return true;
        const student = await this.students.findByUserId(auth.requesterId);
        if (student && student.id === grade.studentId) return true;
        const instructor = await this.instructors.findByUserId(auth.requesterId);
        return !!instructor && (await this.isInstructorResponsibleForGrade(grade.id, instructor.id));
    }

    async findById(id: string, auth: AuthContext): Promise<GetGradeResult> {
        const grade = await this.grades.findById(id);
        if (!grade) return NotFound;
        if (!(await this.canReadGrade(grade, auth))) return NotFound;
        return { kind: "grade_found", grade: toGradeView(grade) };
    }

    private async canReadGradeById(gradeId: string, auth: AuthContext): Promise<boolean> {
        const grade = await this.grades.findById(gradeId);
        return !!grade && (await this.canReadGrade(grade, auth));
    }

    private async canReadCourseGrades(courseId: string, auth: AuthContext): Promise<boolean> {
        if (auth.isAdmin) return true;
        return isCourseInstructor({ courses: this.courses, instructors: this.instructors }, courseId, auth.requesterId);
    }

    private async canManageModuleNotations(moduleId: string, auth: AuthContext): Promise<boolean> {
        if (auth.isAdmin) return true;
        if (!auth.isInstructor) return false;
        const instructor = await this.instructors.findByUserId(auth.requesterId);
        if (!instructor) return false;
        const moduleCourses = await this.courses.findByModuleId(moduleId);
        return moduleCourses.some((c) => c.instructorId === instructor.id);
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
        gradeId: string;
        assessmentId: string;
    }, auth: AuthContext): Promise<LinkGradeAssessmentResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
        const { gradeId, assessmentId } = input;
        const grade = await this.grades.findById(gradeId);
        if (!grade) return NotFound;
        const assessment = await this.assessments.findById(assessmentId);
        if (!assessment) return NotFound;

        if (!auth.isSuperAdmin) {
            if (grade.enteredBy !== auth.requesterId) return ForbiddenOwnership;
            const instructor = await this.instructors.findByUserId(auth.requesterId);
            const course = await this.courses.findById(assessment.courseId);
            if (!instructor || !course || course.instructorId !== instructor.id) return ForbiddenOwnership;
        }

        if (grade.isLocked) return { kind: "grade_is_locked" };
        if (await this.gradeAssessments.findByGradeAndAssessment(gradeId, assessmentId)) return { kind: "grade_assessment_already_exists" };
        if (await this.gradeHasAnySource(gradeId)) return { kind: "grade_already_has_source" };

        const links = await this.gradeAssessments.findByAssessmentId(assessmentId);
        for (const link of links) {
            const other = await this.grades.findById(link.gradeId);
            if (other && other.id !== gradeId && other.studentId === grade.studentId && other.isRetake === grade.isRetake)
                return { kind: "duplicate_grade_for_student" };
        }
        const entry: GradeAssessment = { id: randomUUID(), gradeId, assessmentId };
        await this.gradeAssessments.save(entry);
        return { kind: "grade_assessment_linked", gradeAssessment: toGradeAssessmentView(entry) };
    }

    async findAssessmentLinkById(id: string, auth: AuthContext): Promise<GetGradeAssessmentResult> {
        const entry = await this.gradeAssessments.findById(id);
        if (!entry) return NotFound;
        if (!(await this.canReadGradeById(entry.gradeId, auth))) return NotFound;
        return { kind: "grade_assessment_found", gradeAssessment: toGradeAssessmentView(entry) };
    }

    async listAssessmentLinksByGrade(gradeId: string, auth: AuthContext): Promise<ListGradeAssessmentsResult> {
        if (!(await this.canReadGradeById(gradeId, auth))) return NotFound;
        const entries = await this.gradeAssessments.findByGradeId(gradeId);
        return { kind: "grade_assessments_listed", gradeAssessments: entries.map(toGradeAssessmentView) };
    }

    async listAssessmentLinksByAssessment(assessmentId: string, auth: AuthContext): Promise<ListGradeAssessmentsResult> {
        const assessment = await this.assessments.findById(assessmentId);
        if (!auth.isAdmin) {
            if (!assessment || !(await this.canReadCourseGrades(assessment.courseId, auth))) return ForbiddenOwnership;
        } else if (!assessment) {
            return NotFound;
        }
        const entries = await this.gradeAssessments.findByAssessmentId(assessmentId);
        return { kind: "grade_assessments_listed", gradeAssessments: entries.map(toGradeAssessmentView) };
    }

    async linkSessionExam(input: {
        gradeId: string;
        sessionExamId: string;
    }, auth: AuthContext): Promise<LinkGradeSessionExamResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
        const { gradeId, sessionExamId } = input;
        const grade = await this.grades.findById(gradeId);
        if (!grade) return NotFound;
        const sessionExam = await this.sessionExams.findById(sessionExamId);
        if (!sessionExam) return NotFound;
        const session = await this.sessions.findById(sessionExam.sessionId);

        if (!auth.isSuperAdmin) {
            if (grade.enteredBy !== auth.requesterId) return ForbiddenOwnership;
            const instructor = await this.instructors.findByUserId(auth.requesterId);
            const course = session ? await this.courses.findById(session.courseId) : null;
            if (!instructor || !course || course.instructorId !== instructor.id) return ForbiddenOwnership;
        }

        if (grade.isLocked) return { kind: "grade_is_locked" };

        if (!session) return { kind: "exam_session_not_found" };

        if (!sessionHasStarted(session)) return { kind: "session_not_started" };

        if (!(await this.sessionExamStudents.findByExamAndStudent(sessionExamId, grade.studentId)))
            return { kind: "student_not_registered_for_exam" };
        if (await this.gradeSessionExams.findByGradeAndSessionExam(gradeId, sessionExamId)) return { kind: "grade_session_exam_already_exists" };
        if (await this.gradeHasAnySource(gradeId)) return { kind: "grade_already_has_source" };
        const entry: GradeSessionExam = { id: randomUUID(), gradeId, sessionExamId };
        await this.gradeSessionExams.save(entry);
        return { kind: "grade_session_exam_linked", gradeSessionExam: toGradeSessionExamView(entry) };
    }

    async findSessionExamLinkById(id: string, auth: AuthContext): Promise<GetGradeSessionExamResult> {
        const entry = await this.gradeSessionExams.findById(id);
        if (!entry) return NotFound;
        if (!(await this.canReadGradeById(entry.gradeId, auth))) return NotFound;
        return { kind: "grade_session_exam_found", gradeSessionExam: toGradeSessionExamView(entry) };
    }

    async listSessionExamLinksByGrade(gradeId: string, auth: AuthContext): Promise<ListGradeSessionExamsResult> {
        if (!(await this.canReadGradeById(gradeId, auth))) return NotFound;
        const entries = await this.gradeSessionExams.findByGradeId(gradeId);
        return { kind: "grade_session_exams_listed", gradeSessionExams: entries.map(toGradeSessionExamView) };
    }

    async listSessionExamLinksBySessionExam(sessionExamId: string, auth: AuthContext): Promise<ListGradeSessionExamsResult> {
        const sessionExam = await this.sessionExams.findById(sessionExamId);
        if (!auth.isAdmin) {
            const session = sessionExam ? await this.sessions.findById(sessionExam.sessionId) : null;
            if (!session || !(await this.canReadCourseGrades(session.courseId, auth))) return ForbiddenOwnership;
        } else if (!sessionExam) {
            return NotFound;
        }
        const entries = await this.gradeSessionExams.findBySessionExamId(sessionExamId);
        return { kind: "grade_session_exams_listed", gradeSessionExams: entries.map(toGradeSessionExamView) };
    }

    async linkManualNotation(input: {
        gradeId: string;
        gradeManualId: string;
    }, auth: AuthContext): Promise<LinkGradeManualNotationResult> {
        if (!auth.isSuperAdmin && !auth.isInstructor) return Forbidden;
        const { gradeId, gradeManualId } = input;

        const grade = await this.grades.findById(gradeId);
        if (!grade) return NotFound;
        const notation = await this.manualNotations.findById(gradeManualId);
        if (!notation) return NotFound;

        if (!auth.isSuperAdmin) {
            if (grade.enteredBy !== auth.requesterId) return ForbiddenOwnership;
            const instructor = await this.instructors.findByUserId(auth.requesterId);
            if (!instructor) return ForbiddenOwnership;
            const moduleCourses = await this.courses.findByModuleId(notation.moduleId);
            if (!moduleCourses.some((c) => c.instructorId === instructor.id)) return ForbiddenOwnership;
        }

        if (grade.isLocked) return { kind: "grade_is_locked" };
        if (await this.gradeManualNotations.findByGradeAndManualNotation(gradeId, gradeManualId)) return { kind: "grade_manual_notation_already_exists" };
        if (await this.gradeHasAnySource(gradeId)) return { kind: "grade_already_has_source" };
        const entry: GradeManualNotation = { id: randomUUID(), gradeId, gradeManualId };
        await this.gradeManualNotations.save(entry);
        return {
            kind: "grade_manual_notation_linked",
            gradeManualNotation: toGradeManualNotationView(entry),
        };
    }

    async findManualNotationLinkById(id: string, auth: AuthContext): Promise<GetGradeManualNotationResult> {
        const entry = await this.gradeManualNotations.findById(id);
        if (!entry) return NotFound;
        if (!(await this.canReadGradeById(entry.gradeId, auth))) return NotFound;
        return {
            kind: "grade_manual_notation_found",
            gradeManualNotation: toGradeManualNotationView(entry),
        };
    }

    async listManualNotationLinksByGrade(gradeId: string, auth: AuthContext): Promise<ListGradeManualNotationsResult> {
        if (!(await this.canReadGradeById(gradeId, auth))) return NotFound;
        const entries = await this.gradeManualNotations.findByGradeId(gradeId);
        return {
            kind: "grade_manual_notations_listed",
            gradeManualNotations: entries.map(toGradeManualNotationView),
        };
    }

    async listManualNotationLinksByGradeManual(gradeManualId: string, auth: AuthContext): Promise<ListGradeManualNotationsResult> {
        const notation = await this.manualNotations.findById(gradeManualId);
        if (!auth.isAdmin) {
            const instructor = notation ? await this.instructors.findByUserId(auth.requesterId) : null;
            const moduleCourses = notation ? await this.courses.findByModuleId(notation.moduleId) : [];
            if (!notation || !instructor || !moduleCourses.some((c) => c.instructorId === instructor.id)) return ForbiddenOwnership;
        } else if (!notation) {
            return NotFound;
        }
        const entries = await this.gradeManualNotations.findByGradeManualId(gradeManualId);
        return {
            kind: "grade_manual_notations_listed",
            gradeManualNotations: entries.map(toGradeManualNotationView),
        };
    }

    async createManualNotation(input: {
        moduleId: string;
        name: string;
    }, auth: AuthContext): Promise<CreateManualNotationResult> {
        if (!auth.isAdmin) return Forbidden;
        const { moduleId, name } = input;
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

        const targetModuleId = input.moduleId ?? entry.moduleId;
        const targetName = input.name ?? entry.name;
        const duplicate = await this.manualNotations.findByModuleAndName(targetModuleId, targetName);
        if (duplicate && duplicate.id !== entry.id) return { kind: "notation_already_exists" };
        entry.moduleId = targetModuleId;
        entry.name = targetName;
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

    async findManualNotationById(id: string, auth: AuthContext): Promise<GetManualNotationResult> {
        const entry = await this.manualNotations.findById(id);
        if (!entry) return NotFound;
        if (await this.canManageModuleNotations(entry.moduleId, auth)) {
            return { kind: "manual_notation_found", manualNotation: toManualNotationView(entry) };
        }

        const links = await this.gradeManualNotations.findByGradeManualId(id);
        for (const link of links) {
            const grade = await this.grades.findById(link.gradeId);
            if (grade && (await this.canReadGrade(grade, auth))) {
                return { kind: "manual_notation_found", manualNotation: toManualNotationView(entry) };
            }
        }
        return ForbiddenOwnership;
    }

    async listManualNotations(auth: AuthContext): Promise<ListManualNotationsResult> {
        if (!auth.isAdmin) return Forbidden;
        const entries = await this.manualNotations.list();
        return { kind: "manual_notations_listed", manualNotations: entries.map(toManualNotationView) };
    }

    async listManualNotationsByModule(moduleId: string, auth: AuthContext): Promise<ListManualNotationsByModuleResult> {
        if (!(await this.modules.findById(moduleId))) return NotFound;
        if (!(await this.canManageModuleNotations(moduleId, auth))) return ForbiddenOwnership;
        const entries = await this.manualNotations.findByModuleId(moduleId);
        return { kind: "manual_notations_listed", manualNotations: entries.map(toManualNotationView) };
    }
}
