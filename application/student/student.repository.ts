import { type Student } from "@domain/student/student.entity";

export interface StudentRepository {
    findById(id: string): Promise<Student | undefined>;
    findByUserId(userId: string): Promise<Student | undefined>;
    findByProgramId(programId: string): Promise<Student[]>;
    existsByProgramId(programId: string): Promise<boolean>;
    findUserIdsByGroupIds(groupIds: string[]): Promise<string[]>;
    save(student: Student): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Student[]>;
}
