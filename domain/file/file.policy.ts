import { type DocumentType } from "@domain/document/document-administrative/document-administrative.enums";
import { type DocumentApprenticeshipContractType } from "@domain/document/document-apprenticeship-contract/document-apprenticeship-contract.enums";

const MB = 1024 * 1024;
const GB = 1024 * MB;

const MIME = {
    PDF: "application/pdf",
    JPG: "image/jpeg",
    PNG: "image/png",
    PPT: "application/vnd.ms-powerpoint",
    PPTX: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    DOC: "application/msword",
    DOCX: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    XLS: "application/vnd.ms-excel",
    XLSX: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    TXT: "text/plain",
    CSV: "text/csv",
    MD: "text/markdown",
    ZIP: "application/zip",
} as const;

export type FilePolicy = { maxBytes: number; mimeTypes: readonly string[] };

const IMAGE_TYPES = [MIME.PDF, MIME.JPG, MIME.PNG] as const;
const OFFICE_TYPES = [MIME.PDF, MIME.DOC, MIME.DOCX, MIME.XLS, MIME.XLSX, MIME.PPT, MIME.PPTX, MIME.TXT, MIME.CSV, MIME.MD, MIME.ZIP] as const;
const TEXT_TYPES = [MIME.PDF, MIME.DOC, MIME.DOCX, MIME.TXT, MIME.MD] as const;

const IMAGE_DOC: FilePolicy = { maxBytes: 25 * MB, mimeTypes: IMAGE_TYPES };
const PDF_ONLY: FilePolicy = { maxBytes: 25 * MB, mimeTypes: [MIME.PDF] };

export const ADMINISTRATIVE_DOCUMENT_POLICIES: Record<DocumentType, FilePolicy> = {
    SCHOOL_CERTIFICATE: IMAGE_DOC,
    ENROLLMENT_CERTIFICATE: IMAGE_DOC,
    TRANSCRIPTS: IMAGE_DOC,
    OFFICIAL_DOCUMENTS_ISSUED_BY_THE_SCHOOL: IMAGE_DOC,
    COMPANY_DOCUMENTS: IMAGE_DOC,
    OTHER: IMAGE_DOC,
    AGREEMENT: PDF_ONLY,
    AMENDMENTS: PDF_ONLY,
};

export const APPRENTICESHIP_CONTRACT_POLICIES: Record<DocumentApprenticeshipContractType, FilePolicy> = {
    APPRENTICESHIP: PDF_ONLY,
    PROFESSIONALIZATION: PDF_ONLY,
};

export type FileContext = "FILE_JUSTIFICATION" | "FILE_COURSE" | "FILE_ASSESSMENT_INSTRUCTION" | "FILE_ASSESSMENT";

export const CONTEXT_POLICIES: Record<FileContext, FilePolicy> = {
    FILE_JUSTIFICATION: IMAGE_DOC,
    FILE_COURSE: { maxBytes: 25 * MB, mimeTypes: OFFICE_TYPES },
    FILE_ASSESSMENT_INSTRUCTION: { maxBytes: 25 * MB, mimeTypes: TEXT_TYPES },
    FILE_ASSESSMENT: { maxBytes: 1 * GB, mimeTypes: OFFICE_TYPES },
};

export type FilePolicyViolation = "file_too_large" | "mime_type_not_allowed";

export const checkAgainstPolicy = (policy: FilePolicy, mimeType: string, sizeBytes: number): FilePolicyViolation | null => {
    if (sizeBytes > policy.maxBytes) return "file_too_large";
    if (!policy.mimeTypes.includes(mimeType)) return "mime_type_not_allowed";
    return null;
};

const ALL_POLICIES: FilePolicy[] = [
    ...Object.values(CONTEXT_POLICIES),
    ...Object.values(ADMINISTRATIVE_DOCUMENT_POLICIES),
    ...Object.values(APPRENTICESHIP_CONTRACT_POLICIES),
];
export const MAX_FILE_SIZE_BYTES = Math.max(...ALL_POLICIES.map((p) => p.maxBytes));
export const ALLOWED_MIME_TYPES: readonly string[] = [...new Set(ALL_POLICIES.flatMap((p) => [...p.mimeTypes]))];
export const isAllowedMimeType = (mimeType: string): boolean => ALLOWED_MIME_TYPES.includes(mimeType);
