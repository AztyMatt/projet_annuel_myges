import nodemailer, { type Transporter } from "nodemailer";
import { type EmailSender } from "@application/auth/email-sender.port";

// Envoi réel via SMTP si configuré (SMTP_HOST défini) ; sinon replie sur un simple console.log,
// pour ne jamais casser l'environnement des personnes de l'équipe qui n'ont pas configuré
// d'identifiants SMTP en local — même contrat, même comportement observable dans les deux cas.
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM ?? SMTP_USER ?? "no-reply@myges.fr";

const transporter: Transporter | null = SMTP_HOST
    ? nodemailer.createTransport({
          host: SMTP_HOST,
          port: SMTP_PORT,
          secure: SMTP_PORT === 465,
          auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASSWORD } : undefined,
      })
    : null;

async function send(to: string, subject: string, text: string): Promise<void> {
    if (!transporter) {
        console.log(`[email] (SMTP non configuré, voir SMTP_HOST) "${subject}" pour ${to} :\n${text}`);
        return;
    }
    await transporter.sendMail({ from: SMTP_FROM, to, subject, text });
    console.log(`[email] Envoyé à ${to} : "${subject}"`);
}

export const emailSender: EmailSender = {
    async sendPasswordResetEmail({ to, resetUrl }) {
        await send(
            to,
            "MyGES — Réinitialisation de votre mot de passe",
            `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe MyGES.\n` +
                `Cliquez sur ce lien (valable 1 heure) pour en choisir un nouveau :\n${resetUrl}\n\n` +
                `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
        );
    },
    async sendInvitationEmail({ to, firstname, inviteUrl }) {
        await send(
            to,
            "MyGES — Activez votre compte",
            `Bonjour ${firstname},\n\nUn compte MyGES a été créé pour vous par l'administration.\n` +
                `Cliquez sur ce lien (valable 72 heures) pour définir votre mot de passe et activer votre compte :\n${inviteUrl}`,
        );
    },
};
