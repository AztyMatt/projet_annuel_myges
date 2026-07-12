import { type Session } from "@domain/session/session.entity";

export interface SessionRepository {
    findById(id: string): Promise<Session | undefined>;
    findByCourseId(courseId: string): Promise<Session[]>;
    existsByCourseId(courseId: string): Promise<boolean>;
    findByClassroomId(classroomId: string): Promise<Session[]>;
    existsByClassroomId(classroomId: string): Promise<boolean>;
    findClassroomOverlap(classroomId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<Session | undefined>;
    findInstructorOverlap(instructorId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<Session | undefined>;
    save(session: Session): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Session[]>;
}
