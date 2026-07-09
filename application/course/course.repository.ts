import { type Course } from "@domain/course/course.entity";

export interface CourseRepository {
    findById(id: string): Promise<Course | undefined>;
    findByInstructorId(instructorId: string): Promise<Course[]>;
    existsByInstructorId(instructorId: string): Promise<boolean>;
    findByModuleId(moduleId: string): Promise<Course[]>;
    existsByModuleId(moduleId: string): Promise<boolean>;
    findByGroupId(groupId: string): Promise<Course[]>;
    existsByGroupId(groupId: string): Promise<boolean>;
    findByBlocId(blocId: string): Promise<Course[]>;
    existsByBlocId(blocId: string): Promise<boolean>;
    findByConversationId(conversationId: string): Promise<Course | undefined>;
    findByInstructorModuleGroup(instructorId: string, moduleId: string, groupId: string): Promise<Course | undefined>;
    save(course: Course): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<Course[]>;
}
