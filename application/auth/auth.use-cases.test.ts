import { describe, expect, it } from "vitest";
import { Role } from "@domain/auth/user.enums";
import { AdminRole } from "@domain/admin/admin.enums";
import { buildAuthUseCases, buildUser } from "@application/auth/auth.use-cases.fakes";
import { type AuthContext } from "@application/types/auth-context";
import { capabilitiesForRole } from "@domain/auth/authorization-policy";

const authContext = (role: Role, requesterId = "requester"): AuthContext => ({
    requesterId,
    ...capabilitiesForRole(role),
});

describe("AuthUseCases.login", () => {
    it("refuse un email inconnu (invalid_credentials)", async () => {
        const { authUseCases } = buildAuthUseCases();
        const result = await authUseCases.login({ email: "inconnu@myges.fr", password: "peu importe" });
        expect(result).toEqual({ kind: "invalid_credentials" });
    });

    it("refuse un mauvais mot de passe et incrémente le compteur d'échecs", async () => {
        const { authUseCases, users } = buildAuthUseCases();
        const user = buildUser({ id: "u1", email: "student@myges.fr", failedAttempts: 2 });
        users.set(user.id, user);

        const result = await authUseCases.login({ email: user.email, password: "mauvais-mdp" });

        expect(result).toEqual({ kind: "invalid_credentials" });
        expect(users.get("u1")?.failedAttempts).toBe(3);
    });

    it("verrouille le compte à la 5e tentative infructueuse et remet le compteur à zéro", async () => {
        const { authUseCases, users } = buildAuthUseCases();
        const user = buildUser({ id: "u1", email: "student@myges.fr", failedAttempts: 4 });
        users.set(user.id, user);

        await authUseCases.login({ email: user.email, password: "mauvais-mdp" });

        const stored = users.get("u1")!;
        expect(stored.failedAttempts).toBe(0);
        expect(stored.lockedUntil).not.toBeNull();
        expect(stored.lockedUntil!.getTime()).toBeGreaterThan(Date.now());
    });

    it("refuse la connexion tant que le compte est verrouillé, même avec le bon mot de passe", async () => {
        const { authUseCases, users, students } = buildAuthUseCases();
        const user = buildUser({ id: "u1", email: "student@myges.fr", lockedUntil: new Date(Date.now() + 60_000) });
        users.set(user.id, user);
        students.set("s1", { id: "s1", userId: "u1", programId: "prog1" });

        const result = await authUseCases.login({ email: user.email, password: "MotDePasse1234$" });

        expect(result.kind).toBe("account_locked");
    });

    it("renvoie pending_role_assignment si le compte n'a encore aucun rôle", async () => {
        const { authUseCases, users } = buildAuthUseCases();
        const user = buildUser({ id: "u1", email: "sans-role@myges.fr" });
        users.set(user.id, user);

        const result = await authUseCases.login({ email: user.email, password: "MotDePasse1234$" });

        expect(result).toEqual({ kind: "pending_role_assignment" });
    });

    it("renvoie password_expired si le mot de passe date de plus de 60 jours", async () => {
        const { authUseCases, users, students } = buildAuthUseCases();
        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 61);
        const user = buildUser({ id: "u1", email: "student@myges.fr", passwordUpdatedAt: oldDate });
        users.set(user.id, user);
        students.set("s1", { id: "s1", userId: "u1", programId: "prog1" });

        const result = await authUseCases.login({ email: user.email, password: "MotDePasse1234$" });

        expect(result).toEqual({ kind: "password_expired", passwordResetRequired: true });
    });

    it("exige la configuration de la 2FA pour un SUPER_ADMIN qui ne l'a pas encore activée", async () => {
        const { authUseCases, users, admins } = buildAuthUseCases();
        const user = buildUser({ id: "u1", email: "super@myges.fr" });
        users.set(user.id, user);
        admins.set("a1", { id: "a1", userId: "u1", role: AdminRole.SUPER_ADMIN });

        const result = await authUseCases.login({ email: user.email, password: "MotDePasse1234$" });

        expect(result.kind).toBe("super_admin_2fa_required");
    });

    it("demande le code TOTP si la 2FA est activée sur le compte", async () => {
        const { authUseCases, users, students } = buildAuthUseCases();
        const user = buildUser({ id: "u1", email: "student@myges.fr", twoFactorEnabled: true, twoFactorSecret: "secret" });
        users.set(user.id, user);
        students.set("s1", { id: "s1", userId: "u1", programId: "prog1" });

        const result = await authUseCases.login({ email: user.email, password: "MotDePasse1234$" });

        expect(result.kind).toBe("two_factor_required");
    });

    it("authentifie un étudiant avec un mot de passe correct, un rôle et pas de 2FA (cas nominal)", async () => {
        const { authUseCases, users, students } = buildAuthUseCases();
        const user = buildUser({ id: "u1", email: "student@myges.fr" });
        users.set(user.id, user);
        students.set("s1", { id: "s1", userId: "u1", programId: "prog1" });

        const result = await authUseCases.login({ email: user.email, password: "MotDePasse1234$" });

        expect(result.kind).toBe("authenticated");
        if (result.kind === "authenticated") {
            expect(result.user.role).toBe("STUDENT");
            expect(result.token).toBeTruthy();
        }
        expect(users.get("u1")?.lastLoginAt).not.toBeNull();
    });
});

describe("AuthUseCases.resetWithToken", () => {
    it("refuse un mot de passe trop faible", async () => {
        const { authUseCases } = buildAuthUseCases();
        const result = await authUseCases.resetWithToken({ token: "n'importe quoi", newPassword: "faible" });
        expect(result).toEqual({ kind: "weak_password" });
    });

    it("refuse un token inconnu", async () => {
        const { authUseCases } = buildAuthUseCases();
        const result = await authUseCases.resetWithToken({ token: "token-inexistant", newPassword: "MotDePasse1234$" });
        expect(result).toEqual({ kind: "invalid_or_expired_token" });
    });

    it("refuse un token de reset classique vieux de plus d'1h", async () => {
        const { authUseCases, users, passwordResetTokens } = buildAuthUseCases();
        const user = buildUser({ id: "u1" });
        users.set(user.id, user);
        const old = new Date(Date.now() - 61 * 60 * 1000);
        passwordResetTokens.set("t1", { token: "t1", userId: "u1", purpose: "reset", createdAt: old });

        const result = await authUseCases.resetWithToken({ token: "t1", newPassword: "MotDePasse1234$" });

        expect(result).toEqual({ kind: "invalid_or_expired_token" });
    });

    it("accepte un token d'invitation vieux de 70h alors qu'un token de reset du même âge serait expiré (TTL différencié)", async () => {
        const { authUseCases, users, passwordResetTokens } = buildAuthUseCases();
        const user = buildUser({ id: "u1", gdprConsentAt: null });
        users.set(user.id, user);
        const seventyHoursAgo = new Date(Date.now() - 70 * 60 * 60 * 1000);
        passwordResetTokens.set("t1", { token: "t1", userId: "u1", purpose: "invitation", createdAt: seventyHoursAgo });

        const result = await authUseCases.resetWithToken({
            token: "t1",
            newPassword: "MotDePasse1234$",
            gdprConsent: true,
        });

        expect(result).toEqual({ kind: "password_updated" });
    });

    it("exige le consentement RGPD si le compte n'a pas encore consenti (invitation)", async () => {
        const { authUseCases, users, passwordResetTokens } = buildAuthUseCases();
        const user = buildUser({ id: "u1", gdprConsentAt: null });
        users.set(user.id, user);
        passwordResetTokens.set("t1", { token: "t1", userId: "u1", purpose: "invitation", createdAt: new Date() });

        const result = await authUseCases.resetWithToken({ token: "t1", newPassword: "MotDePasse1234$" });

        expect(result).toEqual({ kind: "missing_gdpr_consent" });
        expect(users.get("u1")?.gdprConsentAt).toBeNull();
    });

    it("active le compte et enregistre le consentement quand il est fourni", async () => {
        const { authUseCases, users, passwordResetTokens } = buildAuthUseCases();
        const user = buildUser({ id: "u1", gdprConsentAt: null });
        users.set(user.id, user);
        passwordResetTokens.set("t1", { token: "t1", userId: "u1", purpose: "invitation", createdAt: new Date() });

        const result = await authUseCases.resetWithToken({
            token: "t1",
            newPassword: "NouveauMdp1234$",
            gdprConsent: true,
        });

        expect(result).toEqual({ kind: "password_updated" });
        const stored = users.get("u1")!;
        expect(stored.gdprConsentAt).not.toBeNull();
        expect(stored.passwordHash).toBe("hashed:NouveauMdp1234$");
    });

    it("supprime le token après usage — il ne peut pas être réutilisé", async () => {
        const { authUseCases, users, passwordResetTokens } = buildAuthUseCases();
        const user = buildUser({ id: "u1" });
        users.set(user.id, user);
        passwordResetTokens.set("t1", { token: "t1", userId: "u1", purpose: "reset", createdAt: new Date() });

        const first = await authUseCases.resetWithToken({ token: "t1", newPassword: "MotDePasse1234$" });
        const second = await authUseCases.resetWithToken({ token: "t1", newPassword: "AutreMdp12345$" });

        expect(first).toEqual({ kind: "password_updated" });
        expect(second).toEqual({ kind: "invalid_or_expired_token" });
    });
});

describe("AuthUseCases.inviteStudent", () => {
    it("refuse l'invitation si l'appelant n'est pas admin", async () => {
        const { authUseCases } = buildAuthUseCases();
        const result = await authUseCases.inviteStudent(
            { firstname: "A", lastname: "B", email: "a@myges-etu.fr", programId: "prog1" },
            authContext(Role.STUDENT),
        );
        expect(result).toEqual({ kind: "forbidden" });
    });

    it("refuse si l'email est déjà pris", async () => {
        const { authUseCases, users } = buildAuthUseCases();
        users.set("existing", buildUser({ id: "existing", email: "deja@myges-etu.fr" }));

        const result = await authUseCases.inviteStudent(
            { firstname: "A", lastname: "B", email: "deja@myges-etu.fr", programId: "prog1" },
            authContext(Role.ADMIN),
        );

        expect(result).toEqual({ kind: "user_already_exists" });
    });

    it("refuse si la filière n'existe pas", async () => {
        const { authUseCases } = buildAuthUseCases();
        const result = await authUseCases.inviteStudent(
            { firstname: "A", lastname: "B", email: "a@myges-etu.fr", programId: "prog-inconnu" },
            authContext(Role.ADMIN),
        );
        expect(result).toEqual({ kind: "program_not_found" });
    });

    it("crée le compte (sans consentement), le profil étudiant et envoie l'invitation", async () => {
        const { authUseCases, users, students, programs, passwordResetTokens, emailSender } = buildAuthUseCases();
        programs.set("prog1", { id: "prog1", name: "Dev Sup", code: "DS", periodId: "period1" });

        const result = await authUseCases.inviteStudent(
            { firstname: "Nouvel", lastname: "Etudiant", email: "Nouvel.Etudiant@MyGES-etu.fr", programId: "prog1" },
            authContext(Role.ADMIN),
        );

        expect(result.kind).toBe("student_invited");
        if (result.kind !== "student_invited") return;

        const createdUser = users.get(result.user.id)!;
        expect(createdUser.email).toBe("nouvel.etudiant@myges-etu.fr");
        expect(createdUser.gdprConsentAt).toBeNull();

        const createdStudent = [...students.values()].find((s) => s.userId === createdUser.id);
        expect(createdStudent?.programId).toBe("prog1");

        const invitationToken = [...passwordResetTokens.values()].find((t) => t.userId === createdUser.id);
        expect(invitationToken?.purpose).toBe("invitation");

        expect(emailSender.sentInvitations).toHaveLength(1);
        expect(emailSender.sentInvitations[0].to).toBe("nouvel.etudiant@myges-etu.fr");
        expect(emailSender.sentInvitations[0].inviteUrl).toContain(invitationToken!.token);
    });

    it("un étudiant invité ne peut pas se connecter tant qu'il n'a pas défini son mot de passe", async () => {
        const { authUseCases, programs } = buildAuthUseCases();
        programs.set("prog1", { id: "prog1", name: "Dev Sup", code: "DS", periodId: "period1" });

        const invite = await authUseCases.inviteStudent(
            { firstname: "A", lastname: "B", email: "invite@myges-etu.fr", programId: "prog1" },
            authContext(Role.ADMIN),
        );
        expect(invite.kind).toBe("student_invited");

        const loginAttempt = await authUseCases.login({ email: "invite@myges-etu.fr", password: "n'importe quoi" });

        expect(loginAttempt).toEqual({ kind: "invalid_credentials" });
    });
});
