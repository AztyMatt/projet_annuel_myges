import { type Absence } from "@domain/absence/absence.entity";
import { type AuthContext } from "@application/types/auth-context";
import { type StudentRepository } from "@application/student/student.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { isCourseInstructor } from "@application/course/course-access";

export type AbsenceReadDeps = {
    students: StudentRepository;
    sessions: SessionRepository;
    courses: CourseRepository;
    instructors: InstructorRepository;
};

export const canReadAbsence = async (deps: AbsenceReadDeps, absence: Absence, auth: AuthContext): Promise<boolean> => {
    if (auth.isAdmin) return true;
    const student = await deps.students.findByUserId(auth.requesterId);
    if (student && student.id === absence.studentId) return true;
    const session = await deps.sessions.findById(absence.sessionId);
    if (!session) return false;
    return isCourseInstructor({ courses: deps.courses, instructors: deps.instructors }, session.courseId, auth.requesterId);
};
