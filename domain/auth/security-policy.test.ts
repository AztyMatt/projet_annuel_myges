import { describe, expect, it } from "vitest";
import {
    emailIsValid,
    isLocked,
    isStrongPassword,
    LOCK_DURATION_MS,
    MAX_FAILED_ATTEMPTS,
    needsPasswordReset,
    PASSWORD_MAX_AGE_DAYS,
} from "@domain/auth/security-policy";
import { type User } from "@domain/auth/user.entity";

// Exigences chiffrées du Sujet/cahier des charges — un changement accidentel de ces
// constantes doit casser un test, pas passer inaperçu.
describe("constantes de la politique de sécurité", () => {
    it("expire le mot de passe tous les 60 jours", () => {
        expect(PASSWORD_MAX_AGE_DAYS).toBe(60);
    });

    it("verrouille après 5 tentatives infructueuses", () => {
        expect(MAX_FAILED_ATTEMPTS).toBe(5);
    });

    it("verrouille pendant 15 minutes", () => {
        expect(LOCK_DURATION_MS).toBe(15 * 60 * 1000);
    });
});

describe("isStrongPassword", () => {
    it("accepte un mot de passe avec majuscule, minuscule, chiffre et symbole (12+ car.)", () => {
        expect(isStrongPassword("MotDePasse1234$")).toBe(true);
    });

    it("accepte un mot de passe d'exactement 12 caractères (limite basse)", () => {
        expect(isStrongPassword("Aa1$aaaaaaa")).toBe(false); // 11 caractères — juste en dessous
        expect(isStrongPassword("Aa1$aaaaaaaa")).toBe(true); // 12 caractères — accepté
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

    it("refuse un mot de passe sans minuscule", () => {
        expect(isStrongPassword("MOTDEPASSE1234$")).toBe(false);
    });

    it("refuse un mot de passe sans chiffre", () => {
        expect(isStrongPassword("MotDePasseAbcd$")).toBe(false);
    });

    it("refuse une chaîne vide", () => {
        expect(isStrongPassword("")).toBe(false);
    });
});

describe("emailIsValid", () => {
    it("accepte une adresse email valide", () => {
        expect(emailIsValid("etudiant@myges-etu.fr")).toBe(true);
    });

    it("refuse une adresse sans @", () => {
        expect(emailIsValid("etudiant.myges-etu.fr")).toBe(false);
    });

    it("refuse une adresse sans domaine", () => {
        expect(emailIsValid("etudiant@")).toBe(false);
    });

    it("refuse une adresse sans extension de domaine", () => {
        expect(emailIsValid("etudiant@myges")).toBe(false);
    });

    it("refuse une adresse contenant un espace", () => {
        expect(emailIsValid("etu diant@myges-etu.fr")).toBe(false);
    });
});

describe("needsPasswordReset", () => {
    it("ne redemande pas de reset juste après un changement de mot de passe", () => {
        expect(needsPasswordReset(new Date())).toBe(false);
    });

    it("ne redemande pas de reset avant l'échéance des 60 jours", () => {
        const almostExpired = new Date();
        almostExpired.setDate(almostExpired.getDate() - (PASSWORD_MAX_AGE_DAYS - 1));
        expect(needsPasswordReset(almostExpired)).toBe(false);
    });

    it("redemande un reset une fois le délai de 60 jours dépassé", () => {
        const old = new Date();
        old.setDate(old.getDate() - (PASSWORD_MAX_AGE_DAYS + 1));
        expect(needsPasswordReset(old)).toBe(true);
    });
});

describe("isLocked", () => {
    const baseUser: User = {
        id: "u1",
        firstname: "Test",
        lastname: "User",
        email: "test@myges.fr",
        passwordHash: "hash",
        failedAttempts: 0,
        lockedUntil: null,
        passwordUpdatedAt: new Date(),
        twoFactorEnabled: false,
        twoFactorSecret: null,
        gdprConsentAt: new Date(),
        createdAt: new Date(),
        lastLoginAt: null,
    };

    it("n'est pas verrouillé quand lockedUntil est null", () => {
        expect(isLocked(baseUser)).toBe(false);
    });

    it("est verrouillé quand lockedUntil est dans le futur", () => {
        const user = { ...baseUser, lockedUntil: new Date(Date.now() + 60_000) };
        expect(isLocked(user)).toBe(true);
    });

    it("n'est plus verrouillé une fois lockedUntil dépassé", () => {
        const user = { ...baseUser, lockedUntil: new Date(Date.now() - 60_000) };
        expect(isLocked(user)).toBe(false);
    });
});
