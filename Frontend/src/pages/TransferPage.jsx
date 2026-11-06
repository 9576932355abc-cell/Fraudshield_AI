import { useState } from "react";
import { api } from "../api/api";
import { C } from "../constants/colors";
import Input from "../components/Input";
import Button from "../components/Button";
import Badge from "../components/Badge";
import TransactionFailedModal from "../components/TransactionFailedModal";

export default function TransferPage({ toast }) {

    const [receiverAccount, setReceiverAccount] = useState("");
    const [receiverName, setReceiverName]       = useState("");
    const [amount, setAmount]                   = useState("");
    const [loading, setLoading]                 = useState(false);

    // Success modal state
    const [showSuccess, setShowSuccess]         = useState(false);
    const [successResult, setSuccessResult]     = useState(null);

    // Failure modal state
    const [failModal, setFailModal]             = useState(null); // { type, message, result }

    // OTP state — stored here so both send & verify share the token
    const [otpToken, setOtpToken]               = useState(null);
    // Pending transfer params saved when OTP is required
    const [pendingTransfer, setPendingTransfer] = useState(null);

    async function transferMoney(e) {
        e.preventDefault();

        if (!receiverAccount) { toast("Receiver account number required", "error"); return; }
        if (!receiverName)    { toast("Receiver name required", "error"); return; }
        if (!amount || Number(amount) <= 0) { toast("Enter a valid amount", "error"); return; }

        setLoading(true);
        try {
            const response = await api("/transactions/transfer", {
                method: "POST",
                body: JSON.stringify({
                    receiver_account_number: receiverAccount,
                    receiver_name: receiverName,
                    amount: Number(amount),
                }),
            });

            const txResult = response.data || response;

            // OTP required: rapid-fire, high-value, or fraud detected by ML
            if (txResult?.otp_required) {
                // Determine which type of OTP gate triggered
                const otpReason = txResult?.otp_reason || "RAPID_FIRE"; // RAPID_FIRE | HIGH_VALUE | FRAUD
                // Save pending transfer details for the send-otp call
                setPendingTransfer({
                    receiver_account_number: receiverAccount,
                    receiver_name:           receiverName,
                    amount:                  Number(amount),
                });
                setOtpToken(null); // will be set when user clicks "Send OTP"
                setFailModal({
                    type:    otpReason,           // drives modal icon/colours
                    message: txResult?.message || "OTP verification required.",
                    result:  txResult,            // carries reasons / assistant / risk_level
                });
                return; // keep form filled — user may need it after modal closes
            }

            // Transaction processed — was it flagged by ML post-completion?
            if (txResult?.alert_generated || txResult?.risk_level === "HIGH") {
                setFailModal({ type: "FRAUD", message: txResult?.message || "Fraud detected", result: txResult });
            } else {
                setSuccessResult(txResult);
                setShowSuccess(true);
            }

            setReceiverAccount("");
            setReceiverName("");
            setAmount("");

        } catch (err) {
            // All API errors (name mismatch, insufficient balance, etc.)
            toast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    // ── OTP: Step 1 — Send OTP to registered email ─────────────────────────
    async function handleSendOtp() {
        if (!pendingTransfer) return;
        const res = await api("/transactions/send-otp", {
            method: "POST",
            body: JSON.stringify({
                receiver_account_number: pendingTransfer.receiver_account_number,
                receiver_name:           pendingTransfer.receiver_name,
                amount:                  Number(pendingTransfer.amount),
            }),
        });
        // Backend returns { data: { otp_token: "..." } }
        const token = res?.data?.otp_token || res?.otp_token;
        if (!token) throw new Error("Failed to generate OTP. Please try again.");
        setOtpToken(token);
    }

    // ── OTP: Step 2 — Verify OTP and complete the transaction ──────────────
    async function handleOtpVerify(otp) {
        if (!otpToken) throw new Error("OTP token missing. Please request a new OTP.");
        const res = await api("/transactions/verify-otp", {
            method: "POST",
            body: JSON.stringify({
                otp:       otp,
                otp_token: otpToken,
            }),
        });
        // Transaction completed — show success
        const txResult = res?.data || res;
        setFailModal(null);
        setOtpToken(null);
        setPendingTransfer(null);
        setSuccessResult(txResult);
        setShowSuccess(true);
    }

    const isFraud = successResult?.alert_generated || successResult?.risk_level === "HIGH";

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <p style={{
                    margin: "0 0 4px", fontSize: "12px", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent,
                }}>
                    Banking
                </p>
                <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: "-0.02em" }}>
                    Transfer Money
                </h1>
                <p style={{ marginTop: "6px", fontSize: "14px", color: C.textMuted }}>
                    Send money securely with AI-powered fraud protection.
                </p>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "minmax(0,3fr) minmax(0,2fr)",
                gap: "24px",
                alignItems: "start",
            }}
                className="transfer-grid"
            >
                <style>{`
                  @media (max-width: 900px) {
                    .transfer-grid { grid-template-columns: 1fr !important; }
                  }
                `}</style>

                {/* Form */}
                <div style={{
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: "20px",
                    padding: "28px 30px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                        <div style={{
                            width: "44px", height: "44px", borderRadius: "13px",
                            background: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "22px",
                            boxShadow: "0 4px 14px rgba(59,130,246,0.35)",
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12"/>
                                <polyline points="12 5 19 12 12 19"/>
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: C.text }}>
                                Send Money
                            </h2>
                            <p style={{ margin: 0, fontSize: "12px", color: C.textMuted }}>
                                Instant bank transfer
                            </p>
                        </div>
                    </div>

                    <form onSubmit={transferMoney}>
                        <Input
                            label="Receiver Account Number"
                            placeholder="ACC100002"
                            value={receiverAccount}
                            onChange={(e) => setReceiverAccount(e.target.value)}
                        />
                        <Input
                            label="Receiver Full Name"
                            placeholder="Rahul Sharma"
                            value={receiverName}
                            onChange={(e) => setReceiverName(e.target.value)}
                        />

                        {/* Amount field with ₹ prefix */}
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{
                                display: "block",
                                fontSize: "11px", fontWeight: 700,
                                letterSpacing: "0.08em", textTransform: "uppercase",
                                color: C.textMuted, marginBottom: "7px",
                            }}>
                                Amount (₹)
                            </label>
                            <div style={{ position: "relative" }}>
                                <span style={{
                                    position: "absolute", left: "14px", top: "50%",
                                    transform: "translateY(-50%)",
                                    fontSize: "16px", color: C.textMuted, fontWeight: 700,
                                    pointerEvents: "none",
                                }}>₹</span>
                                <input
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    placeholder="5,000"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "11px 14px 11px 34px",
                                        fontSize: "16px", fontWeight: 700,
                                        fontFamily: "inherit",
                                        color: C.text,
                                        background: C.surfaceAlt,
                                        border: `1.5px solid ${C.border}`,
                                        borderRadius: "10px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        letterSpacing: "0.02em",
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = C.accent}
                                    onBlur={(e) => e.target.style.borderColor = C.border}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            loading={loading}
                            style={{ width: "100%" }}
                        >
                            {loading ? "Processing..." : "Send Money →"}
                        </Button>
                    </form>
                </div>

                {/* Info sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Security notice */}
                    <div style={{
                        background: "rgba(59,130,246,0.08)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        borderRadius: "16px",
                        padding: "20px",
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.accentLight} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: C.text }}>
                                AI Fraud Protection
                            </h3>
                        </div>
                        <p style={{ margin: 0, fontSize: "13px", color: C.textMuted, lineHeight: 1.6 }}>
                            Every transaction is analyzed in real-time by our AI engine to detect and prevent fraudulent activity.
                        </p>
                    </div>

                    {/* Tips */}
                    <div style={{
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: "16px",
                        padding: "20px",
                    }}>
                        <h3 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: 800, color: C.text }}>
                            💡 Transfer Tips
                        </h3>
                        {[
                            "Double-check the account number before sending",
                            "Verify the receiver name matches exactly",
                            "Large transfers may require additional verification",
                        ].map((tip, i) => (
                            <div key={i} style={{
                                display: "flex", gap: "10px",
                                marginBottom: i < 2 ? "10px" : 0,
                            }}>
                                <span style={{ color: C.accent, flexShrink: 0, fontSize: "13px" }}>→</span>
                                <p style={{ margin: 0, fontSize: "12px", color: C.textMuted, lineHeight: 1.5 }}>
                                    {tip}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Rate limit notice */}
                    <div style={{
                        background: "rgba(249,115,22,0.07)",
                        border: "1px solid rgba(249,115,22,0.2)",
                        borderRadius: "16px",
                        padding: "16px 20px",
                        display: "flex", gap: "10px", alignItems: "flex-start",
                    }}>
                        <span style={{ fontSize: "16px", flexShrink: 0 }}>⏱️</span>
                        <p style={{ margin: 0, fontSize: "12px", color: C.textMuted, lineHeight: 1.6 }}>
                            <strong style={{ color: "#F97316" }}>Rate limit:</strong> Max 2 transactions per 2 minutes per account to prevent rapid-fire fraud.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Transaction Failed / OTP Modal ──────────────────── */}
            {failModal && (
                <TransactionFailedModal
                    type={failModal.type}
                    message={failModal.message}
                    result={failModal.result}
                    onClose={() => { setFailModal(null); setOtpToken(null); setPendingTransfer(null); }}
                    // All three OTP reasons (RAPID_FIRE, HIGH_VALUE, FRAUD) use the same handlers
                    onSendOtp={failModal.result?.otp_required ? handleSendOtp : null}
                    onVerify={failModal.result?.otp_required ? handleOtpVerify : null}
                    otpToken={otpToken}
                />
            )}

            {/* ── Success Modal ─────────────────────────────────────── */}
            {showSuccess && successResult && (
                <div style={{
                    position: "fixed", inset: 0,
                    background: "rgba(0,0,0,0.82)",
                    backdropFilter: "blur(12px)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    zIndex: 9999, padding: "20px",
                }}>
                    <div style={{
                        background: `linear-gradient(160deg, #0D1526 0%, #080F20 100%)`,
                        border: "1px solid rgba(16,185,129,0.3)",
                        borderRadius: "28px",
                        maxWidth: "480px", width: "100%",
                        boxShadow: "0 0 0 1px rgba(16,185,129,0.15), 0 40px 80px rgba(0,0,0,0.85)",
                        animation: "txFailIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                        overflow: "hidden",
                    }}>
                        <style>{`
                            @keyframes txFailIn {
                                from { opacity: 0; transform: scale(0.92) translateY(20px); }
                                to   { opacity: 1; transform: scale(1) translateY(0); }
                            }
                        `}</style>
                        <div style={{ height: "4px", background: "linear-gradient(90deg, transparent, #10B981, transparent)" }} />
                        <div style={{ padding: "36px" }}>
                            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                <div style={{
                                    width: "88px", height: "88px", borderRadius: "50%",
                                    background: "rgba(16,185,129,0.12)",
                                    border: "2px solid #10B981",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "38px", margin: "0 auto 18px",
                                    boxShadow: "0 0 40px rgba(16,185,129,0.3)",
                                }}>
                                    ✓
                                </div>
                                <h2 style={{ margin: "0 0 8px", fontSize: "24px", fontWeight: 900, letterSpacing: "-0.02em", color: C.success }}>
                                    Transfer Successful!
                                </h2>
                                <p style={{ margin: 0, fontSize: "13.5px", color: C.textMuted }}>
                                    Money transferred securely.
                                </p>
                            </div>

                            {/* Summary */}
                            <div style={{
                                background: C.surfaceAlt,
                                border: `1px solid ${C.borderLight}`,
                                borderRadius: "14px", overflow: "hidden",
                                marginBottom: "20px",
                            }}>
                                {[
                                    { label: "Transaction ID", value: `#${successResult.transaction_id}`, mono: true },
                                    { label: "Receiver",       value: successResult.receiver_name },
                                    { label: "Account",        value: successResult.receiver_account_number, mono: true },
                                    { label: "Amount",         value: `₹ ${Number(successResult.amount).toLocaleString("en-IN")}` },
                                    { label: "Risk Level",     value: successResult.risk_level },
                                ].map(({ label, value, mono }, i, arr) => (
                                    <div key={label} style={{
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        padding: "11px 16px",
                                        borderBottom: i < arr.length - 1 ? `1px solid ${C.borderLight}` : "none",
                                    }}>
                                        <span style={{ fontSize: "12px", color: C.textMuted }}>{label}</span>
                                        {label === "Risk Level"
                                            ? <Badge text={value} type={value} />
                                            : <span style={{ fontSize: "12px", fontWeight: 700, color: C.text, fontFamily: mono ? "monospace" : "inherit" }}>{value}</span>
                                        }
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setShowSuccess(false)}
                                style={{
                                    width: "100%", padding: "13px", borderRadius: "12px",
                                    background: "linear-gradient(135deg, #10B981, #059669)",
                                    border: "none", color: "#fff",
                                    fontSize: "14px", fontWeight: 700,
                                    cursor: "pointer", fontFamily: "inherit",
                                    boxShadow: "0 4px 20px rgba(16,185,129,0.35)",
                                }}
                            >
                                Done ✓
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}