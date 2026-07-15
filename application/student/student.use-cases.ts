import { randomUUID } from "node:crypto";
import { type Student } from "@domain/student/student.entity";
import { type StudentRepository } from "@application/student/student.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type AbsenceRepository } from "@application/absence/absence.repository";
import { type SessionExamStudentRepository } from "@application/session/session-exam/session-exam-student/session-exam-student.repository";
import { type AssessmentGroupMemberRepository } from "@application/assessment/assessment-group-member/assessment-group-member.repository";
import { type FileDocumentRepository } from "@application/file/file-document/file-document.repository";
import { type UserRepository } from "@application/auth/user.repository";
import { type ProgramRepository } from "@application/program/program.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { NotFound, Forbidden } from "@application/types/results";
import { type AuthContext } from "@application/types/auth-context";
import { type AuditRecorder } from "@application/audit-log/audit-recorder";

export type StudentView = { id: string; userId: string; programId: string };

export type CreateStudentResult =
    | Forbidden
    | { kind: "user_not_found" }
    | { kind: "program_not_found" }
    | { kind: "user_already_student" }
    | { kind: "student_created"; student: StudentView };

export type UpdateStudentResult =
    | NotFound
    | Forbidden
    | { kind: "program_not_found" }
    | { kind: "student_updated"; student: StudentView };

export type DeleteStudentResult =
    | NotFound
    | Forbidden
    | { kind: "student_in_groups" }
    | { kind: "student_has_absences" }
    | { kind: "student_has_session_exams" }
    | { kind: "student_in_assessment_groups" }
    | { kind: "student_has_documents" }
    | { kind: "student_deleted" };

export type GetStudentResult = NotFound | Forbidden | { kind: "student_found"; student: StudentView };

export type ListStudentsResult = Forbidden | { kind: "students_listed"; students: StudentView[] };

const toView = (s: Student): StudentView => ({ id: s.id, userId: s.userId, programId: s.programId });

export class StudentUseCases {
    constructor(
        private readonly students: StudentRepository,
        private readonly studentGroups: StudentGroupRepository,
        private readonly absences: AbsenceRepository,
        private readonly sessionExamStudents: SessionExamStudentRepository,
        private readonly assessmentGroupMembers: AssessmentGroupMemberRepository,
        private readonly fileDocuments: FileDocumentRepository,
        private readonly users: UserRepository,
        private readonly programs: ProgramRepository,
        private readonly courses: CourseRepository,
        private readonly instructors: InstructorRepository,
        private readonly auditRecorder: AuditRecorder,
    ) {}

    async create(input: { userId?: string; programId?: string }, auth: AuthContext): Promise<CreateStudentResult> {
        if (!auth.isAdmin) return Forbidden;
        const { userId, programId } = input as { userId: string; programId: string };
        if (!(await this.users.findById(userId))) return { kind: "user_not_found" };

        if (!(await this.programs.findById(programId))) return { kind: "program_not_found" };
        if (await this.students.findByUserId(userId)) return { kind: "user_already_student" };
        const student: Student = { id: randomUUID(), userId, programId };
        await this.students.save(student);
        await this.auditRecorder.record({
            userId: auth.requesterId,
            action: "CREATE",
            entityName: "student",
            entityId: student.id,
            newValue: { userId: student.userId, programId: student.programId },
        });
        return { kind: "student_created", student: toView(student) };
    }

    async update(id: string, input: { programId?: string }, auth: AuthContext): Promise<UpdateStudentResult> {
        if (!auth.isAdmin) return Forbidden;
        const student = await this.students.findById(id);
        if (!student) return NotFound;
        if (input.programId !== undefined && !(await this.programs.findById(input.programId))) return { kind: "program_not_found" };
        const previousProgramId = student.programId;
        if (input.programId !== undefined) student.programId = input.programId;
        await this.students.save(student);
        await this.auditRecorder.record({
            userId: auth.requesterId,
            action: "UPDATE",
            entityName: "student",
            entityId: student.id,
            oldValue: { programId: previousProgramId },
            newValue: { programId: student.programId },
        });
        return { kind: "student_updated", student: toView(student) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteStudentResult> {
        if (!auth.isAdmin) return Forbidden;
        const student = await this.students.findById(id);
        if (!student) return NotFound;
        const [inGroups, hasAbsences, hasSessionExams, inAssessmentGroups, hasDocuments] = await Promise.all([
            this.studentGroups.existsByStudentId(id),
            this.absences.existsByStudentId(id),
            this.sessionExamStudents.existsByStudentId(id),
            this.assessmentGroupMembers.existsByStudentId(id),
            this.fileDocuments.existsByStudentId(id),
        ]);
        if (inGroups) return { kind: "student_in_groups" };
        if (hasAbsences) return { kind: "student_has_absences" };
        if (hasSessionExams) return { kind: "student_has_session_exams" };
        if (inAssessmentGroups) return { kind: "student_in_assessment_groups" };
        if (hasDocuments) return { kind: "student_has_documents" };
        await this.students.deleteById(id);
        await this.auditRecorder.record({
            userId: auth.requesterId,
            action: "DELETE",
            entityName: "student",
            entityId: student.id,
            oldValue: { userId: student.userId, programId: student.programId },
            newValue: { deleted: true },
        });
        return { kind: "student_deleted" };
    }

    async list(auth: AuthContext): Promise<ListStudentsResult> {
        if (!auth.isAdmin) return Forbidden;
        const students = await this.students.list();
        return { kind: "students_listed", students: students.map(toView) };
    }

    async listByProgram(programId: string): Promise<ListStudentsResult> {
        const students = await this.students.findByProgramId(programId);
        return { kind: "students_listed", students: students.map(toView) };
    }

    async findById(id: string, auth: AuthContext): Promise<GetStudentResult> {
        const student = await this.students.findById(id);
        if (!student) return NotFound;
        if (!auth.isAdmin && student.userId !== auth.requesterId && !(await this.isInstructorOfStudent(id, auth.requesterId))) {
            return Forbidden;
        }
        return { kind: "student_found", student: toView(student) };
    }

    private async isInstructorOfStudent(studentId: string, requesterId: string): Promise<boolean> {
        const instructor = await this.instructors.findByUserId(requesterId);
        if (!instructor) return false;
        const [groups, courses] = await Promise.all([
            this.studentGroups.findByStudentId(studentId),
            this.courses.findByInstructorId(instructor.id),
        ]);
        const groupIds = new Set(groups.map((g) => g.groupId));
        return courses.some((c) => groupIds.has(c.groupId));
    }

    async findByUserId(userId: string): Promise<GetStudentResult> {
        const student = await this.students.findByUserId(userId);
        if (!student) return NotFound;
        return { kind: "student_found", student: toView(student) };
    }
}
