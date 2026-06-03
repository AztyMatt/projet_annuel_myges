// TopBar component
const topBarStyles = {
    bar: {
        position: "fixed",
        top: 0,
        left: 256,
        right: 0,
        height: 64,
        zIndex: 90,
        backgroundColor: "rgba(248,250,252,0.9)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(226,232,240,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
    },
    title: { fontFamily: "Manrope", fontWeight: 700, fontSize: 20, color: "#001944", letterSpacing: "-0.5px" },
    right: { display: "flex", alignItems: "center", gap: 16 },
    roleTag: {
        fontFamily: "Manrope",
        fontWeight: 500,
        fontSize: 14,
        color: "#31307e",
        letterSpacing: "-0.3px",
    },
    searchBar: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F3F4F5",
        borderRadius: 999,
        padding: "6px 16px 6px 12px",
        width: 260,
    },
    searchInput: {
        border: "none",
        background: "transparent",
        outline: "none",
        fontFamily: "Manrope",
        fontWeight: 500,
        fontSize: 12,
        color: "#374151",
        width: "100%",
    },
    notifBtn: {
        position: "relative",
        width: 36,
        height: 36,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        color: "#767683",
    },
    notifDot: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 8,
        height: 8,
        borderRadius: "50%",
        backgroundColor: "#BA1A1A",
        border: "2px solid #F8FAFC",
    },
};

const ROLE_LABELS = {
    etudiant: "Rôle : Étudiant",
    intervenant: "Rôle : Intervenant",
    scolarite: "Rôle : Scolarité",
    superadmin: "ROOT ACCESS",
};

function TopBar({ role, pageTitle, onRoleSwitch, roles }) {
    const [search, setSearch] = React.useState("");

    return (
        <div style={topBarStyles.bar}>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        backgroundColor: "#F3F4F5",
                        borderRadius: 999,
                        padding: "6px 16px 6px 12px",
                        width: 260,
                    }}
                >
                    <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#767683"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        style={topBarStyles.searchInput}
                        placeholder="Rechercher un module, un étudiant..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div style={topBarStyles.right}>
                <span style={topBarStyles.roleTag}>{ROLE_LABELS[role] || ""}</span>
                {roles && roles.length > 1 && (
                    <div style={{ position: "relative" }}>
                        <select
                            key={role}
                            defaultValue={role}
                            onChange={(e) => onRoleSwitch(e.target.value)}
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 12,
                                color: "#001944",
                                backgroundColor: "#E7E8E9",
                                border: "none",
                                borderRadius: 8,
                                padding: "6px 28px 6px 12px",
                                cursor: "pointer",
                                outline: "none",
                                appearance: "none",
                            }}
                        >
                            {roles.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                        <svg
                            style={{
                                position: "absolute",
                                right: 8,
                                top: "50%",
                                transform: "translateY(-50%)",
                                pointerEvents: "none",
                            }}
                            width="10"
                            height="6"
                            viewBox="0 0 10 6"
                            fill="#001944"
                        >
                            <path d="M1 1l4 4 4-4" />
                        </svg>
                    </div>
                )}
                <div style={topBarStyles.notifBtn}>
                    <svg
                        width="16"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#767683"
                        strokeWidth="2"
                        strokeLinecap="round"
                    >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <div style={topBarStyles.notifDot} />
                </div>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        backgroundColor: "#002C6E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Inter",
                        fontWeight: 700,
                        fontSize: 12,
                        color: "#fff",
                        cursor: "pointer",
                    }}
                >
                    {role === "etudiant" ? "LB" : role === "intervenant" ? "JD" : role === "scolarite" ? "AS" : "AP"}
                </div>
            </div>
        </div>
    );
}

Object.assign(window, { TopBar });
