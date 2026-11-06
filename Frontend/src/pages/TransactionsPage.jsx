import { useEffect, useMemo, useState } from "react";

import TransactionCard, { TxTableHeader } from "../components/TransactionCard";
import Spinner from "../components/Spinner";
import { api } from "../api/api";
import { C } from "../constants/colors";

const FILTERS = [
  { key: "ALL",     label: "All" },
  { key: "SUCCESS", label: "Successful" },
  { key: "FLAGGED", label: "Flagged" },
  
];

export default function TransactionsPage({ toast }) {

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { loadTransactions(); }, []);

  async function loadTransactions() {
    try {
      const data = await api("/transactions/");
      setTransactions(data.transactions || []);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() =>
    (filter === "ALL" ? transactions : transactions.filter(t => t.status === filter))
      .slice()
      .sort((a, b) => new Date(b.transaction_time) - new Date(a.transaction_time)),
    [transactions, filter]
  );

  const stats = useMemo(() => ({
    total:   transactions.length,
    success: transactions.filter(t => t.status === "SUCCESS").length,
    flagged: transactions.filter(t => t.status === "FLAGGED").length,
    pending: transactions.filter(t => t.status === "PENDING").length,
  }), [transactions]);

  return (
    <div>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{ marginBottom: "28px" }}>
        <p style={{
          margin: "0 0 4px",
          fontSize: "11px", fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: C.accent,
        }}>
          Account Activity
        </p>
        <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: "-0.02em" }}>
          My Transactions
        </h1>
        <p style={{ marginTop: "5px", fontSize: "13px", color: C.textMuted }}>
          Complete history of your banking transactions, sorted by date.
        </p>
      </div>

      {/* ── Stats strip ─────────────────────────────── */}
      {!loading && transactions.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}>
          {[
            { label: "Total",      value: stats.total,   color: C.accent },
            { label: "Successful", value: stats.success, color: C.success },
            { label: "Flagged",    value: stats.flagged, color: C.danger },
            { label: "Pending",    value: stats.pending, color: C.warning },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderTop: `2px solid ${color}`,
              borderRadius: "12px",
              padding: "14px 18px",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}>
              <span style={{
                fontSize: "10px", fontWeight: 700,
                letterSpacing: "0.08em", textTransform: "uppercase",
                color: C.textMuted,
              }}>
                {label}
              </span>
              <span style={{
                fontSize: "22px", fontWeight: 900,
                color, letterSpacing: "-0.03em",
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter bar ──────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        marginBottom: "20px",
        padding: "5px",
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "12px",
        flexWrap: "wrap",
      }}>
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: "7px 18px",
                borderRadius: "8px",
                border: "none",
                background: active ? "rgba(59,130,246,0.16)" : "transparent",
                color: active ? C.accentLight : C.textMuted,
                fontSize: "13px",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
                fontFamily: "inherit",
                outline: active ? `1px solid rgba(59,130,246,0.28)` : "none",
              }}
            >
              {label}
            </button>
          );
        })}

        <span style={{
          marginLeft: "auto",
          padding: "6px 14px",
          borderRadius: "20px",
          background: "rgba(241,245,249,0.04)",
          border: `1px solid ${C.borderLight}`,
          color: C.textMuted,
          fontSize: "12px",
          fontWeight: 600,
        }}>
          {filtered.length} transaction{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Content ─────────────────────────────────── */}
      {loading ? (
        <div style={{
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          minHeight: "40vh", gap: "16px",
        }}>
          <Spinner size={36} />
          <p style={{ color: C.textMuted, fontSize: "13px" }}>Loading transactions...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "16px",
          padding: "56px 32px",
          textAlign: "center",
        }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "14px",
            background: "rgba(59,130,246,0.08)", border: `1px solid rgba(59,130,246,0.2)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <h3 style={{ color: C.text, marginBottom: "8px" }}>No Transactions Found</h3>
          <p style={{ color: C.textMuted, fontSize: "14px" }}>
            {filter === "ALL"
              ? "You haven't made any transactions yet."
              : `No ${filter.toLowerCase()} transactions found.`}
          </p>
        </div>
      ) : (
        <div style={{
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: "14px",
          overflow: "hidden",
        }}>
          {/* Column header — uses same grid as cards */}
          <TxTableHeader />

          {/* Cards */}
          <div style={{ padding: "6px 6px 8px" }}>
            {filtered.map(tx => (
              <TransactionCard key={tx.transaction_id} transaction={tx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}