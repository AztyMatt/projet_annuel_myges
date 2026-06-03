// Login / Role selection screen
function Login({ onLogin }) {
    const [selected, setSelected] = React.useState(null);
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const roles = [
        {
            value: "etudiant",
            label: "Étudiant / Alternant",
            icon: "🎓",
            desc: "Accès planning, notes, documents",
            color: "#001944",
        },
        {
            value: "intervenant",
            label: "Intervenant",
            icon: "👨‍🏫",
            desc: "Saisie notes, supports de cours",
            color: "#002C6E",
        },
        {
            value: "scolarite",
            label: "Administration Scolarité",
            icon: "🏛️",
            desc: "Gestion étudiants & absences",
            color: "#1a3a2a",
        },
        {
            value: "superadmin",
            label: "Super Administrateur",
            icon: "🔐",
            desc: "Accès système complet",
            color: "#3a1010",
        },
    ];

    const defaults = {
        etudiant: { email: "lucas.bernard@esgi.fr", password: "••••••••••••" },
        intervenant: { email: "j.dupont@esgi.fr", password: "••••••••••••" },
        scolarite: { email: "scolarite@esgi.fr", password: "••••••••••••" },
        superadmin: { email: "admin@esgi.fr", password: "••••••••••••" },
    };

    const handleSelect = (r) => {
        setSelected(r.value);
        setEmail(defaults[r.value].email);
        setPassword(defaults[r.value].password);
    };

    const handleLogin = () => {
        if (!selected) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onLogin(selected);
        }, 900);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "#001944",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
            }}
        >
            {/* background pattern */}
            <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                <div
                    style={{
                        position: "absolute",
                        top: -200,
                        right: -200,
                        width: 600,
                        height: 600,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(107,149,243,0.15) 0%, transparent 70%)",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        bottom: -200,
                        left: -100,
                        width: 500,
                        height: 500,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(49,46,129,0.2) 0%, transparent 70%)",
                    }}
                />
            </div>

            <div style={{ width: "100%", maxWidth: 480, position: "relative" }}>
                {/* Logo */}
                <div style={{ textAlign: "center", marginBottom: 40 }}>
                    <div
                        style={{
                            fontFamily: "Manrope",
                            fontWeight: 800,
                            fontSize: 32,
                            color: "#fff",
                            letterSpacing: "-1px",
                        }}
                    >
                        MYGES 2.0
                    </div>
                    <div
                        style={{
                            fontFamily: "Inter",
                            fontSize: 13,
                            color: "rgba(255,255,255,0.4)",
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                            marginTop: 4,
                        }}
                    >
                        Academic Portal
                    </div>
                </div>

                <div
                    style={{
                        backgroundColor: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 20,
                        padding: 32,
                        backdropFilter: "blur(12px)",
                    }}
                >
                    <div
                        style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 20, color: "#fff", marginBottom: 6 }}
                    >
                        Connexion
                    </div>
                    <div
                        style={{ fontFamily: "Inter", fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}
                    >
                        Sélectionnez votre profil pour accéder à la plateforme
                    </div>

                    {/* Role grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                        {roles.map((r) => (
                            <div
                                key={r.value}
                                onClick={() => handleSelect(r)}
                                style={{
                                    padding: "14px 16px",
                                    borderRadius: 12,
                                    cursor: "pointer",
                                    transition: "all 0.15s",
                                    border: `1.5px solid ${selected === r.value ? "#C7D2FE" : "rgba(255,255,255,0.1)"}`,
                                    backgroundColor:
                                        selected === r.value ? "rgba(199,210,254,0.12)" : "rgba(255,255,255,0.03)",
                                }}
                            >
                                <div style={{ fontSize: 20, marginBottom: 6 }}>{r.icon}</div>
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 600,
                                        fontSize: 13,
                                        color: selected === r.value ? "#C7D2FE" : "rgba(255,255,255,0.7)",
                                        marginBottom: 3,
                                    }}
                                >
                                    {r.label}
                                </div>
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 11,
                                        color: "rgba(255,255,255,0.3)",
                                        lineHeight: 1.4,
                                    }}
                                >
                                    {r.desc}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Fields */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                        <div>
                            <label
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.5)",
                                    display: "block",
                                    marginBottom: 6,
                                }}
                            >
                                Adresse email
                            </label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="prenom.nom@esgi.fr"
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    backgroundColor: "rgba(255,255,255,0.06)",
                                    color: "#fff",
                                    fontFamily: "Inter",
                                    fontSize: 13,
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                        </div>
                        <div>
                            <label
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 12,
                                    color: "rgba(255,255,255,0.5)",
                                    display: "block",
                                    marginBottom: 6,
                                }}
                            >
                                Mot de passe
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••••••"
                                style={{
                                    width: "100%",
                                    padding: "10px 14px",
                                    borderRadius: 10,
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    backgroundColor: "rgba(255,255,255,0.06)",
                                    color: "#fff",
                                    fontFamily: "Inter",
                                    fontSize: 13,
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                            />
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 11,
                                    color: "rgba(255,255,255,0.25)",
                                    marginTop: 6,
                                }}
                            >
                                ↺ Réinitialisation requise tous les 60 jours · 2FA activé
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={!selected || loading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: 999,
                            border: "none",
                            cursor: selected ? "pointer" : "not-allowed",
                            backgroundColor: selected ? "#002C6E" : "rgba(255,255,255,0.08)",
                            color: selected ? "#C7D2FE" : "rgba(255,255,255,0.3)",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 14,
                            letterSpacing: "0.3px",
                            transition: "all 0.15s",
                        }}
                    >
                        {loading ? "Connexion en cours…" : "Se connecter"}
                    </button>
                </div>

                <div
                    style={{
                        textAlign: "center",
                        marginTop: 20,
                        fontFamily: "Inter",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.2)",
                    }}
                >
                    ESGI — Prototype MyGES 2.0 · Données fictives
                </div>
            </div>
        </div>
    );
}

Object.assign(window, { Login });
