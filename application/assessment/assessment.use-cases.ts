import { randomUUID } from "node:crypto";
import { type Assessment } from "@domain/assessment/assessment.entity";
import { type AssessmentType } from "@domain/assessment/assessment.enums";
import { type AssessmentGroup } from "@domain/assessment/assessment-group/assessment-group.entity";
import { type AssessmentGroupMember } from "@domain/assessment/assessment-group-member/assessment-group-member.entity";
import { type AssessmentRepository } from "@application/assessment/assessment.repository";
import { type AssessmentGroupRepository } from "@application/assessment/assessment-group/assessment-group.repository";
import { type AssessmentGroupMemberRepository } from "@application/assessment/assessment-group-member/assessment-group-member.repository";
import { NotFound, MissingFields } from "@application/types/results";

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
    | MissingFields
    | { kind: "assessment_created"; assessment: AssessmentView };

export type UpdateAssessmentResult =
    | NotFound
    | { kind: "assessment_updated"; assessment: AssessmentView };

export type DeleteAssessmentResult = NotFound | { kind: "assessment_deleted" };

export type GetAssessmentResult =
    | NotFound
    | { kind: "assessment_found"; assessment: AssessmentView };

export type ListAssessmentsResult = { kind: "assessments_listed"; assessments: AssessmentView[] };

export type PublishAssessmentResult =
    | NotFound
    | { kind: "assessment_published"; assessment: AssessmentView };

export type CreateAssessmentGroupResult =
    | MissingFields
    | { kind: "assessment_group_created"; assessmentGroup: AssessmentGroupView };

export type DeleteAssessmentGroupResult =
    | NotFound
    | { kind: "assessment_group_deleted" };

export type GetAssessmentGroupResult =
    | NotFound
    | { kind: "assessment_group_found"; assessmentGroup: AssessmentGroupView };

export type ListAssessmentGroupsResult = {
    kind: "assessment_groups_listed";
    assessmentGroups: AssessmentGroupView[];
};

export type AddAssessmentGroupMemberResult =
    | MissingFields
    | { kind: "assessment_group_member_added"; member: AssessmentGroupMemberView };

export type DeleteAssessmentGroupMemberResult =
    | NotFound
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
    ) {}

    async create(input: {
        courseId?: string;
        title?: string;
        type?: AssessmentType;
        isPublished?: boolean;
        dueDate?: string;
        maxGroupSize?: number;
    }): Promise<CreateAssessmentResult> {
        const { courseId, title, type, isPublished = false, dueDate, maxGroupSize } = input;
        if (!courseId || !title || !type || !dueDate || maxGroupSize === undefined)
            return MissingFields;
        const assessment: Assessment = {
            id: randomUUID(),
            courseId,
            title,
            type,
            isPublished,
            dueDate: new Date(dueDate),
            maxGroupSize,
        };
        await this.assessments.save(assessment);
        return { kind: "assessment_created", assessment: toAssessmentView(assessment) };
    }

    async update(
        id: string,
        input: {
            courseId?: string;
            title?: string;
            type?: AssessmentType;
            isPublished?: boolean;
            dueDate?: string;
            maxGroupSize?: number;
        },
    ): Promise<UpdateAssessmentResult> {
        const assessment = await this.assessments.findById(id);
        if (!assessment) return NotFound;
        if (input.courseId !== undefined) assessment.courseId = input.courseId;
        if (input.title !== undefined) assessment.title = input.title;
        if (input.type !== undefined) assessment.type = input.type;
        if (input.isPublished !== undefined) assessment.isPublished = input.isPublished;
        if (input.dueDate !== undefined) assessment.dueDate = new Date(input.dueDate);
        if (input.maxGroupSize !== undefined) assessment.maxGroupSize = input.maxGroupSize;
        await this.assessments.save(assessment);
        return { kind: "assessment_updated", assessment: toAssessmentView(assessment) };
    }

    async publish(id: string): Promise<PublishAssessmentResult> {
        const assessment = await this.assessments.findById(id);
        if (!assessment) return NotFound;
        assessment.isPublished = true;
        await this.assessments.save(assessment);
        return { kind: "assessment_published", assessment: toAssessmentView(assessment) };
    }

    async delete(id: string): Promise<DeleteAssessmentResult> {
        const assessment = await this.assessments.findById(id);
        if (!assessment) return NotFound;
        await this.assessments.deleteById(id);
        return { kind: "assessment_deleted" };
    }

    async list(): Promise<ListAssessmentsResult> {
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

    async createGroup(input: { assessmentId?: string }): Promise<CreateAssessmentGroupResult> {
        const { assessmentId } = input;
        if (!assessmentId) return MissingFields;
        const group: AssessmentGroup = { id: randomUUID(), assessmentId };
        await this.assessmentGroups.save(group);
        return { kind: "assessment_group_created", assessmentGroup: toAssessmentGroupView(group) };
    }

    async deleteGroup(id: string): Promise<DeleteAssessmentGroupResult> {
        const group = await this.assessmentGroups.findById(id);
        if (!group) return NotFound;
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
    }): Promise<AddAssessmentGroupMemberResult> {
        const { assessmentGroupId, studentId } = input;
        if (!assessmentGroupId || !studentId) return MissingFields;
        const member: AssessmentGroupMember = { id: randomUUID(), assessmentGroupId, studentId };
        await this.assessmentGroupMembers.save(member);
        return {
            kind: "assessment_group_member_added",
            member: toAssessmentGroupMemberView(member),
        };
    }

    async deleteGroupMember(id: string): Promise<DeleteAssessmentGroupMemberResult> {
        const member = await this.assessmentGroupMembers.findById(id);
        if (!member) return NotFound;
        await this.assessmentGroupMembers.deleteById(id);
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
