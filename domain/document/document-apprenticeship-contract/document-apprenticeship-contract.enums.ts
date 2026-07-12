export const DocumentApprenticeshipContractType = {
    APPRENTICESHIP: "APPRENTICESHIP",
    PROFESSIONALIZATION: "PROFESSIONALIZATION",
} as const;

export type DocumentApprenticeshipContractType =
    (typeof DocumentApprenticeshipContractType)[keyof typeof DocumentApprenticeshipContractType];
