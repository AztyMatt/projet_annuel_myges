import { type DocumentStatus } from "@domain/file/file-document/file-document.enums";

export type FileDocument = {
    id: string;
    fileId: string;
    studentId: string;
    status: DocumentStatus;
};
