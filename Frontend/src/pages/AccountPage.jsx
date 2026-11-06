import { useEffect, useState } from "react";
import { api } from "../api/api";
import { C } from "../constants/colors";
import Spinner from "../components/Spinner";

/* ── Stat card ─────────────────────────────────────────── */
function StatCard({ label, value, color, icon, mono = false }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.surfaceAlt : C.surface,
        border: `1px solid ${hov ? `${color}40` : C.border}`,
        borderRadius: "14px",
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
        boxShadow: hov ? `0 8px 28px rgba(0,0,0,0.3)` : "0 2px 10px rgba(0,0,0,0.18)",
        transition: "all 0.18s ease",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* top color bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: `linear-gradient(90deg,${color},${color}30)`,
        borderRadius: "14px 14px 0 0",
      }} />

      {/* icon + label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontSize: "10px", fontWeight: 700,
          letterSpacing: "0.09em", textTransform: "uppercase",
          color: C.textMuted,
        }}>
          {label}
        </span>
        <div style={{
          width: "32px", height: "32px",
          borderRadius: "9px",
          background: `${color}18`,
          border: `1px solid ${color}28`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color,
        }}>
          {icon}
        </div>
      </div>

      {/* value */}
      <p style={{
        margin: 0,
        fontSize: mono ? "15px" : "22px",
        fontWeight: 800,
        color: C.text,
        letterSpacing: mono ? "0.04em" : "-0.03em",
        fontFamily: mono ? "'Courier New', monospace" : "inherit",
      }}>
        {value}
      </p>
    </div>
  );
}

/* ── Detail row item ───────────────────────────────────── */
function DetailRow({ label, value, valueColor, mono = false }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "13px 0",
      borderBottom: `1px solid ${C.borderLight}`,
    }}>
      <span style={{ fontSize: "12.5px", color: C.textMuted, fontWeight: 500 }}>
        {label}
      </span>
      <span style={{
        fontSize: mono ? "13px" : "13.5px",
        fontWeight: 700,
        color: valueColor || C.textSub,
        fontFamily: mono ? "'Courier New', monospace" : "inherit",
        letterSpacing: mono ? "0.04em" : "normal",
      }}>
        {value}
      </span>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────── */
export default function AccountPage() {
  const [account, setAccount] = useState(null);
  const [txCount, setTxCount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [acct, txData] = await Promise.all([
        api("/accounts/me"),
        api("/transactions/"),
      ]);
      setAccount(acct);
      const txs = txData.transactions || [];
      setTxCount(txs.length);
    } catch {
      /* silently fail — UI handles null */
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        minHeight: "50vh", gap: "16px",
      }}>
        <Spinner size={36} />
        <p style={{ color: C.textMuted, fontSize: "14px" }}>Loading account...</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div style={{ textAlign: "center", paddingTop: "60px" }}>
        <h3 style={{ color: C.text }}>No account found</h3>
      </div>
    );
  }

  const successCount = txCount; // simplified — backend doesn't break down yet

  return (
    <div>
      {/* ── Balance Hero ──────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg,rgba(59,130,246,0.13) 0%,rgba(29,78,216,0.06) 100%)",
        border: `1px solid rgba(59,130,246,0.2)`,
        borderRadius: "20px",
        padding: "32px 36px",
        marginBottom: "26px",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative blobs */}
        <div style={{
          position: "absolute", top: "-60px", right: "-60px",
          width: "220px", height: "220px", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(59,130,246,0.14),transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", left: "30%",
          width: "180px", height: "180px", borderRadius: "50%",
          background: "radial-gradient(circle,rgba(245,158,11,0.06),transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Content row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px", position: "relative" }}>
          <div>
            <p style={{
              margin: "0 0 8px",
              fontSize: "11px", fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: C.accentLight,
            }}>
              Available Balance
            </p>
            <h1 style={{
              margin: "0 0 6px",
              fontSize: "clamp(2rem,4vw,3rem)",
              fontWeight: 900,
              color: C.text,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}>
              ₹ {Number(account.balance || 0).toLocaleString("en-IN")}
            </h1>
            <p style={{ margin: 0, fontSize: "12px", color: C.textMuted }}>
              Account No.&nbsp;
              <span style={{
                fontFamily: "'Courier New', monospace",
                color: C.accentLight,
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}>
                {account.account_number}
              </span>
            </p>
          </div>

          {/* Status badge */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "7px",
              padding: "8px 18px",
              background: "rgba(16,185,129,0.12)",
              border: "1px solid rgba(16,185,129,0.28)",
              borderRadius: "20px",
            }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: C.success, boxShadow: `0 0 6px ${C.success}` }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: C.success, letterSpacing: "0.06em" }}>
                ACTIVE
              </span>
            </div>
            <span style={{ fontSize: "11px", color: C.textFaint }}>
              {account.account_type || "SAVINGS"} Account
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats grid ───────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px",
        marginBottom: "26px",
      }}>
        <StatCard
          label="Account Type"
          value={account.account_type || "SAVINGS"}
          color="#8B5CF6"
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          }
        />
        <StatCard
          label="Account Status"
          value="ACTIVE"
          color={C.success}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          }
        />
        <StatCard
          label="Total Transactions"
          value={txCount !== null ? txCount : "—"}
          color={C.gold}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          }
        />
        <StatCard
          label="Security Level"
          value="256-bit"
          color={C.accent}
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          }
        />
      </div>

      {/* ── Account Details panel ───────────────────── */}
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
      }}>
        {/* Panel header */}
        <div style={{
          padding: "18px 24px",
          borderBottom: `1px solid ${C.borderLight}`,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}>
          <div style={{
            width: "30px", height: "30px",
            borderRadius: "8px",
            background: "rgba(59,130,246,0.1)",
            border: `1px solid rgba(59,130,246,0.2)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: C.text }}>
            Account Details
          </h3>
        </div>

        {/* Detail rows */}
        <div style={{ padding: "4px 24px 8px" }}>
          <DetailRow
            label="Account Number"
            value={account.account_number}
            valueColor={C.accentLight}
            mono
          />
          <DetailRow
            label="Account Type"
            value={account.account_type || "SAVINGS"}
            valueColor={C.textSub}
          />
          <DetailRow
            label="Account Status"
            value="Active"
            valueColor={C.success}
          />
          <DetailRow
            label="Currency"
            value="Indian Rupee (INR)"
            valueColor={C.textSub}
          />
          <DetailRow
            label="Total Transactions"
            value={txCount !== null ? `${txCount} transactions` : "—"}
            valueColor={C.gold}
          />
          <div style={{ padding: "13px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12.5px", color: C.textMuted, fontWeight: 500 }}>Fraud Protection</span>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "3px 10px",
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: "20px",
                fontSize: "11px", fontWeight: 700, color: C.success,
              }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: C.success }} />
                Enabled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}