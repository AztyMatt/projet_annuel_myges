import { type StudentGroup } from "@domain/group/student-group/student-group.entity";

export interface StudentGroupRepository {
    findById(id: string): Promise<StudentGroup | undefined>;
    findByStudentId(studentId: string): Promise<StudentGroup[]>;
    existsByStudentId(studentId: string): Promise<boolean>;
    findByGroupId(groupId: string): Promise<StudentGroup[]>;
    existsByGroupId(groupId: string): Promise<boolean>;
    findByStudentAndGroup(studentId: string, groupId: string): Promise<StudentGroup | undefined>;
    save(studentGroup: StudentGroup): Promise<void>;
    deleteById(id: string): Promise<void>;
    deleteByGroupId(groupId: string): Promise<void>;
}
