export type PasswordResetTokenPurpose = "reset" | "invitation";

export type PasswordResetToken = {
    token: string;
    userId: string;
    purpose: PasswordResetTokenPurpose;
    createdAt: Date;
};
