export interface EmailSender {
    sendPasswordResetEmail(input: { to: string; resetUrl: string }): Promise<void>;
}
