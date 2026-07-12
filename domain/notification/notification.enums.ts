export const NotificationType = {
    GRADE_PUBLISHED: "GRADE_PUBLISHED",
    ABSENCE_VALIDATED: "ABSENCE_VALIDATED",
    ABSENCE_REJECTED: "ABSENCE_REJECTED",
    NEW_MESSAGE: "NEW_MESSAGE",
    DOCUMENT_VALIDATED: "DOCUMENT_VALIDATED",
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
