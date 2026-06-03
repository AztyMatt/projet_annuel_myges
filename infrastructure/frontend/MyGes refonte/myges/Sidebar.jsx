// Sidebar component - shared across all roles
const sidebarStyles = {
    sidebar: {
        width: 256,
        minHeight: "100vh",
        backgroundColor: "#001944",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "32px 16px",
        flexShrink: 0,
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        boxShadow: "4px 0 24px rgba(49,46,129,0.15)",
        zIndex: 100,
    },
    logo: { marginBottom: 32 },
    logoTitle: {
        fontFamily: "Manrope",
        fontWeight: 800,
        fontSize: 20,
        color: "#fff",
        letterSpacing: "-0.5px",
        lineHeight: 1.1,
    },
    logoSub: {
        fontFamily: "Inter",
        fontSize: 11,
        color: "rgba(255,255,255,0.4)",
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        marginTop: 2,
    },
    nav: { display: "flex", flexDirection: "column", gap: 4 },
    navItem: (active) => ({
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderRadius: 10,
        cursor: "pointer",
        transition: "all 0.15s",
        backgroundColor: active ? "rgba(255,255,255,0.12)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.55)",
        fontFamily: "Inter",
        fontWeight: active ? 600 : 400,
        fontSize: 14,
    }),
    sectionLabel: {
        fontFamily: "Inter",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "1.5px",
        color: "rgba(255,255,255,0.25)",
        padding: "16px 16px 6px",
        textTransform: "uppercase",
    },
    bottom: { display: "flex", flexDirection: "column", gap: 4 },
    userCard: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 12px",
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.06)",
        marginTop: 16,
    },
    avatar: { width: 32, height: 32, borderRadius: "50%", border: "2px solid #002C6E", objectFit: "cover" },
    avatarPlaceholder: (initials, color) => ({
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "2px solid rgba(255,255,255,0.2)",
        backgroundColor: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter",
        fontWeight: 700,
        fontSize: 12,
        color: "#fff",
        flexShrink: 0,
    }),
    userName: { fontFamily: "Manrope", fontWeight: 600, fontSize: 13, color: "#fff", lineHeight: 1.2 },
    userRole: { fontFamily: "Inter", fontSize: 11, color: "rgba(255,255,255,0.4)" },
};

const NAV_ICONS = {
    dashboard: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
        </svg>
    ),
    planning: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
    ),
    notes: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    ),
    absences: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
    ),
    documents: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    messagerie: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
    ),
    securite: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    ),
    parametres: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.07 4.93l-1.41 1.41M12 2v2M4.93 4.93l1.41 1.41M2 12h2M4.93 19.07l1.41-1.41M12 20v2M19.07 19.07l-1.41-1.41M20 12h2" />
        </svg>
    ),
    deconnexion: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
    ),
    gestion: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    supports: (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
    ),
};

const NAV_CONFIG = {
    etudiant: [
        { key: "dashboard", label: "Tableau de bord", icon: "dashboard" },
        { key: "planning", label: "Planning", icon: "planning" },
        { key: "notes", label: "Notes", icon: "notes" },
        { key: "absences", label: "Absences", icon: "absences" },
        { key: "documents", label: "Documents", icon: "documents" },
        { key: "messagerie", label: "Messagerie", icon: "messagerie" },
    ],
    intervenant: [
        { key: "dashboard", label: "Tableau de bord", icon: "dashboard" },
        { key: "planning", label: "Planning", icon: "planning" },
        { key: "notes", label: "Saisie des notes", icon: "notes" },
        { key: "supports", label: "Supports de cours", icon: "supports" },
        { key: "messagerie", label: "Messagerie", icon: "messagerie" },
    ],
    scolarite: [
        { key: "dashboard", label: "Tableau de bord", icon: "dashboard" },
        { key: "notes", label: "Supervision des notes", icon: "notes" },
        { key: "absences", label: "Absences", icon: "absences" },
        { key: "documents", label: "Documents", icon: "documents" },
        { key: "messagerie", label: "Messagerie", icon: "messagerie" },
    ],
    superadmin: [
        { key: "dashboard", label: "Tableau de bord", icon: "dashboard" },
        { key: "gestion", label: "Gestion Utilisateurs", icon: "gestion" },
        { key: "securite", label: "Security & Audit", icon: "securite" },
        { key: "messagerie", label: "Messagerie", icon: "messagerie" },
    ],
};

const USER_CONFIG = {
    etudiant: { name: "Lucas Bernard", subtitle: "Étudiant Alternant", initials: "LB", color: "#002C6E" },
    intervenant: { name: "Dr. Jean Dupont", subtitle: "Intervenant", initials: "JD", color: "#4a1942" },
    scolarite: { name: "Admin Scolarité", subtitle: "Pôle Alternance", initials: "AS", color: "#1a4a1a" },
    superadmin: { name: "Admin Principal", subtitle: "Super User", initials: "AP", color: "#4a1a1a" },
};

function Sidebar({ role, currentPage, onNavigate, onLogout }) {
    const navItems = NAV_CONFIG[role] || NAV_CONFIG.etudiant;
    const user = USER_CONFIG[role] || USER_CONFIG.etudiant;
    const isAdminRole = role === "scolarite" || role === "superadmin";

    return (
        <div style={sidebarStyles.sidebar}>
            <div>
                <div style={sidebarStyles.logo}>
                    <div style={sidebarStyles.logoTitle}>MYGES 2.0</div>
                    <div style={sidebarStyles.logoSub}>Academic Portal</div>
                </div>
                <div style={sidebarStyles.nav}>
                    {navItems.map((item) => (
                        <div
                            key={item.key}
                            style={sidebarStyles.navItem(currentPage === item.key)}
                            onClick={() => onNavigate(item.key)}
                            onMouseEnter={(e) => {
                                if (currentPage !== item.key)
                                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
                                e.currentTarget.style.color = "#fff";
                            }}
                            onMouseLeave={(e) => {
                                if (currentPage !== item.key) e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                            }}
                        >
                            {NAV_ICONS[item.icon]}
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>
            <div style={sidebarStyles.bottom}>
                <div
                    style={{ ...sidebarStyles.navItem(false), fontSize: 13 }}
                    onClick={() => onNavigate("parametres")}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                    }}
                >
                    {NAV_ICONS.parametres} Paramètres
                </div>
                <div
                    style={{ ...sidebarStyles.navItem(false), fontSize: 13 }}
                    onClick={onLogout}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.07)";
                        e.currentTarget.style.color = "#fff";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                    }}
                >
                    {NAV_ICONS.deconnexion} Déconnexion
                </div>
                <div style={sidebarStyles.userCard}>
                    <div style={sidebarStyles.avatarPlaceholder(user.initials, user.color)}>{user.initials}</div>
                    <div>
                        <div style={sidebarStyles.userName}>{user.name}</div>
                        <div style={sidebarStyles.userRole}>{user.subtitle}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

Object.assign(window, { Sidebar });
