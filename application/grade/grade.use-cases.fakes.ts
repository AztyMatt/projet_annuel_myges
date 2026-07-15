// Doubles de test en mémoire pour GradeUseCases — ne couvrent que ce qu'exercent les tests
// actuels (create/update/lock/unlock) : grades, students et notifications sont de vrais fakes
// fonctionnels, le reste (10 dépendances) est un stub qui explose si jamais sollicité.
import { type Grade } from "@domain/grade/grade.entity";
import { type Student } from "@domain/student/student.entity";
import { type Notification } from "@domain/notification/notification.entity";
import { type GradeRepository } from "@application/grade/grade.repository";
import { type GradeAssessmentRepository } from "@application/grade/grade-assessment/grade-assessment.repository";
import { type GradeSessionExamRepository } from "@application/grade/grade-session-exam/grade-session-exam.repository";
import { type GradeManualNotationRepository } from "@application/grade/grade-manual-notation/grade-manual-notation.repository";
import { type ManualNotationRepository } from "@application/grade/grade-manual-notation/manual-notation/manual-notation.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type AssessmentRepository } from "@application/assessment/assessment.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type SessionExamRepository } from "@application/session/session-exam/session-exam.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type SessionExamStudentRepository } from "@application/session/session-exam/session-exam-student/session-exam-student.repository";
import { type ModuleRepository } from "@application/module/module.repository";
import { type NotificationRepository } from "@application/notification/notification.repository";
import { NotificationUseCases } from "@application/notification/notification.use-cases";
import { GradeUseCases } from "@application/grade/grade.use-cases";
import { notImplementedMethod, notImplementedRepository } from "../../test/fakes/not-implemented";

function createFakeGradeRepository() {
    const grades = new Map<string, Grade>();
    const repo: GradeRepository = {
        async findById(id) {
            return grades.get(id);
        },
        findByStudentId: notImplementedMethod("grades", "findByStudentId"),
        findByEnteredBy: notImplementedMethod("grades", "findByEnteredBy"),
        async save(grade) {
            grades.set(grade.id, { ...grade });
        },
        async deleteById(id) {
            grades.delete(id);
        },
        list: notImplementedMethod("grades", "list"),
    };
    return { repo, grades };
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

export function buildGradeUseCases() {
    const grades = createFakeGradeRepository();
    const students = createFakeStudentRepository();
    const notifications = createFakeNotificationUseCases();

    const gradeUseCases = new GradeUseCases(
        grades.repo,
        notImplementedRepository<GradeAssessmentRepository>("gradeAssessments"),
        notImplementedRepository<GradeSessionExamRepository>("gradeSessionExams"),
        notImplementedRepository<GradeManualNotationRepository>("gradeManualNotations"),
        notImplementedRepository<ManualNotationRepository>("manualNotations"),
        students.repo,
        notImplementedRepository<AssessmentRepository>("assessments"),
        notImplementedRepository<CourseRepository>("courses"),
        notImplementedRepository<InstructorRepository>("instructors"),
        notImplementedRepository<SessionExamRepository>("sessionExams"),
        notImplementedRepository<SessionRepository>("sessions"),
        notImplementedRepository<SessionExamStudentRepository>("sessionExamStudents"),
        notImplementedRepository<ModuleRepository>("modules"),
        notifications.useCases,
    );

    return { gradeUseCases, grades: grades.grades, students: students.students, sentNotifications: notifications.sent };
}
