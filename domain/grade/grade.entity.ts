export type Grade = {
    id: string;
    studentId: string;
    value: number;
    isRetake: boolean;
    isLocked: boolean;
    enteredAt: Date;
    enteredBy: string | null;
};
