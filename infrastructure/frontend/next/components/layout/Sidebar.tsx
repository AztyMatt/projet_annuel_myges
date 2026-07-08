"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import {
    LayoutDashboard,
    Calendar,
    CalendarDays,
    BookOpen,
    AlertCircle,
    FileText,
    MessageSquare,
    Settings,
    FolderOpen,
    Users,
    Shield,
    UserCog,
    LogOut,
    GraduationCap,
    Briefcase,
    Building2,
    Library,
    Boxes,
    Landmark,
    UserPlus,
    ClipboardList,
    ChevronRight,
} from "lucide-react";

type Role = "etudiant" | "intervenant" | "scolarite" | "superadmin";

type NavItem = { label: string; href: string; icon: React.ElementType };

const navConfig: Record<Role, NavItem[]> = {
    etudiant: [
        { label: "Tableau de bord", href: "/etudiant", icon: LayoutDashboard },
        { label: "Planning", href: "/etudiant/planning", icon: Calendar },
        { label: "Notes", href: "/etudiant/notes", icon: BookOpen },
        { label: "Absences", href: "/etudiant/absences", icon: AlertCircle },
        { label: "Documents", href: "/etudiant/documents", icon: FileText },
        { label: "Messagerie", href: "/messagerie", icon: MessageSquare },
        { label: "Paramètres", href: "/parametres", icon: Settings },
    ],
    intervenant: [
        { label: "Tableau de bord", href: "/intervenant", icon: LayoutDashboard },
        { label: "Mon planning", href: "/intervenant/planning", icon: Calendar },
        { label: "Saisie des notes", href: "/intervenant/notes", icon: BookOpen },
        { label: "Supports de cours", href: "/intervenant/supports", icon: FolderOpen },
        { label: "Messagerie", href: "/messagerie", icon: MessageSquare },
        { label: "Paramètres", href: "/parametres", icon: Settings },
    ],
    scolarite: [
        { label: "Tableau de bord", href: "/scolarite", icon: LayoutDashboard },
        { label: "Étudiants", href: "/scolarite/etudiants", icon: Users },
        { label: "Absences", href: "/scolarite/absences", icon: AlertCircle },
        { label: "Documents", href: "/scolarite/documents", icon: FileText },
        { label: "Notes & jurys", href: "/scolarite/notes", icon: BookOpen },
        { label: "Planning", href: "/scolarite/planning", icon: Calendar },
        { label: "Examens", href: "/scolarite/examens", icon: ClipboardList },
        { label: "Formations", href: "/scolarite/formations", icon: Library },
        { label: "Classes", href: "/scolarite/classes", icon: Boxes },
        { label: "Cours", href: "/scolarite/cours", icon: FolderOpen },
        { label: "Intervenants", href: "/scolarite/intervenants", icon: Briefcase },
        { label: "Entreprises", href: "/scolarite/entreprises", icon: Landmark },
        { label: "Externes", href: "/scolarite/externes", icon: UserPlus },
        { label: "Campus", href: "/scolarite/campus", icon: Building2 },
        { label: "Année académique", href: "/scolarite/annee-academique", icon: CalendarDays },
        { label: "Messagerie", href: "/messagerie", icon: MessageSquare },
        { label: "Paramètres", href: "/parametres", icon: Settings },
    ],
    superadmin: [
        { label: "Tableau de bord", href: "/superadmin", icon: LayoutDashboard },
        { label: "Gestion utilisateurs", href: "/superadmin/gestion", icon: UserCog },
        { label: "Sécurité", href: "/superadmin/securite", icon: Shield },
        { label: "Messagerie", href: "/messagerie", icon: MessageSquare },
        { label: "Paramètres", href: "/parametres", icon: Settings },
    ],
};

type RoleStyle = {
    label: string;
    icon: React.ElementType;
    color: string;
};

const roleConfig: Record<Role, RoleStyle> = {
    etudiant: { label: "Étudiant", icon: GraduationCap, color: "bg-blue-500" },
    intervenant: { label: "Intervenant", icon: Briefcase, color: "bg-emerald-500" },
    scolarite: { label: "Administration", icon: Building2, color: "bg-orange-500" },
    superadmin: { label: "Super Admin", icon: Shield, color: "bg-red-500" },
};

type Me = { firstname: string; lastname: string };

function getRole(pathname: string): Role {
    if (pathname.startsWith("/intervenant")) return "intervenant";
    if (pathname.startsWith("/scolarite")) return "scolarite";
    if (pathname.startsWith("/superadmin")) return "superadmin";
    return "etudiant";
}

function isNavActive(pathname: string, href: string): boolean {
    if (pathname === href) return true;
    const rootPaths = ["/etudiant", "/intervenant", "/scolarite", "/superadmin"];
    if (rootPaths.includes(href)) return false;
    return pathname.startsWith(href);
}

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const role = getRole(pathname);
    const navItems = navConfig[role];
    const user = roleConfig[role];
    const RoleIcon = user.icon;

    const [me, setMe] = useState<Me | null>(null);

    useEffect(() => {
        api
            .get<Me>("/users/me")
            .then(setMe)
            .catch(() => {});
    }, []);

    const initials = me ? `${me.firstname[0]}${me.lastname[0]}`.toUpperCase() : "…";
    const displayName = me ? `${me.firstname} ${me.lastname}` : "Chargement…";

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } finally {
            router.push("/login");
        }
    };

    return (
        <aside className="fixed left-0 top-0 h-full w-64 flex flex-col z-40" style={{ backgroundColor: "#001944" }}>
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur flex-shrink-0">
                    <span className="text-white font-black text-base">M</span>
                </div>
                <div>
                    <div className="text-white font-black text-sm tracking-wider leading-none">MYGES 2.0</div>
                    <div className="text-white/40 text-xs mt-0.5">Gestion scolaire</div>
                </div>
            </div>

            {/* Role badge */}
            <div className="px-4 pt-4 pb-2">
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/10">
                    <div
                        className={cn(
                            "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                            user.color,
                        )}
                    >
                        <RoleIcon size={11} className="text-white" />
                    </div>
                    <span className="text-white/70 text-xs font-medium">{user.label}</span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
                {navItems.map((item) => {
                    const ItemIcon = item.icon;
                    const active = isNavActive(pathname, item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                                active
                                    ? "bg-white/15 text-white font-medium"
                                    : "text-white/55 hover:bg-white/10 hover:text-white/90",
                            )}
                        >
                            <ItemIcon size={16} className="flex-shrink-0" />
                            <span className="flex-1 leading-none">{item.label}</span>
                            {active && <ChevronRight size={13} className="text-white/30" />}
                        </Link>
                    );
                })}
            </nav>

            {/* User card */}
            <div className="p-3 border-t border-white/10">
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                    <div
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
                            user.color,
                        )}
                    >
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-semibold truncate">{displayName}</div>
                        <div className="text-white/40 text-xs">{user.label}</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 mt-1 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors text-xs cursor-pointer"
                >
                    <LogOut size={13} />
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>
    );
}
