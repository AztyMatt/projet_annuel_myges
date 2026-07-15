import { describe, expect, it } from "vitest";
import { capabilitiesForRole } from "@domain/auth/authorization-policy";
import { Role } from "@domain/auth/user.enums";

// Matrice exhaustive des 4 rôles réels du projet (domain/auth/user.enums.ts) — c'est cette
// fonction que consomme getAuthFlags() dans chaque route Express pour décider des 403.
// Un seul cas faux ici, et un rôle obtient trop (ou pas assez) de droits partout dans l'API.
describe("capabilitiesForRole", () => {
    it("STUDENT n'a aucune capacité élevée", () => {
        expect(capabilitiesForRole(Role.STUDENT)).toEqual({
            isAdmin: false,
            isSuperAdmin: false,
            isStaff: false,
            isInstructor: false,
        });
    });

    it("INSTRUCTOR est staff et instructeur, mais pas admin", () => {
        expect(capabilitiesForRole(Role.INSTRUCTOR)).toEqual({
            isAdmin: false,
            isSuperAdmin: false,
            isStaff: true,
            isInstructor: true,
        });
    });

    it("ADMIN est admin et staff, mais pas super admin ni instructeur", () => {
        expect(capabilitiesForRole(Role.ADMIN)).toEqual({
            isAdmin: true,
            isSuperAdmin: false,
            isStaff: true,
            isInstructor: false,
        });
    });

    it("SUPER_ADMIN a toutes les capacités sauf instructeur", () => {
        expect(capabilitiesForRole(Role.SUPER_ADMIN)).toEqual({
            isAdmin: true,
            isSuperAdmin: true,
            isStaff: true,
            isInstructor: false,
        });
    });
});
