import { type FileCourse } from "@domain/file/file-course/file-course.entity";

export interface FileCourseRepository {
    findById(id: string): Promise<FileCourse | undefined>;
    findByCourseId(courseId: string): Promise<FileCourse[]>;
    findByFileId(fileId: string): Promise<FileCourse[]>;
    save(fileCourse: FileCourse): Promise<void>;
    deleteById(id: string): Promise<void>;
}
