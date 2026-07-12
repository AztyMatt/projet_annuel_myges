import { type Session } from "@domain/session/session.entity";

export const isValidTimeRange = (start: Date, end: Date): boolean =>
    !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && start < end;

export const classroomFitsGroup = (capacity: number, groupSize: number): boolean => capacity >= groupSize;

export const sessionHasStarted = (session: Pick<Session, "startTime">, now: Date = new Date()): boolean =>
    now >= session.startTime;
