import { useEffect, useMemo, useState } from "react";

import { api } from "../api/api";
import { C } from "../constants/colors";

import StatsCard from "../components/StatsCard";
import TransactionCard, { TxTableHeader } from "../components/TransactionCard";
import Spinner from "../components/Spinner";

export default function DashboardPage({ user, toast }) {

    const [transactions, setTransactions] = useState([]);
    const [account, setAccount]           = useState(null);
    const [alerts, setAlerts]             = useState([]);
    const [loading, setLoading]           = useState(true);

    useEffect(() => { loadDashboard(); }, []);

    async function loadDashboard() {
        setLoading(true);
        try {
            const [transactionRes, accountRes, alertRes] = await Promise.all([
                api("/transactions/"),
                api("/accounts/me"),
                api("/alerts/"),
            ]);
            setTransactions(transactionRes.transactions || []);
            setAccount(accountRes);
            setAlerts(alertRes.alerts || []);
        } catch (err) {
            toast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    const successfulTransactions = useMemo(() =>
        transactions.filter(t => t.status === "SUCCESS").length,
        [transactions]
    );
    const flaggedTransactions = useMemo(() =>
        transactions.filter(t => t.status === "FLAGGED").length,
        [transactions]
    );
    const recentTransactions = useMemo(() =>
        [...transactions]
            .sort((a, b) => new Date(b.transaction_time) - new Date(a.transaction_time))
            .slice(0, 5),
        [transactions]
    );

    if (loading) {
        return (
            <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                minHeight: "60vh", gap: "16px",
            }}>
                <Spinner size={36} />
                <p style={{ color: C.textMuted, fontSize: "14px" }}>Loading dashboard...</p>
            </div>
        );
    }

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

    return (
        <div>

            {/* ── Header ──────────────────────────────────── */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "28px",
                flexWrap: "wrap",
                gap: "14px",
            }}>
                <div>
                    <p style={{
                        margin: "0 0 3px",
                        fontSize: "15px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: C.accent,
                    }}>
                        {greeting}
                    </p>
                    <h1 style={{
                        margin: 0,
                        fontSize: "clamp(1.5rem,2.5vw,1.9rem)",
                        fontWeight: 900,
                        color: C.text,
                        letterSpacing: "-0.03em",
                    }}>
                        {user?.full_name}
                    </h1>
                    <p style={{ marginTop: "5px", fontSize: "13px", color: C.textMuted }}>
                        Monitor your banking activity and fraud alerts.
                    </p>
                </div>
            </div>

            {/* ── Stats ───────────────────────────────────── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                gap: "16px",
                marginBottom: "32px",
            }}>
                <StatsCard
                    title="Current Balance"
                    value={`₹ ${Number(account?.balance || 0).toLocaleString("en-IN")}`}
                    icon="balance"
                    color={C.accent}
                />
                <StatsCard
                    title="Total Transactions"
                    value={transactions.length}
                    icon="transactions"
                    color="#8B5CF6"
                />
                <StatsCard
                    title="Successful"
                    value={successfulTransactions}
                    icon="success"
                    color={C.success}
                />
                <StatsCard
                    title="Fraud Alerts"
                    value={alerts.length}
                    icon="alerts"
                    color={C.danger}
                />
            </div>

            {/* ── Main Grid: Transactions + Fraud Summary ── */}
            <div
                className="dashboard-grid"
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)",
                    gap: "22px",
                    alignItems: "start",
                }}
            >
                <style>{`
                  @media (max-width: 960px) {
                    .dashboard-grid { grid-template-columns: 1fr !important; }
                  }
                `}</style>

                {/* Recent Transactions */}
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: "16px",
                    overflow: "hidden",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                }}>
                    {/* Panel header */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "18px 20px 16px",
                        borderBottom: `1px solid ${C.borderLight}`,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{
                                width: "30px", height: "30px",
                                borderRadius: "8px",
                                background: "rgba(59,130,246,0.1)",
                                border: `1px solid rgba(59,130,246,0.2)`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                                </svg>
                            </div>
                            <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: C.text }}>
                                Recent Transactions
                            </h2>
                        </div>
                        <span style={{
                            fontSize: "11px",
                            color: C.textMuted,
                            background: "rgba(241,245,249,0.04)",
                            border: `1px solid ${C.borderLight}`,
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontWeight: 600,
                        }}>
                            Latest 5
                        </span>
                    </div>

                    {/* Column headers — synced to TransactionCard grid */}
                    {recentTransactions.length > 0 && <TxTableHeader />}

                    {/* Cards */}
                    <div style={{ padding: "10px 12px" }}>
                        {recentTransactions.length === 0 ? (
                            <div style={{ padding: "36px", textAlign: "center" }}>
                                <p style={{ fontSize: "13px", color: C.textMuted, marginBottom: "4px", fontWeight: 600 }}>
                                    No Transactions Yet
                                </p>
                                <p style={{ fontSize: "12px", color: C.textFaint }}>
                                    Your recent transactions will appear here.
                                </p>
                            </div>
                        ) : (
                            recentTransactions.map(tx => (
                                <TransactionCard key={tx.transaction_id} transaction={tx} />
                            ))
                        )}
                    </div>
                </div>

                {/* Fraud Summary */}
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: "14px",
                    padding: "20px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        marginBottom: "18px",
                        paddingBottom: "14px",
                        borderBottom: `1px solid ${C.borderLight}`,
                    }}>
                        <div style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "9px",
                            background: C.dangerBg,
                            border: `1px solid rgba(239,68,68,0.25)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>
                        <h2 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: C.text }}>
                            Fraud Summary
                        </h2>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[
                            { label: "Total Alerts",          value: alerts.length,            color: C.danger },
                            { label: "Flagged Transactions",  value: flaggedTransactions,       color: "#F97316" },
                            { label: "Successful Transfers",  value: successfulTransactions,    color: C.success },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "11px 14px",
                                background: C.surfaceAlt,
                                border: `1px solid ${C.borderLight}`,
                                borderRadius: "10px",
                            }}>
                                <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 500 }}>
                                    {label}
                                </span>
                                <span style={{
                                    fontSize: "17px",
                                    fontWeight: 800,
                                    color,
                                    letterSpacing: "-0.02em",
                                }}>
                                    {value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}