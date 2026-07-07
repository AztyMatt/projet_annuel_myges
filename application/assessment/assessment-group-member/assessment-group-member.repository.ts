import { type AssessmentGroupMember } from "@domain/assessment/assessment-group-member/assessment-group-member.entity";

export interface AssessmentGroupMemberRepository {
    findById(id: string): Promise<AssessmentGroupMember | undefined>;
    findByAssessmentGroupId(assessmentGroupId: string): Promise<AssessmentGroupMember[]>;
    findByStudentId(studentId: string): Promise<AssessmentGroupMember[]>;
    findByGroupAndStudent(assessmentGroupId: string, studentId: string): Promise<AssessmentGroupMember | undefined>;
    save(member: AssessmentGroupMember): Promise<void>;
    deleteById(id: string): Promise<void>;
}
