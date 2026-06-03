import { type FileDocument } from "@domain/file/file-document/file-document.entity";

export interface FileDocumentRepository {
    findById(id: string): Promise<FileDocument | undefined>;
    findByStudentId(studentId: string): Promise<FileDocument[]>;
    findByFileId(fileId: string): Promise<FileDocument | undefined>;
    save(fileDocument: FileDocument): Promise<void>;
    deleteById(id: string): Promise<void>;
    list(): Promise<FileDocument[]>;
}
