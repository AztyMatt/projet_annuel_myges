export const ExternalType = {
  INVIGILATOR: "Surveillant",
  JURY: "Jury",
  OTHER: "Autre",
} as const

export type ExternalType = typeof ExternalType[keyof typeof ExternalType]
