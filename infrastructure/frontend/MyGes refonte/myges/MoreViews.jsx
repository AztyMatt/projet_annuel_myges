// MoreViews — Supports Intervenant, Documents Étudiant v2, Paramètres, Gestion Utilisateurs, Planning Intervenant

// ─── SUPPORTS DE COURS — INTERVENANT ───────────────────────────────────────
function SupportsIntervenant() {
    const [activeTab, setActiveTab] = React.useState("all");
    const [dragOver, setDragOver] = React.useState(false);
    const [files, setFiles] = React.useState([
        {
            id: 1,
            name: "Introduction à AWS Services v2",
            type: "PDF",
            size: "4.2 MB",
            modified: "il y a 2 jours",
            downloads: 56,
            status: "PUBLIÉ",
            statusColor: "#16803C",
            statusBg: "#DCFCE7",
            category: "lecture",
            icon: "📄",
            iconBg: "#EEF2FF",
        },
        {
            id: 2,
            name: "TP 01 — Déploiement Terraform",
            type: "ZIP",
            size: "12.8 MB",
            modified: "12 Oct.",
            downloads: 31,
            status: "BROUILLON",
            statusColor: "#92400E",
            statusBg: "#FEF3C7",
            category: "tp",
            icon: "📦",
            iconBg: "#FFF3EE",
        },
        {
            id: 3,
            name: "Guide des bonnes pratiques de sécurité",
            type: "PDF",
            size: "1.1 MB",
            modified: "hier",
            downloads: 89,
            status: "PUBLIÉ",
            statusColor: "#16803C",
            statusBg: "#DCFCE7",
            category: "ressources",
            icon: "📗",
            iconBg: "#F0FDF4",
        },
        {
            id: 4,
            name: "Slides — Architecture Microservices",
            type: "PPT",
            size: "8.4 MB",
            modified: "8 Oct.",
            downloads: 44,
            status: "PUBLIÉ",
            statusColor: "#16803C",
            statusBg: "#DCFCE7",
            category: "lecture",
            icon: "📊",
            iconBg: "#EEF2FF",
        },
        {
            id: 5,
            name: "TP 02 — Kubernetes & Helm",
            type: "ZIP",
            size: "15.2 MB",
            modified: "5 Oct.",
            downloads: 12,
            status: "BROUILLON",
            statusColor: "#92400E",
            statusBg: "#FEF3C7",
            category: "tp",
            icon: "📦",
            iconBg: "#FFF3EE",
        },
    ]);
    const [showUpload, setShowUpload] = React.useState(false);
    const [newTitle, setNewTitle] = React.useState("");
    const [newCat, setNewCat] = React.useState("Lecture Notes");
    const [visibility, setVisibility] = React.useState(true);

    const tabs = [
        ["all", "Tous les fichiers"],
        ["lecture", "Lecture Notes"],
        ["tp", "Travaux Pratiques (TP)"],
        ["ressources", "Ressources & Lectures"],
    ];
    const filtered = activeTab === "all" ? files : files.filter((f) => f.category === activeTab);

    const handlePublish = () => {
        if (!newTitle.trim()) return;
        setFiles((f) => [
            ...f,
            {
                id: Date.now(),
                name: newTitle,
                type: "PDF",
                size: "—",
                modified: "à l'instant",
                downloads: 0,
                status: visibility ? "PUBLIÉ" : "BROUILLON",
                statusColor: visibility ? "#16803C" : "#92400E",
                statusBg: visibility ? "#DCFCE7" : "#FEF3C7",
                category:
                    newCat === "Lecture Notes" ? "lecture" : newCat === "Travaux Pratiques (TP)" ? "tp" : "ressources",
                icon: "📄",
                iconBg: "#EEF2FF",
            },
        ]);
        setNewTitle("");
        setShowUpload(false);
    };

    return (
        <div>
            {/* Hero card */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 220px 220px", gap: 16, marginBottom: 24 }}>
                <div
                    style={{
                        backgroundColor: "#001944",
                        borderRadius: 20,
                        padding: "28px 32px",
                        color: "#fff",
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
                            letterSpacing: "1.5px",
                            textTransform: "uppercase",
                            marginBottom: 10,
                        }}
                    >
                        Architecture Cloud
                    </div>
                    <div
                        style={{
                            fontFamily: "Manrope",
                            fontWeight: 800,
                            fontSize: 26,
                            color: "#fff",
                            marginBottom: 10,
                            lineHeight: 1.2,
                        }}
                    >
                        Session Automne 2024
                    </div>
                    <div
                        style={{
                            fontFamily: "Inter",
                            fontSize: 13,
                            color: "rgba(255,255,255,0.6)",
                            lineHeight: 1.5,
                            marginBottom: 20,
                        }}
                    >
                        Gérez vos ressources pédagogiques, suivez l'engagement et publiez de nouveaux modules.
                    </div>
                    <div style={{ display: "flex", gap: 24 }}>
                        <div>
                            <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 28, color: "#fff" }}>
                                {files.length}
                            </div>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 10,
                                    color: "rgba(255,255,255,0.4)",
                                    letterSpacing: "0.8px",
                                    textTransform: "uppercase",
                                }}
                            >
                                Fichiers actifs
                            </div>
                        </div>
                        <div style={{ width: 1, backgroundColor: "rgba(255,255,255,0.1)" }} />
                        <div>
                            <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 28, color: "#fff" }}>
                                {files.reduce((a, f) => a + f.downloads, 0)}
                            </div>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 10,
                                    color: "rgba(255,255,255,0.4)",
                                    letterSpacing: "0.8px",
                                    textTransform: "uppercase",
                                }}
                            >
                                Téléchargements
                            </div>
                        </div>
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            right: -20,
                            top: -20,
                            width: 120,
                            height: 120,
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,255,255,0.04)",
                        }}
                    />
                </div>

                {/* Upload zone */}
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        setShowUpload(true);
                    }}
                    onClick={() => setShowUpload(true)}
                    style={{
                        backgroundColor: dragOver ? "#EEF2FF" : "#F8F9FA",
                        border: `2px dashed ${dragOver ? "#002C6E" : "#E2E8F0"}`,
                        borderRadius: 20,
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        gap: 10,
                    }}
                >
                    <div style={{ fontSize: 32 }}>☁️</div>
                    <div
                        style={{
                            fontFamily: "Manrope",
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#001944",
                            textAlign: "center",
                        }}
                    >
                        Nouveau Fichier
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
                        Glissez-déposez pour ajouter du contenu
                    </div>
                </div>

                {/* Engagement */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 20,
                        padding: "24px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
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
                                color: "#64748B",
                                letterSpacing: "1px",
                                textTransform: "uppercase",
                            }}
                        >
                            Engagement Étudiant
                        </div>
                        <span
                            style={{
                                backgroundColor: "#FEE2E2",
                                color: "#BA1A1A",
                                borderRadius: 999,
                                padding: "2px 8px",
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 10,
                            }}
                        >
                            LIVE
                        </span>
                    </div>
                    <div
                        style={{
                            fontFamily: "Manrope",
                            fontWeight: 800,
                            fontSize: 36,
                            color: "#001944",
                            marginBottom: 10,
                        }}
                    >
                        84%
                    </div>
                    <div
                        style={{
                            height: 6,
                            backgroundColor: "#E2E8F0",
                            borderRadius: 999,
                            overflow: "hidden",
                            marginBottom: 8,
                        }}
                    >
                        <div style={{ width: "84%", height: "100%", backgroundColor: "#7B2E12", borderRadius: 999 }} />
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                        des étudiants ont téléchargé au moins un fichier
                    </div>
                </div>
            </div>

            {/* File list */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
            >
                <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", padding: "0 8px" }}>
                    {tabs.map(([k, l]) => (
                        <button
                            key={k}
                            onClick={() => setActiveTab(k)}
                            style={{
                                padding: "14px 16px",
                                border: "none",
                                borderBottom: activeTab === k ? "2px solid #001944" : "2px solid transparent",
                                backgroundColor: "transparent",
                                fontFamily: "Inter",
                                fontWeight: activeTab === k ? 700 : 400,
                                fontSize: 13,
                                color: activeTab === k ? "#001944" : "#64748B",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {l}
                        </button>
                    ))}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "0 16px" }}>
                        <button
                            style={{
                                padding: "6px 14px",
                                borderRadius: 8,
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
                    </div>
                </div>
                {filtered.map((f, i) => (
                    <div
                        key={f.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 16,
                            padding: "16px 24px",
                            borderBottom: "1px solid #F8F9FA",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                backgroundColor: f.iconBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                                flexShrink: 0,
                            }}
                        >
                            {f.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 14,
                                    color: "#001944",
                                    marginBottom: 3,
                                }}
                            >
                                {f.name}
                            </div>
                            <div style={{ fontFamily: "Inter", fontSize: 12, color: "#94A3B8" }}>
                                {f.type} • {f.size} • Modifié {f.modified}
                            </div>
                        </div>
                        <div style={{ textAlign: "right", marginRight: 16 }}>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 11,
                                    color: "#64748B",
                                    letterSpacing: "0.5px",
                                    marginBottom: 2,
                                }}
                            >
                                DOWNLOADS
                            </div>
                            <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 16, color: "#001944" }}>
                                {f.downloads} {f.downloads > 30 ? "↑" : "–"}
                            </div>
                        </div>
                        <span
                            style={{
                                backgroundColor: f.statusBg,
                                color: f.statusColor,
                                borderRadius: 999,
                                padding: "4px 12px",
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 11,
                                flexShrink: 0,
                            }}
                        >
                            {f.status}
                        </span>
                        <div style={{ position: "relative" }}>
                            <button
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 6,
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#fff",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 14,
                                    color: "#64748B",
                                }}
                            >
                                ⋮
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload modal */}
            {showUpload && (
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
                    onClick={() => setShowUpload(false)}
                >
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: 32,
                            width: 520,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 20,
                                color: "#001944",
                                marginBottom: 20,
                            }}
                        >
                            Déposer un nouveau fichier
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    style={{
                                        border: "2px dashed #E2E8F0",
                                        borderRadius: 14,
                                        padding: "32px",
                                        textAlign: "center",
                                        backgroundColor: "#F8F9FA",
                                        cursor: "pointer",
                                    }}
                                >
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
                                    <div
                                        style={{
                                            fontFamily: "Manrope",
                                            fontWeight: 700,
                                            fontSize: 14,
                                            color: "#001944",
                                            marginBottom: 4,
                                        }}
                                    >
                                        Déposer les fichiers
                                    </div>
                                    <div style={{ fontFamily: "Inter", fontSize: 12, color: "#94A3B8" }}>
                                        Ou cliquez pour parcourir vos dossiers locaux
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontSize: 10,
                                            color: "#CBD5E1",
                                            marginTop: 6,
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        Limite : 50MB par fichier
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#374151",
                                        display: "block",
                                        marginBottom: 6,
                                    }}
                                >
                                    Titre du document
                                </label>
                                <input
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="ex: Module 04 — Kubernetes Clusters"
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: 10,
                                        border: "1px solid #E2E8F0",
                                        fontFamily: "Inter",
                                        fontSize: 13,
                                        color: "#001944",
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
                                        fontWeight: 600,
                                        color: "#374151",
                                        display: "block",
                                        marginBottom: 6,
                                    }}
                                >
                                    Catégorie
                                </label>
                                <select
                                    value={newCat}
                                    onChange={(e) => setNewCat(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: 10,
                                        border: "1px solid #E2E8F0",
                                        fontFamily: "Inter",
                                        fontSize: 13,
                                        color: "#001944",
                                        outline: "none",
                                    }}
                                >
                                    {["Lecture Notes", "Travaux Pratiques (TP)", "Ressources & Lectures"].map((c) => (
                                        <option key={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ gridColumn: "1 / -1" }}>
                                <div
                                    style={{
                                        backgroundColor: "#F8F9FA",
                                        borderRadius: 12,
                                        padding: "14px 16px",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontWeight: 600,
                                                fontSize: 13,
                                                color: "#001944",
                                                marginBottom: 2,
                                            }}
                                        >
                                            👁 Visibilité Étudiant
                                        </div>
                                        <div style={{ fontFamily: "Inter", fontSize: 11, color: "#64748B" }}>
                                            Les étudiants pourront voir ce fichier immédiatement
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => setVisibility((v) => !v)}
                                        style={{
                                            width: 44,
                                            height: 24,
                                            backgroundColor: visibility ? "#002C6E" : "#E2E8F0",
                                            borderRadius: 999,
                                            cursor: "pointer",
                                            position: "relative",
                                            transition: "background 0.2s",
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 3,
                                                left: visibility ? 22 : 3,
                                                width: 18,
                                                height: 18,
                                                borderRadius: "50%",
                                                backgroundColor: "#fff",
                                                transition: "left 0.2s",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                            <button
                                onClick={() => setShowUpload(false)}
                                style={{
                                    flex: 1,
                                    padding: "11px",
                                    borderRadius: 10,
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#fff",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: "#374151",
                                    cursor: "pointer",
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handlePublish}
                                style={{
                                    flex: 2,
                                    padding: "11px",
                                    borderRadius: 10,
                                    border: "none",
                                    backgroundColor: "#001944",
                                    color: "#C7D2FE",
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: 6,
                                }}
                            >
                                🚀 Publier maintenant
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── DOCUMENTS ÉTUDIANT v2 ──────────────────────────────────────────────────
function DocumentsEtudiantV2() {
    const [showDeposer, setShowDeposer] = React.useState(false);

    const contrats = [
        {
            icon: "📋",
            name: "Contrat d'Apprentissage 2023-2024",
            id: "ID: APP-4492-Z",
            status: "SIGNÉ",
            statusColor: "#16803C",
            statusBg: "#DCFCE7",
        },
        {
            icon: "🤝",
            name: "Convention de Stage Alterné",
            id: "MIS À JOUR LE 12/10/2023",
            status: "VALIDE",
            statusColor: "#16803C",
            statusBg: "#DCFCE7",
        },
        {
            icon: "📝",
            name: "Avenant de Télétravail",
            id: "DOCUMENT MANQUANT",
            status: "MANQUANT",
            statusColor: "#BA1A1A",
            statusBg: "#FEE2E2",
            missing: true,
        },
    ];

    const officiels = [
        { icon: "🎓", name: "Certificat de Scolarité", detail: "PDF • 1.2 MB", action: "download" },
        { icon: "🪪", name: "Carte Étudiant Digitale", detail: "PNG • 0.8 MB", action: "view" },
        { icon: "📊", name: "Relevé de Notes S1", detail: "PDF • 2.4 MB", action: "download" },
    ];

    return (
        <div>
            {/* Alerte conformité */}
            <div
                style={{
                    backgroundColor: "rgba(254,226,226,0.4)",
                    border: "1.5px solid #FCA5A5",
                    borderRadius: 16,
                    padding: "16px 20px",
                    marginBottom: 24,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                }}
            >
                <div
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: "#FEE2E2",
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
                            fontSize: 14,
                            color: "#BA1A1A",
                            marginBottom: 3,
                        }}
                    >
                        Alerte de Conformité
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 13, color: "#64748B" }}>
                        L'élément <strong>Attestation de Responsabilité Civile</strong> est manquant pour le quatrième
                        trimestre (Q4). Veuillez le soumettre avant le 15 Décembre.
                    </div>
                </div>
                <button
                    onClick={() => setShowDeposer(true)}
                    style={{
                        backgroundColor: "#BA1A1A",
                        color: "#fff",
                        border: "none",
                        borderRadius: 10,
                        padding: "10px 18px",
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        flexShrink: 0,
                    }}
                >
                    Régulariser
                </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Contrats */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "24px 28px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 20,
                                color: "#001944",
                                marginBottom: 4,
                            }}
                        >
                            Contrats & Alternance
                        </div>
                        <div style={{ fontFamily: "Inter", fontSize: 13, color: "#94A3B8", marginBottom: 20 }}>
                            Gestion de vos engagements contractuels
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {contrats.map((c, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 14,
                                        padding: "14px 16px",
                                        borderRadius: 14,
                                        border: c.missing ? "1.5px dashed #FCA5A5" : "1px solid #F1F5F9",
                                        backgroundColor: c.missing ? "rgba(254,226,226,0.1)" : "#FAFBFC",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 12,
                                            backgroundColor: c.missing ? "#FEE2E2" : "#EEF2FF",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: 20,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {c.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 14,
                                                color: c.missing ? "#BA1A1A" : "#001944",
                                                marginBottom: 3,
                                            }}
                                        >
                                            {c.name}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontSize: 11,
                                                color: c.missing ? "#BA1A1A" : "#94A3B8",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 4,
                                            }}
                                        >
                                            {c.missing ? "⚠ " : "✓ "}
                                            {c.id}
                                        </div>
                                    </div>
                                    {!c.missing ? (
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    border: "1px solid #E2E8F0",
                                                    backgroundColor: "#fff",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 14,
                                                }}
                                            >
                                                👁
                                            </button>
                                            <button
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    border: "1px solid #E2E8F0",
                                                    backgroundColor: "#fff",
                                                    cursor: "pointer",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontSize: 14,
                                                }}
                                            >
                                                ↓
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowDeposer(true)}
                                            style={{
                                                backgroundColor: "#001944",
                                                color: "#C7D2FE",
                                                border: "none",
                                                borderRadius: 10,
                                                padding: "8px 16px",
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 12,
                                                cursor: "pointer",
                                            }}
                                        >
                                            DÉPOSER
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Aide */}
                    <div
                        style={{
                            backgroundColor: "#001944",
                            borderRadius: 20,
                            padding: "24px 28px",
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
                                    color: "#fff",
                                    marginBottom: 6,
                                }}
                            >
                                Besoin d'aide ?
                            </div>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 13,
                                    color: "rgba(255,255,255,0.6)",
                                    lineHeight: 1.5,
                                }}
                            >
                                Consultez notre guide ou contactez votre conseiller alternance dédié.
                            </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
                            <button
                                style={{
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                    color: "#fff",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    borderRadius: 10,
                                    padding: "10px 18px",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                🔗 Contacter le support
                            </button>
                            <div style={{ textAlign: "center" }}>
                                <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 28, color: "#fff" }}>
                                    85%
                                </div>
                                <div
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 10,
                                        color: "rgba(255,255,255,0.4)",
                                        letterSpacing: "0.8px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Dossier complet
                                </div>
                                <div
                                    style={{
                                        marginTop: 6,
                                        height: 4,
                                        width: 80,
                                        backgroundColor: "rgba(255,255,255,0.2)",
                                        borderRadius: 999,
                                        overflow: "hidden",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "85%",
                                            height: "100%",
                                            backgroundColor: "#C7D2FE",
                                            borderRadius: 999,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Documents officiels */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "20px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                            <span style={{ fontSize: 16 }}>🏫</span>
                            <span style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 16, color: "#001944" }}>
                                Documents Officiels
                            </span>
                        </div>
                        {officiels.map((d, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    padding: "10px 0",
                                    borderBottom: i < officiels.length - 1 ? "1px solid #F8F9FA" : "none",
                                }}
                            >
                                <span style={{ fontSize: 20, flexShrink: 0 }}>{d.icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 13, color: "#001944" }}
                                    >
                                        {d.name}
                                    </div>
                                    <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                                        {d.detail}
                                    </div>
                                </div>
                                <button
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 8,
                                        border: "1px solid #E2E8F0",
                                        backgroundColor: "#fff",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontSize: 14,
                                    }}
                                >
                                    {d.action === "download" ? "↓" : "👁"}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Déposer un fichier */}
                    <div
                        style={{
                            backgroundColor: "#F8F9FA",
                            border: "2px dashed #E2E8F0",
                            borderRadius: 20,
                            padding: "24px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 10,
                            cursor: "pointer",
                        }}
                        onClick={() => setShowDeposer(true)}
                    >
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: "50%",
                                backgroundColor: "#EEF2FF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 22,
                            }}
                        >
                            ☁️
                        </div>
                        <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 14, color: "#001944" }}>
                            Déposer un nouveau fichier
                        </div>
                        <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8", textAlign: "center" }}>
                            Fichiers autorisés : PDF, PNG, JPG (Max 5MB)
                        </div>
                        <button
                            style={{
                                backgroundColor: "transparent",
                                border: "1.5px solid #001944",
                                borderRadius: 10,
                                padding: "8px 18px",
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 12,
                                color: "#001944",
                                cursor: "pointer",
                                letterSpacing: "0.3px",
                            }}
                        >
                            PARCOURIR LES FICHIERS
                        </button>
                    </div>

                    {/* Statut alternant */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "20px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 10,
                                color: "#94A3B8",
                                letterSpacing: "1px",
                                textTransform: "uppercase",
                                marginBottom: 14,
                            }}
                        >
                            Statut Alternant
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    backgroundColor: "#EEF2FF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 22,
                                }}
                            >
                                💼
                            </div>
                            <div>
                                <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14, color: "#001944" }}>
                                    Microsoft France
                                </div>
                                <div style={{ fontFamily: "Inter", fontSize: 12, color: "#64748B" }}>
                                    Contrat d'Apprentissage Actif
                                </div>
                            </div>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderTop: "1px solid #F1F5F9",
                                paddingTop: 12,
                            }}
                        >
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontSize: 11,
                                    color: "#94A3B8",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                Renouvellement
                            </div>
                            <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 12, color: "#001944" }}>
                                SEP 2024
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal dépôt */}
            {showDeposer && (
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
                    onClick={() => setShowDeposer(false)}
                >
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: 32,
                            width: 440,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 20,
                                color: "#001944",
                                marginBottom: 20,
                            }}
                        >
                            Déposer un document
                        </div>
                        <div
                            style={{
                                border: "2px dashed #E2E8F0",
                                borderRadius: 14,
                                padding: "32px",
                                textAlign: "center",
                                backgroundColor: "#F8F9FA",
                                marginBottom: 16,
                                cursor: "pointer",
                            }}
                        >
                            <div style={{ fontSize: 32, marginBottom: 8 }}>📎</div>
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: "#001944",
                                    marginBottom: 4,
                                }}
                            >
                                Cliquez ou glissez un fichier ici
                            </div>
                            <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                                PDF, JPG, PNG — max 5MB
                            </div>
                        </div>
                        <select
                            style={{
                                width: "100%",
                                padding: "9px 12px",
                                borderRadius: 10,
                                border: "1px solid #E2E8F0",
                                fontFamily: "Inter",
                                fontSize: 13,
                                color: "#001944",
                                outline: "none",
                                marginBottom: 16,
                            }}
                        >
                            <option>Attestation de Responsabilité Civile</option>
                            <option>Avenant de Télétravail</option>
                            <option>Autre document</option>
                        </select>
                        <div style={{ display: "flex", gap: 12 }}>
                            <button
                                onClick={() => setShowDeposer(false)}
                                style={{
                                    flex: 1,
                                    padding: "11px",
                                    borderRadius: 10,
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#fff",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: "#374151",
                                    cursor: "pointer",
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => setShowDeposer(false)}
                                style={{
                                    flex: 1,
                                    padding: "11px",
                                    borderRadius: 10,
                                    border: "none",
                                    backgroundColor: "#001944",
                                    color: "#C7D2FE",
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    cursor: "pointer",
                                }}
                            >
                                Soumettre
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── PARAMÈTRES ─────────────────────────────────────────────────────────────
function Parametres({ role }) {
    const [notifEmail, setNotifEmail] = React.useState(true);
    const [notifPlanning, setNotifPlanning] = React.useState(true);
    const [notifNotes, setNotifNotes] = React.useState(true);
    const [notifDocs, setNotifDocs] = React.useState(false);
    const [lang, setLang] = React.useState("fr");
    const [saved, setSaved] = React.useState(false);

    const Toggle = ({ value, onChange }) => (
        <div
            onClick={() => onChange(!value)}
            style={{
                width: 44,
                height: 24,
                backgroundColor: value ? "#001944" : "#E2E8F0",
                borderRadius: 999,
                cursor: "pointer",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    position: "absolute",
                    top: 3,
                    left: value ? 22 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    backgroundColor: "#fff",
                    transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
            />
        </div>
    );

    const Section = ({ title, children }) => (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: "24px 28px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                marginBottom: 16,
            }}
        >
            <div
                style={{
                    fontFamily: "Manrope",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "#001944",
                    marginBottom: 20,
                    paddingBottom: 14,
                    borderBottom: "1px solid #F1F5F9",
                }}
            >
                {title}
            </div>
            {children}
        </div>
    );

    const Row = ({ label, sub, children }) => (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid #F8F9FA",
            }}
        >
            <div>
                <div style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 13, color: "#001944" }}>{label}</div>
                {sub && <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{sub}</div>}
            </div>
            {children}
        </div>
    );

    const userNames = {
        etudiant: "Lucas Bernard",
        intervenant: "Dr. Jean Dupont",
        scolarite: "Admin Scolarité",
        superadmin: "Admin Principal",
    };
    const userEmails = {
        etudiant: "lucas.bernard@esgi.fr",
        intervenant: "j.dupont@esgi.fr",
        scolarite: "scolarite@esgi.fr",
        superadmin: "admin@esgi.fr",
    };

    return (
        <div>
            <div
                style={{
                    fontFamily: "Manrope",
                    fontWeight: 800,
                    fontSize: 28,
                    color: "#001944",
                    letterSpacing: "-0.6px",
                    marginBottom: 24,
                }}
            >
                Paramètres
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                    <Section title="Profil">
                        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                            <div
                                style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: "50%",
                                    backgroundColor: "#001944",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 20,
                                    color: "#C7D2FE",
                                }}
                            >
                                {userNames[role]
                                    ?.split(" ")
                                    .map((n) => n[0])
                                    .join("") || "U"}
                            </div>
                            <div>
                                <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 16, color: "#001944" }}>
                                    {userNames[role]}
                                </div>
                                <div style={{ fontFamily: "Inter", fontSize: 13, color: "#64748B" }}>
                                    {userEmails[role]}
                                </div>
                                <button
                                    style={{
                                        marginTop: 6,
                                        padding: "4px 12px",
                                        borderRadius: 6,
                                        border: "1px solid #E2E8F0",
                                        backgroundColor: "#fff",
                                        fontFamily: "Inter",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: "#374151",
                                        cursor: "pointer",
                                    }}
                                >
                                    Modifier la photo
                                </button>
                            </div>
                        </div>
                        <Row label="Nom complet">
                            <input
                                defaultValue={userNames[role]}
                                style={{
                                    padding: "7px 12px",
                                    borderRadius: 8,
                                    border: "1px solid #E2E8F0",
                                    fontFamily: "Inter",
                                    fontSize: 13,
                                    color: "#001944",
                                    outline: "none",
                                    width: 200,
                                }}
                            />
                        </Row>
                        <Row label="Adresse email">
                            <input
                                defaultValue={userEmails[role]}
                                style={{
                                    padding: "7px 12px",
                                    borderRadius: 8,
                                    border: "1px solid #E2E8F0",
                                    fontFamily: "Inter",
                                    fontSize: 13,
                                    color: "#001944",
                                    outline: "none",
                                    width: 200,
                                }}
                            />
                        </Row>
                        <Row label="Langue" sub="Langue d'affichage de l'interface">
                            <select
                                value={lang}
                                onChange={(e) => setLang(e.target.value)}
                                style={{
                                    padding: "7px 12px",
                                    borderRadius: 8,
                                    border: "1px solid #E2E8F0",
                                    fontFamily: "Inter",
                                    fontSize: 13,
                                    color: "#001944",
                                    outline: "none",
                                }}
                            >
                                <option value="fr">Français</option>
                                <option value="en">English</option>
                            </select>
                        </Row>
                    </Section>

                    <Section title="Sécurité">
                        <Row label="Mot de passe" sub="Dernière modification il y a 12 jours">
                            <button
                                style={{
                                    padding: "7px 14px",
                                    borderRadius: 8,
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#fff",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    color: "#374151",
                                    cursor: "pointer",
                                }}
                            >
                                Modifier
                            </button>
                        </Row>
                        <Row label="Authentification 2FA" sub="Application TOTP (Google Authenticator)">
                            <Toggle value={true} onChange={() => {}} />
                        </Row>
                        <Row label="Sessions actives" sub="1 session en cours">
                            <button
                                style={{
                                    padding: "7px 14px",
                                    borderRadius: 8,
                                    border: "1px solid #FEE2E2",
                                    backgroundColor: "#FEE2E2",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    color: "#BA1A1A",
                                    cursor: "pointer",
                                }}
                            >
                                Déconnecter tout
                            </button>
                        </Row>
                    </Section>
                </div>

                <div>
                    <Section title="Notifications">
                        <Row label="Notifications par email" sub="Recevoir un résumé hebdomadaire">
                            <Toggle value={notifEmail} onChange={setNotifEmail} />
                        </Row>
                        <Row label="Modifications de planning" sub="Alertes en temps réel">
                            <Toggle value={notifPlanning} onChange={setNotifPlanning} />
                        </Row>
                        <Row label="Nouvelles notes publiées" sub="Dès qu'une note est saisie">
                            <Toggle value={notifNotes} onChange={setNotifNotes} />
                        </Row>
                        <Row label="Documents manquants" sub="Rappels de conformité">
                            <Toggle value={notifDocs} onChange={setNotifDocs} />
                        </Row>
                    </Section>

                    <Section title="Confidentialité & Données">
                        <Row label="Visibilité du profil" sub="Votre profil est visible par les intervenants">
                            <span style={{ fontFamily: "Inter", fontSize: 12, color: "#16803C", fontWeight: 600 }}>
                                ✓ Actif
                            </span>
                        </Row>
                        <Row label="Historique de connexion">
                            <button
                                style={{
                                    padding: "7px 14px",
                                    borderRadius: 8,
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#fff",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 12,
                                    color: "#374151",
                                    cursor: "pointer",
                                }}
                            >
                                Consulter
                            </button>
                        </Row>
                        <Row label="Export de mes données" sub="Conformité RGPD">
                            <button
                                style={{
                                    padding: "7px 14px",
                                    borderRadius: 8,
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
                        </Row>
                        <div style={{ paddingTop: 14 }}>
                            <button
                                style={{
                                    color: "#BA1A1A",
                                    border: "none",
                                    backgroundColor: "transparent",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    cursor: "pointer",
                                }}
                            >
                                Supprimer mon compte…
                            </button>
                        </div>
                    </Section>

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                            onClick={() => {
                                setSaved(true);
                                setTimeout(() => setSaved(false), 2000);
                            }}
                            style={{
                                padding: "12px 28px",
                                borderRadius: 12,
                                border: "none",
                                backgroundColor: saved ? "#16803C" : "#001944",
                                color: saved ? "#fff" : "#C7D2FE",
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 13,
                                cursor: "pointer",
                                transition: "background 0.2s",
                            }}
                        >
                            {saved ? "✓ Modifications sauvegardées" : "Sauvegarder les modifications"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── GESTION UTILISATEURS — SUPER ADMIN ─────────────────────────────────────
function GestionUtilisateurs() {
    const [search, setSearch] = React.useState("");
    const [filterRole, setFilterRole] = React.useState("all");
    const [showModal, setShowModal] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState(null);

    const users = [
        {
            id: 1,
            name: "Lucas Bernard",
            email: "lucas.bernard@esgi.fr",
            role: "etudiant",
            roleLabel: "Étudiant",
            status: "Actif",
            lastLogin: "il y a 2h",
            initials: "LB",
            color: "#002C6E",
        },
        {
            id: 2,
            name: "Dr. Jean Dupont",
            email: "j.dupont@esgi.fr",
            role: "intervenant",
            roleLabel: "Intervenant",
            status: "Actif",
            lastLogin: "il y a 1h",
            initials: "JD",
            color: "#4a1942",
        },
        {
            id: 3,
            name: "Marie Laurent",
            email: "m.laurent@esgi.fr",
            role: "scolarite",
            roleLabel: "Scolarité",
            status: "Actif",
            lastLogin: "hier",
            initials: "ML",
            color: "#1a4a1a",
        },
        {
            id: 4,
            name: "Sophie Bernard",
            email: "s.bernard@esgi.fr",
            role: "etudiant",
            roleLabel: "Étudiant",
            status: "Actif",
            lastLogin: "il y a 30min",
            initials: "SB",
            color: "#7B2E12",
        },
        {
            id: 5,
            name: "Thomas Roche",
            email: "t.roche@esgi.fr",
            role: "etudiant",
            roleLabel: "Étudiant",
            status: "Suspendu",
            lastLogin: "il y a 5j",
            initials: "TR",
            color: "#64748B",
        },
        {
            id: 6,
            name: "Elena Vasquez",
            email: "e.vasquez@esgi.fr",
            role: "intervenant",
            roleLabel: "Intervenant",
            status: "Actif",
            lastLogin: "il y a 3h",
            initials: "EV",
            color: "#374151",
        },
        {
            id: 7,
            name: "Admin Scolarité",
            email: "scolarite@esgi.fr",
            role: "scolarite",
            roleLabel: "Scolarité",
            status: "Actif",
            lastLogin: "il y a 15min",
            initials: "AS",
            color: "#1a4a1a",
        },
    ];

    const filtered = users.filter(
        (u) =>
            (filterRole === "all" || u.role === filterRole) &&
            (u.name.toLowerCase().includes(search.toLowerCase()) ||
                u.email.toLowerCase().includes(search.toLowerCase())),
    );

    const roleBadge = {
        etudiant: ["#EEF2FF", "#002C6E"],
        intervenant: ["#F0FDF4", "#16803C"],
        scolarite: ["#FEF3C7", "#92400E"],
        superadmin: ["#FEE2E2", "#BA1A1A"],
    };

    return (
        <div>
            <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}
            >
                <div>
                    <div
                        style={{
                            fontFamily: "Manrope",
                            fontWeight: 800,
                            fontSize: 28,
                            color: "#001944",
                            letterSpacing: "-0.6px",
                            marginBottom: 6,
                        }}
                    >
                        Gestion des Utilisateurs
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 14, color: "#64748B" }}>
                        Administration des comptes, rôles et accès
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedUser(null);
                        setShowModal(true);
                    }}
                    style={{
                        backgroundColor: "#001944",
                        color: "#C7D2FE",
                        border: "none",
                        borderRadius: 12,
                        padding: "12px 20px",
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                    }}
                >
                    + Créer un compte
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                {[
                    { label: "Total utilisateurs", value: "1,412", color: "#001944", bg: "#fff" },
                    { label: "Étudiants", value: "1,248", color: "#002C6E", bg: "#EEF2FF" },
                    { label: "Intervenants", value: "148", color: "#16803C", bg: "#F0FDF4" },
                    { label: "Comptes suspendus", value: "16", color: "#BA1A1A", bg: "#FEE2E2" },
                ].map((s, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: s.bg,
                            border: s.bg === "#fff" ? "1px solid #F1F5F9" : "none",
                            borderRadius: 14,
                            padding: "18px 20px",
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
                                marginBottom: 8,
                            }}
                        >
                            {s.label}
                        </div>
                        <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 28, color: s.color }}>
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
            >
                <div
                    style={{
                        padding: "16px 20px",
                        borderBottom: "1px solid #F1F5F9",
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            backgroundColor: "#F3F4F5",
                            borderRadius: 10,
                            padding: "8px 12px",
                            flex: 1,
                            maxWidth: 300,
                        }}
                    >
                        <svg
                            width="13"
                            height="13"
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
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Rechercher un utilisateur..."
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
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        style={{
                            padding: "8px 12px",
                            borderRadius: 10,
                            border: "1px solid #E2E8F0",
                            fontFamily: "Inter",
                            fontSize: 12,
                            color: "#374151",
                            outline: "none",
                        }}
                    >
                        <option value="all">Tous les rôles</option>
                        <option value="etudiant">Étudiant</option>
                        <option value="intervenant">Intervenant</option>
                        <option value="scolarite">Scolarité</option>
                        <option value="superadmin">Super Admin</option>
                    </select>
                    <span style={{ fontFamily: "Inter", fontSize: 12, color: "#94A3B8", marginLeft: "auto" }}>
                        {filtered.length} utilisateurs
                    </span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#F8F9FA" }}>
                            {["UTILISATEUR", "RÔLE", "STATUT", "DERNIÈRE CONNEXION", "ACTIONS"].map((h) => (
                                <th
                                    key={h}
                                    style={{
                                        padding: "10px 20px",
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
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((u, i) => (
                            <tr
                                key={u.id}
                                style={{ borderTop: "1px solid #F1F5F9" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <td style={{ padding: "12px 20px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: "50%",
                                                backgroundColor: u.color,
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
                                            {u.initials}
                                        </div>
                                        <div>
                                            <div
                                                style={{
                                                    fontFamily: "Inter",
                                                    fontWeight: 600,
                                                    fontSize: 13,
                                                    color: "#001944",
                                                }}
                                            >
                                                {u.name}
                                            </div>
                                            <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                                                {u.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: "12px 20px" }}>
                                    <span
                                        style={{
                                            backgroundColor: roleBadge[u.role]?.[0] || "#F1F5F9",
                                            color: roleBadge[u.role]?.[1] || "#374151",
                                            borderRadius: 6,
                                            padding: "3px 10px",
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 11,
                                        }}
                                    >
                                        {u.roleLabel}
                                    </span>
                                </td>
                                <td style={{ padding: "12px 20px" }}>
                                    <span
                                        style={{
                                            backgroundColor: u.status === "Actif" ? "#DCFCE7" : "#FEE2E2",
                                            color: u.status === "Actif" ? "#16803C" : "#BA1A1A",
                                            borderRadius: 999,
                                            padding: "3px 10px",
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 11,
                                        }}
                                    >
                                        {u.status}
                                    </span>
                                </td>
                                <td
                                    style={{
                                        padding: "12px 20px",
                                        fontFamily: "Inter",
                                        fontSize: 12,
                                        color: "#64748B",
                                    }}
                                >
                                    {u.lastLogin}
                                </td>
                                <td style={{ padding: "12px 20px" }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button
                                            onClick={() => {
                                                setSelectedUser(u);
                                                setShowModal(true);
                                            }}
                                            style={{
                                                padding: "5px 12px",
                                                borderRadius: 8,
                                                border: "1px solid #E2E8F0",
                                                backgroundColor: "#fff",
                                                fontFamily: "Inter",
                                                fontWeight: 600,
                                                fontSize: 11,
                                                color: "#374151",
                                                cursor: "pointer",
                                            }}
                                        >
                                            ✏️ Modifier
                                        </button>
                                        <button
                                            style={{
                                                padding: "5px 12px",
                                                borderRadius: 8,
                                                border: "none",
                                                backgroundColor: u.status === "Actif" ? "#FEF3C7" : "#DCFCE7",
                                                color: u.status === "Actif" ? "#92400E" : "#16803C",
                                                fontFamily: "Inter",
                                                fontWeight: 600,
                                                fontSize: 11,
                                                cursor: "pointer",
                                            }}
                                        >
                                            {u.status === "Actif" ? "⏸ Suspendre" : "▶ Réactiver"}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
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
                    onClick={() => setShowModal(false)}
                >
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: 32,
                            width: 460,
                            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 20,
                                color: "#001944",
                                marginBottom: 20,
                            }}
                        >
                            {selectedUser ? `Modifier — ${selectedUser.name}` : "Créer un nouveau compte"}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {[
                                ["Nom complet", selectedUser?.name || ""],
                                ["Adresse email", selectedUser?.email || ""],
                            ].map(([l, v]) => (
                                <div key={l}>
                                    <label
                                        style={{
                                            fontFamily: "Inter",
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: "#374151",
                                            display: "block",
                                            marginBottom: 6,
                                        }}
                                    >
                                        {l}
                                    </label>
                                    <input
                                        defaultValue={v}
                                        style={{
                                            width: "100%",
                                            padding: "9px 12px",
                                            borderRadius: 10,
                                            border: "1px solid #E2E8F0",
                                            fontFamily: "Inter",
                                            fontSize: 13,
                                            color: "#001944",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>
                            ))}
                            <div>
                                <label
                                    style={{
                                        fontFamily: "Inter",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: "#374151",
                                        display: "block",
                                        marginBottom: 6,
                                    }}
                                >
                                    Rôle
                                </label>
                                <select
                                    defaultValue={selectedUser?.role || "etudiant"}
                                    style={{
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: 10,
                                        border: "1px solid #E2E8F0",
                                        fontFamily: "Inter",
                                        fontSize: 13,
                                        color: "#001944",
                                        outline: "none",
                                    }}
                                >
                                    <option value="etudiant">Étudiant</option>
                                    <option value="intervenant">Intervenant</option>
                                    <option value="scolarite">Administration Scolarité</option>
                                    <option value="superadmin">Super Administrateur</option>
                                </select>
                            </div>
                            {!selectedUser && (
                                <div
                                    style={{
                                        backgroundColor: "#FEF3C7",
                                        borderRadius: 10,
                                        padding: "12px 14px",
                                        fontFamily: "Inter",
                                        fontSize: 12,
                                        color: "#92400E",
                                    }}
                                >
                                    ℹ️ Un email d'invitation avec lien de création de mot de passe sera envoyé
                                    automatiquement.
                                </div>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1,
                                    padding: "11px",
                                    borderRadius: 10,
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#fff",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    color: "#374151",
                                    cursor: "pointer",
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    flex: 1,
                                    padding: "11px",
                                    borderRadius: 10,
                                    border: "none",
                                    backgroundColor: "#001944",
                                    color: "#C7D2FE",
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    cursor: "pointer",
                                }}
                            >
                                {selectedUser ? "Enregistrer" : "Créer le compte"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── PLANNING INTERVENANT ────────────────────────────────────────────────────
function PlanningIntervenant() {
    const [weekOffset, setWeekOffset] = React.useState(0);
    const start = 14 + weekOffset * 7;

    const coursData = [
        {
            day: 0,
            top: 56,
            height: 148,
            time: "09:00 - 12:30",
            title: "Architecture Cloud & DevOps",
            lieu: "Salle 304 - Campus Eiffel I",
            students: 48,
            bg: "#001944",
            color: "#fff",
        },
        {
            day: 0,
            top: 212,
            height: 100,
            time: "14:00 - 17:30",
            title: "Sécurité des SI",
            lieu: "Distanciel — Microsoft Teams",
            students: 32,
            bg: "#FFF3EE",
            color: "#001944",
            border: "2px dashed #FFD4C2",
        },
        {
            day: 2,
            top: 56,
            height: 148,
            time: "09:00 - 12:30",
            title: "Cybersécurité Avancée",
            lieu: "Salle 201 - Campus Eiffel II",
            students: 36,
            bg: "#001944",
            color: "#fff",
        },
        {
            day: 4,
            top: 130,
            height: 80,
            time: "13:00 - 16:00",
            title: "Atelier Cloud AWS",
            lieu: "Labo Réseau 504",
            students: 24,
            bg: "#EEF2FF",
            color: "#002C6E",
            border: "1.5px solid #C7D2FE",
        },
    ];

    const days = ["LUN.", "MAR.", "MER.", "JEU.", "VEN."];
    const dates = [start, start + 1, start + 2, start + 3, start + 4];
    const hours = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

    return (
        <div>
            <div style={{ marginBottom: 24 }}>
                <div
                    style={{
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 11,
                        color: "#94A3B8",
                        letterSpacing: "1.5px",
                        textTransform: "uppercase",
                        marginBottom: 6,
                    }}
                >
                    Mon Planning d'Enseignement
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                    <div
                        style={{
                            fontFamily: "Manrope",
                            fontWeight: 800,
                            fontSize: 28,
                            color: "#001944",
                            letterSpacing: "-0.8px",
                        }}
                    >
                        Semaine du {start} au {start + 4} Oct.
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                            onClick={() => setWeekOffset((v) => v - 1)}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#001944"
                                strokeWidth="2.5"
                            >
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setWeekOffset(0)}
                            style={{
                                padding: "4px 14px",
                                borderRadius: 8,
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#fff",
                                fontFamily: "Inter",
                                fontWeight: 600,
                                fontSize: 12,
                                color: "#001944",
                                cursor: "pointer",
                            }}
                        >
                            Cette semaine
                        </button>
                        <button
                            onClick={() => setWeekOffset((v) => v + 1)}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 8,
                                border: "1px solid #E2E8F0",
                                backgroundColor: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#001944"
                                strokeWidth="2.5"
                            >
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats semaine */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
                {[
                    { label: "Cours cette semaine", value: "4", sub: "13h au total", color: "#001944", bg: "#fff" },
                    {
                        label: "Étudiants concernés",
                        value: "140",
                        sub: "3 promotions",
                        color: "#002C6E",
                        bg: "#EEF2FF",
                    },
                    {
                        label: "Rendus à corriger",
                        value: "32",
                        sub: "Échéance: 18 Oct.",
                        color: "#92400E",
                        bg: "#FEF3C7",
                    },
                ].map((s, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: s.bg,
                            border: s.bg === "#fff" ? "1px solid #F1F5F9" : "none",
                            borderRadius: 14,
                            padding: "16px 20px",
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
                                marginBottom: 8,
                            }}
                        >
                            {s.label}
                        </div>
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 800,
                                fontSize: 28,
                                color: s.color,
                                marginBottom: 2,
                            }}
                        >
                            {s.value}
                        </div>
                        <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Calendar */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}
            >
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "52px repeat(5,1fr)",
                        borderBottom: "1px solid #F1F5F9",
                    }}
                >
                    <div />
                    {days.map((d, i) => (
                        <div
                            key={d}
                            style={{ padding: "16px 12px", textAlign: "center", borderLeft: "1px solid #F1F5F9" }}
                        >
                            <div
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 700,
                                    fontSize: 10,
                                    color: "#94A3B8",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                {d}
                            </div>
                            <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 20, color: "#001944" }}>
                                {dates[i]}
                            </div>
                        </div>
                    ))}
                </div>
                <div
                    style={{
                        position: "relative",
                        display: "grid",
                        gridTemplateColumns: "52px repeat(5,1fr)",
                        minHeight: 420,
                    }}
                >
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        {hours.map((h) => (
                            <div
                                key={h}
                                style={{
                                    height: 70,
                                    padding: "6px 8px 0",
                                    fontFamily: "Inter",
                                    fontSize: 10,
                                    color: "#94A3B8",
                                    borderBottom: "1px solid #F8FAFC",
                                    flexShrink: 0,
                                }}
                            >
                                {h}
                            </div>
                        ))}
                    </div>
                    {days.map((d, di) => {
                        const dayCours = coursData.filter((c) => c.day === di);
                        return (
                            <div key={d} style={{ position: "relative", borderLeft: "1px solid #F1F5F9" }}>
                                {hours.map((h) => (
                                    <div key={h} style={{ height: 70, borderBottom: "1px solid #F8FAFC" }} />
                                ))}
                                {dayCours.map((c, ci) => (
                                    <div
                                        key={ci}
                                        style={{
                                            position: "absolute",
                                            left: 6,
                                            right: 6,
                                            top: c.top,
                                            height: c.height,
                                            backgroundColor: c.bg,
                                            borderRadius: 10,
                                            padding: "8px 10px",
                                            border: c.border || "none",
                                            cursor: "pointer",
                                            overflow: "hidden",
                                            boxShadow: c.bg === "#001944" ? "0 2px 8px rgba(0,25,68,0.2)" : "none",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 10,
                                                color: c.color === "#fff" ? "rgba(255,255,255,0.5)" : "#94A3B8",
                                                marginBottom: 4,
                                            }}
                                        >
                                            {c.time}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 12,
                                                color: c.color,
                                                lineHeight: 1.3,
                                                marginBottom: 6,
                                            }}
                                        >
                                            {c.title}
                                        </div>
                                        {c.lieu && (
                                            <div
                                                style={{
                                                    fontFamily: "Inter",
                                                    fontSize: 10,
                                                    color: c.color === "#fff" ? "rgba(255,255,255,0.6)" : "#64748B",
                                                    marginBottom: 4,
                                                }}
                                            >
                                                📍 {c.lieu}
                                            </div>
                                        )}
                                        {c.students && (
                                            <div
                                                style={{
                                                    backgroundColor:
                                                        c.color === "#fff" ? "rgba(199,210,254,0.2)" : "#EEF2FF",
                                                    borderRadius: 999,
                                                    padding: "2px 8px",
                                                    display: "inline-block",
                                                    fontFamily: "Inter",
                                                    fontWeight: 700,
                                                    fontSize: 9,
                                                    color: c.color === "#fff" ? "#C7D2FE" : "#002C6E",
                                                }}
                                            >
                                                {c.students} étudiants
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

Object.assign(window, {
    SupportsIntervenant,
    DocumentsEtudiantV2,
    Parametres,
    GestionUtilisateurs,
    PlanningIntervenant,
});
