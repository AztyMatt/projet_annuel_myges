import { type ExternalType } from "./external.enums"

export type External = {
  id: string
  firstName: string
  lastName: string
  email: string
  type: ExternalType
}
