import { describe, expect, it } from "vitest";
import { isStrongPassword, needsPasswordReset, PASSWORD_MAX_AGE_DAYS } from "@domain/auth/security-policy";

describe("isStrongPassword", () => {
    it("accepte un mot de passe avec majuscule, minuscule, chiffre et symbole (12+ car.)", () => {
        expect(isStrongPassword("MotDePasse1234$")).toBe(true);
    });

    it("refuse un mot de passe trop court", () => {
        expect(isStrongPassword("Aa1$aaa")).toBe(false);
    });

    it("refuse un mot de passe sans symbole", () => {
        expect(isStrongPassword("MotDePasse1234")).toBe(false);
    });

    it("refuse un mot de passe sans majuscule", () => {
        expect(isStrongPassword("motdepasse1234$")).toBe(false);
    });
});

describe("needsPasswordReset", () => {
    it("ne redemande pas de reset juste après un changement de mot de passe", () => {
        expect(needsPasswordReset(new Date())).toBe(false);
    });

    it("redemande un reset une fois le délai de 60 jours dépassé", () => {
        const old = new Date();
        old.setDate(old.getDate() - (PASSWORD_MAX_AGE_DAYS + 1));
        expect(needsPasswordReset(old)).toBe(true);
    });
});
