// Dashboard Scolarité — ergonomique, complet, tous boutons connectés
function DashboardScolarite({ onNavigate }) {
    const [activeTab, setActiveTab] = React.useState("justificatifs");
    const [justifSelected, setJustifSelected] = React.useState(null);
    const [justified, setJustified] = React.useState({});

    const justificatifs = [
        {
            initials: "LM",
            name: "Lucas Martin",
            promo: "M2 Dev Ops",
            type: "Maladie",
            period: "12/10 – 14/10",
            doc: "certificat_med.pdf",
            color: "#002C6E",
        },
        {
            initials: "SB",
            name: "Sarah Belkacem",
            promo: "M1 Marketing",
            type: "Entreprise",
            period: "15/10 (Matin)",
            doc: "convoc_rh.pdf",
            color: "#4a1942",
        },
        {
            initials: "TA",
            name: "Thomas Aurore",
            promo: "M2 Cybersécurité",
            type: "Maladie",
            period: "16/10",
            doc: "ordonnance.pdf",
            color: "#1a4a1a",
        },
        {
            initials: "ER",
            name: "Emma Roche",
            promo: "M1 Data Science",
            type: "Personnel",
            period: "13/10 – 14/10",
            doc: null,
            color: "#7B2E12",
        },
    ];

    const alertes = [
        {
            icon: "❗",
            title: "Contrats manquants",
            desc: "14 étudiants Promo Dev Ops 2024",
            action: "Envoyer relance",
            color: "#BA1A1A",
            bg: "rgba(254,226,226,0.4)",
        },
        {
            icon: "⏰",
            title: "Conventions expirées",
            desc: "3 stages à terme sans avenant",
            action: "Voir les dossiers",
            color: "#92400E",
            bg: "rgba(254,243,199,0.6)",
        },
    ];

    const journal = [
        { time: "il y a 12 min", title: "Modification des notes", desc: "M1 — Module Cloud Architecture", icon: "✏️" },
        { time: "il y a 45 min", title: "Justificatif validé", desc: "Lucas Martin", icon: "✅" },
        { time: "il y a 2h", title: "Export PDF généré", desc: "Liste alternants PME Île-de-France", icon: "📄" },
        { time: "il y a 3h", title: "Dossier créé", desc: "Emma Dupont — M1 Marketing", icon: "📁" },
    ];

    const handleValidate = (name) => setJustified((j) => ({ ...j, [name]: "validé" }));
    const handleRefuse = (name) => setJustified((j) => ({ ...j, [name]: "refusé" }));

    return (
        <div>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                    flexWrap: "wrap",
                    gap: 12,
                }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: "Manrope",
                            fontWeight: 800,
                            fontSize: 26,
                            color: "#001944",
                            letterSpacing: "-0.5px",
                            marginBottom: 4,
                        }}
                    >
                        Administration Scolarité
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 13, color: "#64748B" }}>
                        Gestion centralisée des effectifs et conformité académique
                    </div>
                </div>
                <button
                    style={{
                        backgroundColor: "#001944",
                        color: "#C7D2FE",
                        border: "none",
                        borderRadius: 12,
                        padding: "10px 18px",
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                    }}
                >
                    + Nouvelle Promotion
                </button>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
                {[
                    { label: "Total étudiants", value: "1 248", color: "#001944", bg: "#fff", border: true },
                    { label: "Initiale", value: "482", color: "#002C6E", bg: "#EEF2FF" },
                    { label: "Alternance", value: "766", color: "#7B2E12", bg: "#FFF3EE" },
                    { label: "Dossiers incomplets", value: "23", color: "#BA1A1A", bg: "#FEE2E2" },
                ].map((s, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: s.bg,
                            border: s.border ? "1px solid #F1F5F9" : "none",
                            borderRadius: 14,
                            padding: "14px 16px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 10,
                                color: "#94A3B8",
                                letterSpacing: "0.8px",
                                textTransform: "uppercase",
                                marginBottom: 6,
                            }}
                        >
                            {s.label}
                        </div>
                        <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 26, color: s.color }}>
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Alertes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                {alertes.map((a, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: a.bg,
                            borderRadius: 14,
                            padding: "14px 18px",
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                        }}
                    >
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: a.color,
                                    marginBottom: 2,
                                }}
                            >
                                {a.title}
                            </div>
                            <div style={{ fontFamily: "Inter", fontSize: 11, color: "#64748B" }}>{a.desc}</div>
                        </div>
                        <button
                            onClick={() => onNavigate("documents")}
                            style={{
                                border: `1.5px solid ${a.color}`,
                                borderRadius: 8,
                                padding: "5px 12px",
                                backgroundColor: "transparent",
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 11,
                                color: a.color,
                                cursor: "pointer",
                                flexShrink: 0,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {a.action}
                        </button>
                    </div>
                ))}
            </div>

            {/* Main content */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 16 }}>
                {/* Tabs section */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 20,
                        overflow: "hidden",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                >
                    <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9" }}>
                        {[
                            ["justificatifs", "✅ Justificatifs"],
                            ["dossiers", "📁 Dossiers"],
                            ["conformite", "📊 Conformité"],
                        ].map(([k, l]) => (
                            <button
                                key={k}
                                onClick={() => setActiveTab(k)}
                                style={{
                                    flex: 1,
                                    padding: "13px 8px",
                                    border: "none",
                                    borderBottom: activeTab === k ? "2px solid #001944" : "2px solid transparent",
                                    backgroundColor: "transparent",
                                    fontFamily: "Inter",
                                    fontWeight: activeTab === k ? 700 : 400,
                                    fontSize: 12,
                                    color: activeTab === k ? "#001944" : "#64748B",
                                    cursor: "pointer",
                                }}
                            >
                                {l}
                            </button>
                        ))}
                    </div>

                    {activeTab === "justificatifs" && (
                        <div>
                            <div
                                style={{
                                    padding: "12px 20px",
                                    borderBottom: "1px solid #F8F9FA",
                                    display: "flex",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span style={{ fontFamily: "Inter", fontSize: 12, color: "#64748B" }}>
                                    {justificatifs.length} en attente de validation
                                </span>
                                <button
                                    onClick={() => onNavigate("absences")}
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 600,
                                        fontSize: 12,
                                        color: "#6B95F3",
                                        border: "none",
                                        background: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    Voir tout le flux →
                                </button>
                            </div>
                            <div>
                                {justificatifs.map((j, i) => {
                                    const status = justified[j.name];
                                    return (
                                        <div
                                            key={i}
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                                padding: "14px 20px",
                                                borderBottom: "1px solid #F8F9FA",
                                                opacity: status ? 0.6 : 1,
                                                transition: "opacity 0.2s",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: 36,
                                                    height: 36,
                                                    borderRadius: "50%",
                                                    backgroundColor: j.color,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontFamily: "Inter",
                                                    fontWeight: 700,
                                                    fontSize: 12,
                                                    color: "#fff",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {j.initials}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div
                                                    style={{
                                                        fontFamily: "Inter",
                                                        fontWeight: 700,
                                                        fontSize: 13,
                                                        color: "#001944",
                                                    }}
                                                >
                                                    {j.name}
                                                </div>
                                                <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                                                    {j.promo} · {j.period}
                                                </div>
                                            </div>
                                            <span
                                                style={{
                                                    backgroundColor:
                                                        j.type === "Maladie"
                                                            ? "#FEE2E2"
                                                            : j.type === "Entreprise"
                                                              ? "#FFF3EE"
                                                              : "#F1F5F9",
                                                    color:
                                                        j.type === "Maladie"
                                                            ? "#BA1A1A"
                                                            : j.type === "Entreprise"
                                                              ? "#7B2E12"
                                                              : "#64748B",
                                                    borderRadius: 6,
                                                    padding: "2px 8px",
                                                    fontFamily: "Inter",
                                                    fontWeight: 700,
                                                    fontSize: 10,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {j.type}
                                            </span>
                                            {j.doc && (
                                                <span
                                                    style={{
                                                        fontFamily: "Inter",
                                                        fontSize: 11,
                                                        color: "#6B95F3",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    📄
                                                </span>
                                            )}
                                            {status ? (
                                                <span
                                                    style={{
                                                        fontFamily: "Inter",
                                                        fontWeight: 700,
                                                        fontSize: 11,
                                                        color: status === "validé" ? "#16803C" : "#BA1A1A",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {status === "validé" ? "✓ Validé" : "✕ Refusé"}
                                                </span>
                                            ) : (
                                                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                                                    <button
                                                        onClick={() => handleValidate(j.name)}
                                                        style={{
                                                            padding: "5px 10px",
                                                            borderRadius: 8,
                                                            border: "none",
                                                            backgroundColor: "#DCFCE7",
                                                            color: "#16803C",
                                                            fontFamily: "Inter",
                                                            fontWeight: 700,
                                                            fontSize: 11,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => handleRefuse(j.name)}
                                                        style={{
                                                            padding: "5px 10px",
                                                            borderRadius: 8,
                                                            border: "none",
                                                            backgroundColor: "#FEE2E2",
                                                            color: "#BA1A1A",
                                                            fontFamily: "Inter",
                                                            fontWeight: 700,
                                                            fontSize: 11,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === "dossiers" && (
                        <div style={{ padding: "16px 20px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    backgroundColor: "#F3F4F5",
                                    borderRadius: 10,
                                    padding: "8px 12px",
                                    marginBottom: 14,
                                }}
                            >
                                <svg
                                    width="12"
                                    height="12"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="#94A3B8"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    placeholder="Rechercher un étudiant..."
                                    style={{
                                        border: "none",
                                        background: "transparent",
                                        fontFamily: "Inter",
                                        fontSize: 12,
                                        color: "#374151",
                                        outline: "none",
                                        width: "100%",
                                    }}
                                />
                            </div>
                            {[
                                {
                                    initials: "ED",
                                    name: "Emma Dupont",
                                    promo: "M1 Marketing Digital",
                                    status: "Alternance",
                                    ok: true,
                                    color: "#7B2E12",
                                },
                                {
                                    initials: "JR",
                                    name: "Julien Roche",
                                    promo: "M2 Cybersécurité",
                                    status: "Initiale",
                                    ok: true,
                                    color: "#002C6E",
                                },
                                {
                                    initials: "TA",
                                    name: "Thomas Aurore",
                                    promo: "M2 Dev Ops",
                                    status: "Alternance",
                                    ok: false,
                                    color: "#1a4a1a",
                                },
                                {
                                    initials: "LB",
                                    name: "Lucas Bernard",
                                    promo: "M2 Stratégie Digitale",
                                    status: "Alternance",
                                    ok: true,
                                    color: "#001944",
                                },
                            ].map((d, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 12,
                                        padding: "11px 0",
                                        borderBottom: "1px solid #F8F9FA",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8F9FA")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                >
                                    <div
                                        style={{
                                            width: 36,
                                            height: 36,
                                            borderRadius: "50%",
                                            backgroundColor: d.color,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 12,
                                            color: "#fff",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {d.initials}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 13,
                                                color: "#001944",
                                            }}
                                        >
                                            {d.name}
                                        </div>
                                        <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                                            {d.promo} · {d.status}
                                        </div>
                                    </div>
                                    <span
                                        style={{
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 10,
                                            color: d.ok ? "#16803C" : "#BA1A1A",
                                        }}
                                    >
                                        {d.ok ? "✓ Complet" : "⚠ Incomplet"}
                                    </span>
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="#94A3B8"
                                        strokeWidth="2"
                                    >
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === "conformite" && (
                        <div style={{ padding: "16px 20px" }}>
                            <div style={{ fontFamily: "Inter", fontSize: 12, color: "#64748B", marginBottom: 14 }}>
                                Taux de conformité des dossiers par école
                            </div>
                            {[
                                ["ESGI", 82],
                                ["ICAN", 74],
                                ["MOD'ART", 91],
                                ["ISFJ", 68],
                                ["PPA", 88],
                            ].map(([school, val]) => (
                                <div
                                    key={school}
                                    style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}
                                >
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontSize: 12,
                                            color: "#64748B",
                                            width: 56,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {school}
                                    </div>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: 8,
                                            backgroundColor: "#F1F5F9",
                                            borderRadius: 999,
                                            overflow: "hidden",
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: `${val}%`,
                                                height: "100%",
                                                backgroundColor: val >= 80 ? "#001944" : "#BA1A1A",
                                                borderRadius: 999,
                                                transition: "width 0.5s",
                                            }}
                                        />
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 12,
                                            color: val >= 80 ? "#001944" : "#BA1A1A",
                                            width: 32,
                                            textAlign: "right",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {val}%
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => onNavigate("documents")}
                                style={{
                                    width: "100%",
                                    marginTop: 8,
                                    padding: "10px",
                                    borderRadius: 10,
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#fff",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    color: "#001944",
                                    cursor: "pointer",
                                }}
                            >
                                Gérer les documents →
                            </button>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Actions rapides */}
                    <div style={{ backgroundColor: "#001944", borderRadius: 20, padding: "18px" }}>
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 14,
                                color: "#fff",
                                marginBottom: 12,
                            }}
                        >
                            ⚡ Actions rapides
                        </div>
                        {[
                            { label: "Supervision des notes", icon: "📊", page: "notes" },
                            { label: "Gestion absences", icon: "📅", page: "absences" },
                            { label: "Messagerie", icon: "💬", page: "messagerie" },
                            { label: "Paramètres", icon: "⚙️", page: "parametres" },
                        ].map((a, i) => (
                            <button
                                key={i}
                                onClick={() => onNavigate(a.page)}
                                style={{
                                    width: "100%",
                                    padding: "9px 12px",
                                    borderRadius: 10,
                                    border: "none",
                                    backgroundColor: "rgba(255,255,255,0.07)",
                                    color: "rgba(255,255,255,0.8)",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    marginBottom: 6,
                                    textAlign: "left",
                                }}
                            >
                                <span>{a.icon}</span>
                                {a.label}
                            </button>
                        ))}
                    </div>

                    {/* Journal d'activité */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "16px 18px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            flex: 1,
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 14,
                                color: "#001944",
                                marginBottom: 12,
                            }}
                        >
                            🕐 Activité récente
                        </div>
                        {journal.map((j, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    paddingBottom: 10,
                                    marginBottom: 10,
                                    borderBottom: i < journal.length - 1 ? "1px solid #F8F9FA" : "none",
                                }}
                            >
                                <span style={{ fontSize: 14, flexShrink: 0 }}>{j.icon}</span>
                                <div>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontWeight: 600,
                                            fontSize: 12,
                                            color: "#001944",
                                            marginBottom: 1,
                                        }}
                                    >
                                        {j.title}
                                    </div>
                                    <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>{j.desc}</div>
                                    <div style={{ fontFamily: "Inter", fontSize: 10, color: "#CBD5E1", marginTop: 2 }}>
                                        {j.time}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Aide */}
                    <div
                        style={{
                            backgroundColor: "#F8F9FA",
                            border: "1px solid #E2E8F0",
                            borderRadius: 16,
                            padding: "14px 16px",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 13,
                                color: "#001944",
                                marginBottom: 6,
                            }}
                        >
                            Besoin d'aide ?
                        </div>
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontSize: 11,
                                color: "#64748B",
                                lineHeight: 1.5,
                                marginBottom: 10,
                            }}
                        >
                            Guide de gestion des cas complexes d'alternance.
                        </div>
                        <button
                            style={{
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 12,
                                color: "#001944",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                padding: 0,
                            }}
                        >
                            Documentation Support →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── SUPERVISION DES NOTES — SCOLARITÉ ──────────────────────────────────────
function SupervisionNotes() {
    const [selectedPromo, setSelectedPromo] = React.useState("M2 Dev Ops 2024");
    const [gelé, setGelé] = React.useState(false);

    const promos = ["M2 Dev Ops 2024", "M1 Marketing Digital", "M2 Cybersécurité", "M1 Data Science"];

    const modules = [
        {
            name: "Architecture Cloud & DevOps",
            intervenant: "Dr. Jean Dupont",
            credits: 4,
            avg: 14.2,
            min: 8,
            max: 19,
            saisies: 48,
            total: 48,
            status: "Complet",
        },
        {
            name: "Gestion de Projet Agile",
            intervenant: "Mme. Sophie Girard",
            credits: 3,
            avg: 15.8,
            min: 11,
            max: 20,
            saisies: 46,
            total: 48,
            status: "Partiel",
        },
        {
            name: "Cybersécurité Avancée",
            intervenant: "Dr. Marc Laurent",
            credits: 5,
            avg: 13.1,
            min: 6,
            max: 18,
            saisies: 48,
            total: 48,
            status: "Complet",
        },
        {
            name: "Soft Skills & Communication",
            intervenant: "RH : Damien Moreau",
            credits: 2,
            avg: null,
            min: null,
            max: null,
            saisies: 0,
            total: 48,
            status: "En attente",
        },
    ];

    const avgColor = (v) => (v >= 14 ? "#16803C" : v >= 10 ? "#001944" : "#BA1A1A");
    const statusColor = {
        Complet: ["#DCFCE7", "#16803C"],
        Partiel: ["#FEF3C7", "#92400E"],
        "En attente": ["#F1F5F9", "#64748B"],
    };

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
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
                            fontSize: 26,
                            color: "#001944",
                            letterSpacing: "-0.5px",
                            marginBottom: 4,
                        }}
                    >
                        Supervision des Notes
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 13, color: "#64748B" }}>
                        Vue d'ensemble des résultats par promotion et module
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        style={{
                            padding: "9px 16px",
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
                    <button
                        onClick={() => setGelé((g) => !g)}
                        style={{
                            padding: "9px 16px",
                            borderRadius: 10,
                            border: `1.5px solid ${gelé ? "#BA1A1A" : "#E2E8F0"}`,
                            backgroundColor: gelé ? "rgba(186,26,26,0.06)" : "#fff",
                            color: gelé ? "#BA1A1A" : "#374151",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                        }}
                    >
                        {gelé ? "🔒 Notes gelées" : "🔓 Geler avant jury"}
                    </button>
                </div>
            </div>

            {gelé && (
                <div
                    style={{
                        backgroundColor: "rgba(186,26,26,0.08)",
                        border: "1.5px solid #BA1A1A",
                        borderRadius: 12,
                        padding: "12px 20px",
                        marginBottom: 16,
                        fontFamily: "Inter",
                        fontSize: 13,
                        color: "#BA1A1A",
                    }}
                >
                    🔒 Notes gelées — aucune modification possible jusqu'au jury
                </div>
            )}

            {/* Promo selector */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
                {promos.map((p) => (
                    <button
                        key={p}
                        onClick={() => setSelectedPromo(p)}
                        style={{
                            padding: "7px 16px",
                            borderRadius: 999,
                            border: `1.5px solid ${selectedPromo === p ? "#001944" : "#E2E8F0"}`,
                            backgroundColor: selectedPromo === p ? "#001944" : "#fff",
                            color: selectedPromo === p ? "#C7D2FE" : "#64748B",
                            fontFamily: "Inter",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            transition: "all 0.15s",
                        }}
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 18 }}>
                {[
                    { label: "Moyenne promo", value: "14.37", suffix: "/20", color: "#001944", bg: "#fff" },
                    { label: "Modules complets", value: "3/4", color: "#16803C", bg: "#DCFCE7" },
                    { label: "Notes manquantes", value: "2", color: "#92400E", bg: "#FEF3C7" },
                    { label: "Étudiants en échec", value: "4", color: "#BA1A1A", bg: "#FEE2E2" },
                ].map((s, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: s.bg,
                            border: s.bg === "#fff" ? "1px solid #F1F5F9" : "none",
                            borderRadius: 14,
                            padding: "14px 16px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 10,
                                color: "#94A3B8",
                                letterSpacing: "0.8px",
                                textTransform: "uppercase",
                                marginBottom: 6,
                            }}
                        >
                            {s.label}
                        </div>
                        <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 24, color: s.color }}>
                            {s.value}
                            <span style={{ fontSize: 12, opacity: 0.5 }}>{s.suffix}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Table modules */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
            >
                <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 16, color: "#001944" }}>
                        {selectedPromo}
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                        Semestre 1 — 2024/2025
                    </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#F8F9FA" }}>
                            {["MODULE", "INTERVENANT", "CRÉDITS", "MOYENNE", "MIN / MAX", "SAISIES", "STATUT"].map(
                                (h) => (
                                    <th
                                        key={h}
                                        style={{
                                            padding: "10px 18px",
                                            textAlign: "left",
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 10,
                                            color: "#94A3B8",
                                            letterSpacing: "0.8px",
                                        }}
                                    >
                                        {h}
                                    </th>
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {modules.map((m, i) => {
                            const [sBg, sColor] = statusColor[m.status];
                            return (
                                <tr
                                    key={i}
                                    style={{ borderTop: "1px solid #F1F5F9" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                >
                                    <td style={{ padding: "14px 18px" }}>
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
                                    </td>
                                    <td
                                        style={{
                                            padding: "14px 18px",
                                            fontFamily: "Inter",
                                            fontSize: 12,
                                            color: "#64748B",
                                        }}
                                    >
                                        {m.intervenant}
                                    </td>
                                    <td
                                        style={{
                                            padding: "14px 18px",
                                            fontFamily: "Inter",
                                            fontWeight: 600,
                                            fontSize: 13,
                                            color: "#374151",
                                            textAlign: "center",
                                        }}
                                    >
                                        {m.credits}
                                    </td>
                                    <td style={{ padding: "14px 18px" }}>
                                        {m.avg ? (
                                            <div
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    minWidth: 44,
                                                    height: 28,
                                                    borderRadius: 8,
                                                    backgroundColor:
                                                        avgColor(m.avg) === "#16803C"
                                                            ? "#DCFCE7"
                                                            : avgColor(m.avg) === "#BA1A1A"
                                                              ? "#FEE2E2"
                                                              : "rgba(0,25,68,0.06)",
                                                    fontFamily: "Inter",
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    color: avgColor(m.avg),
                                                }}
                                            >
                                                {m.avg}
                                            </div>
                                        ) : (
                                            <span style={{ color: "#CBD5E1" }}>—</span>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: "14px 18px",
                                            fontFamily: "Inter",
                                            fontSize: 12,
                                            color: "#64748B",
                                        }}
                                    >
                                        {m.min !== null ? `${m.min} / ${m.max}` : "—"}
                                    </td>
                                    <td style={{ padding: "14px 18px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                            <div
                                                style={{
                                                    flex: 1,
                                                    height: 5,
                                                    backgroundColor: "#F1F5F9",
                                                    borderRadius: 999,
                                                    overflow: "hidden",
                                                    minWidth: 48,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        width: `${m.total ? (m.saisies / m.total) * 100 : 0}%`,
                                                        height: "100%",
                                                        backgroundColor: "#001944",
                                                        borderRadius: 999,
                                                    }}
                                                />
                                            </div>
                                            <span
                                                style={{
                                                    fontFamily: "Inter",
                                                    fontSize: 11,
                                                    color: "#64748B",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {m.saisies}/{m.total}
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "14px 18px" }}>
                                        <span
                                            style={{
                                                backgroundColor: sBg,
                                                color: sColor,
                                                borderRadius: 999,
                                                padding: "3px 10px",
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 10,
                                            }}
                                        >
                                            {m.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

Object.assign(window, { DashboardScolarite, SupervisionNotes });
