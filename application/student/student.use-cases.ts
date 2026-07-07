import { randomUUID } from "node:crypto";
import { type Student } from "@domain/student/student.entity";
import { type StudentRepository } from "@application/student/student.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type StudentView = { id: string; userId: string; programId: string };

export type CreateStudentResult =
    | MissingFields
    | { kind: "user_already_student" }
    | { kind: "student_created"; student: StudentView };

export type UpdateStudentResult =
    | NotFound
    | { kind: "student_updated"; student: StudentView };

export type DeleteStudentResult = NotFound | { kind: "student_deleted" };

export type GetStudentResult = NotFound | { kind: "student_found"; student: StudentView };

export type ListStudentsResult = { kind: "students_listed"; students: StudentView[] };

const toView = (s: Student): StudentView => ({ id: s.id, userId: s.userId, programId: s.programId });

export class StudentUseCases {
    constructor(private readonly students: StudentRepository) {}

    async create(input: { userId?: string; programId?: string }): Promise<CreateStudentResult> {
        const { userId, programId } = input;
        if (!userId || !programId) return MissingFields;
        if (await this.students.findByUserId(userId)) return { kind: "user_already_student" };
        const student: Student = { id: randomUUID(), userId, programId };
        await this.students.save(student);
        return { kind: "student_created", student: toView(student) };
    }

    async update(id: string, input: { programId?: string }): Promise<UpdateStudentResult> {
        const student = await this.students.findById(id);
        if (!student) return NotFound;
        if (input.programId !== undefined) student.programId = input.programId;
        await this.students.save(student);
        return { kind: "student_updated", student: toView(student) };
    }

    async delete(id: string): Promise<DeleteStudentResult> {
        const student = await this.students.findById(id);
        if (!student) return NotFound;
        await this.students.deleteById(id);
        return { kind: "student_deleted" };
    }

    async list(): Promise<ListStudentsResult> {
        const students = await this.students.list();
        return { kind: "students_listed", students: students.map(toView) };
    }

    async listByProgram(programId: string): Promise<ListStudentsResult> {
        const students = await this.students.findByProgramId(programId);
        return { kind: "students_listed", students: students.map(toView) };
    }

    async findById(id: string): Promise<GetStudentResult> {
        const student = await this.students.findById(id);
        if (!student) return NotFound;
        return { kind: "student_found", student: toView(student) };
    }

    async findByUserId(userId: string): Promise<GetStudentResult> {
        const student = await this.students.findByUserId(userId);
        if (!student) return NotFound;
        return { kind: "student_found", student: toView(student) };
    }
}
