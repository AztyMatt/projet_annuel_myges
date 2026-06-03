export const DocumentType = {
    SCHOOL_CERTIFICATE: "Certificat de scolarité",
    ENROLLMENT_CERTIFICATE: "Attestation d'inscription",
    TRANSCRIPTS: "Relevé de notes",
    OFFICIAL_SCHOOL_DOCUMENTS: "Documents officiels de l'école",
    AGREEMENT: "Convention",
    AMENDMENTS: "Avenants",
    COMPANY_DOCUMENTS: "Documents d'entreprise",
    OTHER: "Autre",
} as const;

export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];
