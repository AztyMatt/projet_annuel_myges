import { randomUUID } from "node:crypto";
import { type SessionExam } from "@domain/session/session-exam/session-exam.entity";
import { type SessionExamType } from "@domain/session/session-exam/session-exam.enums";
import { type SessionExamStudent } from "@domain/session/session-exam/session-exam-student/session-exam-student.entity";
import { type SessionExamInstructor } from "@domain/session/session-exam/session-exam-instructor/session-exam-instructor.entity";
import { type SessionExamExternal } from "@domain/session/session-exam/session-exam-external/session-exam-external.entity";
import { type SessionExamRepository } from "@application/session/session-exam/session-exam.repository";
import { type SessionExamStudentRepository } from "@application/session/session-exam/session-exam-student/session-exam-student.repository";
import { type SessionExamInstructorRepository } from "@application/session/session-exam/session-exam-instructor/session-exam-instructor.repository";
import { type SessionExamExternalRepository } from "@application/session/session-exam/session-exam-external/session-exam-external.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type GradeSessionExamRepository } from "@application/grade/grade-session-exam/grade-session-exam.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type ExternalRepository } from "@application/external/external.repository";
import { type AssessmentRepository } from "@application/assessment/assessment.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { sessionHasStarted } from "@domain/session/session.policy";
import { NotFound, Forbidden, ForbiddenOwnership } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";
import { canReadSession, canReadCourseSessions, canReadSessionExam, canReadExamComposition } from "@application/session/session-access";

export type SessionExamView = {
    id: string;
    sessionId: string;
    type: SessionExamType;
    isRetake: boolean;
    assessmentId: string | null;
};

export type SessionExamStudentView = {
    id: string;
    sessionExamId: string;
    studentId: string;
};

export type SessionExamInstructorView = {
    id: string;
    sessionExamId: string;
    instructorId: string;
};

export type SessionExamExternalView = {
    id: string;
    sessionExamId: string;
    externalId: string;
};

export type CreateSessionExamResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_already_started" }
    | { kind: "assessment_course_mismatch" }
    | { kind: "session_exam_created"; sessionExam: SessionExamView };

export type UpdateSessionExamResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_already_started" }
    | { kind: "assessment_course_mismatch" }
    | { kind: "session_exam_updated"; sessionExam: SessionExamView };

export type DeleteSessionExamResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_already_started" }
    | { kind: "session_exam_has_grades" }
    | { kind: "session_exam_deleted" };

export type GetSessionExamResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_found"; sessionExam: SessionExamView };

export type ListSessionExamsResult = Forbidden | { kind: "session_exams_listed"; sessionExams: SessionExamView[] };

export type AddSessionExamStudentResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_already_started" }
    | { kind: "student_already_registered" }
    | { kind: "session_exam_student_added"; sessionExamStudent: SessionExamStudentView };

export type DeleteSessionExamStudentResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_already_started" }
    | { kind: "session_exam_has_grades" }
    | { kind: "session_exam_student_deleted" };

export type GetSessionExamStudentResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_student_found"; sessionExamStudent: SessionExamStudentView };

export type ListMineSessionExamsResult =
    | NotFound
    | { kind: "session_exams_listed"; sessionExams: SessionExamView[] };

export type ListSessionExamStudentsResult = Forbidden | {
    kind: "session_exam_students_listed";
    sessionExamStudents: SessionExamStudentView[];
};

export type AddSessionExamInstructorResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_already_started" }
    | { kind: "instructor_already_in_jury" }
    | { kind: "session_exam_instructor_added"; sessionExamInstructor: SessionExamInstructorView };

export type DeleteSessionExamInstructorResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_already_started" }
    | { kind: "session_exam_instructor_deleted" };

export type GetSessionExamInstructorResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_instructor_found"; sessionExamInstructor: SessionExamInstructorView };

export type ListSessionExamInstructorsResult = Forbidden | {
    kind: "session_exam_instructors_listed";
    sessionExamInstructors: SessionExamInstructorView[];
};

export type AddSessionExamExternalResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_already_started" }
    | { kind: "external_already_in_jury" }
    | { kind: "session_exam_external_added"; sessionExamExternal: SessionExamExternalView };

export type DeleteSessionExamExternalResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_already_started" }
    | { kind: "session_exam_external_deleted" };

export type GetSessionExamExternalResult =
    | NotFound
    | Forbidden
    | { kind: "session_exam_external_found"; sessionExamExternal: SessionExamExternalView };

export type ListSessionExamExternalsResult = Forbidden | {
    kind: "session_exam_externals_listed";
    sessionExamExternals: SessionExamExternalView[];
};

const toSessionExamView = (s: SessionExam): SessionExamView => ({
    id: s.id,
    sessionId: s.sessionId,
    type: s.type,
    isRetake: s.isRetake,
    assessmentId: s.assessmentId,
});

const toSessionExamStudentView = (s: SessionExamStudent): SessionExamStudentView => ({
    id: s.id,
    sessionExamId: s.sessionExamId,
    studentId: s.studentId,
});

const toSessionExamInstructorView = (s: SessionExamInstructor): SessionExamInstructorView => ({
    id: s.id,
    sessionExamId: s.sessionExamId,
    instructorId: s.instructorId,
});

const toSessionExamExternalView = (s: SessionExamExternal): SessionExamExternalView => ({
    id: s.id,
    sessionExamId: s.sessionExamId,
    externalId: s.externalId,
});

export class SessionExamUseCases {
    constructor(
        private readonly sessionExams: SessionExamRepository,
        private readonly sessionExamStudents: SessionExamStudentRepository,
        private readonly sessionExamInstructors: SessionExamInstructorRepository,
        private readonly sessionExamExternals: SessionExamExternalRepository,
        private readonly sessions: SessionRepository,
        private readonly gradeSessionExams: GradeSessionExamRepository,
        private readonly students: StudentRepository,
        private readonly instructors: InstructorRepository,
        private readonly externals: ExternalRepository,
        private readonly assessments: AssessmentRepository,
        private readonly courses: CourseRepository,
        private readonly studentGroups: StudentGroupRepository,
    ) {}

    private get accessDeps() {
        return {
            courses: this.courses,
            instructors: this.instructors,
            students: this.students,
            studentGroups: this.studentGroups,
            sessions: this.sessions,
            sessionExamStudents: this.sessionExamStudents,
            sessionExamInstructors: this.sessionExamInstructors,
        };
    }

    private async isSessionStarted(sessionExamId: string): Promise<boolean> {
        const sessionExam = await this.sessionExams.findById(sessionExamId);
        if (!sessionExam) return false;
        return this.hasSessionStarted(sessionExam);
    }

    private async hasSessionStarted(sessionExam: { sessionId: string }): Promise<boolean> {
        const session = await this.sessions.findById(sessionExam.sessionId);
        return !!session && sessionHasStarted(session);
    }

    async create(input: {
        sessionId?: string;
        type?: SessionExamType;
        isRetake?: boolean;
        assessmentId?: string | null;
    }, auth: AuthContext): Promise<CreateSessionExamResult> {
        if (!auth.isAdmin) return Forbidden;
        const { sessionId, type, isRetake, assessmentId } = input as {
            sessionId: string;
            type: SessionExamType;
            isRetake?: boolean;
            assessmentId?: string | null;
        };

        const session = await this.sessions.findById(sessionId);
        if (!session) return NotFound;

        if (sessionHasStarted(session)) return { kind: "session_exam_already_started" };

        if (assessmentId != null) {
            const assessment = await this.assessments.findById(assessmentId);
            if (!assessment) return NotFound;

            if (assessment.courseId !== session.courseId) return { kind: "assessment_course_mismatch" };
        }
        const sessionExam: SessionExam = {
            id: randomUUID(),
            sessionId,
            type,
            isRetake: isRetake ?? false,
            assessmentId: assessmentId ?? null,
        };
        await this.sessionExams.save(sessionExam);
        return { kind: "session_exam_created", sessionExam: toSessionExamView(sessionExam) };
    }

    async update(
        id: string,
        input: { type?: SessionExamType; isRetake?: boolean; assessmentId?: string | null },
        auth: AuthContext,
    ): Promise<UpdateSessionExamResult> {
        if (!auth.isAdmin) return Forbidden;
        const sessionExam = await this.sessionExams.findById(id);
        if (!sessionExam) return NotFound;
        if (await this.hasSessionStarted(sessionExam)) return { kind: "session_exam_already_started" };

        if (input.assessmentId != null) {
            const assessment = await this.assessments.findById(input.assessmentId);
            if (!assessment) return NotFound;

            const session = await this.sessions.findById(sessionExam.sessionId);
            if (!session) return NotFound;
            if (assessment.courseId !== session.courseId) return { kind: "assessment_course_mismatch" };
        }
        if (input.type !== undefined) sessionExam.type = input.type;
        if (input.isRetake !== undefined) sessionExam.isRetake = input.isRetake;
        if (input.assessmentId !== undefined) sessionExam.assessmentId = input.assessmentId;
        await this.sessionExams.save(sessionExam);
        return { kind: "session_exam_updated", sessionExam: toSessionExamView(sessionExam) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteSessionExamResult> {
        if (!auth.isAdmin) return Forbidden;
        const sessionExam = await this.sessionExams.findById(id);
        if (!sessionExam) return NotFound;
        if (await this.hasSessionStarted(sessionExam)) return { kind: "session_exam_already_started" };
        if (await this.gradeSessionExams.existsBySessionExamId(id)) return { kind: "session_exam_has_grades" };
        await this.sessionExams.deleteById(id);
        return { kind: "session_exam_deleted" };
    }

    async findById(id: string, auth: AuthContext): Promise<GetSessionExamResult> {
        const sessionExam = await this.sessionExams.findById(id);
        if (!sessionExam) return NotFound;

        if (!(await canReadSessionExam(this.accessDeps, sessionExam, auth))) return ForbiddenOwnership;
        return { kind: "session_exam_found", sessionExam: toSessionExamView(sessionExam) };
    }

    async list(auth: AuthContext): Promise<ListSessionExamsResult> {
        if (!auth.isAdmin) return Forbidden;
        const sessionExams = await this.sessionExams.list();
        return { kind: "session_exams_listed", sessionExams: sessionExams.map(toSessionExamView) };
    }

    async listBySession(sessionId: string, auth: AuthContext): Promise<ListSessionExamsResult> {
        if (!auth.isAdmin) {
            const session = await this.sessions.findById(sessionId);
            if (!session || !(await canReadSession(this.accessDeps, session, auth))) return ForbiddenOwnership;
        }
        const sessionExams = await this.sessionExams.findBySessionId(sessionId);
        return { kind: "session_exams_listed", sessionExams: sessionExams.map(toSessionExamView) };
    }

    async listByAssessment(assessmentId: string, auth: AuthContext): Promise<ListSessionExamsResult> {
        if (!auth.isAdmin) {
            const assessment = await this.assessments.findById(assessmentId);
            if (!assessment || !(await canReadCourseSessions(this.accessDeps, assessment.courseId, auth))) return ForbiddenOwnership;
        }
        const sessionExams = await this.sessionExams.findByAssessmentId(assessmentId);
        return { kind: "session_exams_listed", sessionExams: sessionExams.map(toSessionExamView) };
    }

    async addStudent(input: {
        sessionExamId?: string;
        studentId?: string;
    }, auth: AuthContext): Promise<AddSessionExamStudentResult> {
        if (!auth.isAdmin) return Forbidden;
        const { sessionExamId, studentId } = input as { sessionExamId: string; studentId: string };
        const sessionExam = await this.sessionExams.findById(sessionExamId);
        if (!sessionExam) return NotFound;
        if (!(await this.students.findById(studentId))) return NotFound;
        if (await this.hasSessionStarted(sessionExam)) return { kind: "session_exam_already_started" };
        if (await this.sessionExamStudents.findByExamAndStudent(sessionExamId, studentId)) return { kind: "student_already_registered" };
        const entry: SessionExamStudent = { id: randomUUID(), sessionExamId, studentId };
        await this.sessionExamStudents.save(entry);
        return { kind: "session_exam_student_added", sessionExamStudent: toSessionExamStudentView(entry) };
    }

    async removeStudent(id: string, auth: AuthContext): Promise<DeleteSessionExamStudentResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.sessionExamStudents.findById(id);
        if (!entry) return NotFound;
        if (await this.isSessionStarted(entry.sessionExamId)) return { kind: "session_exam_already_started" };
        if (await this.gradeSessionExams.existsBySessionExamIdAndStudentId(entry.sessionExamId, entry.studentId))
            return { kind: "session_exam_has_grades" };
        await this.sessionExamStudents.deleteById(id);
        return { kind: "session_exam_student_deleted" };
    }

    async findStudentById(id: string, auth: AuthContext): Promise<GetSessionExamStudentResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.sessionExamStudents.findById(id);
        if (!entry) return NotFound;
        return { kind: "session_exam_student_found", sessionExamStudent: toSessionExamStudentView(entry) };
    }

    async listMine(auth: AuthContext): Promise<ListMineSessionExamsResult> {
        const student = await this.students.findByUserId(auth.requesterId);
        if (student) {
            const regs = await this.sessionExamStudents.findByStudentId(student.id);
            const exams = await this.resolveExams(regs.map((r) => r.sessionExamId));
            return { kind: "session_exams_listed", sessionExams: exams };
        }
        const instructor = await this.instructors.findByUserId(auth.requesterId);
        if (instructor) {
            const jury = await this.sessionExamInstructors.findByInstructorId(instructor.id);
            const exams = await this.resolveExams(jury.map((j) => j.sessionExamId));
            return { kind: "session_exams_listed", sessionExams: exams };
        }
        return NotFound;
    }

    private async resolveExams(sessionExamIds: string[]): Promise<SessionExamView[]> {
        const exams = await Promise.all(sessionExamIds.map((id) => this.sessionExams.findById(id)));
        return exams.filter((e): e is SessionExam => !!e).map(toSessionExamView);
    }

    async listStudentsBySessionExam(sessionExamId: string, auth: AuthContext): Promise<ListSessionExamStudentsResult> {
        if (!auth.isAdmin) {
            const exam = await this.sessionExams.findById(sessionExamId);
            if (!exam || !(await canReadExamComposition(this.accessDeps, exam, auth))) return ForbiddenOwnership;
        }
        const entries = await this.sessionExamStudents.findBySessionExamId(sessionExamId);
        return {
            kind: "session_exam_students_listed",
            sessionExamStudents: entries.map(toSessionExamStudentView),
        };
    }

    async listSessionExamsByStudent(studentId: string, auth: AuthContext): Promise<ListSessionExamStudentsResult> {
        if (!auth.isAdmin) return Forbidden;
        const entries = await this.sessionExamStudents.findByStudentId(studentId);
        return {
            kind: "session_exam_students_listed",
            sessionExamStudents: entries.map(toSessionExamStudentView),
        };
    }

    async addInstructor(input: {
        sessionExamId?: string;
        instructorId?: string;
    }, auth: AuthContext): Promise<AddSessionExamInstructorResult> {
        if (!auth.isAdmin) return Forbidden;
        const { sessionExamId, instructorId } = input as { sessionExamId: string; instructorId: string };
        const sessionExam = await this.sessionExams.findById(sessionExamId);
        if (!sessionExam) return NotFound;
        if (!(await this.instructors.findById(instructorId))) return NotFound;
        if (await this.hasSessionStarted(sessionExam)) return { kind: "session_exam_already_started" };
        if (await this.sessionExamInstructors.findByExamAndInstructor(sessionExamId, instructorId)) return { kind: "instructor_already_in_jury" };
        const entry: SessionExamInstructor = { id: randomUUID(), sessionExamId, instructorId };
        await this.sessionExamInstructors.save(entry);
        return {
            kind: "session_exam_instructor_added",
            sessionExamInstructor: toSessionExamInstructorView(entry),
        };
    }

    async removeInstructor(id: string, auth: AuthContext): Promise<DeleteSessionExamInstructorResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.sessionExamInstructors.findById(id);
        if (!entry) return NotFound;
        if (await this.isSessionStarted(entry.sessionExamId)) return { kind: "session_exam_already_started" };
        await this.sessionExamInstructors.deleteById(id);
        return { kind: "session_exam_instructor_deleted" };
    }

    async findInstructorById(id: string, auth: AuthContext): Promise<GetSessionExamInstructorResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.sessionExamInstructors.findById(id);
        if (!entry) return NotFound;
        return {
            kind: "session_exam_instructor_found",
            sessionExamInstructor: toSessionExamInstructorView(entry),
        };
    }

    async listInstructorsBySessionExam(sessionExamId: string, auth: AuthContext): Promise<ListSessionExamInstructorsResult> {
        if (!auth.isAdmin) {
            const exam = await this.sessionExams.findById(sessionExamId);
            if (!exam || !(await canReadExamComposition(this.accessDeps, exam, auth))) return ForbiddenOwnership;
        }
        const entries = await this.sessionExamInstructors.findBySessionExamId(sessionExamId);
        return {
            kind: "session_exam_instructors_listed",
            sessionExamInstructors: entries.map(toSessionExamInstructorView),
        };
    }

    async listSessionExamsByInstructor(instructorId: string, auth: AuthContext): Promise<ListSessionExamInstructorsResult> {
        if (!auth.isAdmin) return Forbidden;
        const entries = await this.sessionExamInstructors.findByInstructorId(instructorId);
        return {
            kind: "session_exam_instructors_listed",
            sessionExamInstructors: entries.map(toSessionExamInstructorView),
        };
    }

    async addExternal(input: {
        sessionExamId?: string;
        externalId?: string;
    }, auth: AuthContext): Promise<AddSessionExamExternalResult> {
        if (!auth.isAdmin) return Forbidden;
        const { sessionExamId, externalId } = input as { sessionExamId: string; externalId: string };
        const sessionExam = await this.sessionExams.findById(sessionExamId);
        if (!sessionExam) return NotFound;
        if (!(await this.externals.findById(externalId))) return NotFound;
        if (await this.hasSessionStarted(sessionExam)) return { kind: "session_exam_already_started" };
        if (await this.sessionExamExternals.findByExamAndExternal(sessionExamId, externalId)) return { kind: "external_already_in_jury" };
        const entry: SessionExamExternal = { id: randomUUID(), sessionExamId, externalId };
        await this.sessionExamExternals.save(entry);
        return {
            kind: "session_exam_external_added",
            sessionExamExternal: toSessionExamExternalView(entry),
        };
    }

    async removeExternal(id: string, auth: AuthContext): Promise<DeleteSessionExamExternalResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.sessionExamExternals.findById(id);
        if (!entry) return NotFound;
        if (await this.isSessionStarted(entry.sessionExamId)) return { kind: "session_exam_already_started" };
        await this.sessionExamExternals.deleteById(id);
        return { kind: "session_exam_external_deleted" };
    }

    async findExternalById(id: string, auth: AuthContext): Promise<GetSessionExamExternalResult> {
        if (!auth.isAdmin) return Forbidden;
        const entry = await this.sessionExamExternals.findById(id);
        if (!entry) return NotFound;
        return {
            kind: "session_exam_external_found",
            sessionExamExternal: toSessionExamExternalView(entry),
        };
    }

    async listExternalsBySessionExam(sessionExamId: string, auth: AuthContext): Promise<ListSessionExamExternalsResult> {
        if (!auth.isAdmin) {
            const exam = await this.sessionExams.findById(sessionExamId);
            if (!exam || !(await canReadExamComposition(this.accessDeps, exam, auth))) return ForbiddenOwnership;
        }
        const entries = await this.sessionExamExternals.findBySessionExamId(sessionExamId);
        return {
            kind: "session_exam_externals_listed",
            sessionExamExternals: entries.map(toSessionExamExternalView),
        };
    }

    async listSessionExamsByExternal(externalId: string, auth: AuthContext): Promise<ListSessionExamExternalsResult> {
        if (!auth.isAdmin) return Forbidden;
        const entries = await this.sessionExamExternals.findByExternalId(externalId);
        return {
            kind: "session_exam_externals_listed",
            sessionExamExternals: entries.map(toSessionExamExternalView),
        };
    }
}
