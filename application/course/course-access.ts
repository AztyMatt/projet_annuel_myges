import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";

export const isCourseInstructor = async (
    deps: { courses: CourseRepository; instructors: InstructorRepository },
    courseId: string,
    requesterId: string,
): Promise<boolean> => {
    const [course, instructor] = await Promise.all([
        deps.courses.findById(courseId),
        deps.instructors.findByUserId(requesterId),
    ]);
    return !!course && !!instructor && course.instructorId === instructor.id;
};
