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
import { NotFound, MissingFields } from "@application/types/results";

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
    | MissingFields
    | { kind: "session_exam_created"; sessionExam: SessionExamView };

export type UpdateSessionExamResult =
    | NotFound
    | { kind: "session_exam_updated"; sessionExam: SessionExamView };

export type DeleteSessionExamResult = NotFound | { kind: "session_exam_deleted" };

export type GetSessionExamResult =
    | NotFound
    | { kind: "session_exam_found"; sessionExam: SessionExamView };

export type ListSessionExamsResult = { kind: "session_exams_listed"; sessionExams: SessionExamView[] };

export type AddSessionExamStudentResult =
    | MissingFields
    | { kind: "student_already_registered" }
    | { kind: "session_exam_student_added"; sessionExamStudent: SessionExamStudentView };

export type DeleteSessionExamStudentResult =
    | NotFound
    | { kind: "session_exam_student_deleted" };

export type GetSessionExamStudentResult =
    | NotFound
    | { kind: "session_exam_student_found"; sessionExamStudent: SessionExamStudentView };

export type ListSessionExamStudentsResult = {
    kind: "session_exam_students_listed";
    sessionExamStudents: SessionExamStudentView[];
};

export type AddSessionExamInstructorResult =
    | MissingFields
    | { kind: "instructor_already_in_jury" }
    | { kind: "session_exam_instructor_added"; sessionExamInstructor: SessionExamInstructorView };

export type DeleteSessionExamInstructorResult =
    | NotFound
    | { kind: "session_exam_instructor_deleted" };

export type GetSessionExamInstructorResult =
    | NotFound
    | { kind: "session_exam_instructor_found"; sessionExamInstructor: SessionExamInstructorView };

export type ListSessionExamInstructorsResult = {
    kind: "session_exam_instructors_listed";
    sessionExamInstructors: SessionExamInstructorView[];
};

export type AddSessionExamExternalResult =
    | MissingFields
    | { kind: "external_already_in_jury" }
    | { kind: "session_exam_external_added"; sessionExamExternal: SessionExamExternalView };

export type DeleteSessionExamExternalResult =
    | NotFound
    | { kind: "session_exam_external_deleted" };

export type GetSessionExamExternalResult =
    | NotFound
    | { kind: "session_exam_external_found"; sessionExamExternal: SessionExamExternalView };

export type ListSessionExamExternalsResult = {
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
    ) {}

    async create(input: {
        sessionId?: string;
        type?: SessionExamType;
        isRetake?: boolean;
        assessmentId?: string | null;
    }): Promise<CreateSessionExamResult> {
        const { sessionId, type, isRetake, assessmentId } = input;
        if (!sessionId || !type) return MissingFields;
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
    ): Promise<UpdateSessionExamResult> {
        const sessionExam = await this.sessionExams.findById(id);
        if (!sessionExam) return NotFound;
        if (input.type !== undefined) sessionExam.type = input.type;
        if (input.isRetake !== undefined) sessionExam.isRetake = input.isRetake;
        if (input.assessmentId !== undefined) sessionExam.assessmentId = input.assessmentId;
        await this.sessionExams.save(sessionExam);
        return { kind: "session_exam_updated", sessionExam: toSessionExamView(sessionExam) };
    }

    async delete(id: string): Promise<DeleteSessionExamResult> {
        const sessionExam = await this.sessionExams.findById(id);
        if (!sessionExam) return NotFound;
        await this.sessionExams.deleteById(id);
        return { kind: "session_exam_deleted" };
    }

    async findById(id: string): Promise<GetSessionExamResult> {
        const sessionExam = await this.sessionExams.findById(id);
        if (!sessionExam) return NotFound;
        return { kind: "session_exam_found", sessionExam: toSessionExamView(sessionExam) };
    }

    async list(): Promise<ListSessionExamsResult> {
        const sessionExams = await this.sessionExams.list();
        return { kind: "session_exams_listed", sessionExams: sessionExams.map(toSessionExamView) };
    }

    async listBySession(sessionId: string): Promise<ListSessionExamsResult> {
        const sessionExams = await this.sessionExams.findBySessionId(sessionId);
        return { kind: "session_exams_listed", sessionExams: sessionExams.map(toSessionExamView) };
    }

    async listByAssessment(assessmentId: string): Promise<ListSessionExamsResult> {
        const sessionExams = await this.sessionExams.findByAssessmentId(assessmentId);
        return { kind: "session_exams_listed", sessionExams: sessionExams.map(toSessionExamView) };
    }

    async addStudent(input: {
        sessionExamId?: string;
        studentId?: string;
    }): Promise<AddSessionExamStudentResult> {
        const { sessionExamId, studentId } = input;
        if (!sessionExamId || !studentId) return MissingFields;
        if (await this.sessionExamStudents.findByExamAndStudent(sessionExamId, studentId)) return { kind: "student_already_registered" };
        const entry: SessionExamStudent = { id: randomUUID(), sessionExamId, studentId };
        await this.sessionExamStudents.save(entry);
        return { kind: "session_exam_student_added", sessionExamStudent: toSessionExamStudentView(entry) };
    }

    async removeStudent(id: string): Promise<DeleteSessionExamStudentResult> {
        const entry = await this.sessionExamStudents.findById(id);
        if (!entry) return NotFound;
        await this.sessionExamStudents.deleteById(id);
        return { kind: "session_exam_student_deleted" };
    }

    async findStudentById(id: string): Promise<GetSessionExamStudentResult> {
        const entry = await this.sessionExamStudents.findById(id);
        if (!entry) return NotFound;
        return { kind: "session_exam_student_found", sessionExamStudent: toSessionExamStudentView(entry) };
    }

    async listStudentsBySessionExam(sessionExamId: string): Promise<ListSessionExamStudentsResult> {
        const entries = await this.sessionExamStudents.findBySessionExamId(sessionExamId);
        return {
            kind: "session_exam_students_listed",
            sessionExamStudents: entries.map(toSessionExamStudentView),
        };
    }

    async listSessionExamsByStudent(studentId: string): Promise<ListSessionExamStudentsResult> {
        const entries = await this.sessionExamStudents.findByStudentId(studentId);
        return {
            kind: "session_exam_students_listed",
            sessionExamStudents: entries.map(toSessionExamStudentView),
        };
    }

    async addInstructor(input: {
        sessionExamId?: string;
        instructorId?: string;
    }): Promise<AddSessionExamInstructorResult> {
        const { sessionExamId, instructorId } = input;
        if (!sessionExamId || !instructorId) return MissingFields;
        if (await this.sessionExamInstructors.findByExamAndInstructor(sessionExamId, instructorId)) return { kind: "instructor_already_in_jury" };
        const entry: SessionExamInstructor = { id: randomUUID(), sessionExamId, instructorId };
        await this.sessionExamInstructors.save(entry);
        return {
            kind: "session_exam_instructor_added",
            sessionExamInstructor: toSessionExamInstructorView(entry),
        };
    }

    async removeInstructor(id: string): Promise<DeleteSessionExamInstructorResult> {
        const entry = await this.sessionExamInstructors.findById(id);
        if (!entry) return NotFound;
        await this.sessionExamInstructors.deleteById(id);
        return { kind: "session_exam_instructor_deleted" };
    }

    async findInstructorById(id: string): Promise<GetSessionExamInstructorResult> {
        const entry = await this.sessionExamInstructors.findById(id);
        if (!entry) return NotFound;
        return {
            kind: "session_exam_instructor_found",
            sessionExamInstructor: toSessionExamInstructorView(entry),
        };
    }

    async listInstructorsBySessionExam(sessionExamId: string): Promise<ListSessionExamInstructorsResult> {
        const entries = await this.sessionExamInstructors.findBySessionExamId(sessionExamId);
        return {
            kind: "session_exam_instructors_listed",
            sessionExamInstructors: entries.map(toSessionExamInstructorView),
        };
    }

    async listSessionExamsByInstructor(instructorId: string): Promise<ListSessionExamInstructorsResult> {
        const entries = await this.sessionExamInstructors.findByInstructorId(instructorId);
        return {
            kind: "session_exam_instructors_listed",
            sessionExamInstructors: entries.map(toSessionExamInstructorView),
        };
    }

    async addExternal(input: {
        sessionExamId?: string;
        externalId?: string;
    }): Promise<AddSessionExamExternalResult> {
        const { sessionExamId, externalId } = input;
        if (!sessionExamId || !externalId) return MissingFields;
        if (await this.sessionExamExternals.findByExamAndExternal(sessionExamId, externalId)) return { kind: "external_already_in_jury" };
        const entry: SessionExamExternal = { id: randomUUID(), sessionExamId, externalId };
        await this.sessionExamExternals.save(entry);
        return {
            kind: "session_exam_external_added",
            sessionExamExternal: toSessionExamExternalView(entry),
        };
    }

    async removeExternal(id: string): Promise<DeleteSessionExamExternalResult> {
        const entry = await this.sessionExamExternals.findById(id);
        if (!entry) return NotFound;
        await this.sessionExamExternals.deleteById(id);
        return { kind: "session_exam_external_deleted" };
    }

    async findExternalById(id: string): Promise<GetSessionExamExternalResult> {
        const entry = await this.sessionExamExternals.findById(id);
        if (!entry) return NotFound;
        return {
            kind: "session_exam_external_found",
            sessionExamExternal: toSessionExamExternalView(entry),
        };
    }

    async listExternalsBySessionExam(sessionExamId: string): Promise<ListSessionExamExternalsResult> {
        const entries = await this.sessionExamExternals.findBySessionExamId(sessionExamId);
        return {
            kind: "session_exam_externals_listed",
            sessionExamExternals: entries.map(toSessionExamExternalView),
        };
    }

    async listSessionExamsByExternal(externalId: string): Promise<ListSessionExamExternalsResult> {
        const entries = await this.sessionExamExternals.findByExternalId(externalId);
        return {
            kind: "session_exam_externals_listed",
            sessionExamExternals: entries.map(toSessionExamExternalView),
        };
    }
}
