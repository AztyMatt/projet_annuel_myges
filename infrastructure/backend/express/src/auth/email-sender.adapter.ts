import { type EmailSender } from "@application/auth/email-sender.port";

export const emailSender: EmailSender = {
    async sendPasswordResetEmail({ to, resetUrl }) {
        console.log(`[email] Password reset link for ${to}: ${resetUrl}`);
    },
};
