export const InstructorContractType = {
    PERMANENT: "PERMANENT",
    FIXED_TERM: "FIXED_TERM",
    FREELANCE: "FREELANCE",
    TEMPORARY: "TEMPORARY",
} as const;

export type InstructorContractType = (typeof InstructorContractType)[keyof typeof InstructorContractType];
