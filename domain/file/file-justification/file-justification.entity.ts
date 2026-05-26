import { type BasicStatus } from "../../absence/absence.enums"

export type FileJustification = {
  id: string
  absenceId: string
  fileId: string
  validationStatus: BasicStatus
  processedBy: string
}
