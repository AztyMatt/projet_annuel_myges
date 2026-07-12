import { type Session } from "@domain/session/session.entity";
import { type SessionMode } from "@domain/session/session.enums";
import { type SessionExamType } from "@domain/session/session-exam/session-exam.enums";
import { type StudentRepository } from "@application/student/student.repository";
import { type InstructorRepository } from "@application/instructor/instructor.repository";
import { type StudentGroupRepository } from "@application/group/student-group/student-group.repository";
import { type GroupRepository } from "@application/group/group.repository";
import { type ClassRepository } from "@application/class/class.repository";
import { type CourseRepository } from "@application/course/course.repository";
import { type ModuleRepository } from "@application/module/module.repository";
import { type ClassroomRepository } from "@application/classroom/classroom.repository";
import { type SessionRepository } from "@application/session/session.repository";
import { type SessionExamRepository } from "@application/session/session-exam/session-exam.repository";
import { type AuthContext } from "@application/types/auth-context";
import { NotFound } from "@application/types/results";

export type PlanningEntryView = {
    sessionId: string;
    startTime: string;
    endTime: string;
    mode: SessionMode;
    courseId: string;
    moduleId: string;
    moduleName: string | null;
    groupId: string;
    groupName: string | null;
    classId: string | null;
    classNumber: number | null;
    classroomId: string | null;
    classroomName: string | null;

    exam: { sessionExamId: string; type: SessionExamType; isRetake: boolean } | null;
};

export type PlanningWindow = { from?: Date; to?: Date };

export type PlanningWeek = { weekStart: string; weekEnd: string; entries: PlanningEntryView[] };

export type ListMinePlanningResult =
    | NotFound
    | { kind: "planning_listed"; mode: "range"; from: string; to: string; entries: PlanningEntryView[] }
    | { kind: "planning_listed"; mode: "weeks"; weeks: PlanningWeek[] };

export class PlanningUseCases {
    constructor(
        private readonly students: StudentRepository,
        private readonly instructors: InstructorRepository,
        private readonly studentGroups: StudentGroupRepository,
        private readonly groups: GroupRepository,
        private readonly classes: ClassRepository,
        private readonly courses: CourseRepository,
        private readonly modules: ModuleRepository,
        private readonly classrooms: ClassroomRepository,
        private readonly sessions: SessionRepository,
        private readonly sessionExams: SessionExamRepository,
    ) {}

    private async resolveMyCourses(auth: AuthContext): Promise<{ id: string; moduleId: string; groupId: string }[] | null> {
        const student = await this.students.findByUserId(auth.requesterId);
        if (student) {
            const groups = await this.studentGroups.findByStudentId(student.id);
            const lists = await Promise.all(groups.map((g) => this.courses.findByGroupId(g.groupId)));
            return dedupeById(lists.flat());
        }
        const instructor = await this.instructors.findByUserId(auth.requesterId);
        if (instructor) return await this.courses.findByInstructorId(instructor.id);
        return null;
    }

    async listMine(auth: AuthContext, window: PlanningWindow = {}): Promise<ListMinePlanningResult> {
        const courses = await this.resolveMyCourses(auth);
        if (courses === null) return NotFound;

        const rangeMode = !!(window.from && window.to);
        const rangeEndExcl = window.to ? addDays(window.to, 1) : undefined;
        const inScope = (s: Session) =>
            !rangeMode || (s.startTime >= window.from! && s.startTime < rangeEndExcl!);

        const entries = await this.collectEntries(courses, inScope);
        entries.sort((a, b) => (a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0));

        if (rangeMode) {
            return { kind: "planning_listed", mode: "range", from: window.from!.toISOString(), to: window.to!.toISOString(), entries };
        }
        return { kind: "planning_listed", mode: "weeks", weeks: bucketByWeek(entries) };
    }

    private async collectEntries(
        courses: { id: string; moduleId: string; groupId: string }[],
        inScope: (s: Session) => boolean,
    ): Promise<PlanningEntryView[]> {
        const moduleNames = new Map<string, string | null>();
        const groupInfos = new Map<string, { groupName: string | null; classId: string | null; classNumber: number | null }>();
        const classroomNames = new Map<string, string | null>();
        const entries: PlanningEntryView[] = [];

        for (const course of courses) {
            const sessions = (await this.sessions.findByCourseId(course.id)).filter(inScope);
            if (sessions.length === 0) continue;
            const moduleName = await memo(moduleNames, course.moduleId, async (id) => (await this.modules.findById(id))?.name ?? null);
            const groupInfo = await memo(groupInfos, course.groupId, async (id) => {
                const group = await this.groups.findById(id);
                if (!group) return { groupName: null, classId: null, classNumber: null };
                const cls = await this.classes.findById(group.classId);
                return { groupName: group.name, classId: group.classId, classNumber: cls?.number ?? null };
            });
            for (const session of sessions) {
                const classroomName = session.classroomId
                    ? await memo(classroomNames, session.classroomId, async (id) => (await this.classrooms.findById(id))?.name ?? null)
                    : null;
                const exams = await this.sessionExams.findBySessionId(session.id);
                const exam = exams[0] ? { sessionExamId: exams[0].id, type: exams[0].type, isRetake: exams[0].isRetake } : null;
                entries.push(toEntry(session, course.id, course.moduleId, course.groupId, moduleName, groupInfo, classroomName, exam));
            }
        }
        return entries;
    }
}

const startOfWeek = (d: Date): Date => {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const mondayOffset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - mondayOffset);
    return date;
};

const addDays = (d: Date, days: number): Date => {
    const date = new Date(d);
    date.setDate(date.getDate() + days);
    return date;
};

const bucketByWeek = (entries: PlanningEntryView[]): PlanningWeek[] => {
    const buckets = new Map<string, PlanningWeek>();
    for (const entry of entries) {
        const weekStart = startOfWeek(new Date(entry.startTime));
        const key = weekStart.toISOString();
        let bucket = buckets.get(key);
        if (!bucket) {
            bucket = { weekStart: key, weekEnd: addDays(weekStart, 7).toISOString(), entries: [] };
            buckets.set(key, bucket);
        }
        bucket.entries.push(entry);
    }
    return [...buckets.values()].sort((a, b) => (a.weekStart < b.weekStart ? -1 : a.weekStart > b.weekStart ? 1 : 0));
};

const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    return items.filter((it) => (seen.has(it.id) ? false : (seen.add(it.id), true)));
};

const memo = async <V>(cache: Map<string, V>, key: string, load: (key: string) => Promise<V>): Promise<V> => {
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const value = await load(key);
    cache.set(key, value);
    return value;
};

const toEntry = (
    session: Session,
    courseId: string,
    moduleId: string,
    groupId: string,
    moduleName: string | null,
    groupInfo: { groupName: string | null; classId: string | null; classNumber: number | null },
    classroomName: string | null,
    exam: { sessionExamId: string; type: SessionExamType; isRetake: boolean } | null,
): PlanningEntryView => ({
    sessionId: session.id,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime.toISOString(),
    mode: session.mode,
    courseId,
    moduleId,
    moduleName,
    groupId,
    groupName: groupInfo.groupName,
    classId: groupInfo.classId,
    classNumber: groupInfo.classNumber,
    classroomId: session.classroomId,
    classroomName,
    exam,
});
