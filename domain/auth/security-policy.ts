import { type User } from "./user"

export const PASSWORD_MAX_AGE_DAYS = 60
export const MAX_FAILED_ATTEMPTS = 5
export const LOCK_DURATION_MS = 15 * 60 * 1000

export const emailIsValid = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export const isStrongPassword = (password: string): boolean =>
  password.length >= 12 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password) &&
  /[^A-Za-z0-9]/.test(password)

export const needsPasswordReset = (passwordUpdatedAt: Date): boolean => {
  const expiresAt = new Date(passwordUpdatedAt)
  expiresAt.setDate(expiresAt.getDate() + PASSWORD_MAX_AGE_DAYS)
  return Date.now() > expiresAt.getTime()
}

export const isLocked = (user: User): boolean =>
  Boolean(user.lockedUntil && user.lockedUntil.getTime() > Date.now())
