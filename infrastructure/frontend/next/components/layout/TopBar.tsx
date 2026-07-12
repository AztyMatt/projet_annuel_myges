"use client";

import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/use-current-user";

type Role = "etudiant" | "intervenant" | "scolarite" | "superadmin";

const pageTitles: Record<string, string> = {
    "/etudiant": "Tableau de bord",
    "/etudiant/planning": "Mon planning",
    "/etudiant/notes": "Mes notes",
    "/etudiant/absences": "Mes absences",
    "/etudiant/documents": "Mes documents",
    "/etudiant/cours": "Supports de cours",
    "/etudiant/evaluations": "Évaluations",
    "/intervenant": "Tableau de bord",
    "/intervenant/planning": "Mon planning",
    "/intervenant/notes": "Saisie des notes",
    "/intervenant/supports": "Supports de cours",
    "/intervenant/evaluations": "Évaluations",
    "/scolarite": "Tableau de bord",
    "/scolarite/etudiants": "Gestion des étudiants",
    "/scolarite/notes": "Notes & jurys",
    "/superadmin": "Tableau de bord",
    "/superadmin/gestion": "Gestion des utilisateurs",
    "/superadmin/securite": "Sécurité système",
    "/messagerie": "Messagerie",
    "/parametres": "Paramètres",
};

function roleFromApi(apiRole: string | undefined): Role {
    switch (apiRole) {
        case "INSTRUCTOR":
            return "intervenant";
        case "ADMIN":
            return "scolarite";
        case "SUPER_ADMIN":
            return "superadmin";
        default:
            return "etudiant";
    }
}

// Même logique que Sidebar.tsx : le chemin suffit sur les pages préfixées par rôle, mais
// /parametres et /messagerie sont partagées — il faut alors le vrai rôle de l'utilisateur connecté.
function getRole(pathname: string, apiRole: string | undefined): Role {
    if (pathname.startsWith("/intervenant")) return "intervenant";
    if (pathname.startsWith("/scolarite")) return "scolarite";
    if (pathname.startsWith("/superadmin")) return "superadmin";
    if (pathname.startsWith("/etudiant")) return "etudiant";
    return roleFromApi(apiRole);
}

const roleBadge: Record<Role, { label: string; className: string }> = {
    etudiant: { label: "Étudiant", className: "bg-blue-50 text-blue-700 border border-blue-200" },
    intervenant: { label: "Intervenant", className: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    scolarite: { label: "Administration", className: "bg-orange-50 text-orange-700 border border-orange-200" },
    superadmin: { label: "Super Admin", className: "bg-red-50 text-red-700 border border-red-200" },
};

export function TopBar() {
    const pathname = usePathname();
    const me = useCurrentUser();
    const title = pageTitles[pathname] ?? "MyGES 2.0";
    const role = getRole(pathname, me?.role);
    const badge = roleBadge[role];

    return (
        <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-100 z-30 flex items-center px-6 gap-4 shadow-sm">
            <div className="flex-1">
                <h1 className="text-base font-bold text-gray-900 leading-none">{title}</h1>
                <p className="text-xs text-gray-400 mt-0.5">MyGES 2.0</p>
            </div>

            <div className="flex items-center gap-3">
                {/* Role badge */}
                <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", badge.className)}>
                    {badge.label}
                </span>

                {/* Notifications */}
                <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
                    <Bell size={17} className="text-gray-600" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>
            </div>
        </header>
    );
}
