export type ApplicationErrorScope =
    | "validation"
    | "unauthorized"
    | "not_found"
    | "conflict"
    | "unprocessable"
    | "infrastructure"

export type ApplicationErrorIssue = {
    field?: string
    message: string
}

export type ApplicationErrorMetadataValue = string | number | boolean | null

export type ApplicationErrorMetadata = Record<string, ApplicationErrorMetadataValue>

export type ApplicationErrorDetail = {
    scope: ApplicationErrorScope
    issues?: ApplicationErrorIssue[]
    metadata?: ApplicationErrorMetadata
}

export type ApplicationErrorPayload = {
    ok: false
    code: string
    message: string
    data?: ApplicationErrorDetail
}