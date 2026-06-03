import { type BasicStatus } from "./absence.enums"

export type Absence = {
  id: string
  studentId: string
  sessionId: string
  reason: string
  status: BasicStatus
  declaredAt: Date
}
