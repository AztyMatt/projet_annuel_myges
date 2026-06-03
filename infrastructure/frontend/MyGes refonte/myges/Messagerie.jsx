// Messagerie
function Messagerie() {
    const [activeConv, setActiveConv] = React.useState(0);
    const [msg, setMsg] = React.useState("");
    const [messages, setMessages] = React.useState([
        [
            {
                from: "Lucas Martin",
                initials: "LM",
                time: "12:45",
                text: "Monsieur, j'ai une question concernant le TP de déploiement Kubernetes. Est-ce que la partie Helm est obligatoire ?",
                self: false,
            },
            {
                from: "Moi",
                initials: "LB",
                time: "13:02",
                text: "Oui, la partie Helm est bien attendue dans le rendu. Voir section 3 de l'énoncé.",
                self: true,
            },
            {
                from: "Lucas Martin",
                initials: "LM",
                time: "13:10",
                text: "Merci beaucoup ! Je vais retravailler cette partie.",
                self: false,
            },
        ],
        [
            {
                from: "Admin Scolarité",
                initials: "AS",
                time: "09:00",
                text: "Rappel : votre attestation de responsabilité est manquante pour le dossier Q4. Merci de la déposer avant le 25 octobre.",
                self: false,
            },
            {
                from: "Moi",
                initials: "LB",
                time: "09:30",
                text: "Bien reçu, je la dépose dès aujourd'hui.",
                self: true,
            },
        ],
        [
            {
                from: "Sophie Bernard",
                initials: "SB",
                time: "08:30",
                text: "Bonjour, merci pour le cours de ce matin ! Les ressources sont très bien organisées.",
                self: false,
            },
            {
                from: "Moi",
                initials: "LB",
                time: "08:45",
                text: "Avec plaisir ! N'hésitez pas si vous avez des questions.",
                self: true,
            },
        ],
    ]);

    const convs = [
        { name: "Lucas Martin", tag: "4ESGI-7", time: "12:45", preview: "Monsieur, j'ai une question...", unread: 2 },
        {
            name: "Admin Scolarité",
            tag: "Scolarité",
            time: "09:00",
            preview: "Rappel : votre attestation...",
            unread: 1,
        },
        {
            name: "Sophie Bernard",
            tag: "4ESGI-8",
            time: "08:30",
            preview: "Merci pour le cours de ce matin...",
            unread: 0,
        },
    ];

    const sendMsg = () => {
        if (!msg.trim()) return;
        const updated = [...messages];
        updated[activeConv] = [
            ...updated[activeConv],
            {
                from: "Moi",
                initials: "LB",
                time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
                text: msg.trim(),
                self: true,
            },
        ];
        setMessages(updated);
        setMsg("");
    };

    const colorForInitials = (init) => {
        const colors = { LM: "#002C6E", AS: "#1a4a1a", SB: "#4a1942", LB: "#001944" };
        return colors[init] || "#64748B";
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
                    marginBottom: 20,
                }}
            >
                Messagerie
            </div>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "300px 1fr",
                    gap: 0,
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    minHeight: 600,
                }}
            >
                {/* Conversations list */}
                <div style={{ borderRight: "1px solid #F1F5F9" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F5F9" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                backgroundColor: "#F3F4F5",
                                borderRadius: 10,
                                padding: "8px 12px",
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
                                placeholder="Rechercher..."
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
                    </div>
                    <div>
                        {convs.map((c, i) => (
                            <div
                                key={i}
                                onClick={() => setActiveConv(i)}
                                style={{
                                    padding: "16px 20px",
                                    cursor: "pointer",
                                    backgroundColor: activeConv === i ? "#EEF2FF" : "transparent",
                                    borderLeft: activeConv === i ? "3px solid #002C6E" : "3px solid transparent",
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "flex-start",
                                    transition: "background 0.1s",
                                }}
                            >
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: "50%",
                                        backgroundColor: colorForInitials(
                                            c.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join(""),
                                        ),
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 13,
                                        color: "#fff",
                                        flexShrink: 0,
                                    }}
                                >
                                    {c.name
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
                                            marginBottom: 3,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 13,
                                                color: "#001944",
                                            }}
                                        >
                                            {c.name}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontSize: 10,
                                                color: "#94A3B8",
                                                flexShrink: 0,
                                            }}
                                        >
                                            {c.time}
                                        </div>
                                    </div>
                                    <div
                                        style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8", marginBottom: 4 }}
                                    >
                                        {c.tag}
                                    </div>
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontSize: 12,
                                                color: "#64748B",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                maxWidth: 150,
                                            }}
                                        >
                                            {c.preview}
                                        </div>
                                        {c.unread > 0 && (
                                            <div
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: "50%",
                                                    backgroundColor: "#BA1A1A",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    fontFamily: "Inter",
                                                    fontWeight: 700,
                                                    fontSize: 10,
                                                    color: "#fff",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {c.unread}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div
                        style={{
                            padding: "16px 24px",
                            borderBottom: "1px solid #F1F5F9",
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                backgroundColor: colorForInitials(
                                    convs[activeConv].name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join(""),
                                ),
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 12,
                                color: "#fff",
                            }}
                        >
                            {convs[activeConv].name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                        </div>
                        <div>
                            <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 14, color: "#001944" }}>
                                {convs[activeConv].name}
                            </div>
                            <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                                {convs[activeConv].tag}
                            </div>
                        </div>
                    </div>

                    <div
                        style={{
                            flex: 1,
                            padding: "20px 24px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                            overflowY: "auto",
                            maxHeight: 460,
                        }}
                    >
                        {messages[activeConv].map((m, i) => (
                            <div
                                key={i}
                                style={{
                                    display: "flex",
                                    justifyContent: m.self ? "flex-end" : "flex-start",
                                    gap: 10,
                                    alignItems: "flex-end",
                                }}
                            >
                                {!m.self && (
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: "50%",
                                            backgroundColor: colorForInitials(m.initials),
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontFamily: "Inter",
                                            fontWeight: 700,
                                            fontSize: 10,
                                            color: "#fff",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {m.initials}
                                    </div>
                                )}
                                <div style={{ maxWidth: "65%" }}>
                                    <div
                                        style={{
                                            backgroundColor: m.self ? "#001944" : "#F3F4F5",
                                            color: m.self ? "#fff" : "#001944",
                                            borderRadius: m.self ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                                            padding: "10px 14px",
                                            fontFamily: "Inter",
                                            fontSize: 13,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {m.text}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "Inter",
                                            fontSize: 10,
                                            color: "#94A3B8",
                                            marginTop: 4,
                                            textAlign: m.self ? "right" : "left",
                                        }}
                                    >
                                        {m.time}
                                    </div>
                                </div>
                                {m.self && (
                                    <div
                                        style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: "50%",
                                            backgroundColor: "#001944",
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
                                        LB
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div
                        style={{
                            padding: "16px 24px",
                            borderTop: "1px solid #F1F5F9",
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                        }}
                    >
                        <input
                            value={msg}
                            onChange={(e) => setMsg(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMsg()}
                            placeholder="Écrire un message..."
                            style={{
                                flex: 1,
                                padding: "10px 16px",
                                borderRadius: 999,
                                border: "1px solid #E2E8F0",
                                fontFamily: "Inter",
                                fontSize: 13,
                                color: "#001944",
                                outline: "none",
                                backgroundColor: "#F8F9FA",
                            }}
                        />
                        <button
                            onClick={sendMsg}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: "50%",
                                border: "none",
                                backgroundColor: "#001944",
                                color: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            >
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

Object.assign(window, { Messagerie });
