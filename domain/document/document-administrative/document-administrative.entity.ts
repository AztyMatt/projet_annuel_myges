import { type DocumentType } from "@domain/document/document-administrative/document-administrative.enums";

export type DocumentAdministrative = {
    id: string;
    fileDocumentId: string;
    type: DocumentType;
    expiration: Date | null;
};
