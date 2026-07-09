import { randomUUID } from "node:crypto";
import { type Session } from "@domain/session/session.entity";
import { SessionMode } from "@domain/session/session.enums";
import { type SessionRepository } from "@application/session/session.repository";
import { type SessionExamRepository } from "@application/session/session-exam/session-exam.repository";
import { type AbsenceRepository } from "@application/absence/absence.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";
import { isCourseInstructor as resolveCourseInstructor } from "@application/course/course-access";

export type SessionView = {
    id: string;
    courseId: string;
    startTime: string;
    endTime: string;
    mode: SessionMode;
    classroomId: string | null;
};

export type CreateSessionResult =
    | MissingFields
    | Forbidden
    | { kind: "classroom_required" }
    | { kind: "classroom_forbidden" }
    | { kind: "classroom_conflict" }
    | { kind: "session_created"; session: SessionView };

export type UpdateSessionResult =
    | NotFound
    | Forbidden
    | { kind: "classroom_conflict" }
    | { kind: "session_updated"; session: SessionView };

export type DeleteSessionResult =
    | NotFound
    | Forbidden
    | { kind: "session_has_exams" }
    | { kind: "session_has_absences" }
    | { kind: "session_deleted" };

export type GetSessionResult = NotFound | { kind: "session_found"; session: SessionView };

export type ListSessionsResult = { kind: "sessions_listed"; sessions: SessionView[] };

const toView = (s: Session): SessionView => ({
    id: s.id,
    courseId: s.courseId,
    startTime: s.startTime.toISOString(),
    endTime: s.endTime.toISOString(),
    mode: s.mode,
    classroomId: s.classroomId,
});

export class SessionUseCases {
    constructor(
        private readonly sessions: SessionRepository,
        private readonly sessionExams: SessionExamRepository,
        private readonly absences: AbsenceRepository,
        private readonly courses: CourseRepository,
        private readonly instructors: InstructorRepository,
    ) {}

    private isCourseInstructor(courseId: string, requesterId: string): Promise<boolean> {
        return resolveCourseInstructor({ courses: this.courses, instructors: this.instructors }, courseId, requesterId);
    }

    async create(input: {
        courseId?: string;
        startTime?: string;
        endTime?: string;
        mode?: SessionMode;
        classroomId?: string;
    }, auth: AuthContext): Promise<CreateSessionResult> {
        const { courseId, startTime, endTime, mode, classroomId } = input;
        if (!courseId || !startTime || !endTime || !mode) return MissingFields;
        if (!auth.isAdmin && !(await this.isCourseInstructor(courseId, auth.requesterId)))
            return Forbidden;
        if (mode === SessionMode.ON_SITE && !classroomId) return { kind: "classroom_required" };
        if (mode === SessionMode.REMOTE && classroomId) return { kind: "classroom_forbidden" };
        const resolvedClassroomId = mode === SessionMode.REMOTE ? null : classroomId!;
        const parsedStart = new Date(startTime);
        const parsedEnd = new Date(endTime);
        if (resolvedClassroomId && (await this.sessions.findBySlot(courseId, resolvedClassroomId, parsedStart, parsedEnd)))
            return { kind: "classroom_conflict" };
        const session: Session = {
            id: randomUUID(),
            courseId,
            startTime: parsedStart,
            endTime: parsedEnd,
            mode,
            classroomId: resolvedClassroomId,
        };
        await this.sessions.save(session);
        return { kind: "session_created", session: toView(session) };
    }

    async update(
        id: string,
        input: {
            courseId?: string;
            startTime?: string;
            endTime?: string;
            mode?: SessionMode;
            classroomId?: string | null;
        },
        auth: AuthContext,
    ): Promise<UpdateSessionResult> {
        const session = await this.sessions.findById(id);
        if (!session) return NotFound;
        if (!auth.isAdmin && !(await this.isCourseInstructor(session.courseId, auth.requesterId)))
            return Forbidden;
        const newCourseId = input.courseId !== undefined ? input.courseId : session.courseId;
        const newStart = input.startTime ? new Date(input.startTime) : session.startTime;
        const newEnd = input.endTime ? new Date(input.endTime) : session.endTime;
        const newClassroomId = input.classroomId !== undefined ? input.classroomId : session.classroomId;
        const existing = await this.sessions.findBySlot(newCourseId, newClassroomId, newStart, newEnd);
        if (existing && existing.id !== id) return { kind: "classroom_conflict" };
        session.courseId = newCourseId;
        if (input.mode !== undefined) session.mode = input.mode;
        session.startTime = newStart;
        session.endTime = newEnd;
        session.classroomId = newClassroomId;
        await this.sessions.save(session);
        return { kind: "session_updated", session: toView(session) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteSessionResult> {
        const session = await this.sessions.findById(id);
        if (!session) return NotFound;
        if (!auth.isAdmin && !(await this.isCourseInstructor(session.courseId, auth.requesterId)))
            return Forbidden;
        if (await this.sessionExams.existsBySessionId(id)) return { kind: "session_has_exams" };
        if (await this.absences.existsBySessionId(id)) return { kind: "session_has_absences" };
        await this.sessions.deleteById(id);
        return { kind: "session_deleted" };
    }

    async list(): Promise<ListSessionsResult> {
        const sessions = await this.sessions.list();
        return { kind: "sessions_listed", sessions: sessions.map(toView) };
    }

    async listByCourse(courseId: string): Promise<ListSessionsResult> {
        const sessions = await this.sessions.findByCourseId(courseId);
        return { kind: "sessions_listed", sessions: sessions.map(toView) };
    }

    async listByClassroom(classroomId: string): Promise<ListSessionsResult> {
        const sessions = await this.sessions.findByClassroomId(classroomId);
        return { kind: "sessions_listed", sessions: sessions.map(toView) };
    }

    async findById(id: string): Promise<GetSessionResult> {
        const session = await this.sessions.findById(id);
        if (!session) return NotFound;
        return { kind: "session_found", session: toView(session) };
    }
}
