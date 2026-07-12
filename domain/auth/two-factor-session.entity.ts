export type TwoFactorSession = {
    token: string;
    userId: string;
    attempts: number;
    createdAt: Date;
};
