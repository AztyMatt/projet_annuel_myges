"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, X, Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api";

type SecurityUser = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    lockedUntil: string | null;
    passwordExpired: boolean;
    twoFactorEnabled: boolean;
};

type ResolvedRole = "STUDENT" | "INSTRUCTOR" | "ADMIN" | "SUPER_ADMIN" | "PENDING";

type UserRow = SecurityUser & { role: ResolvedRole; adminId: string | null };

type Program = { id: string; name: string; code: string };

const roleConfig: Record<ResolvedRole, { label: string; className: string }> = {
    STUDENT: { label: "Étudiant", className: "bg-blue-100 text-blue-700" },
    INSTRUCTOR: { label: "Intervenant", className: "bg-emerald-100 text-emerald-700" },
    ADMIN: { label: "Administration", className: "bg-orange-100 text-orange-700" },
    SUPER_ADMIN: { label: "Super Admin", className: "bg-red-100 text-red-700" },
    PENDING: { label: "En attente de rôle", className: "bg-gray-100 text-gray-600" },
};

async function loadUsers(): Promise<UserRow[]> {
    const [{ users: securityUsers }, students, instructors, admins] = await Promise.all([
        api.get<{ users: SecurityUser[] }>("/admin/security/users"),
        api.get<{ userId: string }[]>("/students"),
        api.get<{ userId: string }[]>("/instructors"),
        api.get<{ id: string; userId: string; role: "ADMIN" | "SUPER_ADMIN" }[]>("/admins"),
    ]);

    const studentUserIds = new Set(students.map((s) => s.userId));
    const instructorUserIds = new Set(instructors.map((i) => i.userId));
    const adminByUserId = new Map(admins.map((a) => [a.userId, a]));

    return securityUsers.map((u) => {
        const admin = adminByUserId.get(u.id);
        if (admin) return { ...u, role: admin.role, adminId: admin.id };
        if (instructorUserIds.has(u.id)) return { ...u, role: "INSTRUCTOR" as const, adminId: null };
        if (studentUserIds.has(u.id)) return { ...u, role: "STUDENT" as const, adminId: null };
        return { ...u, role: "PENDING" as const, adminId: null };
    });
}

export default function GestionUtilisateurs() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | ResolvedRole>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [assigningUser, setAssigningUser] = useState<UserRow | null>(null);

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            setUsers(await loadUsers());
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Impossible de charger les comptes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void refresh();
    }, []);

    const filtered = useMemo(
        () =>
            users.filter((u) => {
                const matchSearch =
                    `${u.firstname} ${u.lastname}`.toLowerCase().includes(search.toLowerCase()) ||
                    u.email.toLowerCase().includes(search.toLowerCase());
                const matchRole = roleFilter === "all" || u.role === roleFilter;
                return matchSearch && matchRole;
            }),
        [users, search, roleFilter],
    );

    const handleAdminRoleChange = async (adminId: string, role: "ADMIN" | "SUPER_ADMIN") => {
        try {
            await api.patch(`/admins/${adminId}`, { role });
            void refresh();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Modification impossible.");
        }
    };

    const handleRemoveAdmin = async (adminId: string) => {
        try {
            await api.delete(`/admins/${adminId}`);
            void refresh();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Suppression impossible.");
        }
    };

    return (
        <div className="space-y-6 max-w-5xl">
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4">{error}</div>}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total", value: users.length },
                    { label: "En attente de rôle", value: users.filter((u) => u.role === "PENDING").length },
                    { label: "Comptes verrouillés", value: users.filter((u) => u.lockedUntil && new Date(u.lockedUntil) > new Date()).length },
                    { label: "Mots de passe expirés", value: users.filter((u) => u.passwordExpired).length },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                        <div className="text-2xl font-black text-gray-900">{s.value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 p-5 border-b border-gray-100 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-gray-400" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as "all" | ResolvedRole)}
                            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white text-gray-600"
                        >
                            <option value="all">Tous les rôles</option>
                            <option value="PENDING">En attente de rôle</option>
                            <option value="STUDENT">Étudiants</option>
                            <option value="INSTRUCTOR">Intervenants</option>
                            <option value="ADMIN">Administration</option>
                            <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                    </div>
                </div>

                {loading && <p className="p-5 text-sm text-gray-400">Chargement…</p>}

                {!loading && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    {["Utilisateur", "Email", "Rôle", "Sécurité", "Actions"].map((h) => (
                                        <th key={h} className="text-left font-semibold text-gray-400 text-xs px-5 py-3">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((u) => {
                                    const role = roleConfig[u.role];
                                    const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#001944] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {u.firstname[0]}
                                                        {u.lastname[0]}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">
                                                        {u.firstname} {u.lastname}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-gray-500 text-xs">{u.email}</td>
                                            <td className="px-5 py-3">
                                                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", role.className)}>
                                                    {role.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {isLocked && (
                                                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                                            <Lock size={10} /> Verrouillé
                                                        </span>
                                                    )}
                                                    {u.passwordExpired && (
                                                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                                            <AlertTriangle size={10} /> Mdp expiré
                                                        </span>
                                                    )}
                                                    {u.twoFactorEnabled && (
                                                        <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                            <ShieldCheck size={10} /> 2FA
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                {u.role === "PENDING" && (
                                                    <button
                                                        onClick={() => setAssigningUser(u)}
                                                        className="px-3 py-1.5 bg-[#001944] text-white text-xs font-semibold rounded-lg hover:bg-[#002C6E]"
                                                    >
                                                        Attribuer un rôle
                                                    </button>
                                                )}
                                                {(u.role === "ADMIN" || u.role === "SUPER_ADMIN") && u.adminId && (
                                                    <div className="flex items-center gap-1.5">
                                                        <select
                                                            value={u.role}
                                                            onChange={(e) =>
                                                                void handleAdminRoleChange(u.adminId!, e.target.value as "ADMIN" | "SUPER_ADMIN")
                                                            }
                                                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none bg-white text-gray-600"
                                                        >
                                                            <option value="ADMIN">Administration</option>
                                                            <option value="SUPER_ADMIN">Super Admin</option>
                                                        </select>
                                                        <button
                                                            onClick={() => void handleRemoveAdmin(u.adminId!)}
                                                            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                                                        >
                                                            Retirer
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">Aucun utilisateur trouvé</div>}
                    </div>
                )}
            </div>

            {assigningUser && (
                <AssignRoleModal
                    user={assigningUser}
                    onClose={() => setAssigningUser(null)}
                    onAssigned={() => {
                        setAssigningUser(null);
                        void refresh();
                    }}
                />
            )}
        </div>
    );
}

type RoleChoice = "STUDENT" | "INSTRUCTOR" | "ADMIN";

function AssignRoleModal({
    user,
    onClose,
    onAssigned,
}: {
    user: UserRow;
    onClose: () => void;
    onAssigned: () => void;
}) {
    const [choice, setChoice] = useState<RoleChoice>("STUDENT");
    const [programs, setPrograms] = useState<Program[]>([]);
    const [programId, setProgramId] = useState("");
    const [contractType, setContractType] = useState("PERMANENT");
    const [adminRole, setAdminRole] = useState<"ADMIN" | "SUPER_ADMIN">("ADMIN");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        api
            .get<Program[]>("/programs")
            .then((list) => {
                setPrograms(list);
                if (list[0]) setProgramId(list[0].id);
            })
            .catch(() => {});
    }, []);

    const handleSubmit = async () => {
        setSubmitting(true);
        setError("");
        try {
            if (choice === "STUDENT") {
                if (!programId) throw new ApiError(400, "Sélectionnez une filière.");
                await api.post("/students", { userId: user.id, programId });
            } else if (choice === "INSTRUCTOR") {
                await api.post("/instructors", { userId: user.id, contractType });
            } else {
                await api.post("/admins", { userId: user.id, role: adminRole });
            }
            onAssigned();
        } catch (e) {
            setError(e instanceof ApiError ? e.message : "Attribution impossible.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900">
                        Attribuer un rôle — {user.firstname} {user.lastname}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-medium text-gray-700 block mb-1">Rôle</label>
                        <select
                            value={choice}
                            onChange={(e) => setChoice(e.target.value as RoleChoice)}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white"
                        >
                            <option value="STUDENT">Étudiant</option>
                            <option value="INSTRUCTOR">Intervenant</option>
                            <option value="ADMIN">Admin / Super Admin</option>
                        </select>
                    </div>

                    {choice === "STUDENT" && (
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Filière</label>
                            <select
                                value={programId}
                                onChange={(e) => setProgramId(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white"
                            >
                                {programs.length === 0 && <option value="">Aucune filière disponible</option>}
                                {programs.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {choice === "INSTRUCTOR" && (
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Type de contrat</label>
                            <select
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white"
                            >
                                <option value="PERMANENT">Permanent</option>
                                <option value="FIXED_TERM">CDD</option>
                                <option value="FREELANCE">Indépendant</option>
                                <option value="TEMPORARY">Vacataire</option>
                            </select>
                        </div>
                    )}

                    {choice === "ADMIN" && (
                        <div>
                            <label className="text-xs font-medium text-gray-700 block mb-1">Niveau</label>
                            <select
                                value={adminRole}
                                onChange={(e) => setAdminRole(e.target.value as "ADMIN" | "SUPER_ADMIN")}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none bg-white"
                            >
                                <option value="ADMIN">Administration</option>
                                <option value="SUPER_ADMIN">Super Admin</option>
                            </select>
                        </div>
                    )}

                    {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
                </div>
                <div className="flex items-center gap-3 px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => void handleSubmit()}
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-[#001944] text-white rounded-xl text-sm font-semibold hover:bg-[#002C6E] disabled:opacity-50"
                    >
                        {submitting ? "Attribution…" : "Attribuer"}
                    </button>
                </div>
            </div>
        </div>
    );
}
