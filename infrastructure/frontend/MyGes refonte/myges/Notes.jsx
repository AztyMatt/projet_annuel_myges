// Notes Étudiant
function NotesEtudiant() {
    const modules = [
        {
            name: "Algorithmique Avancée",
            prof: "Prof. Marc Antoine",
            credits: 6,
            note: 18.5,
            appreciation: "Excellente maîtrise des structures de données et de la complexité.",
            type: "ACADÉMIQUE",
            typeColor: "#002C6E",
            typeBg: "#EEF2FF",
        },
        {
            name: "Projet Professionnel — Sprint 1",
            prof: "Tuteur : Sarah L.",
            credits: 10,
            note: 17.0,
            appreciation: "Capacité d'adaptation remarquable aux process Agile de l'équipe.",
            type: "ENTREPRISE",
            typeColor: "#7B2E12",
            typeBg: "#FFF3EE",
        },
        {
            name: "Architecture Cloud & DevOps",
            prof: "Prof. Elena V.",
            credits: 4,
            note: 14.0,
            appreciation: "Bonne compréhension de Kubernetes, attention aux coûts cloud.",
            type: "ACADÉMIQUE",
            typeColor: "#002C6E",
            typeBg: "#EEF2FF",
        },
        {
            name: "Soft Skills & Communication",
            prof: "RH : Damien M.",
            credits: 2,
            note: 16.0,
            appreciation: "Prise de parole en public efficace lors des démos client.",
            type: "ENTREPRISE",
            typeColor: "#7B2E12",
            typeBg: "#FFF3EE",
        },
        {
            name: "Cybersécurité Avancée",
            prof: "Prof. Laurent B.",
            credits: 5,
            note: 15.5,
            appreciation: "Bons fondamentaux en pentest, aller plus loin sur la cryptographie.",
            type: "ACADÉMIQUE",
            typeColor: "#002C6E",
            typeBg: "#EEF2FF",
        },
        {
            name: "Stratégie Omnicanale",
            prof: "Prof. Marie C.",
            credits: 4,
            note: 16.0,
            appreciation: "Excellent travail de groupe et présentation finale très convaincante.",
            type: "ACADÉMIQUE",
            typeColor: "#002C6E",
            typeBg: "#EEF2FF",
        },
    ];

    const noteColor = (n) => (n >= 16 ? "#16803C" : n >= 12 ? "#001944" : "#BA1A1A");
    const noteBg = (n) => (n >= 16 ? "#DCFCE7" : n >= 12 ? "rgba(0,25,68,0.06)" : "#FEE2E2");

    const moyenne = (
        modules.reduce((a, m) => a + m.note * m.credits, 0) / modules.reduce((a, m) => a + m.credits, 0)
    ).toFixed(2);
    const totalCredits = modules.reduce((a, m) => a + m.credits, 0);

    return (
        <div>
            {/* KPI bar */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
                <div
                    style={{
                        backgroundColor: "#fff",
                        border: "1.5px solid #001944",
                        borderRadius: 14,
                        padding: "24px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                >
                    <div
                        style={{
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 11,
                            color: "#767683",
                            letterSpacing: "1.2px",
                            textTransform: "uppercase",
                            marginBottom: 8,
                        }}
                    >
                        Moyenne Générale
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 36, color: "#001944" }}>
                            {moyenne}
                        </span>
                        <span style={{ fontFamily: "Inter", fontSize: 14, color: "rgba(0,25,68,0.4)" }}>/20</span>
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 12, color: "#16803C", marginTop: 6 }}>
                        ↑ +0.5 ce semestre
                    </div>
                </div>

                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 14,
                        padding: "24px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        border: "1px solid #F1F5F9",
                    }}
                >
                    <div
                        style={{
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 11,
                            color: "#767683",
                            letterSpacing: "1.2px",
                            textTransform: "uppercase",
                            marginBottom: 8,
                        }}
                    >
                        Crédits ECTS
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 36, color: "#001944" }}>
                            144
                        </span>
                        <span style={{ fontFamily: "Inter", fontSize: 14, color: "rgba(0,25,68,0.4)" }}>/180</span>
                    </div>
                    <div
                        style={{
                            marginTop: 12,
                            height: 6,
                            backgroundColor: "#E2E8F0",
                            borderRadius: 999,
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ width: "80%", height: "100%", backgroundColor: "#001944", borderRadius: 999 }} />
                    </div>
                </div>

                <div
                    style={{
                        backgroundColor: "#001944",
                        borderRadius: 14,
                        padding: "24px",
                        boxShadow: "0 4px 16px rgba(0,25,68,0.2)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 11,
                            color: "rgba(255,255,255,0.5)",
                            letterSpacing: "1.2px",
                            textTransform: "uppercase",
                            marginBottom: 8,
                        }}
                    >
                        Appréciation Entreprise
                    </div>
                    <div
                        style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 24, color: "#fff", marginBottom: 8 }}
                    >
                        Excellent ★★★★½
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>
                        "Une excellente intégration technique. Lucas fait preuve d'une grande autonomie."
                    </div>
                    <div style={{ position: "absolute", right: 16, top: 16, opacity: 0.1 }}>
                        <svg width="60" height="60" viewBox="0 0 24 24" fill="#fff">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Prochaine évaluation */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, marginBottom: 20 }}>
                {/* Chart placeholder */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 20,
                        padding: "28px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 20,
                        }}
                    >
                        <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 18, color: "#001944" }}>
                            Progression Annuelle
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                            {[
                                ["#001944", "ACADÉMIQUE"],
                                ["#6B95F3", "ENTREPRISE"],
                            ].map(([c, l]) => (
                                <div key={l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: c }} />
                                    <span
                                        style={{
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 10,
                                            color: "#64748B",
                                            letterSpacing: "0.5px",
                                        }}
                                    >
                                        {l}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* SVG Chart */}
                    <svg width="100%" height="160" viewBox="0 0 500 160" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#001944" stopOpacity="0.1" />
                                <stop offset="100%" stopColor="#001944" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M0,120 C50,110 100,100 150,95 C200,90 250,80 300,70 C350,60 400,55 500,45"
                            fill="none"
                            stroke="#001944"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        />
                        <path
                            d="M0,130 C50,120 100,115 150,105 C200,100 250,90 300,88 C350,85 400,78 500,65"
                            fill="none"
                            stroke="#6B95F3"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeDasharray="5,3"
                        />
                        {[150, 250, 300, 500].map((x, i) => (
                            <circle key={i} cx={x} cy={[95, 80, 70, 45][i]} r="4" fill="#001944" />
                        ))}
                        {["SEPT", "NOV", "JAN", "MAR", "MAI", "JUIL"].map((m, i) => (
                            <text key={m} x={i * 100} y="158" fontFamily="Inter" fontSize="10" fill="#94A3B8">
                                {m}
                            </text>
                        ))}
                    </svg>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div
                        style={{
                            backgroundColor: "#7B2E12",
                            borderRadius: 20,
                            padding: "24px",
                            boxShadow: "0 4px 16px rgba(123,46,18,0.2)",
                            flex: 1,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 16,
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 11,
                                    color: "rgba(255,255,255,0.6)",
                                    letterSpacing: "1px",
                                    textTransform: "uppercase",
                                }}
                            >
                                Prochaine Évaluation
                            </div>
                            <span style={{ fontSize: 16 }}>📅</span>
                        </div>
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 18,
                                color: "#fff",
                                marginBottom: 8,
                            }}
                        >
                            Soutenance de Stage
                        </div>
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontSize: 12,
                                color: "rgba(255,255,255,0.7)",
                                lineHeight: 1.5,
                                marginBottom: 16,
                            }}
                        >
                            Préparation du rapport final et présentation devant le jury académique.
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                            <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 32, color: "#fff" }}>
                                12
                            </span>
                            <div>
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 9,
                                        color: "rgba(255,255,255,0.7)",
                                        letterSpacing: "0.8px",
                                    }}
                                >
                                    JOURS
                                </div>
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 9,
                                        color: "rgba(255,255,255,0.7)",
                                        letterSpacing: "0.8px",
                                    }}
                                >
                                    RESTANTS
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            backgroundColor: "#F8F9FA",
                            border: "1px solid #E2E8F0",
                            borderRadius: 20,
                            padding: "20px",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 10,
                                color: "#94A3B8",
                                letterSpacing: "1.2px",
                                textTransform: "uppercase",
                                marginBottom: 10,
                            }}
                        >
                            Statut Alternance
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "50%",
                                    backgroundColor: "#DCFCE7",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                ✓
                            </div>
                            <div>
                                <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14, color: "#001944" }}>
                                    Contrat Validé
                                </div>
                                <div style={{ fontFamily: "Inter", fontSize: 12, color: "#64748B" }}>
                                    Période 2023-2024
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Module table */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        padding: "24px 28px",
                        borderBottom: "1px solid #F1F5F9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
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
                            Détail des Modules
                        </div>
                        <div style={{ fontFamily: "Inter", fontSize: 13, color: "#94A3B8" }}>
                            Semestre 2 — Parcours Ingénierie Web
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 16px",
                                borderRadius: 10,
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#fff",
                                fontFamily: "Inter",
                                fontWeight: 600,
                                fontSize: 12,
                                color: "#374151",
                                cursor: "pointer",
                            }}
                        >
                            ≡ Filtrer
                        </button>
                        <button
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "8px 16px",
                                borderRadius: 10,
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#fff",
                                fontFamily: "Inter",
                                fontWeight: 600,
                                fontSize: 12,
                                color: "#374151",
                                cursor: "pointer",
                            }}
                        >
                            ↓ Exporter
                        </button>
                    </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#F8F9FA" }}>
                            {["MODULE", "CRÉDITS", "NOTE /20", "APPRÉCIATION", "TYPE"].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        padding: "12px 20px",
                                        textAlign: "left",
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 11,
                                        color: "#94A3B8",
                                        letterSpacing: "0.8px",
                                    }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {modules.map((m, i) => (
                            <tr
                                key={i}
                                style={{ borderTop: "1px solid #F1F5F9" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <td style={{ padding: "16px 20px" }}>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 13,
                                            color: "#001944",
                                            marginBottom: 3,
                                        }}
                                    >
                                        {m.name}
                                    </div>
                                    <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>{m.prof}</div>
                                </td>
                                <td
                                    style={{
                                        padding: "16px 20px",
                                        fontFamily: "Inter",
                                        fontWeight: 600,
                                        fontSize: 13,
                                        color: "#374151",
                                    }}
                                >
                                    {m.credits}
                                </td>
                                <td style={{ padding: "16px 20px" }}>
                                    <div
                                        style={{
                                            display: "inline-flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: 44,
                                            height: 28,
                                            borderRadius: 8,
                                            backgroundColor: noteBg(m.note),
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: noteColor(m.note),
                                        }}
                                    >
                                        {m.note}
                                    </div>
                                </td>
                                <td
                                    style={{
                                        padding: "16px 20px",
                                        fontFamily: "Inter",
                                        fontSize: 12,
                                        color: "#64748B",
                                        maxWidth: 280,
                                    }}
                                >
                                    {m.appreciation}
                                </td>
                                <td style={{ padding: "16px 20px" }}>
                                    <div
                                        style={{
                                            display: "inline-block",
                                            backgroundColor: m.typeBg,
                                            borderRadius: 6,
                                            padding: "3px 10px",
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 10,
                                            color: m.typeColor,
                                            letterSpacing: "0.5px",
                                        }}
                                    >
                                        {m.type}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

Object.assign(window, { NotesEtudiant });
