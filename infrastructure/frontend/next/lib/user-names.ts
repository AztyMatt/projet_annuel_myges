import { api } from "@/lib/api";

const userNameCache = new Map<string, string>();
let studentsById: Map<string, { userId: string }> | null = null;
let studentsLoadPromise: Promise<Map<string, { userId: string }>> | null = null;

async function ensureStudentsById(): Promise<Map<string, { userId: string }>> {
    if (studentsById) return studentsById;
    if (!studentsLoadPromise) {
        studentsLoadPromise = api
            .get<{ id: string; userId: string }[]>("/students")
            .then((list) => {
                studentsById = new Map(list.map((s) => [s.id, s]));
                return studentsById;
            })
            .catch(() => {
                studentsLoadPromise = null;
                return new Map<string, { userId: string }>();
            });
    }
    return studentsLoadPromise;
}

export async function resolveUserName(userId: string, fallbackLabel = "Utilisateur"): Promise<string> {
    const cached = userNameCache.get(userId);
    if (cached) return cached;

    const name = await api
        .get<{ firstname: string; lastname: string }>(`/users/${userId}`)
        .then((u) => `${u.firstname} ${u.lastname}`)
        .catch(() => `${fallbackLabel} #${userId.slice(0, 8)}`);

    userNameCache.set(userId, name);
    return name;
}

export async function resolveStudentName(studentId: string): Promise<string> {
    const students = await ensureStudentsById();
    let student = students.get(studentId);

    if (!student) {
        const fetched = await api.get<{ id: string; userId: string }>(`/students/${studentId}`).catch(() => null);
        if (fetched) {
            student = fetched;
            if (!studentsById) studentsById = new Map();
            studentsById.set(studentId, fetched);
        }
    }

    if (!student?.userId) return `Étudiant #${studentId.slice(0, 8)}`;
    return resolveUserName(student.userId, "Étudiant");
}

/** Résout les noms pour une liste d'identifiants métier `student.id`. */
export async function buildStudentNameMap(studentIds: string[]): Promise<Record<string, string>> {
    const unique = [...new Set(studentIds)];
    const entries = await Promise.all(
        unique.map(async (studentId) => [studentId, await resolveStudentName(studentId)] as const),
    );
    return Object.fromEntries(entries);
}

export async function buildNameMap<T extends { id: string; userId: string }>(
    entities: T[],
    fallbackLabel: string,
): Promise<Record<string, string>> {
    const entries = await Promise.all(
        entities.map(async (entity) => [entity.id, await resolveUserName(entity.userId, fallbackLabel)] as const),
    );
    return Object.fromEntries(entries);
}

export function formatStudentName(studentId: string, names: Record<string, string>): string {
    return names[studentId] ?? `Étudiant #${studentId.slice(0, 8)}`;
}
