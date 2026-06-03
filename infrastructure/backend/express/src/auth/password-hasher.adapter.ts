import argon2 from "argon2"
import { type PasswordHasher } from "@application/auth/password-hasher.port"

export const passwordHasher: PasswordHasher = {
  async hash(value) {
    return argon2.hash(value)
  },
  async verify(hash, raw) {
    return argon2.verify(hash, raw)
  },
}
