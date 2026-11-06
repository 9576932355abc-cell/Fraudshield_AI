import { useState } from "react";
import { C } from "../constants/colors";

/* ── Inline status/risk pill ──────────────────────────────── */
function Pill({ text, type }) {
  const p = {
    HIGH:    { bg: "rgba(239,68,68,0.12)",   color: "#F87171", dot: "#EF4444" },
    MEDIUM:  { bg: "rgba(245,158,11,0.12)",  color: "#FBBF24", dot: "#F59E0B" },
    LOW:     { bg: "rgba(16,185,129,0.12)",  color: "#34D399", dot: "#10B981" },
    SUCCESS: { bg: "rgba(16,185,129,0.12)",  color: "#34D399", dot: "#10B981" },
    FLAGGED: { bg: "rgba(239,68,68,0.12)",   color: "#F87171", dot: "#EF4444" },
    PENDING: { bg: "rgba(245,158,11,0.12)",  color: "#FBBF24", dot: "#F59E0B" },
  };
  const s = p[(type || "").toUpperCase()] || { bg: "rgba(59,130,246,0.12)", color: C.accentLight, dot: C.accent };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 8px", borderRadius: "6px",
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em",
      textTransform: "uppercase", background: s.bg, color: s.color,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: s.dot, flexShrink: 0 }} />
      {text}
    </span>
  );
}

/*
 * Grid columns — must match TransactionsPage header:
 *   recipient(1fr) | status(160px) | acct(170px) | date(160px) | amount(110px)
 */
const GRID = "1fr 160px 170px 160px 110px";

/* ── Row header — exported so TransactionsPage can use it ─── */
export function TxTableHeader() {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: GRID,
      alignItems: "center",
      padding: "8px 18px 8px 66px",
      borderBottom: `1px solid ${C.borderLight}`,
      marginBottom: "4px",
      gap: "12px",
    }}>
      {["Recipient", "Status & Risk", "Account No.", "Date & Time", "Amount"].map(col => (
        <span key={col} style={{
          fontSize: "9.5px", fontWeight: 700,
          letterSpacing: "0.09em", textTransform: "uppercase",
          color: C.textFaint,
        }}>
          {col}
        </span>
      ))}
    </div>
  );
}

/* ── Main card ───────────────────────────────────────────── */
export default function TransactionCard({ transaction }) {
  const [hovered, setHovered] = useState(false);

  const risk   = (transaction.risk_level || "LOW").toUpperCase();
  const status = (transaction.status || "").toUpperCase();
  const isFlagged = status === "FLAGGED" || risk === "HIGH";

  const accentColor =
    risk === "HIGH" ? "#EF4444" :
    risk === "MEDIUM" ? "#F59E0B" : "#10B981";

  const formattedDate = transaction.transaction_time
    ? new Date(transaction.transaction_time).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  const formattedTime = transaction.transaction_time
    ? new Date(transaction.transaction_time).toLocaleTimeString("en-IN", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      })
    : "";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 18px",
        marginBottom: "6px",
        background: hovered ? C.surfaceAlt : C.surface,
        border: `1px solid ${hovered
          ? (isFlagged ? "rgba(239,68,68,0.28)" : "rgba(59,130,246,0.22)")
          : C.border}`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: "10px",
        boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.22)" : "none",
        transition: "all 0.16s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: "default",
      }}
    >
      {/* Avatar — fixed 40px, not part of grid */}
      <div style={{
        width: "40px", height: "40px", flexShrink: 0,
        borderRadius: "50%",
        background: isFlagged
          ? "radial-gradient(circle,rgba(239,68,68,0.18),rgba(239,68,68,0.04))"
          : "radial-gradient(circle,rgba(59,130,246,0.18),rgba(59,130,246,0.04))",
        border: `1.5px solid ${isFlagged ? "rgba(239,68,68,0.28)" : "rgba(59,130,246,0.28)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "15px", fontWeight: 800,
        color: isFlagged ? "#F87171" : C.accentLight,
      }}>
        {(transaction.receiver_name || "?")[0].toUpperCase()}
      </div>

      {/* Grid columns */}
      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: GRID,
        alignItems: "center",
        gap: "12px",
        minWidth: 0,
      }}>

        {/* Col 1 — Recipient name */}
        <div style={{ minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: "13.5px", fontWeight: 700,
            color: C.text, letterSpacing: "-0.01em",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {transaction.receiver_name || "Unknown"}
          </p>
        </div>

        {/* Col 2 — Status & Risk badges */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
          <Pill text={risk} type={risk} />
          <Pill text={status || "—"} type={status} />
        </div>

        {/* Col 3 — Account number */}
        <div>
          <p style={{
            margin: "0 0 1px",
            fontSize: "11px", fontWeight: 800,
            letterSpacing: "0.08em", textTransform: "uppercase",
            color: C.textFaint,
          }}>
            
          </p>
          <p style={{
            margin: 0,
            fontSize: "11.5px", fontWeight: 600,
            color: C.accentLight,
            fontFamily: "'Courier New', monospace",
            letterSpacing: "0.04em",
          }}>
            {transaction.receiver_account_number || "—"}
          </p>
        </div>

        {/* Col 4 — Date & Time */}
        <div>
          <p style={{ margin: "0 0 1px", fontSize: "12px", fontWeight: 600, color: C.textSub }}>
            {formattedDate}
          </p>
          {formattedTime && (
            <p style={{ margin: 0, fontSize: "10.5px", color: C.textMuted }}>
              {formattedTime}
            </p>
          )}
        </div>

        {/* Col 5 — Amount */}
        <div style={{ textAlign: "right" }}>
          <p style={{
            margin: 0,
            fontSize: "14px", fontWeight: 800,
            color: isFlagged ? "#F87171" : C.text,
            letterSpacing: "-0.02em",
          }}>
            ₹ {Number(transaction.amount || 0).toLocaleString("en-IN")}
          </p>
          {isFlagged && (
            <span style={{
              fontSize: "9px", color: "#F87171", fontWeight: 700,
              letterSpacing: "0.07em", textTransform: "uppercase",
            }}>
              Fraud Risk
            </span>
          )}
        </div>
      </div>
    </div>
  );
}