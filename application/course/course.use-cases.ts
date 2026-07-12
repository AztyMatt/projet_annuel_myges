import { randomUUID } from "node:crypto";
import { type Course } from "@domain/course/course.entity";
import { GENERAL_GROUP_NAME } from "@domain/group/group.entity";
import { type Conversation } from "@domain/conversation/conversation.entity";
import { type CourseRepository } from "@application/course/course.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type AssessmentRepository } from "@application/assessment/assessment.repository";
import { type FileCourseRepository } from "@application/file/file-course/file-course.repository";
import { type FileRepository } from "@application/file/file.repository";
import { type StorageService } from "@application/file/storage.service";
import { type ConversationRepository } from "@application/conversation/conversation.repository";
import { type GroupRepository } from "@application/group/group.repository";
import { type ClassRepository } from "@application/class/class.repository";
import { type BlocRepository } from "@application/bloc/bloc.repository";
import { type ProgramModuleRepository } from "@application/program/program-module/program-module.repository";
import { type UnitOfWork } from "@application/types/unit-of-work";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden, ForbiddenOwnership } from "@application/types/results";
import { type InstructorRepository } from "@application/instructor/instructor.repository";

export type CourseView = {
    id: string;
    instructorId: string;
    moduleId: string;
    groupId: string;
    blocId: string;
    conversationId: string;
};

type CourseStructureError =
    | { kind: "group_not_found" }
    | { kind: "class_not_found" }
    | { kind: "instructor_not_found" }
    | { kind: "module_not_in_program" }
    | { kind: "bloc_not_in_program" };

export type CreateCourseResult =
    | Forbidden
    | CourseStructureError
    | { kind: "group_not_in_class" }
    | { kind: "course_already_exists" }
    | { kind: "course_created"; course: CourseView };

export type UpdateCourseResult =
    | NotFound
    | Forbidden
    | CourseStructureError
    | { kind: "course_already_exists" }
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
        private readonly groups: GroupRepository,
        private readonly classes: ClassRepository,
        private readonly blocs: BlocRepository,
        private readonly programModules: ProgramModuleRepository,
        private readonly unitOfWork: UnitOfWork,
        private readonly instructors: InstructorRepository,
    ) {}

    private async validateModuleAndBloc(
        groupId: string,
        moduleId: string,
        blocId: string,
    ): Promise<CourseStructureError | null> {
        const group = await this.groups.findById(groupId);
        if (!group) return { kind: "group_not_found" };
        const cls = await this.classes.findById(group.classId);
        if (!cls) return { kind: "class_not_found" };
        if (!(await this.programModules.findByProgramAndModule(cls.programId, moduleId))) return { kind: "module_not_in_program" };
        const bloc = await this.blocs.findById(blocId);
        if (!bloc || bloc.programId !== cls.programId) return { kind: "bloc_not_in_program" };
        return null;
    }

    async create(input: {
        instructorId?: string;
        moduleId?: string;
        classId?: string;
        groupId?: string;
        blocId?: string;
    }, auth: AuthContext): Promise<CreateCourseResult> {
        if (!auth.isAdmin) return Forbidden;
        const { instructorId, moduleId, classId, groupId, blocId } = input as {
            instructorId: string;
            moduleId: string;
            classId: string;
            groupId?: string;
            blocId: string;
        };
        const cls = await this.classes.findById(classId);
        if (!cls) return { kind: "class_not_found" };

        let resolvedGroupId: string;
        if (groupId) {
            const group = await this.groups.findById(groupId);
            if (!group) return { kind: "group_not_found" };
            if (group.classId !== classId) return { kind: "group_not_in_class" };
            resolvedGroupId = group.id;
        } else {
            const general = await this.groups.findByClassAndName(classId, GENERAL_GROUP_NAME);
            if (!general) return { kind: "group_not_found" };
            resolvedGroupId = general.id;
        }

        if (!(await this.instructors.findById(instructorId))) return { kind: "instructor_not_found" };
        const structureError = await this.validateModuleAndBloc(resolvedGroupId, moduleId, blocId);
        if (structureError) return structureError;
        if (await this.courses.findByInstructorModuleGroup(instructorId, moduleId, resolvedGroupId)) return { kind: "course_already_exists" };
        const conversation: Conversation = { id: randomUUID(), createdAt: new Date() };
        const course: Course = { id: randomUUID(), instructorId, moduleId, groupId: resolvedGroupId, blocId, conversationId: conversation.id };
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
        const newGroupId = input.groupId !== undefined ? input.groupId : course.groupId;
        const newModuleId = input.moduleId !== undefined ? input.moduleId : course.moduleId;
        const newBlocId = input.blocId !== undefined ? input.blocId : course.blocId;
        const newInstructorId = input.instructorId !== undefined ? input.instructorId : course.instructorId;

        if (input.instructorId !== undefined && !(await this.instructors.findById(input.instructorId)))
            return { kind: "instructor_not_found" };
        const structureError = await this.validateModuleAndBloc(newGroupId, newModuleId, newBlocId);
        if (structureError) return structureError;

        const duplicate = await this.courses.findByInstructorModuleGroup(newInstructorId, newModuleId, newGroupId);
        if (duplicate && duplicate.id !== id) return { kind: "course_already_exists" };
        course.instructorId = newInstructorId;
        course.moduleId = newModuleId;
        course.groupId = newGroupId;
        course.blocId = newBlocId;
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

    async listByInstructor(instructorId: string, auth: AuthContext): Promise<ListCoursesResult> {
        if (!auth.isAdmin) {
            const instructor = await this.instructors.findByUserId(auth.requesterId);
            if (!instructor || instructor.id !== instructorId) return ForbiddenOwnership;
        }
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
