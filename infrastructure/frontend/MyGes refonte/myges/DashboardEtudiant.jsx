// Dashboard Étudiant Alternant
function DashboardEtudiant({ onNavigate }) {
    const week = ["LUN 16", "MAR 17", "MER 18", "JEU 19", "VEN 20"];
    const weekData = [
        {
            type: "COURS",
            color: "#001944",
            bg: "rgba(0,25,68,0.06)",
            border: "rgba(0,25,68,0.15)",
            title: "UX Design Advanced",
            lieu: "Campus 1 - S302",
            typeLabel: "PRÉSENTIEL",
        },
        {
            type: "REMOTE",
            color: "#002C6E",
            bg: "rgba(199,210,254,0.2)",
            border: "#C7D2FE",
            title: "Gestion de Projet Agile",
            lieu: "Teams Link",
            typeLabel: "DISTANCIEL",
        },
        {
            type: "PRO",
            color: "#7B2E12",
            bg: "rgba(255,219,208,0.2)",
            border: "#FFD4C2",
            title: "Accenture France",
            lieu: "Siège Paris",
            typeLabel: "ENTREPRISE",
        },
        {
            type: "PRO",
            color: "#7B2E12",
            bg: "rgba(255,219,208,0.2)",
            border: "#FFD4C2",
            title: "Accenture France",
            lieu: "Siège Paris",
            typeLabel: "ENTREPRISE",
        },
        {
            type: "PRO",
            color: "#7B2E12",
            bg: "rgba(255,219,208,0.2)",
            border: "#FFD4C2",
            title: "Accenture France",
            lieu: "Siège Paris",
            typeLabel: "ENTREPRISE",
        },
    ];

    const Card = ({ title, children, action, actionLabel, style = {} }) => (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: 24,
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                padding: "28px 28px",
                ...style,
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 18, color: "#001944" }}>{title}</div>
                {action && (
                    <button
                        onClick={action}
                        style={{
                            backgroundColor: "#002C6E",
                            color: "#B0C6FF",
                            border: "none",
                            borderRadius: 999,
                            padding: "6px 14px",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 11,
                            cursor: "pointer",
                        }}
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
            {children}
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div
                    style={{
                        fontFamily: "Manrope",
                        fontWeight: 800,
                        fontSize: 32,
                        color: "#001944",
                        letterSpacing: "-0.8px",
                        marginBottom: 6,
                    }}
                >
                    Bonjour, Lucas 👋
                </div>
                <div style={{ fontFamily: "Inter", fontSize: 15, color: "#64748B" }}>
                    Semaine 42 — Master Management de la Stratégie Digitale
                </div>
            </div>

            {/* Bento Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
                {/* Week Overview */}
                <Card title="Aperçu de la Semaine" style={{ padding: "28px" }}>
                    <div
                        style={{
                            fontFamily: "Inter",
                            fontSize: 12,
                            color: "#94A3B8",
                            marginTop: -12,
                            marginBottom: 16,
                        }}
                    >
                        Octobre 16 - Octobre 22
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                        {[
                            ["●", "#001944", "PRÉSENTIEL", "#E8EDF8"],
                            ["●", "#002C6E", "DISTANCIEL", "#EEF2FF"],
                            ["●", "#7B2E12", "ENTREPRISE", "#FFF3EE"],
                        ].map(([dot, col, label, bg]) => (
                            <div
                                key={label}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    backgroundColor: bg,
                                    borderRadius: 999,
                                    padding: "3px 10px",
                                }}
                            >
                                <span style={{ color: col, fontSize: 8 }}>●</span>
                                <span
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 10,
                                        color: col,
                                        letterSpacing: "0.8px",
                                    }}
                                >
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                        {week.map((day, i) => {
                            const d = weekData[i];
                            return (
                                <div
                                    key={day}
                                    style={{
                                        backgroundColor: d.bg,
                                        border: `1.5px solid ${d.border}`,
                                        borderRadius: 14,
                                        padding: "12px 10px",
                                        minHeight: 120,
                                    }}
                                >
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 10,
                                            color: "#94A3B8",
                                            letterSpacing: "0.5px",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {day}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 9,
                                            color: d.color,
                                            letterSpacing: "0.8px",
                                            marginBottom: 8,
                                            backgroundColor: "rgba(255,255,255,0.6)",
                                            borderRadius: 4,
                                            padding: "2px 5px",
                                            display: "inline-block",
                                        }}
                                    >
                                        {d.type}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 12,
                                            color: "#001944",
                                            lineHeight: 1.3,
                                            marginBottom: 12,
                                        }}
                                    >
                                        {d.title}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontSize: 10,
                                            color: "#94A3B8",
                                            marginTop: "auto",
                                        }}
                                    >
                                        {d.lieu}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Prochain cours */}
                    <div
                        style={{
                            backgroundColor: "#001944",
                            borderRadius: 24,
                            padding: "24px",
                            boxShadow: "0 8px 24px rgba(0,25,68,0.2)",
                            flex: 1,
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 16,
                                color: "#fff",
                                marginBottom: 20,
                            }}
                        >
                            Prochain cours
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                    border: "1px solid rgba(255,255,255,0.1)",
                                    borderRadius: 14,
                                    padding: "14px",
                                    backdropFilter: "blur(4px)",
                                }}
                            >
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 10,
                                        color: "#B0C6FF",
                                        letterSpacing: "1px",
                                        marginBottom: 8,
                                    }}
                                >
                                    DEMAIN, 09:00 - 12:30
                                </div>
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: "#fff",
                                        lineHeight: 1.3,
                                        marginBottom: 10,
                                    }}
                                >
                                    Architecture Cloud & DevOps
                                </div>
                                <div style={{ fontFamily: "Inter", fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                                    📍 Salle 504 - Labo Réseau
                                </div>
                            </div>
                            <div
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.04)",
                                    border: "1px solid rgba(255,255,255,0.05)",
                                    borderRadius: 14,
                                    padding: "14px",
                                }}
                            >
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 10,
                                        color: "#94A3B8",
                                        letterSpacing: "1px",
                                        marginBottom: 8,
                                    }}
                                >
                                    DEMAIN, 14:00 - 17:00
                                </div>
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: "#E2E8F0",
                                        lineHeight: 1.3,
                                        marginBottom: 10,
                                    }}
                                >
                                    Management des Risques IT
                                </div>
                                <div style={{ fontFamily: "Inter", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                                    👤 Mme. Sophie Girard
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assiduité */}
                    <div
                        style={{
                            backgroundColor: "#F3F4F5",
                            border: "1px solid rgba(226,232,240,0.5)",
                            borderRadius: 24,
                            padding: "20px 24px",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 12,
                                color: "#001944",
                                letterSpacing: "0.8px",
                                marginBottom: 16,
                                textTransform: "uppercase",
                            }}
                        >
                            Assiduité
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                            <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
                                <svg width="64" height="64" viewBox="0 0 64 64">
                                    <circle cx="32" cy="32" r="26" fill="none" stroke="#E2E8F0" strokeWidth="6" />
                                    <circle
                                        cx="32"
                                        cy="32"
                                        r="26"
                                        fill="none"
                                        stroke="#BA1A1A"
                                        strokeWidth="6"
                                        strokeDasharray={`${2 * Math.PI * 26 * 0.33} ${2 * Math.PI * 26 * 0.67}`}
                                        strokeDashoffset={2 * Math.PI * 26 * 0.25}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 18,
                                        color: "#001944",
                                    }}
                                >
                                    2
                                </div>
                            </div>
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <div
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            backgroundColor: "#4C616C",
                                            flexShrink: 0,
                                        }}
                                    />
                                    <span
                                        style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 12, color: "#191C1D" }}
                                    >
                                        4 Justifiées
                                    </span>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                    <div
                                        style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: "50%",
                                            backgroundColor: "#BA1A1A",
                                            flexShrink: 0,
                                        }}
                                    />
                                    <span
                                        style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 12, color: "#191C1D" }}
                                    >
                                        2 Injustifiées
                                    </span>
                                </div>
                                <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 10, color: "#BA1A1A" }}>
                                    Seuil critique: 10h
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20, marginBottom: 20 }}>
                {/* Notes & Evaluations */}
                <Card
                    title="Notes & Évaluations"
                    action={() => onNavigate("notes")}
                    actionLabel="Voir tout le bulletin"
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                padding: "12px",
                                borderRadius: 14,
                            }}
                        >
                            <div
                                style={{
                                    width: 52,
                                    height: 52,
                                    borderRadius: 12,
                                    backgroundColor: "rgba(0,25,68,0.06)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 20,
                                    color: "#001944",
                                    flexShrink: 0,
                                }}
                            >
                                16
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color: "#001944",
                                        marginBottom: 4,
                                    }}
                                >
                                    Stratégie Omnicanale
                                </div>
                                <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                                    Examen final - 12 Oct 2023
                                </div>
                            </div>
                            <div
                                style={{
                                    backgroundColor: "rgba(217,226,255,0.5)",
                                    borderRadius: 4,
                                    padding: "2px 8px",
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 10,
                                    color: "#002C6E",
                                }}
                            >
                                A-
                            </div>
                        </div>

                        <div
                            style={{
                                backgroundColor: "rgba(255,219,208,0.2)",
                                border: "1px solid rgb(255,219,208)",
                                borderRadius: 14,
                                padding: "20px",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                <span style={{ fontSize: 16 }}>⭐</span>
                                <span
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 11,
                                        color: "#7B2E12",
                                        letterSpacing: "1px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Appréciation Entreprise
                                </span>
                            </div>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 13,
                                    color: "#380B00",
                                    lineHeight: 1.6,
                                    marginBottom: 12,
                                }}
                            >
                                "Lucas fait preuve d'une excellente capacité d'adaptation sur les projets Cloud. Ses
                                initiatives sur l'optimisation des CI/CD sont très appréciées par l'équipe technique."
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 10,
                                        color: "rgba(123,46,18,0.6)",
                                    }}
                                >
                                    Tuteur: Jean-Marc Dupont (Accenture)
                                </span>
                                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 12, color: "#7B2E12" }}>
                                    4.8 / 5.0
                                </span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Documents & Contrat */}
                <Card title="Documents & Contrat">
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div
                            style={{
                                backgroundColor: "rgba(207,230,242,0.2)",
                                borderRadius: 14,
                                padding: "14px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    backgroundColor: "#CFE6F2",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                    flexShrink: 0,
                                }}
                            >
                                ✓
                            </div>
                            <div>
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color: "#001944",
                                        marginBottom: 2,
                                    }}
                                >
                                    Contrat d'alternance
                                </div>
                                <div style={{ fontFamily: "Inter", fontSize: 11, color: "#64748B" }}>
                                    Statut: Signé par les 3 parties
                                </div>
                            </div>
                        </div>

                        <div
                            style={{
                                backgroundColor: "rgba(255,218,214,0.2)",
                                border: "1px solid rgba(255,218,214,0.4)",
                                borderRadius: 14,
                                padding: "14px 16px",
                                display: "flex",
                                alignItems: "center",
                                gap: 14,
                            }}
                        >
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: "50%",
                                    backgroundColor: "#FFDAD6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                    flexShrink: 0,
                                }}
                            >
                                ⚠️
                            </div>
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color: "#BA1A1A",
                                        marginBottom: 2,
                                    }}
                                >
                                    Attestation de Responsabilité
                                </div>
                                <div style={{ fontFamily: "Inter", fontSize: 11, color: "rgba(186,26,26,0.7)" }}>
                                    Document manquant pour Q4
                                </div>
                            </div>
                            <button
                                style={{
                                    backgroundColor: "#BA1A1A",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 999,
                                    padding: "6px 14px",
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 11,
                                    cursor: "pointer",
                                    flexShrink: 0,
                                }}
                            >
                                Déposer
                            </button>
                        </div>

                        <div style={{ borderTop: "1px solid #F1F5F9", paddingTop: 14 }}>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 11,
                                    color: "#94A3B8",
                                    letterSpacing: "1px",
                                    marginBottom: 10,
                                    textTransform: "uppercase",
                                }}
                            >
                                Ressources Utiles
                            </div>
                            <div style={{ display: "flex", gap: 12 }}>
                                {["📄 Livret Alternant", "📋 Fiches de poste"].map((l) => (
                                    <div
                                        key={l}
                                        style={{
                                            fontFamily: "Inter",
                                            fontWeight: 500,
                                            fontSize: 12,
                                            color: "#191C1D",
                                            padding: "8px 12px",
                                            borderRadius: 10,
                                            border: "1px solid transparent",
                                            cursor: "pointer",
                                            backgroundColor: "#F8F9FA",
                                        }}
                                    >
                                        {l}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Stats footer */}
            <div
                style={{
                    backgroundColor: "rgba(225,227,228,0.4)",
                    border: "1px solid rgba(255,255,255,0.6)",
                    borderRadius: 24,
                    backdropFilter: "blur(24px)",
                    padding: "28px 60px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                }}
            >
                {[
                    { label: "Moyenne Générale", value: "14.82", suffix: "/20" },
                    { label: "Crédits ECTS", value: "120", suffix: "/180" },
                ].map((s, i) => (
                    <React.Fragment key={s.label}>
                        {i > 0 && <div style={{ width: 1, height: 40, backgroundColor: "rgba(203,213,225,0.4)" }} />}
                        <div style={{ textAlign: "center" }}>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 10,
                                    color: "#64748B",
                                    letterSpacing: "1px",
                                    textTransform: "uppercase",
                                    marginBottom: 6,
                                }}
                            >
                                {s.label}
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: "center" }}>
                                <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 24, color: "#001944" }}>
                                    {s.value}
                                </span>
                                <span
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 12,
                                        color: "rgba(0,25,68,0.4)",
                                    }}
                                >
                                    {s.suffix}
                                </span>
                            </div>
                        </div>
                    </React.Fragment>
                ))}
                <div style={{ width: 1, height: 40, backgroundColor: "rgba(203,213,225,0.4)" }} />
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 10,
                            color: "#64748B",
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            marginBottom: 8,
                        }}
                    >
                        Progression Année
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                            style={{
                                width: 120,
                                height: 8,
                                borderRadius: 999,
                                backgroundColor: "#E2E8F0",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{ width: "64%", height: "100%", borderRadius: 999, backgroundColor: "#001944" }}
                            />
                        </div>
                        <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14, color: "#001944" }}>
                            64%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

Object.assign(window, { DashboardEtudiant });
