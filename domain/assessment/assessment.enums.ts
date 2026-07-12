export const AssessmentType = {
    CONTINUOUS: "CONTINUOUS",
    EXAM: "EXAM",
} as const;

export type AssessmentType = (typeof AssessmentType)[keyof typeof AssessmentType];
