import { type GradeSessionExam } from "@domain/grade/grade-session-exam/grade-session-exam.entity";

export interface GradeSessionExamRepository {
    findById(id: string): Promise<GradeSessionExam | undefined>;
    findByGradeId(gradeId: string): Promise<GradeSessionExam[]>;
    findBySessionExamId(sessionExamId: string): Promise<GradeSessionExam[]>;
    existsBySessionExamId(sessionExamId: string): Promise<boolean>;
    findByGradeAndSessionExam(gradeId: string, sessionExamId: string): Promise<GradeSessionExam | undefined>;
    existsBySessionExamIdAndStudentId(sessionExamId: string, studentId: string): Promise<boolean>;
    save(gradeSessionExam: GradeSessionExam): Promise<void>;
    deleteById(id: string): Promise<void>;
}
