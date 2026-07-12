import { randomUUID } from "node:crypto";
import { type Absence } from "@domain/absence/absence.entity";
import { BasicStatus } from "@domain/absence/absence.enums";
import { sessionHasStarted } from "@domain/session/session.policy";
import { type AbsenceRepository } from "@application/absence/absence.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { isCourseInstructor } from "@application/course/course-access";
import { canReadAbsence } from "@application/absence/absence-access";
import { type FileJustificationRepository } from "@application/file/file-justification/file-justification.repository";
import { type FileRepository } from "@application/file/file.repository";
import { type StorageService } from "@application/file/storage.service";
import { type UnitOfWork } from "@application/types/unit-of-work";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden, ForbiddenOwnership } from "@application/types/results";

export type AbsenceView = {
    id: string;
    studentId: string;
    sessionId: string;
    reason: string;
    status: string;
    declaredAt: string;
};

export type DeclareAbsenceResult =
    | NotFound
    | Forbidden
    | { kind: "student_not_in_course" }
    | { kind: "session_not_started" }
    | { kind: "absence_already_exists" }
    | { kind: "absence_declared"; absence: AbsenceView };

export type ValidateAbsenceResult = NotFound | Forbidden | { kind: "absence_already_processed" } | { kind: "absence_validated"; absence: AbsenceView };

export type RejectAbsenceResult = NotFound | Forbidden | { kind: "absence_already_processed" } | { kind: "absence_rejected"; absence: AbsenceView };

export type DeleteAbsenceResult =
    | NotFound
    | Forbidden
    | { kind: "absence_is_validated" }
    | { kind: "absence_deleted" }
    | { kind: "absence_deleted_with_warnings"; failedPaths: string[] };

export type GetAbsenceResult = NotFound | Forbidden | { kind: "absence_found"; absence: AbsenceView };

export type ListAbsencesResult = Forbidden | { kind: "absences_listed"; absences: AbsenceView[] };

const toView = (a: Absence): AbsenceView => ({
    id: a.id,
    studentId: a.studentId,
    sessionId: a.sessionId,
    reason: a.reason,
    status: a.status,
    declaredAt: a.declaredAt.toISOString(),
});

export class AbsenceUseCases {
    constructor(
        private readonly absences: AbsenceRepository,
        private readonly fileJustifications: FileJustificationRepository,
        private readonly files: FileRepository,
        private readonly storage: StorageService,
        private readonly unitOfWork: UnitOfWork,
        private readonly students: StudentRepository,
        private readonly sessions: SessionRepository,
        private readonly courses: CourseRepository,
        private readonly instructors: InstructorRepository,
        private readonly studentGroups: StudentGroupRepository,
    ) {}

    async declare(
        input: { studentId?: string; sessionId?: string; reason?: string },
        auth: AuthContext,
    ): Promise<DeclareAbsenceResult> {
        const { studentId, sessionId, reason } = input as { studentId: string; sessionId: string; reason: string };

        if (!auth.isStaff) return Forbidden;
        const session = await this.sessions.findById(sessionId);
        if (!session) return NotFound;
        if (!auth.isAdmin) {
            const ownsCourse = await isCourseInstructor(
                { courses: this.courses, instructors: this.instructors },
                session.courseId,
                auth.requesterId,
            );
            if (!ownsCourse) return ForbiddenOwnership;
        }

        const course = await this.courses.findById(session.courseId);

        if (!course) return NotFound;
        if (!(await this.studentGroups.findByStudentAndGroup(studentId, course.groupId))) return { kind: "student_not_in_course" };
        if (!sessionHasStarted(session)) return { kind: "session_not_started" };
        if (await this.absences.findByStudentAndSession(studentId, sessionId)) return { kind: "absence_already_exists" };
        const absence: Absence = {
            id: randomUUID(),
            studentId,
            sessionId,
            reason,
            status: BasicStatus.PENDING,
            declaredAt: new Date(),
        };
        await this.absences.save(absence);
        return { kind: "absence_declared", absence: toView(absence) };
    }

    async validate(id: string, auth: AuthContext): Promise<ValidateAbsenceResult> {
        if (!auth.isAdmin) return Forbidden;
        const absence = await this.absences.findById(id);
        if (!absence) return NotFound;

        if (absence.status !== BasicStatus.PENDING && !auth.isSuperAdmin) return { kind: "absence_already_processed" };
        absence.status = BasicStatus.VALIDATED;
        await this.absences.save(absence);
        return { kind: "absence_validated", absence: toView(absence) };
    }

    async reject(id: string, auth: AuthContext): Promise<RejectAbsenceResult> {
        if (!auth.isAdmin) return Forbidden;
        const absence = await this.absences.findById(id);
        if (!absence) return NotFound;

        if (absence.status !== BasicStatus.PENDING && !auth.isSuperAdmin) return { kind: "absence_already_processed" };
        absence.status = BasicStatus.REJECTED;
        await this.absences.save(absence);
        return { kind: "absence_rejected", absence: toView(absence) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteAbsenceResult> {
        if (!auth.isAdmin) return Forbidden;
        const absence = await this.absences.findById(id);
        if (!absence) return NotFound;
        if (absence.status === BasicStatus.VALIDATED && !auth.isSuperAdmin) return { kind: "absence_is_validated" };
        const justifications = await this.fileJustifications.findByAbsenceId(id);
        const fileOrNulls = await Promise.all(justifications.map((j) => this.files.findById(j.fileId)));
        const storagePaths = fileOrNulls.filter(Boolean).map((f) => f!.storagePath);
        await this.unitOfWork.run(async () => {
            for (const j of justifications) await this.fileJustifications.deleteById(j.id);
            for (const f of fileOrNulls) if (f) await this.files.deleteById(f.id);
            await this.absences.deleteById(id);
        });
        const failedPaths = await this.storage.deleteMany(storagePaths);
        return failedPaths.length > 0
            ? { kind: "absence_deleted_with_warnings", failedPaths }
            : { kind: "absence_deleted" };
    }

    async list(auth: AuthContext): Promise<ListAbsencesResult> {
        if (!auth.isStaff) return Forbidden;
        const absences = await this.absences.list();

        const visible = await this.filterReadable(absences, auth);
        return { kind: "absences_listed", absences: visible.map(toView) };
    }

    async listByStudent(studentId: string, auth: AuthContext): Promise<ListAbsencesResult> {
        if (!auth.isStaff) return Forbidden;
        const absences = await this.absences.findByStudentId(studentId);

        const visible = await this.filterReadable(absences, auth);
        return { kind: "absences_listed", absences: visible.map(toView) };
    }

    async listMine(auth: AuthContext): Promise<NotFound | { kind: "absences_listed"; absences: AbsenceView[] }> {
        const student = await this.students.findByUserId(auth.requesterId);
        if (!student) return NotFound;
        const absences = await this.absences.findByStudentId(student.id);
        return { kind: "absences_listed", absences: absences.map(toView) };
    }

    async listBySession(sessionId: string, auth: AuthContext): Promise<ListAbsencesResult> {
        if (!auth.isStaff) return Forbidden;
        const absences = await this.absences.findBySessionId(sessionId);
        const visible = await this.filterReadable(absences, auth);
        return { kind: "absences_listed", absences: visible.map(toView) };
    }

    private async filterReadable(absences: Absence[], auth: AuthContext): Promise<Absence[]> {
        if (auth.isAdmin) return absences;
        const visible: Absence[] = [];
        for (const absence of absences) {
            if (await this.canReadAbsence(absence, auth)) visible.push(absence);
        }
        return visible;
    }

    private canReadAbsence(absence: Absence, auth: AuthContext): Promise<boolean> {
        return canReadAbsence(
            { students: this.students, sessions: this.sessions, courses: this.courses, instructors: this.instructors },
            absence,
            auth,
        );
    }

    async findById(id: string, auth: AuthContext): Promise<GetAbsenceResult> {
        const absence = await this.absences.findById(id);
        if (!absence) return NotFound;
        if (!(await this.canReadAbsence(absence, auth))) return NotFound;
        return { kind: "absence_found", absence: toView(absence) };
    }
}
