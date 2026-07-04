import { type FileJustification } from "@domain/file/file-justification/file-justification.entity";

export interface FileJustificationRepository {
    findById(id: string): Promise<FileJustification | undefined>;
    findByAbsenceId(absenceId: string): Promise<FileJustification[]>;
    findByFileId(fileId: string): Promise<FileJustification | undefined>;
    findByAbsenceAndFile(absenceId: string, fileId: string): Promise<FileJustification | undefined>;
    save(fileJustification: FileJustification): Promise<void>;
    deleteById(id: string): Promise<void>;
}
