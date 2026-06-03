import { type SessionMode } from "@domain/session/session.enums";

export type Session = {
    id: string;
    courseId: string;
    startTime: Date;
    endTime: Date;
    mode: SessionMode;
    classroomId: string;
};
