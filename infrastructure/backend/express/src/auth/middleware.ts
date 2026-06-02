import { type NextFunction, type Request, type Response } from "express"
import { tokenProvider } from "./token-provider.adapter"
import { type Role } from "../../../../../domain/auth/user.enums"

export type AuthRequest = Request & {
  auth?: { userId: string; role: Role; email: string }
}

export const requireAuth = (request: AuthRequest, response: Response, nextFunction: NextFunction): void => {
  const authorization = request.headers.authorization
  if (!authorization?.startsWith("Bearer ")) {
    response.status(401).json({ error: "Unauthorized" })
    return
  }
  try {
    const token = authorization.slice("Bearer ".length)
    const payload = tokenProvider.verify(token)
    request.auth = { userId: payload.sub, role: payload.role, email: payload.email }
    nextFunction()
  } catch {
    response.status(401).json({ error: "Invalid token" })
  }
}

export const requireCronSecret = (request: Request, response: Response, nextFunction: NextFunction): void => {
  const authorization = request.headers.authorization
  const secret = process.env.CRON_SECRET
  if (!secret || !authorization || authorization !== `Bearer ${secret}`) {
    response.status(401).json({ error: "Unauthorized" })
    return
  }
  nextFunction()
}

export const requireRole =
  (...allowedRoles: Role[]) =>
  (request: AuthRequest, response: Response, nextFunction: NextFunction): void => {
    if (!request.auth) {
      response.status(401).json({ error: "Unauthorized" })
      return
    }
    if (!allowedRoles.includes(request.auth.role)) {
      response.status(403).json({ error: "Forbidden: insufficient role" })
      return
    }
    nextFunction()
  }
