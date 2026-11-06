import { useEffect, useState, useMemo } from "react";
import { api } from "../../api/api";
import { C } from "../../constants/colors";
import Spinner from "../../components/Spinner";

/* ─── SVG Icons ─────────────────────────────────────── */
const RefreshIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
);
const DownloadIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
);
const ArrowRight = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
);
const ChevronDown = ({ open }) => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.22s ease" }}>
        <polyline points="6 9 12 15 18 9"/>
    </svg>
);
const SortIcon = ({ active, dir }) => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: active && dir === "asc" ? "rotate(180deg)" : "none", transition: "transform 0.2s", opacity: active ? 1 : 0.35 }}>
        <polyline points="6 9 12 15 18 9"/>
    </svg>
);
const SearchIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
);

/* ─── Status helpers ─────────────────────────────────── */
function statusStyle(status) {
    const s = (status || "").toUpperCase();
    if (s === "SUCCESS")  return { color: C.success,  bg: C.successBg,  border: C.success  + "40" };
    if (s === "FLAGGED")  return { color: C.danger,   bg: C.dangerBg,   border: C.danger   + "40" };
    if (s === "BLOCKED")  return { color: "#F97316",  bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.4)" };
    return { color: C.accent, bg: C.infoBg, border: C.accent + "40" };
}

function StatusPill({ status }) {
    const { color, bg, border } = statusStyle(status);
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "3px 10px", borderRadius: "99px",
            background: bg, border: `1px solid ${border}`,
            color, fontSize: "10.5px", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap",
        }}>
            <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: color, boxShadow: `0 0 5px ${color}`, flexShrink: 0 }} />
            {status || "—"}
        </span>
    );
}

/* ─── Risk chip ──────────────────────────────────────── */
function RiskChip({ level }) {
    const col = level === "HIGH" ? C.danger : level === "MEDIUM" ? C.warning : level === "LOW" ? C.success : C.accent;
    return (
        <span style={{
            display: "inline-block", padding: "2px 9px", borderRadius: "99px",
            background: col + "18", border: `1px solid ${col}35`,
            color: col, fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em",
        }}>
            {level || "—"}
        </span>
    );
}

/* ─── Anomaly bar ────────────────────────────────────── */
function ScoreBar({ score }) {
    if (score == null) return <span style={{ color: C.textMuted, fontSize: "11px" }}>—</span>;
    const pct = Math.min(Math.max(score * 100, 0), 100);
    const col = score >= 0.75 ? C.danger : score >= 0.45 ? C.warning : C.success;
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ flex: 1, height: "5px", borderRadius: "99px", background: "rgba(255,255,255,0.07)", overflow: "hidden", minWidth: "60px" }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: "99px", background: col, boxShadow: `0 0 6px ${col}80` }} />
            </div>
            <span style={{ fontSize: "10.5px", fontWeight: 700, color: col, minWidth: "34px", textAlign: "right" }}>
                {pct.toFixed(0)}%
            </span>
        </div>
    );
}

/* ─── Table header cell ──────────────────────────────── */
function TH({ label, sortKey, sort, onSort, align = "left", minWidth }) {
    const isActive = sort.key === sortKey;
    return (
        <th
            onClick={() => sortKey && onSort(sortKey)}
            style={{
                padding: "11px 16px", textAlign: align, whiteSpace: "nowrap",
                fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", userSelect: "none",
                color: isActive ? C.accentLight : C.textMuted,
                background: "transparent", border: "none",
                borderBottom: `1px solid ${C.borderLight}`,
                cursor: sortKey ? "pointer" : "default",
                transition: "color 0.15s", minWidth: minWidth || "auto",
            }}
        >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                {label} {sortKey && <SortIcon active={isActive} dir={sort.dir} />}
            </span>
        </th>
    );
}

/* ─── Table row ──────────────────────────────────────── */
function TxRow({ tx, index }) {
    const [hov, setHov] = useState(false);
    const [open, setOpen] = useState(false);

    const ts = tx.transaction_time ? new Date(tx.transaction_time) : null;
    const dateStr = ts ? ts.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
    const timeStr = ts ? ts.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "—";
    const { color: sColor } = statusStyle(tx.status);
    const rowBg = hov ? C.surfaceHover : index % 2 === 0 ? C.surface : "rgba(8,15,32,0.6)";

    return (
        <>
            <tr
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => setHov(false)}
                onClick={() => setOpen(o => !o)}
                style={{ background: rowBg, cursor: "pointer", transition: "background 0.15s", borderBottom: `1px solid ${C.borderLight}` }}
            >
                {/* # */}
                <td style={{ padding: "14px 16px", color: C.textMuted, fontSize: "11px", fontWeight: 600, fontFamily: "monospace" }}>
                    {String(index + 1).padStart(4, "0")}
                </td>

                {/* Date / Time */}
                <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: C.textSub }}>{dateStr}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "10px", color: C.textMuted, fontFamily: "monospace" }}>{timeStr}</p>
                </td>

                {/* Sender */}
                <td style={{ padding: "14px 16px", maxWidth: "180px" }}>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tx.sender_name || "—"}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "10px", color: C.textMuted, fontFamily: "monospace" }}>
                        {tx.sender_account_number || "—"}
                    </p>
                </td>

                {/* Arrow */}
                <td style={{ padding: "14px 8px", textAlign: "center" }}>
                    <span style={{ color: C.accent, display: "inline-flex" }}><ArrowRight /></span>
                </td>

                {/* Receiver */}
                <td style={{ padding: "14px 16px", maxWidth: "180px" }}>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: C.textSub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {tx.receiver_name || "—"}
                    </p>
                    <p style={{ margin: "2px 0 0", fontSize: "10px", color: C.textMuted, fontFamily: "monospace" }}>
                        {tx.receiver_account_number || "—"}
                    </p>
                </td>

                {/* Amount */}
                <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: "14px", fontWeight: 900, color: sColor, letterSpacing: "-0.02em" }}>
                        ₹ {tx.amount != null ? Number(tx.amount).toLocaleString("en-IN") : "—"}
                    </span>
                </td>

                {/* Status */}
                <td style={{ padding: "14px 16px" }}>
                    <StatusPill status={tx.status} />
                </td>

                {/* Risk */}
                <td style={{ padding: "14px 16px" }}>
                    <RiskChip level={tx.risk_level} />
                </td>

                {/* Anomaly */}
                <td style={{ padding: "14px 16px", minWidth: "120px" }}>
                    <ScoreBar score={tx.anomaly_score} />
                </td>

                {/* Expand */}
                <td style={{ padding: "14px 12px", textAlign: "center", color: C.textMuted }}>
                    <ChevronDown open={open} />
                </td>
            </tr>

            {/* ── Expanded detail ── */}
            {open && (
                <tr style={{ background: "rgba(0,0,0,0.25)" }}>
                    <td colSpan={10} style={{ padding: 0, borderBottom: `1px solid ${C.borderLight}` }}>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))",
                            gap: "20px",
                            padding: "20px 24px",
                        }}>
                            {/* Sender block */}
                            <div style={{ gridColumn: "span 2", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 18px" }}>
                                <p style={{ margin: "0 0 10px", fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Sender Details</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <Detail label="Full Name"       value={tx.sender_name} />
                                    <Detail label="Account Number"  value={tx.sender_account_number} mono />
                                    <Detail label="Email"           value={tx.sender_email} />
                                </div>
                            </div>

                            {/* Receiver block */}
                            <div style={{ gridColumn: "span 2", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 18px" }}>
                                <p style={{ margin: "0 0 10px", fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Receiver Details</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                    <Detail label="Full Name"       value={tx.receiver_name} />
                                    <Detail label="Account Number"  value={tx.receiver_account_number} mono />
                                </div>
                            </div>

                            {/* Transaction block */}
                            <div style={{ gridColumn: "span 2", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 18px" }}>
                                <p style={{ margin: "0 0 10px", fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Transaction Details</p>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: "10px" }}>
                                    <Detail label="Transaction ID"  value={`#${tx.transaction_id}`} mono />
                                    <Detail label="Amount"          value={tx.amount != null ? `₹ ${Number(tx.amount).toLocaleString("en-IN")}` : "—"} />
                                    <Detail label="Date"            value={dateStr} />
                                    <Detail label="Time"            value={timeStr} mono />
                                    <Detail label="Status"          value={tx.status} valueColor={statusStyle(tx.status).color} />
                                    <Detail label="Risk Level"      value={tx.risk_level} valueColor={tx.risk_level === "HIGH" ? C.danger : tx.risk_level === "MEDIUM" ? C.warning : C.success} />
                                    <Detail label="Anomaly Score"   value={tx.anomaly_score != null ? `${(tx.anomaly_score * 100).toFixed(2)}%` : "—"} />
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

function Detail({ label, value, mono, valueColor }) {
    return (
        <div>
            <p style={{ margin: "0 0 2px", fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 600, color: valueColor || C.textSub, fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all" }}>
                {value != null && value !== "" ? String(value) : "—"}
            </p>
        </div>
    );
}

/* ─── Filter tab ─────────────────────────────────────── */
function FilterTab({ label, count, active, color, onClick }) {
    return (
        <button onClick={onClick} style={{
            padding: "7px 15px",
            border: active ? `1.5px solid ${color}` : `1px solid ${C.border}`,
            borderRadius: "20px",
            background: active ? `${color}18` : "transparent",
            color: active ? color : C.textMuted,
            fontSize: "12px", fontWeight: active ? 700 : 500,
            cursor: "pointer", transition: "all 0.18s",
            display: "flex", alignItems: "center", gap: "6px", fontFamily: "inherit",
        }}>
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

/* ─── Pagination ─────────────────────────────────────── */
function PgBtn({ onClick, disabled, active, label }) {
    const [hov, setHov] = useState(false);
    return (
        <button onClick={onClick} disabled={disabled}
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{
                minWidth: "32px", height: "32px", padding: "0 6px", borderRadius: "8px",
                border: active ? `1.5px solid ${C.accent}` : `1px solid ${C.border}`,
                background: active ? C.accent : hov && !disabled ? C.surfaceAlt : C.surface,
                color: active ? "#fff" : disabled ? C.textMuted : C.textSub,
                fontSize: "12px", fontWeight: active ? 700 : 500,
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.4 : 1, fontFamily: "inherit", transition: "all 0.15s",
            }}>
            {label}
        </button>
    );
}

function Pagination({ page, totalPages, onChange }) {
    const MAX = 7;
    let pages = [];
    if (totalPages <= MAX) {
        pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (page <= 4) {
        pages = [1, 2, 3, 4, 5, "…", totalPages];
    } else if (page >= totalPages - 3) {
        pages = [1, "…", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    } else {
        pages = [1, "…", page - 1, page, page + 1, "…", totalPages];
    }
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <PgBtn onClick={() => onChange(page - 1)} disabled={page === 1} label="‹" />
            {pages.map((p, i) => (
                p === "…"
                    ? <span key={`e${i}`} style={{ color: C.textMuted, fontSize: "13px", padding: "0 2px" }}>…</span>
                    : <PgBtn key={p} onClick={() => onChange(p)} active={p === page} label={String(p)} />
            ))}
            <PgBtn onClick={() => onChange(page + 1)} disabled={page === totalPages} label="›" />
        </div>
    );
}

/* ─── Main Page ──────────────────────────────────────── */
const PAGE_SIZE_OPTIONS = [15, 25, 50, 100];

export default function AdminAuditLogsPage({ toast }) {
    const [txs, setTxs]           = useState([]);
    const [loading, setLoading]   = useState(true);
    const [search, setSearch]     = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [riskFilter, setRiskFilter]     = useState("ALL");
    const [sort, setSort]         = useState({ key: "transaction_time", dir: "desc" });
    const [page, setPage]         = useState(1);
    const [pageSize, setPageSize] = useState(25);

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            const data = await api("/admin/transactions?limit=200");
            setTxs(Array.isArray(data) ? data : data.transactions || []);
        } catch (err) {
            toast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    /* counts */
    const counts = useMemo(() => ({
        ALL:     txs.length,
        SUCCESS: txs.filter(t => t.status === "SUCCESS").length,
        FLAGGED: txs.filter(t => t.status === "FLAGGED").length,
        BLOCKED: txs.filter(t => t.status === "BLOCKED").length,
    }), [txs]);

    /* filter + search */
    const filtered = useMemo(() => txs.filter(t => {
        const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
        const matchRisk   = riskFilter   === "ALL" || t.risk_level === riskFilter;
        const q = search.toLowerCase();
        const matchSearch = !q
            || (t.sender_name           || "").toLowerCase().includes(q)
            || (t.sender_account_number || "").toLowerCase().includes(q)
            || (t.sender_email          || "").toLowerCase().includes(q)
            || (t.receiver_name         || "").toLowerCase().includes(q)
            || (t.receiver_account_number || "").toLowerCase().includes(q)
            || String(t.transaction_id  || "").includes(q);
        return matchStatus && matchRisk && matchSearch;
    }), [txs, statusFilter, riskFilter, search]);

    /* sort */
    const sorted = useMemo(() => [...filtered].sort((a, b) => {
        let av = a[sort.key], bv = b[sort.key];
        if (sort.key === "transaction_time") {
            av = new Date(av || 0).getTime();
            bv = new Date(bv || 0).getTime();
        }
        if (sort.key === "amount") { av = Number(av || 0); bv = Number(bv || 0); }
        if (av < bv) return sort.dir === "asc" ? -1 :  1;
        if (av > bv) return sort.dir === "asc" ?  1 : -1;
        return 0;
    }), [filtered, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const visible    = sorted.slice((page - 1) * pageSize, page * pageSize);

    function handleSort(key) {
        setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" });
        setPage(1);
    }

    /* stats */
    const totalAmount  = txs.reduce((s, t) => s + Number(t.amount || 0), 0);
    const flaggedCount = counts.FLAGGED;
    const highRisk     = txs.filter(t => t.risk_level === "HIGH").length;

    /* CSV export */
    function exportCSV() {
        const headers = ["#","Date","Time","Sender Name","Sender Account","Sender Email","Receiver Name","Receiver Account","Amount","Status","Risk Level","Anomaly Score","Transaction ID"];
        const rows = sorted.map((t, i) => {
            const ts = t.transaction_time ? new Date(t.transaction_time) : null;
            return [
                i + 1,
                ts ? ts.toLocaleDateString("en-IN") : "",
                ts ? ts.toLocaleTimeString("en-IN") : "",
                t.sender_name || "", t.sender_account_number || "", t.sender_email || "",
                t.receiver_name || "", t.receiver_account_number || "",
                t.amount || "", t.status || "", t.risk_level || "",
                t.anomaly_score != null ? (t.anomaly_score * 100).toFixed(2) + "%" : "",
                t.transaction_id || "",
            ].join(",");
        });
        const csv = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `transactions-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div>
            {/* ── Header ── */}
            <div style={{ marginBottom: "28px" }}>
                <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: C.gold }}>
                    Admin Panel
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
                    <div>
                        <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: "-0.02em", fontSize: "clamp(1.4rem,2.5vw,1.9rem)" }}>
                            Transaction Audit Log
                        </h1>
                        <p style={{ margin: "5px 0 0", fontSize: "13.5px", color: C.textMuted }}>
                            Complete record of every money transfer across the platform.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                        <button onClick={exportCSV} style={{
                            display: "flex", alignItems: "center", gap: "7px",
                            padding: "9px 18px", border: `1px solid rgba(16,185,129,0.35)`,
                            borderRadius: "10px", background: "rgba(16,185,129,0.08)", color: C.success,
                            fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = "rgba(16,185,129,0.15)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "rgba(16,185,129,0.08)"; }}>
                            <DownloadIcon /> Export CSV
                        </button>
                        <button onClick={load} style={{
                            display: "flex", alignItems: "center", gap: "7px",
                            padding: "9px 18px", border: `1px solid ${C.border}`,
                            borderRadius: "10px", background: C.surface, color: C.textSub,
                            fontSize: "13px", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt; }}
                            onMouseLeave={e => { e.currentTarget.style.background = C.surface; }}>
                            <RefreshIcon /> Refresh
                        </button>
                    </div>
                </div>

                {/* ── Stats cards ── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: "14px", marginTop: "22px" }}>
                    {[
                        { label: "Total Transactions", value: txs.length,      color: C.accent,   icon: "📊" },
                        { label: "Total Volume",       value: `₹ ${Number(totalAmount.toFixed(0)).toLocaleString("en-IN")}`, color: C.success, icon: "💰" },
                        { label: "Successful",         value: counts.SUCCESS,  color: C.success,  icon: "✅" },
                        { label: "Flagged (High Risk)",value: flaggedCount,    color: C.danger,   icon: "⚠️" },
                        { label: "High Risk",          value: highRisk,        color: C.danger,   icon: "🚨" },
                    ].map(({ label, value, color, icon }) => (
                        <div key={label} style={{
                            padding: "14px 18px",
                            background: `linear-gradient(135deg, ${C.surface}, ${C.surfaceAlt})`,
                            border: `1px solid ${C.border}`,
                            borderRadius: "14px",
                            transition: "border-color 0.2s",
                        }}>
                            <p style={{ margin: "0 0 2px", fontSize: "18px" }}>{icon}</p>
                            <p style={{ margin: 0, fontSize: "clamp(15px,2vw,20px)", fontWeight: 900, color, letterSpacing: "-0.03em" }}>{value}</p>
                            <p style={{ margin: "3px 0 0", fontSize: "10px", color: C.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Filter bar ── */}
            <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: "14px", padding: "16px 20px",
                marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "14px", alignItems: "center",
            }}>
                {/* Search */}
                <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: C.textMuted }}>
                        <SearchIcon />
                    </span>
                    <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Search by name, account number, email…"
                        style={{
                            width: "100%", paddingLeft: "34px", paddingRight: "14px",
                            paddingTop: "9px", paddingBottom: "9px",
                            background: C.surfaceAlt, border: `1px solid ${C.border}`,
                            borderRadius: "8px", color: C.text, fontSize: "13px",
                            fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                        }}
                        onFocus={e => { e.target.style.borderColor = C.accent; }}
                        onBlur={e => { e.target.style.borderColor = C.border; }}
                    />
                </div>

                {/* Status filter tabs */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {[
                        { key: "ALL",     label: "All",     color: C.accent   },
                        { key: "SUCCESS", label: "Success", color: C.success  },
                        { key: "FLAGGED", label: "Flagged", color: C.danger   },
                        { key: "BLOCKED", label: "Blocked", color: "#F97316"  },
                    ].map(({ key, label, color }) => (
                        <FilterTab key={key} label={label} count={counts[key]} active={statusFilter === key} color={color} onClick={() => { setStatusFilter(key); setPage(1); }} />
                    ))}
                </div>

                {/* Risk filter */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>Risk:</span>
                    <select value={riskFilter} onChange={e => { setRiskFilter(e.target.value); setPage(1); }}
                        style={{ padding: "8px 10px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "12px", fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
                        {["ALL", "HIGH", "MEDIUM", "LOW"].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>

                {/* Rows per page */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: C.textMuted, fontWeight: 600, whiteSpace: "nowrap" }}>Rows:</span>
                    <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                        style={{ padding: "8px 10px", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: "8px", color: C.text, fontSize: "12px", fontFamily: "inherit", cursor: "pointer", outline: "none" }}>
                        {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                </div>
            </div>

            {/* Count */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <p style={{ fontSize: "12px", color: C.textMuted, fontWeight: 500 }}>
                    Showing <strong style={{ color: C.textSub }}>{visible.length}</strong> of <strong style={{ color: C.textSub }}>{sorted.length}</strong> transactions
                    {search && ` matching "${search}"`}
                </p>
                <p style={{ fontSize: "12px", color: C.textMuted }}>Page {page} of {totalPages}</p>
            </div>

            {/* ── Table ── */}
            {loading ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: "16px" }}>
                    <Spinner size={36} />
                    <p style={{ color: C.textMuted, fontSize: "14px" }}>Loading transactions…</p>
                </div>
            ) : (
                <>
                    <div style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: "14px", overflow: "hidden",
                        boxShadow: "0 4px 28px rgba(0,0,0,0.28)", marginBottom: "18px",
                    }}>
                        {sorted.length === 0 ? (
                            <div style={{ padding: "72px 32px", textAlign: "center" }}>
                                <div style={{ fontSize: "48px", marginBottom: "14px" }}>📋</div>
                                <h3 style={{ color: C.text, marginBottom: "8px" }}>No Transactions Found</h3>
                                <p style={{ color: C.textMuted, fontSize: "14px" }}>
                                    {search || statusFilter !== "ALL" || riskFilter !== "ALL" ? "Try adjusting your filters." : "No transactions recorded yet."}
                                </p>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ background: C.surfaceAlt }}>
                                            <TH label="#"             sort={sort} onSort={handleSort} minWidth="52px" />
                                            <TH label="Date / Time"   sortKey="transaction_time" sort={sort} onSort={handleSort} minWidth="130px" />
                                            <TH label="Sender"        sort={sort} onSort={handleSort} minWidth="160px" />
                                            <TH label="" sort={sort} onSort={handleSort} minWidth="30px" />
                                            <TH label="Receiver"      sort={sort} onSort={handleSort} minWidth="160px" />
                                            <TH label="Amount"        sortKey="amount" sort={sort} onSort={handleSort} minWidth="120px" align="right" />
                                            <TH label="Status"        sortKey="status" sort={sort} onSort={handleSort} minWidth="110px" />
                                            <TH label="Risk"          sortKey="risk_level" sort={sort} onSort={handleSort} minWidth="90px" />
                                            <TH label="Anomaly Score" sortKey="anomaly_score" sort={sort} onSort={handleSort} minWidth="130px" />
                                            <TH label="" sort={sort} onSort={handleSort} minWidth="32px" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visible.map((tx, i) => (
                                            <TxRow key={tx.transaction_id || i} tx={tx} index={(page - 1) * pageSize + i} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div style={{ display: "flex", justifyContent: "center" }}>
                            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}