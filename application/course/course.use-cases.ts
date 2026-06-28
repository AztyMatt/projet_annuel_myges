import { randomUUID } from "node:crypto";
import { type Course } from "@domain/course/course.entity";
import { type CourseRepository } from "@application/course/course.repository";
import { NotFound, MissingFields } from "@application/types/results";

export type CourseView = {
    id: string;
    instructorId: string;
    moduleId: string;
    groupId: string;
    blocId: string;
    conversationId: string;
};

export type CreateCourseResult = MissingFields | { kind: "course_created"; course: CourseView };

export type UpdateCourseResult =
    | NotFound
    | { kind: "course_updated"; course: CourseView };

export type DeleteCourseResult = NotFound | { kind: "course_deleted" };

export type GetCourseResult = NotFound | { kind: "course_found"; course: CourseView };

export type ListCoursesResult = { kind: "courses_listed"; courses: CourseView[] };

const toView = (c: Course): CourseView => ({
    id: c.id,
    instructorId: c.instructorId,
    moduleId: c.moduleId,
    groupId: c.groupId,
    blocId: c.blocId,
    conversationId: c.conversationId,
});

export class CourseUseCases {
    constructor(private readonly courses: CourseRepository) {}

    async create(input: {
        instructorId?: string;
        moduleId?: string;
        groupId?: string;
        blocId?: string;
        conversationId?: string;
    }): Promise<CreateCourseResult> {
        const { instructorId, moduleId, groupId, blocId, conversationId } = input;
        if (!instructorId || !moduleId || !groupId || !blocId || !conversationId) return MissingFields;
        const course: Course = { id: randomUUID(), instructorId, moduleId, groupId, blocId, conversationId };
        await this.courses.save(course);
        return { kind: "course_created", course: toView(course) };
    }

    async update(
        id: string,
        input: {
            instructorId?: string;
            moduleId?: string;
            groupId?: string;
            blocId?: string;
            conversationId?: string;
        },
    ): Promise<UpdateCourseResult> {
        const course = await this.courses.findById(id);
        if (!course) return NotFound;
        if (input.instructorId !== undefined) course.instructorId = input.instructorId;
        if (input.moduleId !== undefined) course.moduleId = input.moduleId;
        if (input.groupId !== undefined) course.groupId = input.groupId;
        if (input.blocId !== undefined) course.blocId = input.blocId;
        if (input.conversationId !== undefined) course.conversationId = input.conversationId;
        await this.courses.save(course);
        return { kind: "course_updated", course: toView(course) };
    }

    async delete(id: string): Promise<DeleteCourseResult> {
        const course = await this.courses.findById(id);
        if (!course) return NotFound;
        await this.courses.deleteById(id);
        return { kind: "course_deleted" };
    }

    async list(): Promise<ListCoursesResult> {
        const courses = await this.courses.list();
        return { kind: "courses_listed", courses: courses.map(toView) };
    }

    async listByInstructor(instructorId: string): Promise<ListCoursesResult> {
        const courses = await this.courses.findByInstructorId(instructorId);
        return { kind: "courses_listed", courses: courses.map(toView) };
    }

    async listByModule(moduleId: string): Promise<ListCoursesResult> {
        const courses = await this.courses.findByModuleId(moduleId);
        return { kind: "courses_listed", courses: courses.map(toView) };
    }

    async listByGroup(groupId: string): Promise<ListCoursesResult> {
        const courses = await this.courses.findByGroupId(groupId);
        return { kind: "courses_listed", courses: courses.map(toView) };
    }

    async listByBloc(blocId: string): Promise<ListCoursesResult> {
        const courses = await this.courses.findByBlocId(blocId);
        return { kind: "courses_listed", courses: courses.map(toView) };
    }

    async findById(id: string): Promise<GetCourseResult> {
        const course = await this.courses.findById(id);
        if (!course) return NotFound;
        return { kind: "course_found", course: toView(course) };
    }
}
