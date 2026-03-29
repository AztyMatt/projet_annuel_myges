export type DomainErrorContextValue = string | number | boolean | null

export type DomainErrorContext = Record<string, DomainErrorContextValue>

export type DomainErrorDetail = {
    issue: string
    context?: DomainErrorContext
}