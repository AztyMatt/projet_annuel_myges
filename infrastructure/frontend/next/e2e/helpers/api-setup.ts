// Prépare des données de test en appelant directement le backend réel (docker compose,
// base "myges" de dev) — plus rapide et plus fiable qu'un aller-retour par l'UI pour de la
// donnée qui n'est pas elle-même le sujet du test. Chaque compte/entité créé ici a un nom/email
// suffixé par un identifiant unique pour ne jamais entrer en collision avec les fixtures ou une
// exécution E2E précédente.
const BACKEND_URL = "http://localhost:3001";

// Doit rester une politique de mot de passe forte (12+ car., maj./min./chiffre/symbole).
export const E2E_PASSWORD = "MotDePasseE2E1234$";

async function api<T>(path: string, options: { method?: string; token?: string; body?: unknown } = {}): Promise<T> {
    const response = await fetch(`${BACKEND_URL}/api${path}`, {
        method: options.method ?? "GET",
        headers: {
            "Content-Type": "application/json",
            ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
    if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`${options.method ?? "GET"} ${path} → ${response.status}: ${text}`);
    }
    return response.json() as Promise<T>;
}

// Deux mécanismes de seed coexistent dans ce projet et se marchent dessus : SEED_ON_START
// (démarrage du backend, mot de passe = .env SEED_PASSWORD) et fixtures/dev-fixtures.sql
// (rechargeable à tout moment, écrase admin.seed@myges.fr avec son propre mot de passe
// documenté "MotDePasse1234$"). Le dernier chargé gagne — plutôt que d'imposer un état
// particulier de la base de dev, on essaie les deux mots de passe connus.
const FIXTURES_PASSWORD = "MotDePasse1234$";

export async function getSeedAdminCredentials(): Promise<{ email: string; password: string; token: string }> {
    const email = "admin.seed@myges.fr";
    const candidates = [process.env.SEED_PASSWORD, FIXTURES_PASSWORD].filter((p): p is string => Boolean(p));

    for (const password of candidates) {
        try {
            const result = await api<{ token: string }>("/auth/login", { method: "POST", body: { email, password } });
            return { email, password, token: result.token };
        } catch {
            // essaie le mot de passe candidat suivant
        }
    }
    throw new Error(
        `Impossible de se connecter avec ${email} (ni SEED_PASSWORD du .env, ni le mot de passe des fixtures) — ` +
            "vérifie que docker compose tourne et qu'un des deux seeds a été appliqué.",
    );
}

export async function loginAsSeedAdmin(): Promise<string> {
    return (await getSeedAdminCredentials()).token;
}

async function signup(email: string, firstname: string, lastname: string): Promise<string> {
    const result = await api<{ userId: string }>("/auth/signup", {
        method: "POST",
        body: { firstname, lastname, email, password: E2E_PASSWORD, gdprConsent: true },
    });
    return result.userId;
}

export type TestProgramChain = {
    programId: string;
    classId: string;
    groupId: string;
    blocId: string;
    moduleId: string;
};

/** Filière → classe → groupe → bloc → module (rattaché à la filière) — chaîne minimale pour créer un cours. */
export async function createProgramChain(adminToken: string, suffix: string): Promise<TestProgramChain> {
    // Les dates doivent être uniques par exécution : (startDate, endDate) est contraint en base
    // (unique) — deux specs qui créeraient la même "année académique 2026-2027" entreraient en
    // conflit (409). On décale arbitrairement loin dans le futur à partir d'un nombre aléatoire.
    const yearOffset = Math.floor(Math.random() * 500);
    const academicYear = await api<{ id: string }>("/academic-years", {
        method: "POST",
        token: adminToken,
        body: {
            startDate: new Date(Date.UTC(2100 + yearOffset, 8, 1)).toISOString(),
            endDate: new Date(Date.UTC(2101 + yearOffset, 7, 31)).toISOString(),
        },
    });
    const period = await api<{ id: string }>("/periods", {
        method: "POST",
        token: adminToken,
        body: {
            order: 1,
            startDate: new Date(Date.UTC(2100 + yearOffset, 8, 1)).toISOString(),
            endDate: new Date(Date.UTC(2101 + yearOffset, 7, 31)).toISOString(),
            academicYearId: academicYear.id,
        },
    });
    const program = await api<{ id: string }>("/programs", {
        method: "POST",
        token: adminToken,
        body: { name: `Programme E2E ${suffix}`, code: `E2E-${suffix}`, periodId: period.id },
    });
    const klass = await api<{ id: string }>("/classes", {
        method: "POST",
        token: adminToken,
        body: { number: 1, programId: program.id, size: 24 },
    });
    const group = await api<{ id: string }>("/groups", {
        method: "POST",
        token: adminToken,
        body: { classId: klass.id, name: `Groupe E2E ${suffix}` },
    });
    const bloc = await api<{ id: string }>("/blocs", {
        method: "POST",
        token: adminToken,
        body: { name: `Bloc E2E ${suffix}`, programId: program.id },
    });
    const testModule = await api<{ id: string }>("/modules", {
        method: "POST",
        token: adminToken,
        body: { name: `Module E2E ${suffix}`, code: `MOD-E2E-${suffix}` },
    });
    await api("/program-modules", {
        method: "POST",
        token: adminToken,
        body: { programId: program.id, moduleId: testModule.id, coefficient: 2, ectsCredits: 4 },
    });

    return { programId: program.id, classId: klass.id, groupId: group.id, blocId: bloc.id, moduleId: testModule.id };
}

export async function createInstructor(
    adminToken: string,
    suffix: string,
): Promise<{ email: string; instructorId: string }> {
    const email = `e2e-instructor-${suffix}@myges-test.fr`;
    const userId = await signup(email, "Intervenant", "E2E");
    const instructor = await api<{ id: string }>("/instructors", {
        method: "POST",
        token: adminToken,
        body: { userId, contractType: "PERMANENT" },
    });
    return { email, instructorId: instructor.id };
}

export async function createStudent(
    adminToken: string,
    programId: string,
    suffix: string,
): Promise<{ email: string; studentId: string }> {
    const email = `e2e-student-${suffix}@myges-test.fr`;
    const userId = await signup(email, "Etudiant", "E2E");
    const student = await api<{ id: string }>("/students", {
        method: "POST",
        token: adminToken,
        body: { userId, programId },
    });
    return { email, studentId: student.id };
}

export async function addStudentToGroup(adminToken: string, studentId: string, groupId: string): Promise<void> {
    await api("/student-groups", { method: "POST", token: adminToken, body: { studentId, groupId } });
}

export async function createCourse(
    adminToken: string,
    chain: TestProgramChain,
    instructorId: string,
): Promise<{ courseId: string }> {
    const course = await api<{ id: string }>("/courses", {
        method: "POST",
        token: adminToken,
        body: {
            instructorId,
            moduleId: chain.moduleId,
            classId: chain.classId,
            groupId: chain.groupId,
            blocId: chain.blocId,
        },
    });
    return { courseId: course.id };
}

export async function createAssessment(
    adminToken: string,
    courseId: string,
    suffix: string,
): Promise<{ assessmentId: string }> {
    const assessment = await api<{ id: string }>("/assessments", {
        method: "POST",
        token: adminToken,
        body: {
            courseId,
            title: `Évaluation E2E ${suffix}`,
            type: "CONTINUOUS",
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            maxGroupSize: 1,
            isPublished: true,
        },
    });
    return { assessmentId: assessment.id };
}
