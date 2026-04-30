import { type NextFunction, type Request, type Response } from "express"
import { tokenProvider } from "./adapters"
import { type Role } from "../../../../../domain/auth/user"

export type AuthRequest = Request & {
  auth?: { userId: string; role: Role; email: string }
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authorization = req.headers.authorization
  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  try {
    const token = authorization.slice("Bearer ".length)
    const payload = tokenProvider.verify(token)
    req.auth = { userId: payload.sub, role: payload.role, email: payload.email }
    next()
  } catch {
    res.status(401).json({ error: "Invalid token" })
  }
}

export const requireRole =
  (...allowedRoles: Role[]) =>
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Unauthorized" })
      return
    }
    if (!allowedRoles.includes(req.auth.role)) {
      res.status(403).json({ error: "Forbidden: insufficient role" })
      return
    }
    next()
  }
