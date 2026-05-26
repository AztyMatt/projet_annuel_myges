export const AssessmentType = {
  CONTINUOUS: "Continu",
  EXAM: "Examen",
} as const

export type AssessmentType = typeof AssessmentType[keyof typeof AssessmentType]
