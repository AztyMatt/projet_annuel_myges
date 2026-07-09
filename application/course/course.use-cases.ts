import { randomUUID } from "node:crypto";
import { type Course } from "@domain/course/course.entity";
import { type Conversation } from "@domain/conversation/conversation.entity";
import { type CourseRepository } from "@application/course/course.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type AssessmentRepository } from "@application/assessment/assessment.repository";
import { type FileCourseRepository } from "@application/file/file-course/file-course.repository";
import { type FileRepository } from "@application/file/file.repository";
import { type StorageService } from "@application/file/storage.service";
import { type ConversationRepository } from "@application/conversation/conversation.repository";
import { type UnitOfWork } from "@application/types/unit-of-work";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";

export type CourseView = {
    id: string;
    instructorId: string;
    moduleId: string;
    groupId: string;
    blocId: string;
    conversationId: string;
};

export type CreateCourseResult = MissingFields | Forbidden | { kind: "course_already_exists" } | { kind: "course_created"; course: CourseView };

export type UpdateCourseResult =
    | NotFound
    | Forbidden
    | { kind: "course_updated"; course: CourseView };

export type DeleteCourseResult =
    | NotFound
    | Forbidden
    | { kind: "course_has_sessions" }
    | { kind: "course_has_assessments" }
    | { kind: "course_deleted" }
    | { kind: "course_deleted_with_warnings"; failedPaths: string[] };

export type GetCourseResult = NotFound | { kind: "course_found"; course: CourseView };

export type ListCoursesResult = Forbidden | { kind: "courses_listed"; courses: CourseView[] };

const toView = (c: Course): CourseView => ({
    id: c.id,
    instructorId: c.instructorId,
    moduleId: c.moduleId,
    groupId: c.groupId,
    blocId: c.blocId,
    conversationId: c.conversationId,
});

export class CourseUseCases {
    constructor(
        private readonly courses: CourseRepository,
        private readonly sessions: SessionRepository,
        private readonly assessments: AssessmentRepository,
        private readonly fileCourses: FileCourseRepository,
        private readonly files: FileRepository,
        private readonly storage: StorageService,
        private readonly conversations: ConversationRepository,
        private readonly unitOfWork: UnitOfWork,
    ) {}

    async create(input: {
        instructorId?: string;
        moduleId?: string;
        groupId?: string;
        blocId?: string;
    }, auth: AuthContext): Promise<CreateCourseResult> {
        if (!auth.isAdmin) return Forbidden;
        const { instructorId, moduleId, groupId, blocId } = input;
        if (!instructorId || !moduleId || !groupId || !blocId) return MissingFields;
        if (await this.courses.findByInstructorModuleGroup(instructorId, moduleId, groupId)) return { kind: "course_already_exists" };
        const conversation: Conversation = { id: randomUUID(), createdAt: new Date() };
        const course: Course = { id: randomUUID(), instructorId, moduleId, groupId, blocId, conversationId: conversation.id };
        await this.unitOfWork.run(async () => {
            await this.conversations.save(conversation);
            await this.courses.save(course);
        });
        return { kind: "course_created", course: toView(course) };
    }

    async update(
        id: string,
        input: {
            instructorId?: string;
            moduleId?: string;
            groupId?: string;
            blocId?: string;
        },
        auth: AuthContext,
    ): Promise<UpdateCourseResult> {
        if (!auth.isAdmin) return Forbidden;
        const course = await this.courses.findById(id);
        if (!course) return NotFound;
        if (input.instructorId !== undefined) course.instructorId = input.instructorId;
        if (input.moduleId !== undefined) course.moduleId = input.moduleId;
        if (input.groupId !== undefined) course.groupId = input.groupId;
        if (input.blocId !== undefined) course.blocId = input.blocId;
        await this.courses.save(course);
        return { kind: "course_updated", course: toView(course) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteCourseResult> {
        if (!auth.isAdmin) return Forbidden;
        const course = await this.courses.findById(id);
        if (!course) return NotFound;
        if (await this.sessions.existsByCourseId(id)) return { kind: "course_has_sessions" };
        if (await this.assessments.existsByCourseId(id)) return { kind: "course_has_assessments" };
        const fileCourses = await this.fileCourses.findByCourseId(id);
        const fileOrNulls = await Promise.all(fileCourses.map((fc) => this.files.findById(fc.fileId)));
        const storagePaths = fileOrNulls.filter(Boolean).map((f) => f!.storagePath);
        const fileIds = fileOrNulls.filter(Boolean).map((f) => f!.id);
        await this.unitOfWork.run(async () => {
            await this.fileCourses.deleteByCourseId(id);
            await this.files.deleteByIds(fileIds);
            await this.courses.deleteById(id);
            await this.conversations.deleteById(course.conversationId);
        });
        const failedPaths = await this.storage.deleteMany(storagePaths);
        return failedPaths.length > 0
            ? { kind: "course_deleted_with_warnings", failedPaths }
            : { kind: "course_deleted" };
    }

    async list(auth: AuthContext): Promise<ListCoursesResult> {
        if (!auth.isAdmin) return Forbidden;
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
