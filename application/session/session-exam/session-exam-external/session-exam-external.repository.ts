import { type SessionExamExternal } from "@domain/session/session-exam/session-exam-external/session-exam-external.entity";

export interface SessionExamExternalRepository {
    findById(id: string): Promise<SessionExamExternal | undefined>;
    findBySessionExamId(sessionExamId: string): Promise<SessionExamExternal[]>;
    findByExternalId(externalId: string): Promise<SessionExamExternal[]>;
    existsByExternalId(externalId: string): Promise<boolean>;
    findByExamAndExternal(sessionExamId: string, externalId: string): Promise<SessionExamExternal | undefined>;
    save(sessionExamExternal: SessionExamExternal): Promise<void>;
    deleteById(id: string): Promise<void>;
}
