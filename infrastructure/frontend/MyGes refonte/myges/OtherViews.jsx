// Saisie des Notes - Intervenant + Documents page
function SaisieNotes() {
    const [notes, setNotes] = React.useState({
        "Lucas Bernard": 16.5,
        "Marie Dubois": 14,
        "Thomas Roche": 12.5,
        "Emma Petit": 18,
        "Julien Moreau": 11,
        "Sophie Laurent": 15,
    });
    const [editing, setEditing] = React.useState(null);
    const [saved, setSaved] = React.useState(false);
    const [gelé, setGelé] = React.useState(false);
    const [module, setModule] = React.useState("Architecture Cloud & DevOps");

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const students = Object.entries(notes);
    const avg = (students.reduce((a, [, n]) => a + n, 0) / students.length).toFixed(2);

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
                        Saisie des Notes
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 14, color: "#64748B" }}>
                        Saisissez les notes de vos étudiants pour chaque évaluation
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        onClick={() => setGelé((g) => !g)}
                        style={{
                            padding: "10px 18px",
                            borderRadius: 10,
                            border: `1.5px solid ${gelé ? "#BA1A1A" : "#E2E8F0"}`,
                            backgroundColor: gelé ? "rgba(186,26,26,0.06)" : "#fff",
                            color: gelé ? "#BA1A1A" : "#374151",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                        }}
                    >
                        {gelé ? "🔒 Notes gelées" : "🔓 Geler les notes"}
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: "10px 20px",
                            borderRadius: 10,
                            border: "none",
                            backgroundColor: saved ? "#16803C" : "#001944",
                            color: saved ? "#fff" : "#C7D2FE",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            transition: "background 0.2s",
                        }}
                    >
                        {saved ? "✓ Sauvegardé" : "Sauvegarder"}
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
                        marginBottom: 20,
                        fontFamily: "Inter",
                        fontSize: 13,
                        color: "#BA1A1A",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    🔒 Notes gelées pour ce module. Aucune modification n'est possible jusqu'au jury.
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
                {[
                    {
                        label: "Étudiants évalués",
                        value: `${students.length}/${students.length}`,
                        color: "#16803C",
                        bg: "#DCFCE7",
                    },
                    { label: "Moyenne de classe", value: avg, suffix: "/20", color: "#001944", bg: "#fff" },
                    { label: "Module", value: module.split(" ")[0], suffix: "...", color: "#002C6E", bg: "#EEF2FF" },
                ].map((s, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: s.bg,
                            border: s.bg === "#fff" ? "1px solid #F1F5F9" : "none",
                            borderRadius: 14,
                            padding: "20px",
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
                            <span style={{ fontSize: 14, opacity: 0.5 }}>{s.suffix}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    marginBottom: 20,
                }}
            >
                <div
                    style={{
                        padding: "20px 24px",
                        borderBottom: "1px solid #F1F5F9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <select
                            value={module}
                            onChange={(e) => setModule(e.target.value)}
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 16,
                                color: "#001944",
                                border: "none",
                                outline: "none",
                                backgroundColor: "transparent",
                                cursor: "pointer",
                            }}
                        >
                            {["Architecture Cloud & DevOps", "Cybersécurité Avancée", "Gestion de Projet Agile"].map(
                                (m) => (
                                    <option key={m}>{m}</option>
                                ),
                            )}
                        </select>
                        <div style={{ fontFamily: "Inter", fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                            Examen final — Semestre 1, 2024/2025
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
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
                            ↓ Exporter CSV
                        </button>
                    </div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#F8F9FA" }}>
                            {["ÉTUDIANT", "STATUT", "NOTE /20", "MENTION", "COMMENTAIRE", ""].map((h) => (
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
                        {students.map(([name, note], i) => {
                            const mention =
                                note >= 16 ? "TB" : note >= 14 ? "B" : note >= 12 ? "AB" : note >= 10 ? "P" : "F";
                            const mentionColor =
                                note >= 16
                                    ? "#16803C"
                                    : note >= 14
                                      ? "#002C6E"
                                      : note >= 12
                                        ? "#92400E"
                                        : note >= 10
                                          ? "#64748B"
                                          : "#BA1A1A";
                            const mentionBg =
                                note >= 16
                                    ? "#DCFCE7"
                                    : note >= 14
                                      ? "#EEF2FF"
                                      : note >= 12
                                        ? "#FEF3C7"
                                        : note >= 10
                                          ? "#F1F5F9"
                                          : "#FEE2E2";
                            const isEditing = editing === name && !gelé;

                            return (
                                <tr key={i} style={{ borderTop: "1px solid #F1F5F9" }}>
                                    <td style={{ padding: "14px 20px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div
                                                style={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: "50%",
                                                    backgroundColor: [
                                                        "#002C6E",
                                                        "#4a1942",
                                                        "#1a4a1a",
                                                        "#4a1a1a",
                                                        "#1a3a4a",
                                                        "#3a2a1a",
                                                    ][i % 6],
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontFamily: "Inter",
                                                    fontWeight: 700,
                                                    fontSize: 11,
                                                    color: "#fff",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
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
                                                    {name}
                                                </div>
                                                <div style={{ fontFamily: "Inter", fontSize: 10, color: "#94A3B8" }}>
                                                    4ESGI-7
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <span
                                            style={{
                                                backgroundColor: "#DCFCE7",
                                                color: "#16803C",
                                                borderRadius: 999,
                                                padding: "3px 10px",
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 11,
                                            }}
                                        >
                                            Présent
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        {isEditing ? (
                                            <input
                                                autoFocus
                                                type="number"
                                                min="0"
                                                max="20"
                                                step="0.5"
                                                value={note}
                                                onChange={(e) =>
                                                    setNotes((n) => ({ ...n, [name]: parseFloat(e.target.value) || 0 }))
                                                }
                                                onBlur={() => setEditing(null)}
                                                style={{
                                                    width: 60,
                                                    padding: "4px 8px",
                                                    borderRadius: 8,
                                                    border: "2px solid #002C6E",
                                                    fontFamily: "Inter",
                                                    fontWeight: 700,
                                                    fontSize: 14,
                                                    color: "#001944",
                                                    outline: "none",
                                                }}
                                            />
                                        ) : (
                                            <div
                                                onClick={() => !gelé && setEditing(name)}
                                                style={{
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    minWidth: 44,
                                                    height: 32,
                                                    borderRadius: 8,
                                                    backgroundColor: mentionBg,
                                                    fontFamily: "Inter",
                                                    fontWeight: 700,
                                                    fontSize: 15,
                                                    color: mentionColor,
                                                    cursor: gelé ? "default" : "pointer",
                                                    padding: "0 10px",
                                                }}
                                            >
                                                {note}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <span
                                            style={{
                                                backgroundColor: mentionBg,
                                                color: mentionColor,
                                                borderRadius: 6,
                                                padding: "3px 10px",
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 11,
                                            }}
                                        >
                                            {mention}
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <input
                                            placeholder="Ajouter un commentaire..."
                                            disabled={gelé}
                                            style={{
                                                border: "none",
                                                backgroundColor: "transparent",
                                                fontFamily: "Inter",
                                                fontSize: 12,
                                                color: "#64748B",
                                                outline: "none",
                                                width: "100%",
                                                cursor: gelé ? "default" : "text",
                                            }}
                                        />
                                    </td>
                                    <td style={{ padding: "14px 20px" }}>
                                        <button
                                            onClick={() => !gelé && setEditing(name)}
                                            disabled={gelé}
                                            style={{
                                                padding: "5px 12px",
                                                borderRadius: 8,
                                                border: "1px solid #E2E8F0",
                                                backgroundColor: gelé ? "#F8F9FA" : "#fff",
                                                fontFamily: "Inter",
                                                fontWeight: 600,
                                                fontSize: 11,
                                                color: gelé ? "#94A3B8" : "#374151",
                                                cursor: gelé ? "default" : "pointer",
                                            }}
                                        >
                                            ✏️
                                        </button>
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

function DocumentsEtudiant() {
    const docs = [
        {
            name: "Contrat d'alternance 2023-2024",
            type: "Contrat",
            date: "01 Sep 2023",
            status: "Signé",
            statusColor: "#16803C",
            statusBg: "#DCFCE7",
            size: "245 KB",
        },
        {
            name: "Convention de formation",
            type: "Convention",
            date: "01 Sep 2023",
            status: "Signé",
            statusColor: "#16803C",
            statusBg: "#DCFCE7",
            size: "189 KB",
        },
        {
            name: "Attestation de Responsabilité Q4",
            type: "Attestation",
            date: "—",
            status: "Manquant",
            statusColor: "#BA1A1A",
            statusBg: "#FEE2E2",
            size: "—",
        },
        {
            name: "Livret d'alternant",
            type: "Guide",
            date: "01 Sep 2023",
            status: "Disponible",
            statusColor: "#002C6E",
            statusBg: "#EEF2FF",
            size: "1.2 MB",
        },
        {
            name: "Avenant au contrat — Oct 2023",
            type: "Avenant",
            date: "10 Oct 2023",
            status: "En attente",
            statusColor: "#92400E",
            statusBg: "#FEF3C7",
            size: "98 KB",
        },
    ];

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
                Documents & Dossier
            </div>
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
                        padding: "20px 24px",
                        borderBottom: "1px solid #F1F5F9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 16, color: "#001944" }}>
                        Mes Documents
                    </div>
                    <button
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
                        + Déposer un document
                    </button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#F8F9FA" }}>
                            {["NOM", "TYPE", "DATE", "TAILLE", "STATUT", "ACTIONS"].map((h) => (
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
                        {docs.map((d, i) => (
                            <tr
                                key={i}
                                style={{ borderTop: "1px solid #F1F5F9" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <td style={{ padding: "14px 20px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <span style={{ fontSize: 18 }}>📄</span>
                                        <span
                                            style={{
                                                fontFamily: "Inter",
                                                fontWeight: 600,
                                                fontSize: 13,
                                                color: "#001944",
                                            }}
                                        >
                                            {d.name}
                                        </span>
                                    </div>
                                </td>
                                <td
                                    style={{
                                        padding: "14px 20px",
                                        fontFamily: "Inter",
                                        fontSize: 12,
                                        color: "#64748B",
                                    }}
                                >
                                    {d.type}
                                </td>
                                <td
                                    style={{
                                        padding: "14px 20px",
                                        fontFamily: "Inter",
                                        fontSize: 12,
                                        color: "#64748B",
                                    }}
                                >
                                    {d.date}
                                </td>
                                <td
                                    style={{
                                        padding: "14px 20px",
                                        fontFamily: "Inter",
                                        fontSize: 12,
                                        color: "#64748B",
                                    }}
                                >
                                    {d.size}
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                    <span
                                        style={{
                                            backgroundColor: d.statusBg,
                                            color: d.statusColor,
                                            borderRadius: 999,
                                            padding: "3px 10px",
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 11,
                                        }}
                                    >
                                        {d.status}
                                    </span>
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        {d.status !== "Manquant" && (
                                            <button
                                                style={{
                                                    padding: "5px 10px",
                                                    borderRadius: 8,
                                                    border: "1px solid #E2E8F0",
                                                    backgroundColor: "#fff",
                                                    fontFamily: "Inter",
                                                    fontSize: 11,
                                                    color: "#374151",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                ↓ Télécharger
                                            </button>
                                        )}
                                        {d.status === "Manquant" && (
                                            <button
                                                style={{
                                                    padding: "5px 10px",
                                                    borderRadius: 8,
                                                    border: "none",
                                                    backgroundColor: "#BA1A1A",
                                                    color: "#fff",
                                                    fontFamily: "Inter",
                                                    fontWeight: 700,
                                                    fontSize: 11,
                                                    cursor: "pointer",
                                                }}
                                            >
                                                Déposer
                                            </button>
                                        )}
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

Object.assign(window, { SaisieNotes, DocumentsEtudiant });
