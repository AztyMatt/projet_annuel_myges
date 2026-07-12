export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

// Le token est stocké dans un cookie httpOnly posé par /api/auth/login — le navigateur l'envoie
// automatiquement (même origine), et le middleware le retransforme en header Authorization avant
// de relayer la requête au backend. Rien à faire ici pour l'authentification.
async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const { body, headers, ...rest } = options;

    const response = await fetch(`/api${path}`, {
        ...rest,
        headers: { "Content-Type": "application/json", ...headers },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new ApiError(401, "Session expirée, veuillez vous reconnecter.");
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const message = payload && typeof payload.error === "string" ? payload.error : "Une erreur est survenue.";
        throw new ApiError(response.status, message);
    }

    return payload as T;
}

async function upload<T>(path: string, file: File): Promise<T> {
    const formData = new FormData();
    formData.append("file", file);

    // Pas de Content-Type manuel : le navigateur doit poser lui-même le boundary multipart.
    const response = await fetch(`/api${path}`, { method: "POST", body: formData });

    if (response.status === 401) {
        if (typeof window !== "undefined") window.location.href = "/login";
        throw new ApiError(401, "Session expirée, veuillez vous reconnecter.");
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const message = payload && typeof payload.error === "string" ? payload.error : "Une erreur est survenue.";
        throw new ApiError(response.status, message);
    }

    return payload as T;
}

export const api = {
    get: <T>(path: string) => request<T>(path, { method: "GET" }),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
    patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
    delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
    upload,
};
