import { userRepository } from "./postgres/auth/user.adapter"
import { twoFactorSessionRepository } from "./postgres/auth/two-factor-session.adapter"
import { adminRepository } from "./postgres/admin/admin.adapter"
import { studentRepository } from "./postgres/student/student.adapter"
import { instructorRepository } from "./postgres/instructor/instructor.adapter"
import { passwordHasher } from "./auth/password-hasher.adapter"
import { tokenProvider } from "./auth/token-provider.adapter"
import { totpProvider } from "./auth/totp-provider.adapter"
import { AuthUseCases } from "../../../../application/auth/use-cases"

export const authUseCases = new AuthUseCases(
  userRepository,
  adminRepository,
  studentRepository,
  instructorRepository,
  passwordHasher,
  tokenProvider,
  totpProvider,
  twoFactorSessionRepository
)
export { userRepository }
