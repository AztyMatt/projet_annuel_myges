import { type SessionExamInstructor } from "@domain/session/session-exam/session-exam-instructor/session-exam-instructor.entity";

export interface SessionExamInstructorRepository {
    findById(id: string): Promise<SessionExamInstructor | undefined>;
    findBySessionExamId(sessionExamId: string): Promise<SessionExamInstructor[]>;
    findByInstructorId(instructorId: string): Promise<SessionExamInstructor[]>;
    findByExamAndInstructor(sessionExamId: string, instructorId: string): Promise<SessionExamInstructor | undefined>;
    save(sessionExamInstructor: SessionExamInstructor): Promise<void>;
    deleteById(id: string): Promise<void>;
}
