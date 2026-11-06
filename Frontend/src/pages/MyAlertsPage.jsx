import { useEffect, useState } from "react";

import { api } from "../api/api";
import { C } from "../constants/colors";
import Badge from "../components/Badge";
import Spinner from "../components/Spinner";

function AlertCard({ alert }) {
    const [hov, setHov] = useState(false);
    const risk = alert.transaction?.risk_level || "LOW";
    const riskColor = risk === "HIGH" ? C.danger : risk === "MEDIUM" ? C.warning : C.success;

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: hov ? C.surfaceAlt : C.surface,
                border: `1px solid ${hov ? `${riskColor}35` : C.border}`,
                borderLeft: `4px solid ${riskColor}`,
                borderRadius: "14px",
                padding: "18px 20px",
                marginBottom: "12px",
                boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.32)" : "0 2px 8px rgba(0,0,0,0.18)",
                transition: "all 0.2s ease",
            }}
        >
            {/* Top row */}
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                flexWrap: "wrap",
                gap: "8px",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                        width: "32px", height: "32px",
                        borderRadius: "9px",
                        background: `${riskColor}15`,
                        border: `1px solid ${riskColor}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={riskColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: "13.5px", fontWeight: 800, color: C.text }}>
                            Alert #{alert.alert_id}
                        </h3>
                        <p style={{ margin: 0, fontSize: "11px", color: C.textMuted }}>
                            Transaction #{alert.transaction_id}
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <Badge text={risk} type={risk} />
                    <Badge
                        text={alert.is_resolved ? "Resolved" : "Active"}
                        type={alert.is_resolved ? "SUCCESS" : "FLAGGED"}
                    />
                </div>
            </div>

            {/* Details grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
                gap: "10px",
                padding: "12px 14px",
                background: C.surfaceAlt,
                border: `1px solid ${C.borderLight}`,
                borderRadius: "10px",
                marginBottom: "10px",
            }}>
                {[
                    { label: "Receiver",  value: alert.transaction?.receiver_name || "—" },
                    { label: "Account",   value: alert.transaction?.receiver_account_number || "—" },
                    { label: "Amount",    value: alert.transaction?.amount ? `₹ ${Number(alert.transaction.amount).toLocaleString("en-IN")}` : "—" },
                    { label: "Status",    value: alert.transaction?.status || "—" },
                ].map(({ label, value }) => (
                    <div key={label}>
                        <p style={{ margin: "0 0 2px", fontSize: "9px", color: C.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {label}
                        </p>
                        <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 600, color: C.textSub }}>
                            {value}
                        </p>
                    </div>
                ))}
            </div>

            {alert.alert_message && (
                <div style={{
                    padding: "9px 13px",
                    background: `${riskColor}0d`,
                    border: `1px solid ${riskColor}20`,
                    borderRadius: "8px",
                    marginBottom: "8px",
                }}>
                    <p style={{ margin: 0, fontSize: "12px", color: C.textSub, lineHeight: 1.5 }}>
                        {alert.alert_message}
                    </p>
                </div>
            )}

            <p style={{ margin: 0, fontSize: "11px", color: C.textMuted }}>
                {new Date(alert.alert_time).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
        </div>
    );
}

export default function MyAlertsPage({ toast }) {

    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadAlerts(); }, []);

    async function loadAlerts() {
        try {
            const [alertRes, transactionRes] = await Promise.all([
                api("/alerts/"),
                api("/transactions/"),
            ]);
            const merged = (alertRes.alerts || []).map(alert => {
                const tx = (transactionRes.transactions || []).find(
                    t => t.transaction_id === alert.transaction_id
                );
                return { ...alert, transaction: tx };
            });
            setAlerts(merged);
        } catch (err) {
            toast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    const highRisk  = alerts.filter(a => a.transaction?.risk_level === "HIGH").length;
    const unresolved = alerts.filter(a => !a.is_resolved).length;

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px" }}>
                <p style={{
                    margin: "0 0 4px", fontSize: "11px", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase", color: C.danger,
                }}>
                    Security
                </p>
                <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: "-0.02em" }}>
                    My Fraud Alerts
                </h1>
                <p style={{ marginTop: "5px", fontSize: "13px", color: C.textMuted }}>
                    All fraud alerts associated with your account.
                </p>
            </div>

            {/* Summary strip */}
            {alerts.length > 0 && (
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                    gap: "12px",
                    marginBottom: "24px",
                }}>
                    {[
                        { label: "Total Alerts",  value: alerts.length,  color: C.accent },
                        { label: "High Risk",     value: highRisk,       color: C.danger },
                        { label: "Unresolved",    value: unresolved,     color: C.warning },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: "11px",
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}>
                            <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 600 }}>{label}</span>
                            <span style={{ fontSize: "18px", fontWeight: 800, color }}>{value}</span>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    minHeight: "40vh", gap: "16px",
                }}>
                    <Spinner size={34} />
                    <p style={{ color: C.textMuted, fontSize: "13px" }}>Loading alerts...</p>
                </div>
            ) : alerts.length === 0 ? (
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: "14px",
                    padding: "52px 32px",
                    textAlign: "center",
                }}>
                    <div style={{
                        width: "48px", height: "48px", borderRadius: "14px",
                        background: "rgba(16,185,129,0.12)",
                        border: "1px solid rgba(16,185,129,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 14px",
                    }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </div>
                    <h3 style={{ color: C.success, margin: "0 0 6px" }}>All Clear</h3>
                    <p style={{ color: C.textMuted, fontSize: "13px" }}>
                        No fraud alerts on your account.
                    </p>
                </div>
            ) : (
                alerts.map(alert => (
                    <AlertCard key={alert.alert_id} alert={alert} />
                ))
            )}
        </div>
    );
}