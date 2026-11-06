import { useEffect, useState } from "react";

import { api } from "../../api/api";
import { C } from "../../constants/colors";
import Badge from "../../components/Badge";
import Spinner from "../../components/Spinner";

/* ─── Icons ──────────────────────────────────────────── */
const ArrowRight = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
);
const RefreshIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
);
const AlertTriangle = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);

/* ─── Risk helpers ───────────────────────────────────── */
function riskColor(level) {
    if (!level) return C.accent;
    const l = level.toUpperCase();
    if (l === "HIGH")   return C.danger;
    if (l === "MEDIUM") return C.warning;
    if (l === "LOW")    return C.success;
    return C.accent;
}
function riskBg(level) {
    return riskColor(level) + "18";
}

/* ─── Anomaly score bar ──────────────────────────────── */
function AnomalyBar({ score }) {
    if (score == null) return <span style={{ fontSize: "12px", color: C.textMuted }}>N/A</span>;
    const pct = Math.min(Math.max(score * 100, 0), 100);
    const col = score >= 0.75 ? C.danger : score >= 0.45 ? C.warning : C.success;
    return (
        <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <div style={{
                    flex: 1, height: "7px", borderRadius: "99px",
                    background: "rgba(241,245,249,0.07)", overflow: "hidden",
                }}>
                    <div style={{
                        height: "100%",
                        width: `${pct}%`,
                        borderRadius: "99px",
                        background: `linear-gradient(90deg, ${col}, ${col}cc)`,
                        boxShadow: `0 0 8px ${col}80`,
                    }} />
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: col, minWidth: "38px", textAlign: "right" }}>
                    {(score * 100).toFixed(1)}%
                </span>
            </div>
        </div>
    );
}

/* ─── Info cell ─────────────────────────────────────── */
function InfoCell({ label, value, mono, valueColor }) {
    return (
        <div>
            <p style={{ margin: "0 0 3px", fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {label}
            </p>
            <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: valueColor || C.textSub, fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>
                {value != null && value !== "" ? String(value) : "—"}
            </p>
        </div>
    );
}

/* ─── Alert row card ─────────────────────────────────── */
function AlertRow({ alert }) {
    const [expanded, setExpanded] = useState(false);
    const [hov, setHov] = useState(false);

    // risk_level comes from the transaction, fall back to alert_type-based color
    const effectiveRisk = alert.risk_level || null;
    const rc = riskColor(effectiveRisk);
    const rb = riskBg(effectiveRisk);

    const alertTime = alert.alert_time ? new Date(alert.alert_time) : null;
    const dateStr = alertTime ? alertTime.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    const timeStr = alertTime ? alertTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "—";

    const senderDisplay   = alert.sender_email || "—";
    const receiverDisplay = alert.receiver_name || alert.receiver_account_number || "—";
    const amountDisplay   = alert.amount != null ? `₹ ${Number(alert.amount).toLocaleString("en-IN")}` : "—";

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: hov ? C.surfaceHover : C.surface,
                border: `1px solid ${hov ? `${rc}35` : C.border}`,
                borderLeft: `4px solid ${rc}`,
                borderRadius: "14px",
                marginBottom: "12px",
                overflow: "hidden",
                transition: "all 0.2s ease",
                boxShadow: hov ? `0 4px 24px rgba(0,0,0,0.3)` : "0 2px 8px rgba(0,0,0,0.18)",
            }}
        >
            {/* ── Main clickable row ── */}
            <div
                onClick={() => setExpanded(e => !e)}
                style={{ padding: "16px 20px", cursor: "pointer", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}
            >
                {/* Icon + ID + Badge */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "170px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: rb, border: `1px solid ${rc}40`, display: "flex", alignItems: "center", justifyContent: "center", color: rc, flexShrink: 0 }}>
                        <AlertTriangle />
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: C.textMuted, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                            Alert #{alert.alert_id}
                        </p>
                        <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px", flexWrap: "wrap" }}>
                            {effectiveRisk
                                ? <Badge text={effectiveRisk} type={effectiveRisk} />
                                : <span style={{ fontSize: "10px", color: C.textMuted, padding: "2px 6px", borderRadius: "4px", border: `1px solid ${C.border}` }}>Unknown</span>
                            }
                            {alert.is_resolved && <Badge text="Resolved" type="SUCCESS" />}
                        </div>
                    </div>
                </div>

                {/* Sender → Receiver */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "230px" }}>
                    <div style={{ textAlign: "center", minWidth: "0", flex: 1 }}>
                        <p style={{ margin: "0 0 2px", fontSize: "9px", color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>From</p>
                        <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {senderDisplay}
                        </p>
                    </div>
                    <div style={{ color: rc, flexShrink: 0 }}><ArrowRight /></div>
                    <div style={{ textAlign: "center", minWidth: "0", flex: 1 }}>
                        <p style={{ margin: "0 0 2px", fontSize: "9px", color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>To</p>
                        <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {receiverDisplay}
                        </p>
                        {alert.receiver_account_number && alert.receiver_name && (
                            <p style={{ margin: "2px 0 0", fontSize: "10px", color: C.textMuted, fontFamily: "monospace" }}>
                                {alert.receiver_account_number}
                            </p>
                        )}
                    </div>
                </div>

                {/* Amount */}
                <div style={{ textAlign: "right", minWidth: "110px" }}>
                    <p style={{ margin: "0 0 2px", fontSize: "9px", color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Amount</p>
                    <p style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: rc, letterSpacing: "-0.02em" }}>
                        {amountDisplay}
                    </p>
                </div>

                {/* Date + Time */}
                <div style={{ textAlign: "right", minWidth: "105px" }}>
                    <p style={{ margin: "0 0 1px", fontSize: "12px", fontWeight: 600, color: C.textSub }}>{dateStr}</p>
                    <p style={{ margin: 0, fontSize: "10.5px", color: C.textMuted, fontFamily: "monospace" }}>{timeStr}</p>
                </div>

                {/* Expand chevron */}
                <div style={{ color: C.textMuted, transition: "transform 0.2s", transform: expanded ? "rotate(90deg)" : "none", flexShrink: 0 }}>
                    <ArrowRight />
                </div>
            </div>

            {/* ── Expanded detail panel ── */}
            {expanded && (
                <div style={{
                    padding: "16px 20px 20px",
                    borderTop: `1px solid ${C.borderLight}`,
                    background: "rgba(0,0,0,0.18)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                    gap: "18px",
                }}>
                    <InfoCell label="Alert Type"           value={alert.alert_type} />
                    <InfoCell label="Transaction ID"       value={alert.transaction_id} mono />
                    <InfoCell label="Sender Email"         value={alert.sender_email} />
                    <InfoCell label="Receiver Name"        value={alert.receiver_name} />
                    <InfoCell label="Receiver Account"     value={alert.receiver_account_number} mono />
                    <InfoCell label="Amount"               value={amountDisplay} />
                    <InfoCell label="Date"                 value={dateStr} />
                    <InfoCell label="Time"                 value={timeStr} mono />
                    <InfoCell label="Status"               value={alert.is_resolved ? "Resolved" : "Active"} valueColor={alert.is_resolved ? C.success : C.danger} />

                    {/* Anomaly Score — full width */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                            Anomaly Score
                        </p>
                        <AnomalyBar score={alert.anomaly_score} />
                    </div>

                    {/* Alert Message — full width */}
                    {alert.alert_message && (
                        <div style={{ gridColumn: "1 / -1" }}>
                            <p style={{ margin: "0 0 6px", fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                Alert Message
                            </p>
                            <div style={{
                                padding: "12px 16px",
                                background: rb,
                                border: `1px solid ${rc}28`,
                                borderRadius: "10px",
                                fontSize: "13px",
                                color: C.textSub,
                                lineHeight: 1.65,
                                fontStyle: "italic",
                            }}>
                                {alert.alert_message}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Filter tab ─────────────────────────────────────── */
function FilterTab({ label, count, active, color, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: "7px 16px",
                border: active ? `1.5px solid ${color}` : `1px solid ${C.border}`,
                borderRadius: "20px",
                background: active ? `${color}18` : "transparent",
                color: active ? color : C.textMuted,
                fontSize: "12px", fontWeight: active ? 700 : 500,
                cursor: "pointer", transition: "all 0.18s ease",
                display: "flex", alignItems: "center", gap: "6px",
                fontFamily: "inherit",
            }}
        >
            {label}
            {count != null && (
                <span style={{
                    fontSize: "10px", fontWeight: 700, minWidth: "18px", height: "18px",
                    background: active ? color : C.surfaceAlt,
                    color: active ? "#fff" : C.textMuted,
                    borderRadius: "99px", display: "inline-flex",
                    alignItems: "center", justifyContent: "center", padding: "0 4px",
                }}>
                    {count}
                </span>
            )}
        </button>
    );
}

/* ─── Main page ──────────────────────────────────────── */
export default function AdminAlertsPage({ toast }) {
    const [alerts, setAlerts]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter]   = useState("ALL");
    const [search, setSearch]   = useState("");

    async function fetchAlerts() {
        setLoading(true);
        try {
            const data = await api("/admin/alerts");
            setAlerts(Array.isArray(data) ? data : data.alerts || []);
        } catch (err) {
            toast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchAlerts(); }, []);

    const counts = {
        ALL:      alerts.length,
        HIGH:     alerts.filter(a => (a.risk_level || "").toUpperCase() === "HIGH").length,
        MEDIUM:   alerts.filter(a => (a.risk_level || "").toUpperCase() === "MEDIUM").length,
        LOW:      alerts.filter(a => (a.risk_level || "").toUpperCase() === "LOW").length,
        RESOLVED: alerts.filter(a => a.is_resolved).length,
    };

    const visible = alerts.filter(a => {
        const matchFilter =
            filter === "ALL"      ? true :
            filter === "RESOLVED" ? a.is_resolved :
            (a.risk_level || "").toUpperCase() === filter;

        const q = search.toLowerCase();
        const matchSearch = !q
            || (a.sender_email            || "").toLowerCase().includes(q)
            || (a.receiver_name           || "").toLowerCase().includes(q)
            || (a.receiver_account_number || "").toLowerCase().includes(q)
            || (a.alert_type              || "").toLowerCase().includes(q)
            || (a.alert_message           || "").toLowerCase().includes(q)
            || String(a.alert_id || "").includes(q);

        return matchFilter && matchSearch;
    });

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ marginBottom: "28px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.gold }}>
                    Admin Panel
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                        <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: "-0.02em", fontSize: "clamp(1.4rem,2.5vw,1.9rem)" }}>
                            Fraud Alerts
                        </h1>
                        <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: C.textMuted }}>
                            Real-time view of all fraud alerts. Read-only monitoring.
                        </p>
                    </div>
                    <button
                        onClick={fetchAlerts}
                        style={{
                            display: "flex", alignItems: "center", gap: "7px",
                            padding: "9px 18px", border: `1px solid ${C.border}`,
                            borderRadius: "10px", background: C.surface, color: C.textSub,
                            fontSize: "13px", fontWeight: 600, cursor: "pointer",
                            transition: "all 0.18s", fontFamily: "inherit",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt; }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}
                    >
                        <RefreshIcon /> Refresh
                    </button>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
                    {[
                        { label: "Total",    value: counts.ALL,      color: C.accent },
                        { label: "High",     value: counts.HIGH,     color: C.danger },
                        { label: "Medium",   value: counts.MEDIUM,   color: C.warning },
                        { label: "Low",      value: counts.LOW,      color: C.success },
                        { label: "Resolved", value: counts.RESOLVED, color: "#8B5CF6" },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{
                            padding: "10px 20px", background: C.surface,
                            border: `1px solid ${C.border}`, borderRadius: "12px", textAlign: "center", minWidth: "72px",
                        }}>
                            <p style={{ margin: 0, fontSize: "20px", fontWeight: 900, color, letterSpacing: "-0.03em" }}>{value}</p>
                            <p style={{ margin: "2px 0 0", fontSize: "10px", color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Filter tabs + Search ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                        { key: "ALL",      label: "All Alerts", color: C.accent },
                        { key: "HIGH",     label: "High Risk",  color: C.danger },
                        { key: "MEDIUM",   label: "Medium",     color: C.warning },
                        { key: "LOW",      label: "Low Risk",   color: C.success },
                        { key: "RESOLVED", label: "Resolved",   color: "#8B5CF6" },
                    ].map(({ key, label, color }) => (
                        <FilterTab key={key} label={label} count={counts[key]} active={filter === key} color={color} onClick={() => setFilter(key)} />
                    ))}
                </div>
                <div style={{ position: "relative" }}>
                    <svg style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textMuted }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by email, type, message…"
                        style={{
                            paddingLeft: "36px", paddingRight: "14px", paddingTop: "9px", paddingBottom: "9px",
                            background: C.surface, border: `1px solid ${C.border}`,
                            borderRadius: "10px", color: C.text, fontSize: "13px",
                            fontFamily: "inherit", outline: "none", width: "240px",
                        }}
                        onFocus={e => { e.target.style.borderColor = C.accent; }}
                        onBlur={e => { e.target.style.borderColor = C.border; }}
                    />
                </div>
            </div>

            <p style={{ fontSize: "12px", color: C.textMuted, marginBottom: "14px" }}>
                Showing <strong style={{ color: C.textSub }}>{visible.length}</strong> of <strong style={{ color: C.textSub }}>{alerts.length}</strong> alerts
                {search && ` matching "${search}"`}
            </p>

            {/* ── List ── */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: "16px" }}>
                    <Spinner size={36} />
                    <p style={{ color: C.textMuted, fontSize: "14px" }}>Loading fraud alerts…</p>
                </div>
            ) : visible.length === 0 ? (
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "64px 32px", textAlign: "center" }}>
                    <div style={{ fontSize: "40px", marginBottom: "12px" }}>🛡️</div>
                    <h3 style={{ color: C.success, marginBottom: "8px" }}>No Alerts Found</h3>
                    <p style={{ color: C.textMuted, fontSize: "14px" }}>
                        {search ? "No alerts match your search." : "No fraud alerts at this time."}
                    </p>
                </div>
            ) : (
                visible.map(alert => (
                    <AlertRow key={alert.alert_id} alert={alert} />
                ))
            )}
        </div>
    );
}