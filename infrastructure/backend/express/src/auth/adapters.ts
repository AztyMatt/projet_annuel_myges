import argon2 from "argon2"
import jwt from "jsonwebtoken"
import speakeasy from "speakeasy"
import { type PasswordHasher, type TokenProvider, type TotpProvider, type UserRepository } from "../../../../../application/auth/ports"
import { type Role, type User } from "../../../../../domain/auth/user"
import { devSeedAccounts, usersByEmail, usersById } from "./store"

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-secret-change-me"
const JWT_EXPIRES_IN = "8h"

export const userRepository: UserRepository = {
  async findByEmail(email) {
    return usersByEmail.get(email.toLowerCase())
  },
  async findById(id) {
    return usersById.get(id)
  },
  async save(user) {
    usersByEmail.set(user.email, user)
    usersById.set(user.id, user)
  },
  async deleteById(id) {
    const user = usersById.get(id)
    if (!user) return
    usersById.delete(id)
    usersByEmail.delete(user.email)
  },
  async list() {
    return Array.from(usersById.values())
  },
  async listDevSeedAccounts() {
    return devSeedAccounts
  },
}

export const passwordHasher: PasswordHasher = {
  async hash(value) {
    return argon2.hash(value)
  },
  async verify(hash, raw) {
    return argon2.verify(hash, raw)
  },
}

export const tokenProvider: TokenProvider = {
  issue(user: User) {
    return jwt.sign({ sub: user.id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    })
  },
  verify(token: string) {
    return jwt.verify(token, JWT_SECRET) as { sub: string; role: Role; email: string }
  },
}

export const totpProvider: TotpProvider = {
  generateSecret(email: string) {
    return speakeasy.generateSecret({ name: `MyGES (${email.toLowerCase()})` }).base32
  },
  verify(secret: string, code: string) {
    return speakeasy.totp.verify({ secret, token: code, encoding: "base32", window: 1 })
  },
  buildProvisioningUri(email: string, secret: string) {
    return speakeasy.otpauthURL({
      secret,
      label: email,
      issuer: "MyGES",
      encoding: "base32",
    })
  },
}
