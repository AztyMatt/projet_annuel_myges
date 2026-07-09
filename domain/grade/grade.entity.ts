export type Grade = {
    id: string;
    studentId: string;
    value: number;
    isLocked: boolean;
    enteredAt: Date;
    enteredBy: string | null;
};
