// Planning Étudiant
function PlanningEtudiant() {
    const [weekOffset, setWeekOffset] = React.useState(0);
    const [filters, setFilters] = React.useState({ presentiel: true, distanciel: true, entreprise: true });

    const baseWeek = { start: 12, month: "Mai" };
    const start = baseWeek.start + weekOffset * 7;

    const days = ["LUN.", "MAR.", "MER.", "JEU.", "VEN."];
    const dates = [start, start + 1, start + 2, start + 3, start + 4];

    const coursData = [
        {
            day: 0,
            top: 56,
            height: 148,
            type: "presentiel",
            time: "09:00 - 12:00",
            title: "UX/UI Advanced Principles",
            lieu: "Salle 402",
            bg: "#001944",
            color: "#fff",
        },
        {
            day: 0,
            top: 212,
            height: 100,
            type: "distanciel",
            time: "14:00 - 17:00",
            title: "Web Development Workshop",
            lieu: "Distanciel (Teams)",
            bg: "#fff",
            color: "#001944",
            border: "2px solid #001944",
        },
        {
            day: 1,
            top: 56,
            height: 148,
            type: "presentiel",
            time: "09:00 - 12:00",
            title: "Database Architecture",
            lieu: "Amphi B",
            bg: "#001944",
            color: "#fff",
        },
        {
            day: 2,
            top: 100,
            height: 80,
            type: "autre",
            time: "Temps libre",
            title: "Temps libre",
            lieu: "",
            bg: "#F3F4F5",
            color: "#94A3B8",
            dashed: true,
        },
        {
            day: 3,
            top: 56,
            height: 348,
            type: "entreprise",
            time: "09:00 - 18:00",
            title: "ENTREPRISE",
            lieu: "",
            bg: "#FFF3EE",
            color: "#94A3B8",
            icon: true,
        },
        {
            day: 4,
            top: 56,
            height: 348,
            type: "entreprise",
            time: "09:00 - 18:00",
            title: "ENTREPRISE",
            lieu: "",
            bg: "#FFF3EE",
            color: "#94A3B8",
            icon: true,
        },
    ];

    const upcoming = [
        {
            day: "JEU",
            date: 15,
            title: "Digital Strategy Lab",
            time: "09:00 - 12:30",
            lieu: "Salle 104",
            color: "#C7D2FE",
            textColor: "#002C6E",
        },
        {
            day: "VEN",
            date: 16,
            title: "Journée Entreprise",
            time: "09:00 - 18:00",
            lieu: "Tech Hub Paris",
            color: "#FFE4D6",
            textColor: "#7B2E12",
        },
    ];

    const hours = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"];

    return (
        <div>
            <div style={{ marginBottom: 28 }}>
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
                    Mon Emploi du Temps
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
                        Semaine du {start} au {start + 4} {baseWeek.month}
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
                            Aujourd'hui
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
                <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
                    {[
                        ["presentiel", "#001944", "PRÉSENTIEL"],
                        ["distanciel", "#002C6E", "DISTANCIEL"],
                        ["entreprise", "#7B2E12", "ENTREPRISE"],
                    ].map(([k, c, l]) => (
                        <label key={k} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={filters[k]}
                                onChange={() => setFilters((f) => ({ ...f, [k]: !f[k] }))}
                                style={{ accentColor: c }}
                            />
                            <span style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 12, color: c }}>{l}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 20 }}>
                {/* Calendar Grid */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: 20,
                        overflow: "hidden",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}
                >
                    {/* Day headers */}
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
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "center",
                                    borderLeft: "1px solid #F1F5F9",
                                    backgroundColor: dates[i] === 14 + weekOffset * 7 ? "#EEF2FF" : "transparent",
                                }}
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
                                <div
                                    style={{
                                        fontFamily: "Manrope",
                                        fontWeight: 800,
                                        fontSize: 20,
                                        color: dates[i] === 14 + weekOffset * 7 ? "#002C6E" : "#001944",
                                    }}
                                >
                                    {dates[i]}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Time grid */}
                    <div
                        style={{
                            position: "relative",
                            display: "grid",
                            gridTemplateColumns: "52px repeat(5,1fr)",
                            minHeight: 420,
                        }}
                    >
                        {/* Hour labels */}
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

                        {/* Day columns */}
                        {days.map((d, di) => {
                            const dayCours = coursData.filter(
                                (c) => c.day === di && filters[c.type === "autre" ? "presentiel" : c.type],
                            );
                            return (
                                <div
                                    key={d}
                                    style={{
                                        position: "relative",
                                        borderLeft: "1px solid #F1F5F9",
                                        backgroundColor: di === 3 || di === 4 ? "rgba(255,243,238,0.3)" : "transparent",
                                    }}
                                >
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
                                                border:
                                                    c.border || `1.5px solid ${c.dashed ? "#E2E8F0" : "transparent"}`,
                                                borderStyle: c.dashed ? "dashed" : "solid",
                                                cursor: "pointer",
                                                overflow: "hidden",
                                                boxShadow: c.bg === "#001944" ? "0 2px 8px rgba(0,25,68,0.2)" : "none",
                                            }}
                                        >
                                            {c.icon ? (
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        height: "100%",
                                                    }}
                                                >
                                                    <div style={{ fontSize: 24, marginBottom: 8, opacity: 0.3 }}>
                                                        💼
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontFamily: "Inter",
                                                            fontWeight: 700,
                                                            fontSize: 11,
                                                            color: "#94A3B8",
                                                            letterSpacing: "1px",
                                                        }}
                                                    >
                                                        {c.title}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontFamily: "Inter",
                                                            fontSize: 10,
                                                            color: "#94A3B8",
                                                            marginTop: 4,
                                                        }}
                                                    >
                                                        {c.time}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <div
                                                        style={{
                                                            fontFamily: "Inter",
                                                            fontWeight: 700,
                                                            fontSize: 10,
                                                            color:
                                                                c.color === "#fff"
                                                                    ? "rgba(255,255,255,0.6)"
                                                                    : "#94A3B8",
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
                                                        }}
                                                    >
                                                        {c.title}
                                                    </div>
                                                    {c.lieu && (
                                                        <div
                                                            style={{
                                                                fontFamily: "Inter",
                                                                fontSize: 10,
                                                                color:
                                                                    c.color === "#fff"
                                                                        ? "rgba(255,255,255,0.6)"
                                                                        : "#94A3B8",
                                                                marginTop: 6,
                                                            }}
                                                        >
                                                            📍 {c.lieu}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right panel */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {/* Mini calendar */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "20px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#001944"
                                strokeWidth="2"
                                strokeLinecap="round"
                            >
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <span style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 14, color: "#001944" }}>
                                Calendrier
                            </span>
                        </div>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(7, 1fr)",
                                gap: 2,
                                textAlign: "center",
                            }}
                        >
                            {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                                <div
                                    key={i}
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: 700,
                                        fontSize: 9,
                                        color: "#94A3B8",
                                        padding: "4px 0",
                                    }}
                                >
                                    {d}
                                </div>
                            ))}
                            {[10, 11, 12, 13, 14, 15, 16].map((n) => (
                                <div
                                    key={n}
                                    style={{
                                        fontFamily: "Inter",
                                        fontWeight: n === 14 ? 700 : 400,
                                        fontSize: 11,
                                        padding: "5px 0",
                                        borderRadius: 6,
                                        backgroundColor: n === 14 ? "#001944" : "transparent",
                                        color: n === 14 ? "#fff" : "#374151",
                                        cursor: "pointer",
                                    }}
                                >
                                    {n}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upcoming */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "20px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
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
                            <span style={{ fontFamily: "Manrope", fontWeight: 700, fontSize: 14, color: "#001944" }}>
                                À venir
                            </span>
                            <span
                                style={{
                                    fontFamily: "Inter",
                                    fontWeight: 600,
                                    fontSize: 11,
                                    color: "#6B95F3",
                                    cursor: "pointer",
                                }}
                            >
                                Voir tout
                            </span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {upcoming.map((u, i) => (
                                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                                    <div
                                        style={{
                                            backgroundColor: u.color,
                                            borderRadius: 8,
                                            padding: "6px 8px",
                                            textAlign: "center",
                                            minWidth: 36,
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 9,
                                                color: u.textColor,
                                                textTransform: "uppercase",
                                            }}
                                        >
                                            {u.day}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: "Manrope",
                                                fontWeight: 800,
                                                fontSize: 16,
                                                color: u.textColor,
                                            }}
                                        >
                                            {u.date}
                                        </div>
                                    </div>
                                    <div>
                                        <div
                                            style={{
                                                fontFamily: "Inter",
                                                fontWeight: 700,
                                                fontSize: 12,
                                                color: "#001944",
                                                marginBottom: 3,
                                            }}
                                        >
                                            {u.title}
                                        </div>
                                        <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                                            {u.time}
                                        </div>
                                        <div style={{ fontFamily: "Inter", fontSize: 11, color: "#94A3B8" }}>
                                            • {u.lieu}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick filters */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            padding: "20px",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                fontFamily: "Manrope",
                                fontWeight: 700,
                                fontSize: 12,
                                color: "#001944",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                                marginBottom: 12,
                            }}
                        >
                            Filtres Rapides
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                            {[
                                ["Cours Présentiels", true],
                                ["Sessions Distancielles", true],
                                ["Séminaires & Events", false],
                            ].map(([label, checked], i) => (
                                <label
                                    key={i}
                                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                                >
                                    <input
                                        type="checkbox"
                                        defaultChecked={checked}
                                        style={{ accentColor: "#001944" }}
                                    />
                                    <span style={{ fontFamily: "Inter", fontSize: 12, color: "#374151" }}>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* FAB */}
            <button
                onClick={() => window.__mygesNavigate && window.__mygesNavigate("absences")}
                style={{
                    position: "fixed",
                    bottom: 32,
                    right: 32,
                    backgroundColor: "#001944",
                    color: "#fff",
                    border: "none",
                    borderRadius: 999,
                    padding: "14px 24px",
                    fontFamily: "Inter",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 16px rgba(0,25,68,0.3)",
                    zIndex: 200,
                }}
            >
                <span>+</span> Ajouter Absence
            </button>
        </div>
    );
}

Object.assign(window, { PlanningEtudiant });
