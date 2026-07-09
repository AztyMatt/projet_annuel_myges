import { randomUUID } from "node:crypto";
import { type Group, GENERAL_GROUP_NAME } from "@domain/group/group.entity";
import { type StudentGroup } from "@domain/group/student-group/student-group.entity";
import { type GroupRepository } from "@application/group/group.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound, MissingFields, Forbidden } from "@application/types/results";

export type GroupView = { id: string; classId: string; name: string };
export type StudentGroupView = { id: string; studentId: string; groupId: string };

export type CreateGroupResult = MissingFields | Forbidden | { kind: "group_already_exists" } | { kind: "group_created"; group: GroupView };

export type UpdateGroupResult =
    | NotFound
    | Forbidden
    | { kind: "group_is_general" }
    | { kind: "group_updated"; group: GroupView };

export type DeleteGroupResult =
    | NotFound
    | Forbidden
    | { kind: "group_is_general" }
    | { kind: "group_has_students" }
    | { kind: "group_has_courses" }
    | { kind: "group_deleted" };

export type GetGroupResult = NotFound | { kind: "group_found"; group: GroupView };

export type ListGroupsResult = { kind: "groups_listed"; groups: GroupView[] };

export type AddStudentResult =
    | MissingFields
    | Forbidden
    | { kind: "student_already_in_group" }
    | { kind: "student_group_created"; studentGroup: StudentGroupView };

export type RemoveStudentResult = NotFound | Forbidden | { kind: "student_group_deleted" };

export type ListStudentGroupsResult = { kind: "student_groups_listed"; studentGroups: StudentGroupView[] };

const toGroupView = (g: Group): GroupView => ({ id: g.id, classId: g.classId, name: g.name });

const toStudentGroupView = (sg: StudentGroup): StudentGroupView => ({
    id: sg.id,
    studentId: sg.studentId,
    groupId: sg.groupId,
});

export class GroupUseCases {
    constructor(
        private readonly groups: GroupRepository,
        private readonly studentGroups: StudentGroupRepository,
        private readonly courses: CourseRepository,
    ) {}

    async create(input: { classId?: string; name?: string }, auth: AuthContext): Promise<CreateGroupResult> {
        if (!auth.isAdmin) return Forbidden;
        const { classId, name } = input;
        if (!classId || !name) return MissingFields;
        if (await this.groups.findByClassAndName(classId, name)) return { kind: "group_already_exists" };
        const group: Group = { id: randomUUID(), classId, name };
        await this.groups.save(group);
        return { kind: "group_created", group: toGroupView(group) };
    }

    async update(id: string, input: { classId?: string; name?: string }, auth: AuthContext): Promise<UpdateGroupResult> {
        if (!auth.isAdmin) return Forbidden;
        const group = await this.groups.findById(id);
        if (!group) return NotFound;
        if (input.name !== undefined && input.name !== group.name &&
            (group.name === GENERAL_GROUP_NAME || input.name === GENERAL_GROUP_NAME))
            return { kind: "group_is_general" };
        if (input.classId !== undefined) group.classId = input.classId;
        if (input.name !== undefined) group.name = input.name;
        await this.groups.save(group);
        return { kind: "group_updated", group: toGroupView(group) };
    }

    async delete(id: string, auth: AuthContext): Promise<DeleteGroupResult> {
        if (!auth.isAdmin) return Forbidden;
        const group = await this.groups.findById(id);
        if (!group) return NotFound;
        if (group.name === GENERAL_GROUP_NAME) return { kind: "group_is_general" };
        if (await this.studentGroups.existsByGroupId(id)) return { kind: "group_has_students" };
        if (await this.courses.existsByGroupId(id)) return { kind: "group_has_courses" };
        await this.groups.deleteById(id);
        return { kind: "group_deleted" };
    }

    async list(): Promise<ListGroupsResult> {
        const groups = await this.groups.list();
        return { kind: "groups_listed", groups: groups.map(toGroupView) };
    }

    async listByClass(classId: string): Promise<ListGroupsResult> {
        const groups = await this.groups.findByClassId(classId);
        return { kind: "groups_listed", groups: groups.map(toGroupView) };
    }

    async findById(id: string): Promise<GetGroupResult> {
        const group = await this.groups.findById(id);
        if (!group) return NotFound;
        return { kind: "group_found", group: toGroupView(group) };
    }

    async addStudent(input: { studentId?: string; groupId?: string }, auth: AuthContext): Promise<AddStudentResult> {
        if (!auth.isAdmin) return Forbidden;
        const { studentId, groupId } = input;
        if (!studentId || !groupId) return MissingFields;
        if (await this.studentGroups.findByStudentAndGroup(studentId, groupId)) return { kind: "student_already_in_group" };
        const studentGroup: StudentGroup = { id: randomUUID(), studentId, groupId };
        await this.studentGroups.save(studentGroup);
        return { kind: "student_group_created", studentGroup: toStudentGroupView(studentGroup) };
    }

    async removeStudent(id: string, auth: AuthContext): Promise<RemoveStudentResult> {
        if (!auth.isAdmin) return Forbidden;
        const studentGroup = await this.studentGroups.findById(id);
        if (!studentGroup) return NotFound;
        await this.studentGroups.deleteById(id);
        return { kind: "student_group_deleted" };
    }

    async listStudentsByGroup(groupId: string): Promise<ListStudentGroupsResult> {
        const studentGroups = await this.studentGroups.findByGroupId(groupId);
        return { kind: "student_groups_listed", studentGroups: studentGroups.map(toStudentGroupView) };
    }

    async listGroupsByStudent(studentId: string): Promise<ListStudentGroupsResult> {
        const studentGroups = await this.studentGroups.findByStudentId(studentId);
        return { kind: "student_groups_listed", studentGroups: studentGroups.map(toStudentGroupView) };
    }
}
