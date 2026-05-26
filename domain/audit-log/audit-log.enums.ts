export const AuditLogAction = {
  CREATE: "Création",
  UPDATE: "Modification",
  DELETE: "Suppression",
  VALIDATE: "Validation",
  REJECT: "Refus",
  FREEZE: "Freeze",
  LOGIN: "Connexion",
  OTHER: "Autre",
} as const

export type AuditLogAction = typeof AuditLogAction[keyof typeof AuditLogAction]
