import { type InstructorContractType } from "./instructor.enums"

export type Instructor = {
  id: string
  userId: string
  contractType: InstructorContractType
  specialties: string[] | null
}
