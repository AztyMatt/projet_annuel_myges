import { randomUUID } from "node:crypto";
import { type Session } from "@domain/session/session.entity";
import { type SessionMode } from "@domain/session/session.enums";
import { type SessionRepository } from "@application/session/session.repository";
import { NotFound, MissingFields } from "@application/types/results";

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
    | { kind: "classroom_conflict" }
    | { kind: "session_created"; session: SessionView };

export type UpdateSessionResult =
    | NotFound
    | { kind: "classroom_conflict" }
    | { kind: "session_updated"; session: SessionView };

export type DeleteSessionResult = NotFound | { kind: "session_deleted" };

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
    constructor(private readonly sessions: SessionRepository) {}

    async create(input: {
        courseId?: string;
        startTime?: string;
        endTime?: string;
        mode?: SessionMode;
        classroomId?: string;
    }): Promise<CreateSessionResult> {
        const { courseId, startTime, endTime, mode, classroomId } = input;
        if (!courseId || !startTime || !endTime || !mode || !classroomId) return MissingFields;
        const parsedStart = new Date(startTime);
        const parsedEnd = new Date(endTime);
        if (await this.sessions.findBySlot(courseId, classroomId, parsedStart, parsedEnd))
            return { kind: "classroom_conflict" };
        const session: Session = {
            id: randomUUID(),
            courseId,
            startTime: parsedStart,
            endTime: parsedEnd,
            mode,
            classroomId,
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
    ): Promise<UpdateSessionResult> {
        const session = await this.sessions.findById(id);
        if (!session) return NotFound;
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

    async delete(id: string): Promise<DeleteSessionResult> {
        const session = await this.sessions.findById(id);
        if (!session) return NotFound;
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
