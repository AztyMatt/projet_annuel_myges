// Dashboard Intervenant — ergonomique et complet
function DashboardIntervenant({ onNavigate }) {
    const [dragOver, setDragOver] = React.useState(false);
    const [selectedCours, setSelectedCours] = React.useState(null);

    const cours = [
        {
            time: "09:00",
            end: "12:30",
            title: "Architecture Cloud & DevOps",
            students: 48,
            lieu: "Campus Eiffel I — Salle 304",
            type: "presentiel",
            module: "4ESGI-7",
        },
        {
            time: "14:00",
            end: "17:30",
            title: "Sécurité des Systèmes d'Information",
            students: 32,
            lieu: "Distanciel — Microsoft Teams",
            type: "distanciel",
            module: "4ESGI-8",
        },
    ];

    const rendus = [
        {
            title: "TP 02 — Déploiement Kubernetes",
            module: "Architecture Cloud",
            submitted: 24,
            total: 48,
            deadline: "18 Oct.",
            urgent: true,
        },
        {
            title: "Projet Annuel - Audit Sécu",
            module: "Cybersécurité",
            submitted: 8,
            total: 32,
            deadline: "05 Nov.",
            urgent: false,
        },
    ];

    const modules = [
        {
            code: "4ESGI-7",
            name: "Architecture Cloud",
            semester: "S1 — 2024/2025",
            icon: "<>",
            bg: "#EEF2FF",
            color: "#002C6E",
            students: 48,
        },
        {
            code: "4ESGI-8",
            name: "Cybersécurité Avancée",
            semester: "S1 — 2024/2025",
            icon: "🔒",
            bg: "#F0FDF4",
            color: "#16803C",
            students: 32,
        },
    ];

    const messages = [
        { name: "Lucas Martin", tag: "4ESGI-7", time: "12:45", text: "Question sur le TP Kubernetes...", unread: true },
        {
            name: "Sophie Bernard",
            tag: "4ESGI-8",
            time: "11:30",
            text: "Merci pour le cours de ce matin !",
            unread: false,
        },
    ];

    const CoursCard = ({ c }) => (
        <div
            style={{
                borderRadius: 16,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                cursor: "pointer",
                backgroundColor: c.type === "presentiel" ? "#001944" : "#FFF8F5",
                border: c.type === "distanciel" ? "2px dashed #FFD4C2" : "none",
                marginBottom: 10,
            }}
            onClick={() => setSelectedCours(c)}
        >
            <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div
                    style={{
                        fontFamily: "Manrope",
                        fontWeight: 800,
                        fontSize: 20,
                        color: c.type === "presentiel" ? "#C7D2FE" : "#001944",
                        lineHeight: 1,
                    }}
                >
                    {c.time}
                </div>
                <div
                    style={{
                        fontFamily: "Inter",
                        fontSize: 10,
                        color: c.type === "presentiel" ? "rgba(255,255,255,0.4)" : "#94A3B8",
                        marginTop: 2,
                    }}
                >
                    {c.end}
                </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 14,
                        color: c.type === "presentiel" ? "#fff" : "#001944",
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {c.title}
                </div>
                <div
                    style={{
                        fontFamily: "Inter",
                        fontSize: 11,
                        color: c.type === "presentiel" ? "rgba(255,255,255,0.5)" : "#94A3B8",
                    }}
                >
                    📍 {c.lieu}
                </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span
                    style={{
                        backgroundColor: c.type === "presentiel" ? "rgba(199,210,254,0.2)" : "#EEF2FF",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 11,
                        color: c.type === "presentiel" ? "#C7D2FE" : "#002C6E",
                    }}
                >
                    {c.students} ét.
                </span>
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={c.type === "presentiel" ? "rgba(255,255,255,0.4)" : "#94A3B8"}
                    strokeWidth="2"
                >
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </div>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: "Manrope",
                            fontWeight: 800,
                            fontSize: 28,
                            color: "#001944",
                            letterSpacing: "-0.6px",
                            marginBottom: 4,
                        }}
                    >
                        Bonjour, Dr. Dupont
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 14, color: "#64748B" }}>
                        Semaine du 14 au 18 Octobre — 4 séances planifiées
                    </div>
                </div>
                <button
                    onClick={() => onNavigate("supports")}
                    style={{
                        backgroundColor: "#001944",
                        color: "#C7D2FE",
                        border: "none",
                        borderRadius: 12,
                        padding: "11px 18px",
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    + Nouveau Support
                </button>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
                {[
                    {
                        label: "Cours aujourd'hui",
                        value: "2",
                        sub: "13h de séances",
                        icon: "📅",
                        bg: "#EEF2FF",
                        color: "#002C6E",
                    },
                    {
                        label: "Rendus en attente",
                        value: "32",
                        sub: "Échéance: 18 Oct.",
                        icon: "📋",
                        bg: "#FEF3C7",
                        color: "#92400E",
                    },
                    {
                        label: "Étudiants actifs",
                        value: "80",
                        sub: "2 modules",
                        icon: "👥",
                        bg: "#F0FDF4",
                        color: "#16803C",
                    },
                ].map((s, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: s.bg,
                            borderRadius: 14,
                            padding: "16px 18px",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <span style={{ fontSize: 22 }}>{s.icon}</span>
                        <div>
                            <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 24, color: s.color }}>
                                {s.value}
                            </div>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 10,
                                    color: s.color,
                                    opacity: 0.7,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                {s.label}
                            </div>
                            <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>{s.sub}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>
                {/* Left */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Planning du jour */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "20px 24px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 16,
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: "Manrope",
                                    fontWeight: 700,
                                    fontSize: 16,
                                    color: "#001944",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                📅 Planning de la journée
                            </div>
                            <span
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 10,
                                    color: "#94A3B8",
                                    letterSpacing: "1px",
                                    textTransform: "uppercase",
                                }}
                            >
                                Aujourd'hui
                            </span>
                        </div>
                        {cours.map((c, i) => (
                            <CoursCard key={i} c={c} />
                        ))}
                        <button
                            onClick={() => onNavigate("planning")}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: 10,
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#F8F9FA",
                                fontFamily: "Inter",
                                fontWeight: 600,
                                fontSize: 12,
                                color: "#001944",
                                cursor: "pointer",
                                marginTop: 4,
                            }}
                        >
                            Voir tout le planning →
                        </button>
                    </div>

                    {/* Modules actifs */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "20px 24px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 16,
                                color: "#001944",
                                marginBottom: 14,
                            }}
                        >
                            Modules Actifs
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            {modules.map((m, i) => (
                                <div
                                    key={i}
                                    style={{ border: "1px solid #F1F5F9", borderRadius: 14, padding: "14px 16px" }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "flex-start",
                                            marginBottom: 10,
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 10,
                                                backgroundColor: m.bg,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: 14,
                                                fontWeight: 700,
                                                color: m.color,
                                            }}
                                        >
                                            {m.icon}
                                        </div>
                                        <span style={{ fontFamily: "Inter", fontSize: 10, color: "#94A3B8" }}>
                                            {m.code}
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 13,
                                            color: "#001944",
                                            marginBottom: 2,
                                        }}
                                    >
                                        {m.name}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontSize: 11,
                                            color: "#94A3B8",
                                            marginBottom: 12,
                                        }}
                                    >
                                        {m.semester} · {m.students} ét.
                                    </div>
                                    <button
                                        onClick={() => onNavigate("notes")}
                                        style={{
                                            width: "100%",
                                            padding: "7px",
                                            borderRadius: 8,
                                            border: "1.5px solid #E2E8F0",
                                            backgroundColor: "#fff",
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 11,
                                            color: "#001944",
                                            cursor: "pointer",
                                        }}
                                    >
                                        ✏️ Saisie des notes
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Rendus à corriger */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "18px 20px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 15,
                                color: "#001944",
                                marginBottom: 14,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            📋 Rendus à corriger
                        </div>
                        {rendus.map((r, i) => (
                            <div
                                key={i}
                                style={{
                                    padding: "12px 0",
                                    borderBottom: i < rendus.length - 1 ? "1px solid #F1F5F9" : "none",
                                }}
                            >
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color: "#001944",
                                        marginBottom: 3,
                                    }}
                                >
                                    {r.title}
                                </div>
                                <div style={{ fontFamily: "Inter", fontSize: 11, color: "#64748B", marginBottom: 8 }}>
                                    {r.module}
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                        <span
                                            style={{
                                                fontFamily: "Manrope",
                                                fontWeight: 800,
                                                fontSize: 16,
                                                color: "#001944",
                                            }}
                                        >
                                            {r.submitted}
                                        </span>
                                        <span style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                                            /{r.total} soumis
                                        </span>
                                    </div>
                                    <span
                                        style={{
                                            fontFamily: "Inter",
                                            fontSize: 10,
                                            color: r.urgent ? "#BA1A1A" : "#94A3B8",
                                            fontWeight: r.urgent ? 700 : 400,
                                        }}
                                    >
                                        {r.urgent ? "⚠ " : ""}Échéance: {r.deadline}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        marginTop: 8,
                                        height: 4,
                                        backgroundColor: "#F1F5F9",
                                        borderRadius: 999,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: `${Math.round((r.submitted / r.total) * 100)}%`,
                                            height: "100%",
                                            backgroundColor: r.urgent ? "#BA1A1A" : "#001944",
                                            borderRadius: 999,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Supports */}
                    <div style={{ backgroundColor: "#001944", borderRadius: 20, padding: "18px 20px" }}>
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 15,
                                color: "#fff",
                                marginBottom: 12,
                            }}
                        >
                            ☁️ Supports de cours
                        </div>
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setDragOver(false);
                            }}
                            style={{
                                border: `2px dashed ${dragOver ? "#C7D2FE" : "rgba(255,255,255,0.2)"}`,
                                borderRadius: 12,
                                padding: "16px",
                                textAlign: "center",
                                cursor: "pointer",
                                marginBottom: 10,
                            }}
                        >
                            <div style={{ fontSize: 22, marginBottom: 6 }}>📤</div>
                            <div style={{ fontFamily: "Inter", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                                Glisser PDF, PPT ou ZIP
                            </div>
                        </div>
                        <button
                            onClick={() => onNavigate("supports")}
                            style={{
                                width: "100%",
                                padding: "9px",
                                borderRadius: 10,
                                border: "1px solid rgba(255,255,255,0.15)",
                                backgroundColor: "rgba(255,255,255,0.08)",
                                color: "#C7D2FE",
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 11,
                                cursor: "pointer",
                                letterSpacing: "0.3px",
                            }}
                        >
                            Gérer les supports →
                        </button>
                    </div>

                    {/* Messagerie */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "18px 20px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 12,
                            }}
                        >
                            <span style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 15, color: "#001944" }}>
                                💬 Messagerie
                            </span>
                            <button
                                onClick={() => onNavigate("messagerie")}
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 11,
                                    color: "#6B95F3",
                                    border: "none",
                                    background: "none",
                                    cursor: "pointer",
                                }}
                            >
                                Tout voir →
                            </button>
                        </div>
                        {messages.map((m, i) => (
                            <div
                                key={i}
                                onClick={() => onNavigate("messagerie")}
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    padding: "8px 0",
                                    borderBottom: "1px solid #F8F9FA",
                                    cursor: "pointer",
                                }}
                            >
                                <div
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: "50%",
                                        backgroundColor: "#002C6E",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 10,
                                        color: "#C7D2FE",
                                        flexShrink: 0,
                                    }}
                                >
                                    {m.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 12,
                                                color: "#001944",
                                            }}
                                        >
                                            {m.name}
                                        </span>
                                        {m.unread && (
                                            <div
                                                style={{
                                                    width: 7,
                                                    height: 7,
                                                    borderRadius: "50%",
                                                    backgroundColor: "#BA1A1A",
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontSize: 11,
                                            color: "#94A3B8",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {m.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => onNavigate("messagerie")}
                            style={{
                                width: "100%",
                                marginTop: 10,
                                padding: "8px",
                                borderRadius: 8,
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#fff",
                                fontFamily: "Inter",
                                fontWeight: 600,
                                fontSize: 11,
                                color: "#001944",
                                cursor: "pointer",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Accéder au chat de classe
                        </button>
                    </div>
                </div>
            </div>

            {/* Cours detail modal */}
            {selectedCours && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 500,
                    }}
                    onClick={() => setSelectedCours(null)}
                >
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: 28,
                            width: 440,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 20,
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontFamily: "Manrope",
                                        fontWeight: 700,
                                        fontSize: 18,
                                        color: "#001944",
                                        marginBottom: 4,
                                    }}
                                >
                                    {selectedCours.title}
                                </div>
                                <div style={{ fontFamily: "Inter", fontSize: 13, color: "#64748B" }}>
                                    {selectedCours.module}
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedCours(null)}
                                style={{
                                    border: "none",
                                    background: "none",
                                    fontSize: 20,
                                    color: "#94A3B8",
                                    cursor: "pointer",
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
                            {[
                                ["🕐 Horaire", `${selectedCours.time} — ${selectedCours.end}`],
                                ["📍 Lieu", selectedCours.lieu],
                                ["👥 Étudiants", `${selectedCours.students} inscrits`],
                                ["📡 Format", selectedCours.type === "presentiel" ? "Présentiel" : "Distanciel"],
                            ].map(([k, v]) => (
                                <div
                                    key={k}
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        padding: "10px 14px",
                                        backgroundColor: "#F8F9FA",
                                        borderRadius: 10,
                                    }}
                                >
                                    <span
                                        style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 13, color: "#64748B" }}
                                    >
                                        {k}
                                    </span>
                                    <span style={{ fontFamily: "Inter", fontSize: 13, color: "#001944" }}>{v}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => {
                                    setSelectedCours(null);
                                    onNavigate("notes");
                                }}
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: 10,
                                    border: "none",
                                    backgroundColor: "#001944",
                                    color: "#C7D2FE",
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    cursor: "pointer",
                                }}
                            >
                                ✏️ Saisir les notes
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedCours(null);
                                    onNavigate("supports");
                                }}
                                style={{
                                    flex: 1,
                                    padding: "10px",
                                    borderRadius: 10,
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#fff",
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 12,
                                    color: "#001944",
                                    cursor: "pointer",
                                }}
                            >
                                📚 Supports
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

Object.assign(window, { DashboardIntervenant });
