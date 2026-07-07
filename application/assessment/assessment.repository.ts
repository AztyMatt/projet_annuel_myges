import { type Assessment } from "@domain/assessment/assessment.entity";

export interface AssessmentRepository {
    findById(id: string): Promise<Assessment | undefined>;
    findByCourseId(courseId: string): Promise<Assessment[]>;
    findByCourseAndTitle(courseId: string, title: string, dueDate: Date): Promise<Assessment | undefined>;
    save(assessment: Assessment): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Assessment[]>;
}
