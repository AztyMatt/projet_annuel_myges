export const InstructorContractType = {
    PERMANENT: "CDI",
    FIXED_TERM: "CDD",
    FREELANCE: "Freelance",
    TEMPORARY: "Vacataire",
} as const;

export type InstructorContractType = (typeof InstructorContractType)[keyof typeof InstructorContractType];
