import { userRepository } from "@express/src/postgres/auth/user.adapter";
import { twoFactorSessionRepository } from "@express/src/postgres/auth/two-factor-session.adapter";
import { adminRepository } from "@express/src/postgres/admin/admin.adapter";
import { studentRepository } from "@express/src/postgres/student/student.adapter";
import { instructorRepository } from "@express/src/postgres/instructor/instructor.adapter";
import { passwordHasher } from "@express/src/auth/password-hasher.adapter";
import { tokenProvider } from "@express/src/auth/token-provider.adapter";
import { totpProvider } from "@express/src/auth/totp-provider.adapter";
import { AuthUseCases } from "@application/auth/use-cases";

export const authUseCases = new AuthUseCases(
    userRepository,
    adminRepository,
    studentRepository,
    instructorRepository,
    passwordHasher,
    tokenProvider,
    totpProvider,
    twoFactorSessionRepository,
);
export { userRepository };
