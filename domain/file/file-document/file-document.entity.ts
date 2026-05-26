import { type DocumentStatus } from "./file-document.enums"

export type FileDocument = {
  id: string
  fileId: string
  studentId: string
  status: DocumentStatus
}
