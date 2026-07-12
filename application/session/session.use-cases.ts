import { randomUUID } from "node:crypto";
import { type Session } from "@domain/session/session.entity";
import { type Course } from "@domain/course/course.entity";
import { SessionMode } from "@domain/session/session.enums";
import { isValidTimeRange, classroomFitsGroup } from "@domain/session/session.policy";
import { type SessionRepository } from "@application/session/session.repository";
import { type SessionExamRepository } from "@application/session/session-exam/session-exam.repository";
import { type AbsenceRepository } from "@application/absence/absence.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type ClassroomRepository } from "@application/classroom/classroom.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { NotFound, Forbidden, ForbiddenOwnership } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";
import { isCourseInstructor as resolveCourseInstructor } from "@application/course/course-access";
import { canReadSession, canReadCourseSessions } from "@application/session/session-access";

export type SessionView = {
    id: string;
    courseId: string;
    startTime: string;
    endTime: string;
    mode: SessionMode;
    classroomId: string | null;
};

type SlotError =
    | { kind: "invalid_time_range" }
    | { kind: "classroom_not_found" }
    | { kind: "classroom_conflict" }
    | { kind: "instructor_conflict" }
    | { kind: "classroom_capacity_exceeded" };

export type CreateSessionResult =
    | Forbidden
    | { kind: "course_not_found" }
    | { kind: "classroom_required" }
    | { kind: "classroom_forbidden" }
    | SlotError
    | { kind: "session_created"; session: SessionView };

export type UpdateSessionResult =
    | NotFound
    | Forbidden
    | { kind: "classroom_required" }
    | SlotError
    | { kind: "session_updated"; session: SessionView };

export type DeleteSessionResult =
    | NotFound
    | Forbidden
    | { kind: "session_has_exams" }
    | { kind: "session_has_absences" }
    | { kind: "session_deleted" };

export type GetSessionResult = NotFound | Forbidden | { kind: "session_found"; session: SessionView };

export type ListSessionsResult = Forbidden | { kind: "sessions_listed"; sessions: SessionView[] };

export type ListSessionsByCourseResult = Forbidden | { kind: "sessions_listed"; sessions: SessionView[] };

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
        private readonly classrooms: ClassroomRepository,
        private readonly studentGroups: StudentGroupRepository,
        private readonly students: StudentRepository,
    ) {}

    private isCourseInstructor(courseId: string, requesterId: string): Promise<boolean> {
        return resolveCourseInstructor({ courses: this.courses, instructors: this.instructors }, courseId, requesterId);
    }

    private get accessDeps() {
        return { courses: this.courses, instructors: this.instructors, students: this.students, studentGroups: this.studentGroups };
    }

    private async validateSlot(
        input: { course: Course; mode: SessionMode; classroomId: string | null; start: Date; end: Date },
        excludeId?: string,
    ): Promise<SlotError | null> {
        const { course, mode, classroomId, start, end } = input;
        if (!isValidTimeRange(start, end)) return { kind: "invalid_time_range" };
        if (await this.sessions.findInstructorOverlap(course.instructorId, start, end, excludeId))
            return { kind: "instructor_conflict" };
        if (mode === SessionMode.ON_SITE && classroomId) {
            const classroom = await this.classrooms.findById(classroomId);
            if (!classroom) return { kind: "classroom_not_found" };
            if (await this.sessions.findClassroomOverlap(classroomId, start, end, excludeId))
                return { kind: "classroom_conflict" };
            const members = await this.studentGroups.findByGroupId(course.groupId);
            if (!classroomFitsGroup(classroom.capacity, members.length)) return { kind: "classroom_capacity_exceeded" };
        }
        return null;
    }

    async create(input: {
        courseId?: string;
        startTime?: string;
        endTime?: string;
        mode?: SessionMode;
        classroomId?: string;
    }, auth: AuthContext): Promise<CreateSessionResult> {
        if (!auth.isStaff) return Forbidden;
        const { courseId, startTime, endTime, mode, classroomId } = input as {
            courseId: string;
            startTime: string;
            endTime: string;
            mode: SessionMode;
            classroomId?: string;
        };
        const course = await this.courses.findById(courseId);
        if (!course) return { kind: "course_not_found" };
        if (!auth.isAdmin && !(await this.isCourseInstructor(courseId, auth.requesterId)))
            return ForbiddenOwnership;
        if (mode === SessionMode.ON_SITE && !classroomId) return { kind: "classroom_required" };
        if (mode === SessionMode.REMOTE && classroomId) return { kind: "classroom_forbidden" };
        const resolvedClassroomId = mode === SessionMode.REMOTE ? null : classroomId!;
        const parsedStart = new Date(startTime);
        const parsedEnd = new Date(endTime);
        const slotError = await this.validateSlot({ course, mode, classroomId: resolvedClassroomId, start: parsedStart, end: parsedEnd });
        if (slotError) return slotError;
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
            startTime?: string;
            endTime?: string;
            mode?: SessionMode;
            classroomId?: string | null;
        },
        auth: AuthContext,
    ): Promise<UpdateSessionResult> {
        if (!auth.isStaff) return Forbidden;
        const session = await this.sessions.findById(id);
        if (!session) return NotFound;
        if (!auth.isAdmin && !(await this.isCourseInstructor(session.courseId, auth.requesterId)))
            return ForbiddenOwnership;

        const course = await this.courses.findById(session.courseId);
        if (!course) return NotFound;
        const newStart = input.startTime ? new Date(input.startTime) : session.startTime;
        const newEnd = input.endTime ? new Date(input.endTime) : session.endTime;
        const newMode = input.mode !== undefined ? input.mode : session.mode;
        let newClassroomId = input.classroomId !== undefined ? input.classroomId : session.classroomId;

        if (newMode === SessionMode.REMOTE) newClassroomId = null;
        if (newMode === SessionMode.ON_SITE && !newClassroomId) return { kind: "classroom_required" };
        const slotError = await this.validateSlot({ course, mode: newMode, classroomId: newClassroomId, start: newStart, end: newEnd }, id);
        if (slotError) return slotError;
        session.mode = newMode;
        session.startTime = newStart;
        session.endTime = newEnd;
        session.classroomId = newClassroomId;
        await this.sessions.save(session);
        return { kind: "session_updated", session: toView(session) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteSessionResult> {
        if (!auth.isStaff) return Forbidden;
        const session = await this.sessions.findById(id);
        if (!session) return NotFound;
        if (!auth.isAdmin && !(await this.isCourseInstructor(session.courseId, auth.requesterId)))
            return ForbiddenOwnership;
        if (await this.sessionExams.existsBySessionId(id)) return { kind: "session_has_exams" };
        if (await this.absences.existsBySessionId(id)) return { kind: "session_has_absences" };
        await this.sessions.deleteById(id);
        return { kind: "session_deleted" };
    }

    async list(auth: AuthContext): Promise<ListSessionsResult> {
        if (!auth.isAdmin) return Forbidden;
        const sessions = await this.sessions.list();
        return { kind: "sessions_listed", sessions: sessions.map(toView) };
    }

    async listByCourse(courseId: string, auth: AuthContext): Promise<ListSessionsByCourseResult> {
        if (!(await canReadCourseSessions(this.accessDeps, courseId, auth))) return ForbiddenOwnership;
        const sessions = await this.sessions.findByCourseId(courseId);
        return { kind: "sessions_listed", sessions: sessions.map(toView) };
    }

    async listByClassroom(classroomId: string, auth: AuthContext): Promise<ListSessionsResult> {
        if (!auth.isAdmin) return Forbidden;
        const sessions = await this.sessions.findByClassroomId(classroomId);
        return { kind: "sessions_listed", sessions: sessions.map(toView) };
    }

    async findById(id: string, auth: AuthContext): Promise<GetSessionResult> {
        const session = await this.sessions.findById(id);
        if (!session) return NotFound;

        if (!(await canReadSession(this.accessDeps, session, auth))) return ForbiddenOwnership;
        return { kind: "session_found", session: toView(session) };
    }
}
