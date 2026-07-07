import { type Session } from "@domain/session/session.entity";

export interface SessionRepository {
    findById(id: string): Promise<Session | undefined>;
    findByCourseId(courseId: string): Promise<Session[]>;
    findByClassroomId(classroomId: string): Promise<Session[]>;
    findBySlot(courseId: string, classroomId: string | null, startTime: Date, endTime: Date): Promise<Session | undefined>;
    save(session: Session): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Session[]>;
}
