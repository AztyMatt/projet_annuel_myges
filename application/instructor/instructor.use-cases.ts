import { randomUUID } from "node:crypto";
import { type Instructor } from "@domain/instructor/instructor.entity";
import { InstructorContractType } from "@domain/instructor/instructor.enums";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type SessionExamInstructorRepository } from "@application/session/session-exam/session-exam-instructor/session-exam-instructor.repository";
import { type UserRepository } from "@application/auth/user.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden } from "@application/types/results";
import { type AuditRecorder } from "@application/audit-log/audit-recorder";

export type InstructorView = {
    id: string;
    userId: string;
    contractType: InstructorContractType;
    specialties: string[] | null;
};

export type CreateInstructorResult =
    | Forbidden
    | { kind: "user_not_found" }
    | { kind: "user_already_instructor" }
    | { kind: "instructor_created"; instructor: InstructorView };

export type UpdateInstructorResult =
    | NotFound
    | Forbidden
    | { kind: "instructor_updated"; instructor: InstructorView };

export type DeleteInstructorResult = NotFound | Forbidden | { kind: "instructor_has_courses" } | { kind: "instructor_has_session_exams" } | { kind: "instructor_deleted" };

export type GetInstructorResult = NotFound | Forbidden | { kind: "instructor_found"; instructor: InstructorView };

export type ListInstructorsResult = Forbidden | { kind: "instructors_listed"; instructors: InstructorView[] };

const toView = (i: Instructor): InstructorView => ({
    id: i.id,
    userId: i.userId,
    contractType: i.contractType,
    specialties: i.specialties,
});

export class InstructorUseCases {
    constructor(
        private readonly instructors: InstructorRepository,
        private readonly courses: CourseRepository,
        private readonly sessionExamInstructors: SessionExamInstructorRepository,
        private readonly users: UserRepository,
        private readonly auditRecorder: AuditRecorder,
    ) {}

    async create(input: {
        userId?: string;
        contractType?: InstructorContractType;
        specialties?: string[];
    }, auth: AuthContext): Promise<CreateInstructorResult> {
        if (!auth.isAdmin) return Forbidden;
        const { userId, contractType, specialties } = input as {
            userId: string;
            contractType: InstructorContractType;
            specialties?: string[];
        };
        if (!(await this.users.findById(userId))) return { kind: "user_not_found" };
        if (await this.instructors.findByUserId(userId)) return { kind: "user_already_instructor" };
        const instructor: Instructor = {
            id: randomUUID(),
            userId,
            contractType,
            specialties: specialties ?? null,
        };
        await this.instructors.save(instructor);
        await this.auditRecorder.record({
            userId: auth.requesterId,
            action: "CREATE",
            entityName: "instructor",
            entityId: instructor.id,
            newValue: { userId: instructor.userId, contractType: instructor.contractType },
        });
        return { kind: "instructor_created", instructor: toView(instructor) };
    }

    async update(
        id: string,
        input: { contractType?: InstructorContractType; specialties?: string[] },
        auth: AuthContext,
    ): Promise<UpdateInstructorResult> {
        if (!auth.isAdmin) return Forbidden;
        const instructor = await this.instructors.findById(id);
        if (!instructor) return NotFound;
        const previous = { contractType: instructor.contractType, specialties: (instructor.specialties ?? []).join(", ") || null };
        if (input.contractType !== undefined) instructor.contractType = input.contractType;
        if (input.specialties !== undefined) instructor.specialties = input.specialties ?? null;
        await this.instructors.save(instructor);
        await this.auditRecorder.record({
            userId: auth.requesterId,
            action: "UPDATE",
            entityName: "instructor",
            entityId: instructor.id,
            oldValue: previous,
            newValue: { contractType: instructor.contractType, specialties: (instructor.specialties ?? []).join(", ") || null },
        });
        return { kind: "instructor_updated", instructor: toView(instructor) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteInstructorResult> {
        if (!auth.isAdmin) return Forbidden;
        const instructor = await this.instructors.findById(id);
        if (!instructor) return NotFound;
        const [hasCourses, hasSessionExams] = await Promise.all([
            this.courses.existsByInstructorId(id),
            this.sessionExamInstructors.existsByInstructorId(id),
        ]);
        if (hasCourses) return { kind: "instructor_has_courses" };
        if (hasSessionExams) return { kind: "instructor_has_session_exams" };
        await this.instructors.deleteById(id);
        await this.auditRecorder.record({
            userId: auth.requesterId,
            action: "DELETE",
            entityName: "instructor",
            entityId: instructor.id,
            oldValue: { userId: instructor.userId, contractType: instructor.contractType },
            newValue: { deleted: true },
        });
        return { kind: "instructor_deleted" };
    }

    async list(auth: AuthContext): Promise<ListInstructorsResult> {
        if (!auth.isAdmin) return Forbidden;
        const instructors = await this.instructors.list();
        return { kind: "instructors_listed", instructors: instructors.map(toView) };
    }

    async findById(id: string, auth: AuthContext): Promise<GetInstructorResult> {
        if (!auth.isAdmin) return Forbidden;
        const instructor = await this.instructors.findById(id);
        if (!instructor) return NotFound;
        return { kind: "instructor_found", instructor: toView(instructor) };
    }

    async findByUserId(userId: string): Promise<GetInstructorResult> {
        const instructor = await this.instructors.findByUserId(userId);
        if (!instructor) return NotFound;
        return { kind: "instructor_found", instructor: toView(instructor) };
    }
}
