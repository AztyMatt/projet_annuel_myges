// Main App — Router complet
function App() {
    const [role, setRole] = React.useState(() => localStorage.getItem("myges_role") || null);
    const [page, setPage] = React.useState(() => localStorage.getItem("myges_page") || "dashboard");

    React.useEffect(() => {
        window.__mygesNavigate = handleNavigate;
        return () => {
            delete window.__mygesNavigate;
        };
    });

    const handleLogin = (r) => {
        setRole(r);
        setPage("dashboard");
        localStorage.setItem("myges_role", r);
        localStorage.setItem("myges_page", "dashboard");
    };

    const handleLogout = () => {
        setRole(null);
        localStorage.removeItem("myges_role");
        localStorage.removeItem("myges_page");
    };

    const handleNavigate = (p) => {
        setPage(p);
        localStorage.setItem("myges_page", p);
        window.scrollTo(0, 0);
    };

    const handleRoleSwitch = (r) => {
        setRole(r);
        setPage("dashboard");
        localStorage.setItem("myges_role", r);
        localStorage.setItem("myges_page", "dashboard");
    };

    if (!role) return <Login onLogin={handleLogin} />;

    const allRoles = [
        { value: "etudiant", label: "Étudiant" },
        { value: "intervenant", label: "Intervenant" },
        { value: "scolarite", label: "Scolarité" },
        { value: "superadmin", label: "Super Admin" },
    ];

    const renderPage = () => {
        // ── Étudiant ──────────────────────────────────────────────────
        if (role === "etudiant") {
            switch (page) {
                case "dashboard":
                    return <DashboardEtudiant onNavigate={handleNavigate} />;
                case "planning":
                    return <PlanningEtudiant />;
                case "notes":
                    return <NotesEtudiant />;
                case "absences":
                    return <AbsencesEtudiant />;
                case "documents":
                    return <DocumentsEtudiantV2 />;
                case "messagerie":
                    return <Messagerie />;
                case "parametres":
                    return <Parametres role={role} />;
                default:
                    return <DashboardEtudiant onNavigate={handleNavigate} />;
            }
        }
        // ── Intervenant ───────────────────────────────────────────────
        if (role === "intervenant") {
            switch (page) {
                case "dashboard":
                    return <DashboardIntervenant onNavigate={handleNavigate} />;
                case "planning":
                    return <PlanningIntervenant />;
                case "notes":
                    return <SaisieNotes />;
                case "supports":
                    return <SupportsIntervenant />;
                case "messagerie":
                    return <Messagerie />;
                case "parametres":
                    return <Parametres role={role} />;
                default:
                    return <DashboardIntervenant onNavigate={handleNavigate} />;
            }
        }
        // ── Scolarité ─────────────────────────────────────────────────
        if (role === "scolarite") {
            switch (page) {
                case "dashboard":
                    return <DashboardScolarite onNavigate={handleNavigate} />;
                case "notes":
                    return <SupervisionNotes />;
                case "absences":
                    return <AbsencesEtudiant />;
                case "documents":
                    return <DocumentsEtudiantV2 />;
                case "messagerie":
                    return <Messagerie />;
                case "parametres":
                    return <Parametres role={role} />;
                default:
                    return <DashboardScolarite onNavigate={handleNavigate} />;
            }
        }
        // ── Super Admin ───────────────────────────────────────────────
        if (role === "superadmin") {
            switch (page) {
                case "dashboard":
                    return <DashboardSuperAdmin onNavigate={handleNavigate} />;
                case "securite":
                    return <DashboardSuperAdmin onNavigate={handleNavigate} />;
                case "gestion":
                    return <GestionUtilisateurs />;
                case "messagerie":
                    return <Messagerie />;
                case "parametres":
                    return <Parametres role={role} />;
                default:
                    return <DashboardSuperAdmin onNavigate={handleNavigate} />;
            }
        }
        return null;
    };

    const pageTitles = {
        dashboard: "Tableau de bord",
        planning: "Planning",
        notes: role === "intervenant" ? "Saisie des notes" : role === "scolarite" ? "Supervision des notes" : "Notes",
        absences: "Absences",
        documents: "Documents",
        messagerie: "Messagerie",
        securite: "Security & Audit",
        gestion: "Gestion Utilisateurs",
        supports: "Supports de cours",
        parametres: "Paramètres",
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F9FA" }}>
            <Sidebar role={role} currentPage={page} onNavigate={handleNavigate} onLogout={handleLogout} />
            <div style={{ flex: 1, marginLeft: 256, minWidth: 0 }}>
                <TopBar role={role} pageTitle={pageTitles[page]} onRoleSwitch={handleRoleSwitch} roles={allRoles} />
                <main
                    style={{ padding: "80px 28px 48px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}
                >
                    {renderPage()}
                </main>
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
