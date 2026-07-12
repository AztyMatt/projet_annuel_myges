import { Role } from "@domain/auth/user.enums";

export type Capabilities = {
    isAdmin: boolean;
    isSuperAdmin: boolean;
    isStaff: boolean;
    isInstructor: boolean;
};

export const capabilitiesForRole = (role: Role): Capabilities => ({
    isAdmin: role === Role.ADMIN || role === Role.SUPER_ADMIN,
    isSuperAdmin: role === Role.SUPER_ADMIN,
    isStaff: role === Role.ADMIN || role === Role.SUPER_ADMIN || role === Role.INSTRUCTOR,
    isInstructor: role === Role.INSTRUCTOR,
});
