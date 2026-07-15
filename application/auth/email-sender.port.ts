export interface EmailSender {
    sendPasswordResetEmail(input: { to: string; resetUrl: string }): Promise<void>;
    sendInvitationEmail(input: { to: string; firstname: string; inviteUrl: string }): Promise<void>;
}
