// Absences view
function AbsencesEtudiant() {
    const [showForm, setShowForm] = React.useState(false);
    const [motif, setMotif] = React.useState("Maladie");

    const absences = [
        {
            date: "14 Oct 2023",
            module: "UX Design Advanced",
            type: "Maladie",
            statut: "Justifiée",
            statutColor: "#16803C",
            statutBg: "#DCFCE7",
            doc: "certificat_med.pdf",
        },
        {
            date: "08 Oct 2023",
            module: "Gestion de Projet Agile",
            type: "Entreprise",
            statut: "Justifiée",
            statutColor: "#16803C",
            statutBg: "#DCFCE7",
            doc: "convoc_rh.pdf",
        },
        {
            date: "02 Oct 2023",
            module: "Architecture Cloud",
            type: "Personnel",
            statut: "Injustifiée",
            statutColor: "#BA1A1A",
            statutBg: "#FEE2E2",
            doc: null,
        },
        {
            date: "25 Sep 2023",
            module: "Soft Skills & Com.",
            type: "Transport",
            statut: "En attente",
            statutColor: "#92400E",
            statutBg: "#FEF3C7",
            doc: "attestation_sncf.pdf",
        },
        {
            date: "18 Sep 2023",
            module: "Cybersécurité Avancée",
            type: "Maladie",
            statut: "Justifiée",
            statutColor: "#16803C",
            statutBg: "#DCFCE7",
            doc: "cert_medecin.pdf",
        },
        {
            date: "12 Sep 2023",
            module: "Algorithmique Avancée",
            type: "Personnel",
            statut: "Injustifiée",
            statutColor: "#BA1A1A",
            statutBg: "#FEE2E2",
            doc: null,
        },
    ];

    return (
        <div>
            <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}
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
                        Absences & Assiduité
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 14, color: "#64748B" }}>
                        Suivi de votre présence et gestion des justificatifs
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        backgroundColor: "#001944",
                        color: "#C7D2FE",
                        border: "none",
                        borderRadius: 999,
                        padding: "12px 24px",
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    + Déclarer une absence
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                {[
                    { label: "Total absences", value: "6", sub: "ce semestre", color: "#001944", bg: "#fff" },
                    { label: "Justifiées", value: "4", sub: "66% du total", color: "#16803C", bg: "#DCFCE7" },
                    { label: "Injustifiées", value: "2", sub: "Seuil: 10h", color: "#BA1A1A", bg: "#FEE2E2" },
                    { label: "En attente", value: "1", sub: "Justificatif requis", color: "#92400E", bg: "#FEF3C7" },
                ].map((s, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: s.bg,
                            border: `1px solid ${s.bg === "#fff" ? "#F1F5F9" : "transparent"}`,
                            borderRadius: 16,
                            padding: "20px 22px",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 10,
                                color: s.color === "#001944" ? "#94A3B8" : s.color,
                                letterSpacing: "0.8px",
                                textTransform: "uppercase",
                                marginBottom: 8,
                                opacity: 0.8,
                            }}
                        >
                            {s.label}
                        </div>
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 800,
                                fontSize: 32,
                                color: s.color,
                                marginBottom: 4,
                            }}
                        >
                            {s.value}
                        </div>
                        <div style={{ fontFamily: "Inter", fontSize: 11, color: s.color, opacity: 0.7 }}>{s.sub}</div>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 16,
                    padding: "20px 24px",
                    marginBottom: 20,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13, color: "#001944" }}>
                        Taux de présence
                    </span>
                    <span style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13, color: "#16803C" }}>94.2%</span>
                </div>
                <div style={{ height: 8, backgroundColor: "#E2E8F0", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: "94.2%", height: "100%", backgroundColor: "#16803C", borderRadius: 999 }} />
                </div>
                <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
                    Seuil critique à 80% — vous êtes en bonne position
                </div>
            </div>

            {/* Table */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                }}
            >
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9" }}>
                    <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 16, color: "#001944" }}>
                        Historique des absences
                    </div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#F8F9FA" }}>
                            {["DATE", "MODULE", "MOTIF", "STATUT", "JUSTIFICATIF", "ACTION"].map((h) => (
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
                        {absences.map((a, i) => (
                            <tr
                                key={i}
                                style={{ borderTop: "1px solid #F1F5F9" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <td
                                    style={{
                                        padding: "14px 20px",
                                        fontFamily: "Inter",
                                        fontSize: 13,
                                        color: "#374151",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {a.date}
                                </td>
                                <td
                                    style={{
                                        padding: "14px 20px",
                                        fontFamily: "Inter",
                                        fontWeight: 600,
                                        fontSize: 13,
                                        color: "#001944",
                                    }}
                                >
                                    {a.module}
                                </td>
                                <td
                                    style={{
                                        padding: "14px 20px",
                                        fontFamily: "Inter",
                                        fontSize: 13,
                                        color: "#64748B",
                                    }}
                                >
                                    {a.type}
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                    <span
                                        style={{
                                            backgroundColor: a.statutBg,
                                            color: a.statutColor,
                                            borderRadius: 999,
                                            padding: "3px 10px",
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 11,
                                        }}
                                    >
                                        {a.statut}
                                    </span>
                                </td>
                                <td
                                    style={{
                                        padding: "14px 20px",
                                        fontFamily: "Inter",
                                        fontSize: 12,
                                        color: a.doc ? "#6B95F3" : "#94A3B8",
                                    }}
                                >
                                    {a.doc ? `📄 ${a.doc}` : "—"}
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                    {!a.doc && a.statut !== "Justifiée" && (
                                        <button
                                            style={{
                                                backgroundColor: "#001944",
                                                color: "#C7D2FE",
                                                border: "none",
                                                borderRadius: 8,
                                                padding: "5px 12px",
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 11,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Déposer
                                        </button>
                                    )}
                                    {a.statut === "Injustifiée" && a.doc === null && (
                                        <span style={{ fontFamily: "Inter", fontSize: 11, color: "#BA1A1A" }}>
                                            Requiert justificatif
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showForm && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 500,
                    }}
                    onClick={() => setShowForm(false)}
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
                                marginBottom: 6,
                            }}
                        >
                            Déclarer une absence
                        </div>
                        <div style={{ fontFamily: "Inter", fontSize: 13, color: "#94A3B8", marginBottom: 24 }}>
                            Le justificatif devra être déposé sous 48h
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {[{ label: "Date(s) d'absence", type: "date" }].map((f, i) => (
                                <div key={i}>
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
                                        {f.label}
                                    </label>
                                    <input
                                        type={f.type}
                                        style={{
                                            width: "100%",
                                            padding: "10px 14px",
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
                                    Motif
                                </label>
                                <select
                                    value={motif}
                                    onChange={(e) => setMotif(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "10px 14px",
                                        borderRadius: 10,
                                        border: "1px solid #E2E8F0",
                                        fontFamily: "Inter",
                                        fontSize: 13,
                                        color: "#001944",
                                        outline: "none",
                                        boxSizing: "border-box",
                                    }}
                                >
                                    {["Maladie", "Entreprise", "Transport", "Personnel", "Autre"].map((m) => (
                                        <option key={m}>{m}</option>
                                    ))}
                                </select>
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
                                    Justificatif (optionnel)
                                </label>
                                <div
                                    style={{
                                        border: "2px dashed #E2E8F0",
                                        borderRadius: 10,
                                        padding: "24px",
                                        textAlign: "center",
                                        cursor: "pointer",
                                        backgroundColor: "#F8F9FA",
                                    }}
                                >
                                    <div style={{ fontSize: 24, marginBottom: 8 }}>📎</div>
                                    <div style={{ fontFamily: "Inter", fontSize: 12, color: "#94A3B8" }}>
                                        Glissez un fichier ou cliquez pour sélectionner
                                    </div>
                                    <div style={{ fontFamily: "Inter", fontSize: 10, color: "#CBD5E1", marginTop: 4 }}>
                                        PDF, JPG, PNG — max 5MB
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                            <button
                                onClick={() => setShowForm(false)}
                                style={{
                                    flex: 1,
                                    padding: "12px",
                                    borderRadius: 10,
                                    border: "1px solid #E2E8F0",
                                    backgroundColor: "#fff",
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    cursor: "pointer",
                                    color: "#374151",
                                }}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={() => setShowForm(false)}
                                style={{
                                    flex: 1,
                                    padding: "12px",
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

Object.assign(window, { AbsencesEtudiant });
