export const DocumentApprenticeshipContractType = {
  APPRENTICESHIP: "Apprentissage",
  PROFESSIONALIZATION: "Professionnalisation",
} as const

export type DocumentApprenticeshipContractType = typeof DocumentApprenticeshipContractType[keyof typeof DocumentApprenticeshipContractType]
