import { type BasicStatus } from "@domain/absence/absence.enums";

export type FileJustification = {
    id: string;
    absenceId: string;
    fileId: string;
    validationStatus: BasicStatus;
    processedBy: string | null;
};
