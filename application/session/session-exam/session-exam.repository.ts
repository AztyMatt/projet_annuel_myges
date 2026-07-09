import { type SessionExam } from "@domain/session/session-exam/session-exam.entity";

export interface SessionExamRepository {
    findById(id: string): Promise<SessionExam | undefined>;
    findBySessionId(sessionId: string): Promise<SessionExam[]>;
    existsBySessionId(sessionId: string): Promise<boolean>;
    findByAssessmentId(assessmentId: string): Promise<SessionExam[]>;
    existsByAssessmentId(assessmentId: string): Promise<boolean>;
    save(sessionExam: SessionExam): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<SessionExam[]>;
}
