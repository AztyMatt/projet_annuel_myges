// Doubles de test en mémoire pour AbsenceUseCases — ne couvrent que ce qu'exercent les tests
// actuels (validate/reject) : absences, students et notifications sont de vrais fakes
// fonctionnels, le reste (8 dépendances, utilisées par declare/delete) est un stub qui
// explose si jamais sollicité.
import { type Absence } from "@domain/absence/absence.entity";
import { type Student } from "@domain/student/student.entity";
import { type Notification } from "@domain/notification/notification.entity";
import { type AbsenceRepository } from "@application/absence/absence.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type FileJustificationRepository } from "@application/file/file-justification/file-justification.repository";
import { type FileRepository } from "@application/file/file.repository";
import { type StorageService } from "@application/file/storage.service";
import { type UnitOfWork } from "@application/types/unit-of-work";
import { type NotificationRepository } from "@application/notification/notification.repository";
import { NotificationUseCases } from "@application/notification/notification.use-cases";
import { AbsenceUseCases } from "@application/absence/absence.use-cases";
import { notImplementedMethod, notImplementedRepository } from "../../test/fakes/not-implemented";

function createFakeAbsenceRepository() {
    const absences = new Map<string, Absence>();
    const repo: AbsenceRepository = {
        async findById(id) {
            return absences.get(id);
        },
        findByStudentId: notImplementedMethod("absences", "findByStudentId"),
        existsByStudentId: notImplementedMethod("absences", "existsByStudentId"),
        findBySessionId: notImplementedMethod("absences", "findBySessionId"),
        existsBySessionId: notImplementedMethod("absences", "existsBySessionId"),
        findByStudentAndSession: notImplementedMethod("absences", "findByStudentAndSession"),
        async save(absence) {
            absences.set(absence.id, { ...absence });
        },
        deleteById: notImplementedMethod("absences", "deleteById"),
        list: notImplementedMethod("absences", "list"),
    };
    return { repo, absences };
}

function createFakeStudentRepository() {
    const students = new Map<string, Student>();
    const repo: StudentRepository = {
        async findById(id) {
            return students.get(id);
        },
        async findByUserId(userId) {
            return [...students.values()].find((s) => s.userId === userId);
        },
        findByProgramId: notImplementedMethod("students", "findByProgramId"),
        existsByProgramId: notImplementedMethod("students", "existsByProgramId"),
        findUserIdsByGroupIds: notImplementedMethod("students", "findUserIdsByGroupIds"),
        async save(student) {
            students.set(student.id, student);
        },
        deleteById: notImplementedMethod("students", "deleteById"),
        list: notImplementedMethod("students", "list"),
    };
    return { repo, students };
}

function createFakeNotificationUseCases() {
    const sent: Notification[] = [];
    const repo: NotificationRepository = {
        findById: notImplementedMethod("notifications", "findById"),
        findByUserId: notImplementedMethod("notifications", "findByUserId"),
        countUnreadByUserId: notImplementedMethod("notifications", "countUnreadByUserId"),
        async save(notification) {
            sent.push(notification);
        },
        markAsRead: notImplementedMethod("notifications", "markAsRead"),
        markAllAsReadByUserId: notImplementedMethod("notifications", "markAllAsReadByUserId"),
    };
    return { useCases: new NotificationUseCases(repo), sent };
}

export function buildAbsenceUseCases() {
    const absences = createFakeAbsenceRepository();
    const students = createFakeStudentRepository();
    const notifications = createFakeNotificationUseCases();

    const absenceUseCases = new AbsenceUseCases(
        absences.repo,
        notImplementedRepository<FileJustificationRepository>("fileJustifications"),
        notImplementedRepository<FileRepository>("files"),
        notImplementedRepository<StorageService>("storage"),
        notImplementedRepository<UnitOfWork>("unitOfWork"),
        students.repo,
        notImplementedRepository<SessionRepository>("sessions"),
        notImplementedRepository<CourseRepository>("courses"),
        notImplementedRepository<InstructorRepository>("instructors"),
        notImplementedRepository<StudentGroupRepository>("studentGroups"),
        notifications.useCases,
    );

    return {
        absenceUseCases,
        absences: absences.absences,
        students: students.students,
        sentNotifications: notifications.sent,
    };
}
