import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type ProgramModuleRepository } from "@application/program/program-module/program-module.repository";
import { type BlocRepository } from "@application/bloc/bloc.repository";

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

export const hasCourseIncompatibleWithProgram = async (
    deps: { programModules: ProgramModuleRepository; blocs: BlocRepository },
    courses: ReadonlyArray<{ moduleId: string; blocId: string }>,
    programId: string,
): Promise<boolean> => {
    if (courses.length === 0) return false;
    const [programModules, blocs] = await Promise.all([
        deps.programModules.findByProgramId(programId),
        deps.blocs.findByProgramId(programId),
    ]);
    const moduleIds = new Set(programModules.map((pm) => pm.moduleId));
    const blocIds = new Set(blocs.map((b) => b.id));
    return courses.some((c) => !moduleIds.has(c.moduleId) || !blocIds.has(c.blocId));
};
