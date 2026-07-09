import { randomUUID } from "node:crypto";
import { isStrongPassword } from "@domain/auth/security-policy";
import { type User } from "@domain/auth/user.entity";
import { AdminRole } from "@domain/admin/admin.enums";
import { type Admin } from "@domain/admin/admin.entity";
import { passwordHasher } from "@express/src/auth/password-hasher.adapter";
import { SEED_ON_START, SEED_PASSWORD } from "@express/src/auth/auth.config";
import { totpProvider } from "@express/src/auth/totp-provider.adapter";
import { userRepository } from "@express/src/postgres/auth/user.adapter";
import { adminRepository } from "@express/src/postgres/admin/admin.adapter";

const SEED_DEFINITIONS: Array<{ email: string; adminRole: AdminRole; enable2FA?: boolean }> = [
    { email: "admin.seed@myges.fr", adminRole: AdminRole.ADMIN },
    { email: "superadmin.seed@myges.fr", adminRole: AdminRole.SUPER_ADMIN, enable2FA: true },
];

const createSeedAdmin = async ({
    email,
    password,
    adminRole,
    enable2FA = false,
}: {
    email: string;
    password: string;
    adminRole: AdminRole;
    enable2FA?: boolean;
}): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    const existingUser = await userRepository.findByEmail(normalizedEmail);
    if (existingUser) return;

    const twoFactorSecret = enable2FA ? totpProvider.generateSecret(normalizedEmail) : null;
    const user: User = {
        id: randomUUID(),
        firstname: "Seed",
        lastname: "Admin",
        email: normalizedEmail,
        passwordHash: await passwordHasher.hash(password),
        failedAttempts: 0,
        lockedUntil: null,
        passwordUpdatedAt: new Date(),
        twoFactorEnabled: Boolean(enable2FA),
        twoFactorSecret,
        gdprConsentAt: new Date(),
        createdAt: new Date(),
        lastLoginAt: null,
    };
    await userRepository.save(user);

    const admin: Admin = {
        id: randomUUID(),
        userId: user.id,
        role: adminRole,
    };
    await adminRepository.save(admin);
};

export const seedUsers = async (): Promise<void> => {
    if (!SEED_ON_START) return;
    if (!SEED_PASSWORD || !isStrongPassword(SEED_PASSWORD)) return;

    for (const definition of SEED_DEFINITIONS) {
        await createSeedAdmin({
            email: definition.email,
            password: SEED_PASSWORD,
            adminRole: definition.adminRole,
            enable2FA: definition.enable2FA,
        });
    }
};
