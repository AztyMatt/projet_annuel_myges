import { type Session } from "@domain/session/session.entity";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type SessionExamStudentRepository } from "@application/session/session-exam/session-exam-student/session-exam-student.repository";
import { type SessionExamInstructorRepository } from "@application/session/session-exam/session-exam-instructor/session-exam-instructor.repository";
import { type AuthContext } from "@application/types/auth-context";

export type CourseSessionAccessDeps = {
    courses: CourseRepository;
    instructors: InstructorRepository;
    students: StudentRepository;
    studentGroups: StudentGroupRepository;
};

export const canReadCourseSessions = async (
    deps: CourseSessionAccessDeps,
    courseId: string,
    auth: AuthContext,
): Promise<boolean> => {
    if (auth.isAdmin) return true;
    const course = await deps.courses.findById(courseId);
    if (!course) return false;
    const instructor = await deps.instructors.findByUserId(auth.requesterId);
    if (instructor && course.instructorId === instructor.id) return true;
    const student = await deps.students.findByUserId(auth.requesterId);
    if (student && (await deps.studentGroups.findByStudentAndGroup(student.id, course.groupId))) return true;
    return false;
};

export const canReadSession = (
    deps: CourseSessionAccessDeps,
    session: Session,
    auth: AuthContext,
): Promise<boolean> => canReadCourseSessions(deps, session.courseId, auth);

export type ExamCompositionDeps = {
    courses: CourseRepository;
    instructors: InstructorRepository;
    sessions: SessionRepository;
    sessionExamInstructors: SessionExamInstructorRepository;
};

export const canReadExamComposition = async (
    deps: ExamCompositionDeps,
    exam: { id: string; sessionId: string },
    auth: AuthContext,
): Promise<boolean> => {
    if (auth.isAdmin) return true;
    const instructor = await deps.instructors.findByUserId(auth.requesterId);
    if (!instructor) return false;
    if (await deps.sessionExamInstructors.findByExamAndInstructor(exam.id, instructor.id)) return true;
    const session = await deps.sessions.findById(exam.sessionId);
    if (!session) return false;
    const course = await deps.courses.findById(session.courseId);
    return !!course && course.instructorId === instructor.id;
};

export type SessionExamAccessDeps = CourseSessionAccessDeps & {
    sessions: SessionRepository;
    sessionExamStudents: SessionExamStudentRepository;
    sessionExamInstructors: SessionExamInstructorRepository;
};

export const canReadSessionExam = async (
    deps: SessionExamAccessDeps,
    exam: { id: string; sessionId: string },
    auth: AuthContext,
): Promise<boolean> => {
    if (await canReadExamComposition(deps, exam, auth)) return true;
    const session = await deps.sessions.findById(exam.sessionId);
    if (session && (await canReadSession(deps, session, auth))) return true;
    const student = await deps.students.findByUserId(auth.requesterId);
    return !!student && !!(await deps.sessionExamStudents.findByExamAndStudent(exam.id, student.id));
};
