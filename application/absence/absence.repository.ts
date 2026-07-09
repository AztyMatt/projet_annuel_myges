import { type Absence } from "@domain/absence/absence.entity";

export interface AbsenceRepository {
    findById(id: string): Promise<Absence | undefined>;
    findByStudentId(studentId: string): Promise<Absence[]>;
    existsByStudentId(studentId: string): Promise<boolean>;
    findBySessionId(sessionId: string): Promise<Absence[]>;
    existsBySessionId(sessionId: string): Promise<boolean>;
    findByStudentAndSession(studentId: string, sessionId: string): Promise<Absence | undefined>;
    save(absence: Absence): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Absence[]>;
}
