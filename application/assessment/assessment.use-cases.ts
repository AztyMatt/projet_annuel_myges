import { randomUUID } from "node:crypto";
import { type Assessment } from "@domain/assessment/assessment.entity";
import { AssessmentType } from "@domain/assessment/assessment.enums";
import { type AssessmentGroup } from "@domain/assessment/assessment-group/assessment-group.entity";
import { type AssessmentGroupMember } from "@domain/assessment/assessment-group-member/assessment-group-member.entity";
import { type AssessmentRepository } from "@application/assessment/assessment.repository";
import { type AssessmentGroupRepository } from "@application/assessment/assessment-group/assessment-group.repository";
import { type AssessmentGroupMemberRepository } from "@application/assessment/assessment-group-member/assessment-group-member.repository";
import { type FileAssessmentRepository } from "@application/file/file-assessment/file-assessment.repository";
import { type FileAssessmentInstructionRepository } from "@application/file/file-assessment-instruction/file-assessment-instruction.repository";
import { type FileRepository } from "@application/file/file.repository";
import { type StorageService } from "@application/file/storage.service";
import { type GradeAssessmentRepository } from "@application/grade/grade-assessment/grade-assessment.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type StudentRepository } from "@application/student/student.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type SessionExamRepository } from "@application/session/session-exam/session-exam.repository";
import { type UnitOfWork } from "@application/types/unit-of-work";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, Forbidden, ForbiddenOwnership } from "@application/types/results";
import { isCourseInstructor as resolveCourseInstructor } from "@application/course/course-access";

export type AssessmentView = {
    id: string;
    courseId: string;
    title: string;
    type: AssessmentType;
    isPublished: boolean;
    dueDate: string;
    maxGroupSize: number;
};

export type AssessmentGroupView = {
    id: string;
    assessmentId: string;
};

export type AssessmentGroupMemberView = {
    id: string;
    assessmentGroupId: string;
    studentId: string;
};

export type CreateAssessmentResult =
    | Forbidden
    | { kind: "course_not_found" }
    | { kind: "course_finished" }
    | { kind: "assessment_already_exists" }
    | { kind: "assessment_created"; assessment: AssessmentView };

export type UpdateAssessmentResult =
    | NotFound
    | Forbidden
    | { kind: "assessment_locked" }
    | { kind: "assessment_updated"; assessment: AssessmentView };

export type DeleteAssessmentResult =
    | NotFound
    | Forbidden
    | { kind: "assessment_has_grades" }
    | { kind: "assessment_has_submissions" }
    | { kind: "assessment_linked_to_session_exam" }
    | { kind: "assessment_deleted" }
    | { kind: "assessment_deleted_with_warnings"; failedPaths: string[] };

export type GetAssessmentResult =
    | NotFound
    | { kind: "assessment_found"; assessment: AssessmentView };

export type ListAssessmentsResult = Forbidden | { kind: "assessments_listed"; assessments: AssessmentView[] };

export type PublishAssessmentResult =
    | NotFound
    | Forbidden
    | { kind: "assessment_published"; assessment: AssessmentView };

export type CreateAssessmentGroupResult =
    | Forbidden
    | { kind: "members_required" }
    | { kind: "assessment_not_found" }
    | { kind: "assessment_not_published" }
    | { kind: "past_due_date" }
    | { kind: "group_full" }
    | { kind: "student_not_in_course_group" }
    | { kind: "student_already_in_group" }
    | { kind: "assessment_group_created"; assessmentGroup: AssessmentGroupView };

export type DeleteAssessmentGroupResult =
    | NotFound
    | Forbidden
    | { kind: "assessment_group_has_submissions" }
    | { kind: "assessment_group_has_grades" }
    | { kind: "assessment_group_deleted" };

export type GetAssessmentGroupResult =
    | NotFound
    | { kind: "assessment_group_found"; assessmentGroup: AssessmentGroupView };

export type ListAssessmentGroupsResult = {
    kind: "assessment_groups_listed";
    assessmentGroups: AssessmentGroupView[];
};

export type AddAssessmentGroupMemberResult =
    | Forbidden
    | { kind: "assessment_group_missing" }
    | { kind: "assessment_not_found" }
    | { kind: "assessment_not_published" }
    | { kind: "past_due_date" }
    | { kind: "group_full" }
    | { kind: "student_not_in_course_group" }
    | { kind: "student_already_in_group" }
    | { kind: "member_already_exists" }
    | { kind: "assessment_group_member_added"; member: AssessmentGroupMemberView };

export type DeleteAssessmentGroupMemberResult =
    | NotFound
    | Forbidden
    | { kind: "assessment_group_missing" }
    | { kind: "assessment_group_has_submissions" }
    | { kind: "assessment_group_has_grades" }
    | { kind: "assessment_group_member_deleted" };

export type GetAssessmentGroupMemberResult =
    | NotFound
    | { kind: "assessment_group_member_found"; member: AssessmentGroupMemberView };

export type ListAssessmentGroupMembersResult = {
    kind: "assessment_group_members_listed";
    members: AssessmentGroupMemberView[];
};

const toAssessmentView = (a: Assessment): AssessmentView => ({
    id: a.id,
    courseId: a.courseId,
    title: a.title,
    type: a.type,
    isPublished: a.isPublished,
    dueDate: a.dueDate.toISOString(),
    maxGroupSize: a.maxGroupSize,
});

const toAssessmentGroupView = (g: AssessmentGroup): AssessmentGroupView => ({
    id: g.id,
    assessmentId: g.assessmentId,
});

const toAssessmentGroupMemberView = (m: AssessmentGroupMember): AssessmentGroupMemberView => ({
    id: m.id,
    assessmentGroupId: m.assessmentGroupId,
    studentId: m.studentId,
});

export class AssessmentUseCases {
    constructor(
        private readonly assessments: AssessmentRepository,
        private readonly assessmentGroups: AssessmentGroupRepository,
        private readonly assessmentGroupMembers: AssessmentGroupMemberRepository,
        private readonly fileAssessments: FileAssessmentRepository,
        private readonly gradeAssessments: GradeAssessmentRepository,
        private readonly courses: CourseRepository,
        private readonly students: StudentRepository,
        private readonly fileAssessmentInstructions: FileAssessmentInstructionRepository,
        private readonly files: FileRepository,
        private readonly storage: StorageService,
        private readonly sessionExams: SessionExamRepository,
        private readonly instructors: InstructorRepository,
        private readonly studentGroups: StudentGroupRepository,
        private readonly sessions: SessionRepository,
        private readonly unitOfWork: UnitOfWork,
    ) {}

    private async isCourseFinished(courseId: string): Promise<boolean> {
        const sessions = await this.sessions.findByCourseId(courseId);
        const now = new Date();
        return sessions.length > 0 && sessions.every((s) => s.endTime < now);
    }

    private async studentInAssessmentGroup(assessmentId: string, studentId: string): Promise<boolean> {
        const memberships = await this.assessmentGroupMembers.findByStudentId(studentId);
        if (memberships.length === 0) return false;
        const groups = await this.assessmentGroups.findByAssessmentId(assessmentId);
        const groupIds = new Set(groups.map((g) => g.id));
        return memberships.some((m) => groupIds.has(m.assessmentGroupId));
    }

    private async studentInCourseGroup(courseId: string, studentId: string): Promise<boolean> {
        const course = await this.courses.findById(courseId);
        if (!course) return false;
        return !!(await this.studentGroups.findByStudentAndGroup(studentId, course.groupId));
    }

    private isCourseInstructor(courseId: string, requesterId: string): Promise<boolean> {
        return resolveCourseInstructor({ courses: this.courses, instructors: this.instructors }, courseId, requesterId);
    }

    async create(input: {
        courseId?: string;
        title?: string;
        type?: AssessmentType;
        isPublished?: boolean;
        dueDate?: string;
        maxGroupSize?: number;
    }, auth: AuthContext): Promise<CreateAssessmentResult> {
        const { courseId, title, type, isPublished = false, dueDate, maxGroupSize } = input as {
            courseId: string;
            title: string;
            type: AssessmentType;
            isPublished?: boolean;
            dueDate: string;
            maxGroupSize: number;
        };

        if (!auth.isStaff) return Forbidden;
        if (!(await this.courses.findById(courseId))) return { kind: "course_not_found" };
        if (!auth.isAdmin && !(await this.isCourseInstructor(courseId, auth.requesterId)))
            return ForbiddenOwnership;

        const parsedDueDate = new Date(dueDate);
        if (await this.isCourseFinished(courseId)) return { kind: "course_finished" };
        if (await this.assessments.findByCourseAndTitle(courseId, title, parsedDueDate)) return { kind: "assessment_already_exists" };
        const assessment: Assessment = {
            id: randomUUID(),
            courseId,
            title,
            type,
            isPublished,
            dueDate: parsedDueDate,
            maxGroupSize,
        };
        await this.assessments.save(assessment);
        return { kind: "assessment_created", assessment: toAssessmentView(assessment) };
    }

    async update(
        id: string,
        input: {
            title?: string;
            type?: AssessmentType;
            isPublished?: boolean;
            dueDate?: string;
            maxGroupSize?: number;
        },
        auth: AuthContext,
    ): Promise<UpdateAssessmentResult> {
        if (!auth.isStaff) return Forbidden;
        const assessment = await this.assessments.findById(id);
        if (!assessment) return NotFound;
        if (!auth.isAdmin && !(await this.isCourseInstructor(assessment.courseId, auth.requesterId)))
            return ForbiddenOwnership;

        if (assessment.isPublished) {
            if (
                (input.type !== undefined && input.type !== assessment.type) ||
                (input.maxGroupSize !== undefined && input.maxGroupSize !== assessment.maxGroupSize) ||
                input.isPublished === false
            )
                return { kind: "assessment_locked" };
        }
        if (input.dueDate !== undefined) assessment.dueDate = new Date(input.dueDate);
        if (input.title !== undefined) assessment.title = input.title;
        if (input.type !== undefined) assessment.type = input.type;
        if (input.isPublished !== undefined) assessment.isPublished = input.isPublished;
        if (input.maxGroupSize !== undefined) assessment.maxGroupSize = input.maxGroupSize;
        await this.assessments.save(assessment);
        return { kind: "assessment_updated", assessment: toAssessmentView(assessment) };
    }

    async publish(id: string, auth: AuthContext): Promise<PublishAssessmentResult> {
        if (!auth.isStaff) return Forbidden;
        const assessment = await this.assessments.findById(id);
        if (!assessment) return NotFound;
        if (!auth.isAdmin && !(await this.isCourseInstructor(assessment.courseId, auth.requesterId)))
            return ForbiddenOwnership;
        assessment.isPublished = true;
        await this.assessments.save(assessment);
        return { kind: "assessment_published", assessment: toAssessmentView(assessment) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteAssessmentResult> {
        if (!auth.isStaff) return Forbidden;
        const assessment = await this.assessments.findById(id);
        if (!assessment) return NotFound;
        if (!auth.isAdmin && !(await this.isCourseInstructor(assessment.courseId, auth.requesterId)))
            return ForbiddenOwnership;
        if (await this.gradeAssessments.existsByAssessmentId(id)) return { kind: "assessment_has_grades" };
        if (await this.fileAssessments.existsByAssessmentId(id)) return { kind: "assessment_has_submissions" };
        if (await this.sessionExams.existsByAssessmentId(id)) return { kind: "assessment_linked_to_session_exam" };
        const instructions = await this.fileAssessmentInstructions.findByAssessmentId(id);
        const fileOrNulls = await Promise.all(instructions.map((i) => this.files.findById(i.fileId)));
        const storagePaths = fileOrNulls.filter(Boolean).map((f) => f!.storagePath);
        await this.unitOfWork.run(async () => {
            for (const i of instructions) await this.fileAssessmentInstructions.deleteById(i.id);
            for (const f of fileOrNulls) if (f) await this.files.deleteById(f.id);
            await this.assessments.deleteById(id);
        });
        const failedPaths = await this.storage.deleteMany(storagePaths);
        return failedPaths.length > 0
            ? { kind: "assessment_deleted_with_warnings", failedPaths }
            : { kind: "assessment_deleted" };
    }

    async list(auth: AuthContext): Promise<ListAssessmentsResult> {
        if (!auth.isAdmin) return Forbidden;
        const assessments = await this.assessments.list();
        return { kind: "assessments_listed", assessments: assessments.map(toAssessmentView) };
    }

    async listByCourse(courseId: string): Promise<ListAssessmentsResult> {
        const assessments = await this.assessments.findByCourseId(courseId);
        return { kind: "assessments_listed", assessments: assessments.map(toAssessmentView) };
    }

    async findById(id: string): Promise<GetAssessmentResult> {
        const assessment = await this.assessments.findById(id);
        if (!assessment) return NotFound;
        return { kind: "assessment_found", assessment: toAssessmentView(assessment) };
    }

    async createGroup(input: { assessmentId?: string; studentIds?: string[] }, auth: AuthContext): Promise<CreateAssessmentGroupResult> {
        const { assessmentId } = input as { assessmentId: string; studentIds?: string[] };
        const assessment = await this.assessments.findById(assessmentId);
        if (!assessment) return { kind: "assessment_not_found" };

        const student = await this.students.findByUserId(auth.requesterId);
        let memberIds: string[];
        if (student) {
            memberIds = [student.id];
        } else {
            if (!auth.isAdmin && !(await this.isCourseInstructor(assessment.courseId, auth.requesterId))) return ForbiddenOwnership;
            memberIds = [...new Set(input.studentIds ?? [])];
        }

        if (!assessment.isPublished) return { kind: "assessment_not_published" };
        if (memberIds.length === 0) return { kind: "members_required" };
        if (new Date() > assessment.dueDate) return { kind: "past_due_date" };
        if (memberIds.length > assessment.maxGroupSize) return { kind: "group_full" };
        for (const studentId of memberIds) {
            if (!(await this.studentInCourseGroup(assessment.courseId, studentId))) return { kind: "student_not_in_course_group" };
            if (await this.studentInAssessmentGroup(assessmentId, studentId)) return { kind: "student_already_in_group" };
        }
        const group: AssessmentGroup = { id: randomUUID(), assessmentId };
        await this.unitOfWork.run(async () => {
            await this.assessmentGroups.save(group);
            for (const studentId of memberIds) {
                const member: AssessmentGroupMember = { id: randomUUID(), assessmentGroupId: group.id, studentId };
                await this.assessmentGroupMembers.save(member);
            }
        });
        return { kind: "assessment_group_created", assessmentGroup: toAssessmentGroupView(group) };
    }

    async deleteGroup(id: string, auth: AuthContext): Promise<DeleteAssessmentGroupResult> {
        const group = await this.assessmentGroups.findById(id);
        if (!group) return NotFound;
        if (!auth.isAdmin) {
            const assessment = await this.assessments.findById(group.assessmentId);
            if (!assessment || !(await this.isCourseInstructor(assessment.courseId, auth.requesterId)))
                return ForbiddenOwnership;
        }
        if (await this.fileAssessments.existsByAssessmentGroupId(id)) return { kind: "assessment_group_has_submissions" };
        const members = await this.assessmentGroupMembers.findByAssessmentGroupId(id);
        const studentIds = members.map((m) => m.studentId);
        if (await this.gradeAssessments.existsByAssessmentIdAndStudentIds(group.assessmentId, studentIds))
            return { kind: "assessment_group_has_grades" };
        await this.assessmentGroups.deleteById(id);
        return { kind: "assessment_group_deleted" };
    }

    async findGroupById(id: string): Promise<GetAssessmentGroupResult> {
        const group = await this.assessmentGroups.findById(id);
        if (!group) return NotFound;
        return { kind: "assessment_group_found", assessmentGroup: toAssessmentGroupView(group) };
    }

    async listGroupsByAssessment(assessmentId: string): Promise<ListAssessmentGroupsResult> {
        const groups = await this.assessmentGroups.findByAssessmentId(assessmentId);
        return { kind: "assessment_groups_listed", assessmentGroups: groups.map(toAssessmentGroupView) };
    }

    async addGroupMember(input: {
        assessmentGroupId?: string;
        studentId?: string;
    }, auth: AuthContext): Promise<AddAssessmentGroupMemberResult> {
        const { assessmentGroupId, studentId } = input as { assessmentGroupId: string; studentId: string };
        const group = await this.assessmentGroups.findById(assessmentGroupId);
        if (!group) return { kind: "assessment_group_missing" };
        const assessment = await this.assessments.findById(group.assessmentId);
        if (!assessment) return { kind: "assessment_not_found" };

        if (!auth.isAdmin && !(await this.isCourseInstructor(assessment.courseId, auth.requesterId))) {
            const requester = await this.students.findByUserId(auth.requesterId);
            if (!requester || requester.id !== studentId) return ForbiddenOwnership;
        }

        if (!assessment.isPublished) return { kind: "assessment_not_published" };
        if (new Date() > assessment.dueDate) return { kind: "past_due_date" };
        if (await this.assessmentGroupMembers.findByGroupAndStudent(assessmentGroupId, studentId)) return { kind: "member_already_exists" };
        if (await this.studentInAssessmentGroup(assessment.id, studentId)) return { kind: "student_already_in_group" };
        if (!(await this.studentInCourseGroup(assessment.courseId, studentId))) return { kind: "student_not_in_course_group" };
        const current = await this.assessmentGroupMembers.findByAssessmentGroupId(assessmentGroupId);
        if (current.length + 1 > assessment.maxGroupSize) return { kind: "group_full" };
        const member: AssessmentGroupMember = { id: randomUUID(), assessmentGroupId, studentId };
        await this.assessmentGroupMembers.save(member);
        return {
            kind: "assessment_group_member_added",
            member: toAssessmentGroupMemberView(member),
        };
    }

    async deleteGroupMember(id: string, auth: AuthContext): Promise<DeleteAssessmentGroupMemberResult> {
        const member = await this.assessmentGroupMembers.findById(id);
        if (!member) return NotFound;
        const group = await this.assessmentGroups.findById(member.assessmentGroupId);
        if (!auth.isAdmin) {
            const student = await this.students.findByUserId(auth.requesterId);
            const isSelf = !!student && student.id === member.studentId;
            const assessment = group ? await this.assessments.findById(group.assessmentId) : null;
            const isInstructor = !!assessment && (await this.isCourseInstructor(assessment.courseId, auth.requesterId));
            if (!isSelf && !isInstructor) return ForbiddenOwnership;
        }
        if (!group) {
            if (!auth.isSuperAdmin) return { kind: "assessment_group_missing" };
            await this.assessmentGroupMembers.deleteById(id);
            return { kind: "assessment_group_member_deleted" };
        }
        if (await this.fileAssessments.existsByAssessmentGroupId(member.assessmentGroupId)) return { kind: "assessment_group_has_submissions" };
        const allMembers = await this.assessmentGroupMembers.findByAssessmentGroupId(member.assessmentGroupId);
        const studentIds = allMembers.map((m) => m.studentId);
        if (await this.gradeAssessments.existsByAssessmentIdAndStudentIds(group.assessmentId, studentIds))
            return { kind: "assessment_group_has_grades" };
        await this.unitOfWork.run(async () => {
            await this.assessmentGroupMembers.deleteById(id);
            const remaining = await this.assessmentGroupMembers.findByAssessmentGroupId(member.assessmentGroupId);
            if (remaining.length === 0) {
                await this.assessmentGroups.deleteById(member.assessmentGroupId);
            }
        });
        return { kind: "assessment_group_member_deleted" };
    }

    async findGroupMemberById(id: string): Promise<GetAssessmentGroupMemberResult> {
        const member = await this.assessmentGroupMembers.findById(id);
        if (!member) return NotFound;
        return { kind: "assessment_group_member_found", member: toAssessmentGroupMemberView(member) };
    }

    async listGroupMembersByGroup(assessmentGroupId: string): Promise<ListAssessmentGroupMembersResult> {
        const members = await this.assessmentGroupMembers.findByAssessmentGroupId(assessmentGroupId);
        return {
            kind: "assessment_group_members_listed",
            members: members.map(toAssessmentGroupMemberView),
        };
    }

    async listGroupMembersByStudent(studentId: string): Promise<ListAssessmentGroupMembersResult> {
        const members = await this.assessmentGroupMembers.findByStudentId(studentId);
        return {
            kind: "assessment_group_members_listed",
            members: members.map(toAssessmentGroupMemberView),
        };
    }
}
