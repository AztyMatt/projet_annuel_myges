// Dashboard Super Admin — ergonomique, layout fixé
function DashboardSuperAdmin({ onNavigate }) {
    const [activeTab, setActiveTab] = React.useState("audit");
    const [lockdown, setLockdown] = React.useState(false);
    const [twoFA, setTwoFA] = React.useState(true);

    const auditLogs = [
        {
            time: "14:22:01",
            date: "2023-11-24",
            actor: "Jean Dupont",
            actorId: "admin_id: 992",
            initials: "JD",
            action: "DELETE_USER_DATA",
            resource: "student://ID_8219",
            status: "CRITICAL",
            ip: "192.168.1.42",
            color: "#BA1A1A",
            bg: "#FEE2E2",
        },
        {
            time: "14:18:45",
            date: "2023-11-24",
            actor: "CronScheduler",
            actorId: "automated_task",
            initials: "SYS",
            action: "BACKUP_GENERATE",
            resource: "s3://nightly_db",
            status: "SUCCESS",
            ip: "127.0.0.1",
            color: "#16803C",
            bg: "#DCFCE7",
        },
        {
            time: "13:55:12",
            date: "2023-11-24",
            actor: "Marie Laurent",
            actorId: "manager_id: 104",
            initials: "ML",
            action: "ACCESS_DENIED",
            resource: "vault://root_keys/ssh",
            status: "WARNING",
            ip: "10.0.4.8",
            color: "#92400E",
            bg: "#FEF3C7",
        },
        {
            time: "13:40:02",
            date: "2023-11-24",
            actor: "Admin Principal",
            actorId: "root_id: 0",
            initials: "AP",
            action: "PERMISSION_UPDATE",
            resource: "role://external_auditor",
            status: "INFO",
            ip: "82.10.45.1",
            color: "#002C6E",
            bg: "#EEF2FF",
        },
        {
            time: "13:28:14",
            date: "2023-11-24",
            actor: "Lucas Bernard",
            actorId: "student: 2341",
            initials: "LB",
            action: "LOGIN_SUCCESS",
            resource: "auth://portal",
            status: "SUCCESS",
            ip: "91.208.15.3",
            color: "#16803C",
            bg: "#DCFCE7",
        },
    ];

    const roleData = [
        { name: "Étudiant Initiale", users: 482, permissions: 12, color: "#002C6E", bg: "#EEF2FF" },
        { name: "Étudiant Alternance", users: 766, permissions: 15, color: "#7B2E12", bg: "#FFF3EE" },
        { name: "Intervenant", users: 148, permissions: 22, color: "#16803C", bg: "#F0FDF4" },
        { name: "Admin Scolarité", users: 12, permissions: 48, color: "#92400E", bg: "#FEF3C7" },
        { name: "Super Admin", users: 4, permissions: 999, color: "#BA1A1A", bg: "#FEE2E2" },
    ];

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
                        Security Command Center
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 13, color: "#64748B" }}>
                        Infrastructure monitoring & forensic audit trail
                    </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    <button
                        style={{
                            padding: "10px 16px",
                            borderRadius: 10,
                            border: "1.5px solid #E2E8F0",
                            backgroundColor: "#fff",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 12,
                            color: "#374151",
                            cursor: "pointer",
                        }}
                    >
                        ↓ Export Report
                    </button>
                    <button
                        onClick={() => setLockdown((l) => !l)}
                        style={{
                            padding: "10px 16px",
                            borderRadius: 10,
                            border: "none",
                            backgroundColor: lockdown ? "#BA1A1A" : "#001944",
                            color: lockdown ? "#fff" : "#C7D2FE",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            boxShadow: lockdown ? "0 0 0 3px rgba(186,26,26,0.25)" : "none",
                            transition: "all 0.2s",
                        }}
                    >
                        🔒 {lockdown ? "VERROUILLÉ — Cliquer pour déverrouiller" : "System Lockdown"}
                    </button>
                </div>
            </div>

            {lockdown && (
                <div
                    style={{
                        backgroundColor: "rgba(186,26,26,0.1)",
                        border: "2px solid #BA1A1A",
                        borderRadius: 14,
                        padding: "12px 18px",
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                    }}
                >
                    <span style={{ fontSize: 18 }}>🚨</span>
                    <div>
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 13,
                                color: "#BA1A1A",
                                marginBottom: 2,
                            }}
                        >
                            SYSTEM LOCKDOWN ACTIF
                        </div>
                        <div style={{ fontFamily: "Inter", fontSize: 12, color: "#64748B" }}>
                            Accès suspendus pour tous les rôles non-admin. Seuls les Super Admins peuvent agir.
                        </div>
                    </div>
                </div>
            )}

            {/* Infrastructure row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                {/* Docker */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 18,
                        padding: "20px 22px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 14,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    backgroundColor: "#EEF2FF",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                }}
                            >
                                🐳
                            </div>
                            <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 16, color: "#001944" }}>
                                Docker Services
                            </div>
                        </div>
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
                            HEALTHY
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                        }}
                    >
                        <span style={{ fontFamily: "Inter", fontSize: 12, color: "#64748B" }}>Active Containers</span>
                        <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 18, color: "#001944" }}>
                            14/14
                        </span>
                    </div>
                    <div
                        style={{
                            height: 5,
                            backgroundColor: "#E2E8F0",
                            borderRadius: 999,
                            overflow: "hidden",
                            marginBottom: 12,
                        }}
                    >
                        <div style={{ width: "100%", height: "100%", backgroundColor: "#16803C", borderRadius: 999 }} />
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        {["api_gateway: v2.4.1", "auth_service: v1.9.0"].map((tag) => (
                            <span
                                key={tag}
                                style={{
                                    backgroundColor: "#F8F9FA",
                                    border: "1px solid #E2E8F0",
                                    borderRadius: 6,
                                    padding: "3px 8px",
                                    fontFamily: "monospace",
                                    fontSize: 10,
                                    color: "#374151",
                                }}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* PostgreSQL */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 18,
                        padding: "20px 22px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 14,
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 10,
                                    backgroundColor: "#FFF3EE",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 18,
                                }}
                            >
                                🗄️
                            </div>
                            <div style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 16, color: "#001944" }}>
                                PostgreSQL Clusters
                            </div>
                        </div>
                        <span
                            style={{
                                backgroundColor: "#FEF3C7",
                                color: "#92400E",
                                borderRadius: 999,
                                padding: "3px 10px",
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 11,
                            }}
                        >
                            LATENCY: 12ms
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                        }}
                    >
                        <span style={{ fontFamily: "Inter", fontSize: 12, color: "#64748B" }}>Read/Write Load</span>
                        <span style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 18, color: "#001944" }}>
                            24% capacity
                        </span>
                    </div>
                    <div
                        style={{
                            height: 5,
                            backgroundColor: "#E2E8F0",
                            borderRadius: 999,
                            overflow: "hidden",
                            marginBottom: 8,
                        }}
                    >
                        <div style={{ width: "24%", height: "100%", backgroundColor: "#92400E", borderRadius: 999 }} />
                    </div>
                    <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                        Last backup: 14 mins ago · Encrypted AES-256
                    </div>
                </div>
            </div>

            {/* Security params + KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                <div style={{ backgroundColor: "#001944", borderRadius: 18, padding: "18px 20px" }}>
                    <div
                        style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 14 }}
                    >
                        🔐 Security Parameters
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                            padding: "10px 12px",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            borderRadius: 10,
                        }}
                    >
                        <span style={{ fontFamily: "Inter", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                            Force 2FA (Staff)
                        </span>
                        <div
                            onClick={() => setTwoFA((v) => !v)}
                            style={{
                                width: 40,
                                height: 22,
                                backgroundColor: twoFA ? "#6B95F3" : "rgba(255,255,255,0.15)",
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
                                    left: twoFA ? 20 : 3,
                                    width: 16,
                                    height: 16,
                                    borderRadius: "50%",
                                    backgroundColor: "#fff",
                                    transition: "left 0.2s",
                                }}
                            />
                        </div>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 12,
                            padding: "10px 12px",
                            backgroundColor: "rgba(255,255,255,0.06)",
                            borderRadius: 10,
                        }}
                    >
                        <span style={{ fontFamily: "Inter", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                            Expiry (90 Days)
                        </span>
                        <span
                            style={{
                                backgroundColor: "rgba(107,149,243,0.2)",
                                borderRadius: 6,
                                padding: "2px 8px",
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 10,
                                color: "#C7D2FE",
                            }}
                        >
                            ENABLED
                        </span>
                    </div>
                    <button
                        style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: 8,
                            border: "1px solid rgba(255,255,255,0.15)",
                            backgroundColor: "transparent",
                            color: "#C7D2FE",
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 11,
                            cursor: "pointer",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                        }}
                    >
                        Manage Keys
                    </button>
                </div>
                <div
                    style={{
                        backgroundColor: "#F8F9FA",
                        borderRadius: 18,
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <span style={{ fontSize: 28 }}>👥</span>
                    <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 32, color: "#001944" }}>12</div>
                    <div
                        style={{
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 10,
                            color: "#94A3B8",
                            letterSpacing: "0.8px",
                            textTransform: "uppercase",
                        }}
                    >
                        Total Staff Roles
                    </div>
                    <button
                        onClick={() => onNavigate && onNavigate("gestion")}
                        style={{
                            marginTop: 8,
                            padding: "6px 16px",
                            borderRadius: 8,
                            border: "1px solid #E2E8F0",
                            backgroundColor: "#fff",
                            fontFamily: "Inter",
                            fontWeight: 600,
                            fontSize: 11,
                            color: "#001944",
                            cursor: "pointer",
                        }}
                    >
                        Gérer les rôles →
                    </button>
                </div>
                <div
                    style={{
                        backgroundColor: "#FEE2E2",
                        borderRadius: 18,
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 6,
                    }}
                >
                    <span style={{ fontSize: 28 }}>🔑</span>
                    <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 32, color: "#BA1A1A" }}>4</div>
                    <div
                        style={{
                            fontFamily: "Inter",
                            fontWeight: 700,
                            fontSize: 10,
                            color: "#BA1A1A",
                            letterSpacing: "0.8px",
                            textTransform: "uppercase",
                            opacity: 0.7,
                        }}
                    >
                        Privileged Accounts
                    </div>
                    <button
                        onClick={() => onNavigate && onNavigate("gestion")}
                        style={{
                            marginTop: 8,
                            padding: "6px 16px",
                            borderRadius: 8,
                            border: "1px solid rgba(186,26,26,0.2)",
                            backgroundColor: "rgba(255,255,255,0.6)",
                            fontFamily: "Inter",
                            fontWeight: 600,
                            fontSize: 11,
                            color: "#BA1A1A",
                            cursor: "pointer",
                        }}
                    >
                        Voir les comptes →
                    </button>
                </div>
            </div>

            {/* Audit log */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                }}
            >
                <div style={{ display: "flex", borderBottom: "1px solid #F1F5F9", flexWrap: "wrap" }}>
                    {[
                        ["audit", "🔍 Audit Log"],
                        ["roles", "🛡 Identity & Roles"],
                        ["access", "🔓 Access Requests"],
                    ].map(([k, l]) => (
                        <button
                            key={k}
                            onClick={() => setActiveTab(k)}
                            style={{
                                padding: "13px 20px",
                                border: "none",
                                borderBottom: activeTab === k ? "2px solid #001944" : "2px solid transparent",
                                backgroundColor: "transparent",
                                fontFamily: "Inter",
                                fontWeight: activeTab === k ? 700 : 400,
                                fontSize: 13,
                                color: activeTab === k ? "#001944" : "#64748B",
                                cursor: "pointer",
                            }}
                        >
                            {l}
                        </button>
                    ))}
                    {activeTab === "audit" && (
                        <div
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 16px",
                            }}
                        >
                            <select
                                style={{
                                    padding: "5px 10px",
                                    borderRadius: 8,
                                    border: "1px solid #E2E8F0",
                                    fontFamily: "Inter",
                                    fontSize: 11,
                                    color: "#374151",
                                    outline: "none",
                                }}
                            >
                                <option>Severity: All</option>
                                <option>CRITICAL</option>
                                <option>WARNING</option>
                                <option>SUCCESS</option>
                            </select>
                        </div>
                    )}
                </div>

                {activeTab === "audit" && (
                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                            <thead>
                                <tr style={{ backgroundColor: "#F8F9FA" }}>
                                    {["TIME", "ACTOR", "ACTION", "RESOURCE", "STATUS", "IP"].map((h) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: "10px 16px",
                                                textAlign: "left",
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 10,
                                                color: "#94A3B8",
                                                letterSpacing: "0.8px",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map((log, i) => (
                                    <tr
                                        key={i}
                                        style={{ borderTop: "1px solid #F1F5F9" }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAFBFC")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                    >
                                        <td
                                            style={{
                                                padding: "12px 16px",
                                                fontFamily: "monospace",
                                                fontSize: 11,
                                                color: "#64748B",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {log.time}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                <div
                                                    style={{
                                                        width: 26,
                                                        height: 26,
                                                        borderRadius: "50%",
                                                        backgroundColor: log.color,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontFamily: "Inter",
                                                        fontWeight: 700,
                                                        fontSize: 9,
                                                        color: "#fff",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {log.initials}
                                                </div>
                                                <div>
                                                    <div
                                                        style={{
                                                            fontFamily: "Inter",
                                                            fontWeight: 600,
                                                            fontSize: 12,
                                                            color: "#001944",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {log.actor}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontFamily: "monospace",
                                                            fontSize: 10,
                                                            color: "#94A3B8",
                                                        }}
                                                    >
                                                        {log.actorId}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px 16px",
                                                fontFamily: "monospace",
                                                fontWeight: 700,
                                                fontSize: 11,
                                                color: "#374151",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {log.action}
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px 16px",
                                                fontFamily: "monospace",
                                                fontSize: 10,
                                                color: "#64748B",
                                                maxWidth: 140,
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {log.resource}
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span
                                                style={{
                                                    backgroundColor: log.bg,
                                                    color: log.color,
                                                    borderRadius: 6,
                                                    padding: "3px 8px",
                                                    fontFamily: "Inter",
                                                    fontWeight: 700,
                                                    fontSize: 10,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {log.status}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px 16px",
                                                fontFamily: "monospace",
                                                fontSize: 11,
                                                color: "#94A3B8",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {log.ip}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div
                            style={{
                                padding: "12px 20px",
                                borderTop: "1px solid #F1F5F9",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <span style={{ fontFamily: "Inter", fontSize: 12, color: "#64748B" }}>
                                Page 1 of 42 · 8,402 events total
                            </span>
                            <div style={{ display: "flex", gap: 8 }}>
                                {["← Prev", "Next →"].map((b) => (
                                    <button
                                        key={b}
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
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "roles" && (
                    <div style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {roleData.map((r, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "12px 16px",
                                        backgroundColor: r.bg,
                                        borderRadius: 12,
                                    }}
                                >
                                    <div style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 13, color: r.color }}>
                                        {r.name}
                                    </div>
                                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                                        <div style={{ textAlign: "center" }}>
                                            <div
                                                style={{
                                                    fontFamily: "Manrope",
                                                    fontWeight: 800,
                                                    fontSize: 18,
                                                    color: r.color,
                                                }}
                                            >
                                                {r.users}
                                            </div>
                                            <div
                                                style={{
                                                    fontFamily: "Inter",
                                                    fontSize: 9,
                                                    color: r.color,
                                                    opacity: 0.6,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                utilisateurs
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "center" }}>
                                            <div
                                                style={{
                                                    fontFamily: "Manrope",
                                                    fontWeight: 800,
                                                    fontSize: 18,
                                                    color: r.color,
                                                }}
                                            >
                                                {r.permissions === 999 ? "∞" : r.permissions}
                                            </div>
                                            <div
                                                style={{
                                                    fontFamily: "Inter",
                                                    fontSize: 9,
                                                    color: r.color,
                                                    opacity: 0.6,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                permissions
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onNavigate && onNavigate("gestion")}
                                            style={{
                                                padding: "5px 12px",
                                                borderRadius: 8,
                                                border: `1px solid ${r.color}`,
                                                backgroundColor: "rgba(255,255,255,0.6)",
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 11,
                                                color: r.color,
                                                cursor: "pointer",
                                            }}
                                        >
                                            Gérer
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "access" && (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
                        <div
                            style={{
                                fontFamily: "Inter",
                                fontWeight: 700,
                                fontSize: 15,
                                color: "#374151",
                                marginBottom: 6,
                            }}
                        >
                            Aucune demande d'accès en attente
                        </div>
                        <div style={{ fontFamily: "Inter", fontSize: 13, color: "#94A3B8" }}>
                            Les demandes de changement de rôle apparaissent ici
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

Object.assign(window, { DashboardSuperAdmin });
