import { DomainErrorDetail } from "../types/errors";

export class DomainError extends Error {
  public readonly code: string;
  public readonly details?: DomainErrorDetail;

  constructor(code: string, message: string, details?: DomainErrorDetail) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.code = code;
    this.details = details;
  }
}


