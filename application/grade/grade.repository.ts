import { type Grade } from "@domain/grade/grade.entity";

export interface GradeRepository {
    findById(id: string): Promise<Grade | undefined>;
    findByStudentId(studentId: string): Promise<Grade[]>;
    findByEnteredBy(userId: string): Promise<Grade[]>;
    save(grade: Grade): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Grade[]>;
}
