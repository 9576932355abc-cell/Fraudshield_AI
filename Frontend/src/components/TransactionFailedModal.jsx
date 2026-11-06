import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { C } from "../constants/colors";

/* ────────────────────────────────────────────────────────────────────────────
   TransactionFailedModal
   Props:
     type        : "RAPID_FIRE" | "FRAUD" | "ERROR"
     message     : Raw error message / reason string
     result      : Full transaction result object (for fraud/success case)
     onClose     : fn() — close without action
     onSendOtp   : async fn() — called to send OTP via email; resolves when sent
     onVerify    : async fn(otp) — called with the 6-digit OTP when user submits
     otpToken    : string | null — set by parent once OTP has been sent
   ──────────────────────────────────────────────────────────────────────────── */

/* ─── Icons ─────────────────────────────────────────── */
const ShieldOffIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
    </svg>
);
const ClockIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
    </svg>
);
const AlertIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
);
const BankIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="22" x2="21" y2="22"/>
        <line x1="6" y1="18" x2="6" y2="11"/>
        <line x1="10" y1="18" x2="10" y2="11"/>
        <line x1="14" y1="18" x2="14" y2="11"/>
        <line x1="18" y1="18" x2="18" y2="11"/>
        <polygon points="12 2 22 7 2 7"/>
    </svg>
);

const ChevronDown = ({ open }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.22s ease" }}>
        <polyline points="6 9 12 15 18 9"/>
    </svg>
);
const BotIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        <line x1="12" y1="3" x2="12" y2="7"/>
        <circle cx="9" cy="16" r="1"/><circle cx="15" cy="16" r="1"/>
    </svg>
);

/* ─── OTP Input ──────────────────────────────────────── */
function OtpInput({ value, onChange, disabled }) {
    const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
    const digits = value.padEnd(6, " ").split("").slice(0, 6);

    function handleKey(i, e) {
        if (e.key === "Backspace") {
            const next = value.slice(0, i) + " " + value.slice(i + 1);
            onChange(next.trimEnd());
            if (i > 0) refs[i - 1].current?.focus();
        } else if (/^[0-9]$/.test(e.key)) {
            const arr = value.padEnd(6, " ").split("");
            arr[i] = e.key;
            onChange(arr.join("").trimEnd());
            if (i < 5) refs[i + 1].current?.focus();
        }
    }

    return (
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            {refs.map((ref, i) => (
                <input
                    key={i}
                    ref={ref}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digits[i]?.trim() || ""}
                    onChange={() => {}}
                    onKeyDown={e => handleKey(i, e)}
                    onFocus={e => e.target.select()}
                    disabled={disabled}
                    style={{
                        width: "46px", height: "54px",
                        textAlign: "center",
                        fontSize: "22px", fontWeight: 800,
                        fontFamily: "monospace",
                        color: C.text,
                        background: C.surfaceAlt,
                        border: `2px solid ${digits[i]?.trim() ? C.accent : C.border}`,
                        borderRadius: "12px",
                        outline: "none",
                        transition: "border-color 0.18s, box-shadow 0.18s",
                        boxShadow: digits[i]?.trim() ? `0 0 12px ${C.accentGlow}` : "none",
                        caretColor: "transparent",
                    }}
                />
            ))}
        </div>
    );
}

/* ─── Step indicator ─────────────────────────────────── */
function Steps({ current }) {
    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", marginBottom: "28px" }}>
            {[
                { n: 1, label: "Details" },
                { n: 2, label: "Verify" },
                { n: 3, label: "Done" },
            ].map(({ n, label }, i, arr) => {
                const done    = current > n;
                const active  = current === n;
                const col     = done ? C.success : active ? C.accent : C.textMuted;
                const bgCol   = done ? C.successBg : active ? `${C.accent}20` : "transparent";
                return (
                    <div key={n} style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                            <div style={{
                                width: "30px", height: "30px", borderRadius: "50%",
                                background: bgCol,
                                border: `2px solid ${col}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "12px", fontWeight: 800, color: col,
                                transition: "all 0.3s ease",
                            }}>
                                {done ? "✓" : n}
                            </div>
                            <span style={{ fontSize: "9px", fontWeight: 700, color: col, letterSpacing: "0.06em", textTransform: "uppercase", transition: "color 0.3s" }}>
                                {label}
                            </span>
                        </div>
                        {i < arr.length - 1 && (
                            <div style={{
                                width: "40px", height: "2px", marginBottom: "16px",
                                background: done ? C.success : C.borderLight,
                                transition: "background 0.3s",
                            }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Main component ─────────────────────────────────── */
export default function TransactionFailedModal({ type, message, result, onClose, onSendOtp, onVerify, otpToken }) {
    const [showReason, setShowReason]   = useState(false);
    const [step, setStep]               = useState(1);    // 1=details, 2=otp, 3=done
    const [otp, setOtp]                 = useState("");
    const [otpError, setOtpError]       = useState("");
    const [otpLoading, setOtpLoading]   = useState(false);
    const [countdown, setCountdown]     = useState(30);
    const [canResend, setCanResend]     = useState(false);
    const [sendingOtp, setSendingOtp]   = useState(false);
    const [sendOtpError, setSendOtpError] = useState("");

    // Countdown timer for OTP resend
    useEffect(() => {
        if (step !== 2) return;
        setCountdown(30);
        setCanResend(false);
        const timer = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { clearInterval(timer); setCanResend(true); return 0; }
                return c - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [step]);

    // Escape key to close
    useEffect(() => {
        function onKey(e) { if (e.key === "Escape") onClose(); }
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const isRapidFire  = type === "RAPID_FIRE";
    const isHighValue   = type === "HIGH_VALUE";
    const isFraud       = type === "FRAUD";
    const needsOtp      = isRapidFire || isHighValue || isFraud; // any OTP-gated failure

    // ── Per-type visual style ────────────────────────────────────────────
    const accentColor = isRapidFire ? "#F97316"
                      : isHighValue ? "#EAB308"   // amber for high-value
                      : C.danger;                 // red for fraud / generic
    const accentBg    = isRapidFire ? "rgba(249,115,22,0.12)"
                      : isHighValue ? "rgba(234,179,8,0.12)"
                      : C.dangerBg;
    const accentBorder= isRapidFire ? "rgba(249,115,22,0.3)"
                      : isHighValue ? "rgba(234,179,8,0.3)"
                      : "rgba(239,68,68,0.3)";

    // Parse assistant message from result (show whenever assistant data exists)
    const assistant   = result?.assistant;
    // User-facing title & subtitle — prefer assistant fields if present
    const llmTitle    = assistant?.user_title  || null;
    const llmSubtitle = assistant?.user_message || null;
    // Detailed explanation shown inside "View Reason" (prefer admin_summary)
    const llmDetail   = assistant ? (assistant.admin_summary || assistant.user_message || null) : null;
    const nextSteps   = assistant?.next_steps || [];
    const reasons     = result?.reasons || [];
    const triggered   = result?.triggered_rules || [];

    const modalTitle = llmTitle
                     || (isRapidFire ? "Transaction Blocked"
                     : isHighValue  ? "High-Value Transaction"
                     : "Transaction Flagged");
    const modalSubtitle = llmSubtitle
        || (isRapidFire
        ? "Too many transactions detected in a short period."
        : isHighValue
        ? "This transfer is above ₹1,00,000 and requires identity verification."
        : "Our AI flagged this transaction as potentially fraudulent.");
    const statusChip = isRapidFire ? "Rate Limit Exceeded"
                     : isHighValue ? "High Value — OTP Required"
                     : "Fraud Detected";
    const ModalIcon = isRapidFire ? ClockIcon
                    : isHighValue ? BankIcon
                    : ShieldOffIcon;


    async function handleOtpSubmit() {
        const trimmed = otp.replace(/\s/g, "");
        if (trimmed.length < 6) { setOtpError("Please enter all 6 digits"); return; }
        setOtpError("");
        setOtpLoading(true);
        try {
            await onVerify(trimmed);
            setStep(3);
        } catch (err) {
            setOtpError(err.message || "Invalid OTP. Please try again.");
        } finally {
            setOtpLoading(false);
        }
    }

    // Step 1 → 2: send OTP via email then advance
    async function handleStartOtp() {
        setSendOtpError("");
        setSendingOtp(true);
        try {
            await onSendOtp();
            setStep(2);
        } catch (err) {
            setSendOtpError(err.message || "Failed to send OTP. Please try again.");
        } finally {
            setSendingOtp(false);
        }
    }

    async function handleResend() {
        if (!canResend) return;
        setOtp("");
        setOtpError("");
        setCountdown(30);
        setCanResend(false);
        try {
            await onSendOtp();
        } catch (err) {
            setOtpError(err.message || "Failed to resend OTP.");
        }
        const timer = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { clearInterval(timer); setCanResend(true); return 0; }
                return c - 1;
            });
        }, 1000);
    }

    return createPortal(
        <div
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0,
                background: "rgba(0,0,0,0.82)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 99999,
                padding: "20px",
                boxSizing: "border-box",
                overflowY: "auto",
            }}
        >
            <style>{`
                @keyframes txFailIn {
                    from { opacity: 0; transform: scale(0.92) translateY(20px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes pulse-ring {
                    0%   { transform: scale(1);    opacity: 0.6; }
                    100% { transform: scale(1.6);  opacity: 0; }
                }
                @keyframes shake {
                    0%,100% { transform: translateX(0); }
                    20%     { transform: translateX(-8px); }
                    40%     { transform: translateX(8px); }
                    60%     { transform: translateX(-5px); }
                    80%     { transform: translateX(5px); }
                }
            `}</style>

            <div style={{
                background: `linear-gradient(160deg, #0D1526 0%, #080F20 100%)`,
                border: `1px solid ${accentBorder}`,
                borderRadius: "28px",
                maxWidth: "500px", width: "100%",
                maxHeight: "90vh",
                overflowY: "auto",
                boxShadow: `0 0 0 1px ${accentBorder}, 0 40px 80px rgba(0,0,0,0.85)`,
                animation: "txFailIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                scrollbarWidth: "none",
            }}>

                {/* ── Glow bar top ── */}
                <div style={{
                    height: "4px", width: "100%",
                    background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
                    borderRadius: "28px 28px 0 0",
                }} />

                <div style={{ padding: "32px 32px 28px" }}>
                    {/* Step 1: Failure details */}
                    {step === 1 && (
                        <>
                            <Steps current={1} />

                            {/* Icon with pulse ring */}
                            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                <div style={{ position: "relative", display: "inline-block" }}>
                                    <div style={{
                                        position: "absolute", inset: 0,
                                        borderRadius: "50%",
                                        border: `2px solid ${accentColor}`,
                                        animation: "pulse-ring 1.8s ease-out infinite",
                                    }} />
                                    <div style={{
                                        width: "88px", height: "88px", borderRadius: "50%",
                                        background: accentBg,
                                        border: `2px solid ${accentBorder}`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        color: accentColor,
                                        boxShadow: `0 0 40px ${accentColor}30`,
                                        margin: "0 auto",
                                    }}>
                                    <ModalIcon />
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <div style={{ textAlign: "center", marginBottom: "24px" }}>
                                <h2 style={{
                                    margin: "0 0 8px",
                                    fontSize: "24px", fontWeight: 900,
                                    letterSpacing: "-0.03em",
                                    color: C.text,
                                }}>
                                    {modalTitle}
                                </h2>
                                <p style={{ margin: 0, fontSize: "13.5px", color: C.textMuted, lineHeight: 1.55 }}>
                                    {modalSubtitle}
                                </p>
                            </div>

                            {/* Status chip */}
                            <div style={{
                                display: "flex", justifyContent: "center", marginBottom: "20px",
                            }}>
                                <span style={{
                                    display: "inline-flex", alignItems: "center", gap: "6px",
                                    padding: "6px 16px", borderRadius: "99px",
                                    background: accentBg, border: `1px solid ${accentBorder}`,
                                    color: accentColor, fontSize: "12px", fontWeight: 700,
                                    letterSpacing: "0.06em", textTransform: "uppercase",
                                }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: accentColor, boxShadow: `0 0 6px ${accentColor}` }} />
                                    {statusChip}
                                </span>
                            </div>

                            {/* Transaction summary */}
                            {result && (
                                <div style={{
                                    background: C.surfaceAlt,
                                    border: `1px solid ${C.borderLight}`,
                                    borderRadius: "14px", overflow: "hidden",
                                    marginBottom: "16px",
                                }}>
                                    {[
                                        result.transaction_id && { label: "Transaction ID", value: `#${result.transaction_id}`, mono: true },
                                        { label: "Receiver",       value: result.receiver_name },
                                        { label: "Account",        value: result.receiver_account_number, mono: true },
                                        { label: "Amount",         value: `₹ ${Number(result.amount).toLocaleString("en-IN")}`, highlight: true },
                                    ].filter(Boolean).map(({ label, value, mono, highlight }, i, arr) => (
                                        <div key={label} style={{
                                            display: "flex", justifyContent: "space-between", alignItems: "center",
                                            padding: "11px 16px",
                                            borderBottom: i < arr.length - 1 ? `1px solid ${C.borderLight}` : "none",
                                        }}>
                                            <span style={{ fontSize: "12px", color: C.textMuted, fontWeight: 500 }}>{label}</span>
                                            <span style={{
                                                fontSize: highlight ? "15px" : "12px",
                                                fontWeight: highlight ? 900 : 700,
                                                color: highlight ? accentColor : C.text,
                                                fontFamily: mono ? "monospace" : "inherit",
                                                letterSpacing: mono ? "0.04em" : undefined,
                                            }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Expandable Reason section */}
                            <div style={{
                                border: `1px solid ${accentBorder}`,
                                borderRadius: "14px", overflow: "hidden",
                                marginBottom: "20px",
                            }}>
                                {/* Reason toggle button */}
                                <button
                                    onClick={() => setShowReason(r => !r)}
                                    style={{
                                        width: "100%", padding: "13px 18px",
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        background: showReason ? accentBg : "transparent",
                                        border: "none", cursor: "pointer",
                                        color: accentColor, fontFamily: "inherit",
                                        fontSize: "13px", fontWeight: 700,
                                        transition: "background 0.18s",
                                    }}
                                >
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <AlertIcon style={{ width: "15px", height: "15px" }} />
                                        View Reason
                                    </span>
                                    <ChevronDown open={showReason} />
                                </button>

                                {showReason && (
                                    <div style={{
                                        padding: "16px 18px",
                                        background: accentBg,
                                        borderTop: `1px solid ${accentBorder}`,
                                    }}>
                                        {/* Rapid-fire reason */}
                                        {isRapidFire && (
                                            <div style={{
                                                padding: "12px 14px",
                                                background: "rgba(0,0,0,0.25)",
                                                borderRadius: "10px",
                                                borderLeft: `3px solid ${accentColor}`,
                                                marginBottom: "10px",
                                            }}>
                                                <p style={{ margin: 0, fontSize: "13px", color: C.textSub, lineHeight: 1.65 }}>
                                                    {message}
                                                </p>
                                            </div>
                                        )}

                                        {/* Fraud reasons list */}
                                        {reasons.length > 0 && (
                                            <div style={{ marginBottom: llmDetail ? "14px" : 0 }}>
                                                <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                    Detection Reasons
                                                </p>
                                                {reasons.map((r, i) => (
                                                    <div key={i} style={{
                                                        display: "flex", gap: "8px", alignItems: "flex-start",
                                                        padding: "7px 0",
                                                        borderBottom: i < reasons.length - 1 ? `1px solid ${C.borderLight}` : "none",
                                                    }}>
                                                        <span style={{ color: accentColor, fontSize: "13px", flexShrink: 0, marginTop: "1px" }}>•</span>
                                                        <p style={{ margin: 0, fontSize: "12.5px", color: C.textSub, lineHeight: 1.55 }}>{r}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Triggered rules */}
                                        {triggered.length > 0 && (
                                            <div style={{ marginBottom: llmDetail ? "14px" : 0, marginTop: reasons.length > 0 ? "12px" : 0 }}>
                                                <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                    Triggered Rules
                                                </p>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                    {triggered.map((rule, i) => (
                                                        <span key={i} style={{
                                                            padding: "4px 10px", borderRadius: "99px",
                                                            background: `${accentColor}15`,
                                                            border: `1px solid ${accentBorder}`,
                                                            color: accentColor,
                                                            fontSize: "11px", fontWeight: 600,
                                                        }}>{rule}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* LLM / AI assistant message */}
                                        {llmDetail && (
                                            <div style={{
                                                marginTop: (reasons.length > 0 || triggered.length > 0) ? "14px" : 0,
                                                padding: "14px",
                                                background: "rgba(59,130,246,0.07)",
                                                border: "1px solid rgba(59,130,246,0.2)",
                                                borderRadius: "10px",
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                                                    <span style={{ color: C.accentLight }}><BotIcon /></span>
                                                    <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: C.accentLight, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                        FraudShield AI
                                                    </p>
                                                    {assistant?.recommended_action && (
                                                        <span style={{
                                                            marginLeft: "auto",
                                                            padding: "2px 8px", borderRadius: "99px",
                                                            background: "rgba(59,130,246,0.15)",
                                                            border: "1px solid rgba(59,130,246,0.3)",
                                                            color: C.accentLight,
                                                            fontSize: "9px", fontWeight: 700,
                                                            letterSpacing: "0.07em", textTransform: "uppercase",
                                                        }}>
                                                            {assistant.recommended_action.replace(/_/g, " ")}
                                                        </span>
                                                    )}
                                                </div>
                                                <p style={{ margin: 0, fontSize: "13px", color: C.textSub, lineHeight: 1.7, fontStyle: "italic" }}>
                                                    "{llmDetail}"
                                                </p>
                                                {nextSteps.length > 0 && (
                                                    <div style={{ marginTop: "12px" }}>
                                                        <p style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                                                            Next Steps
                                                        </p>
                                                        {nextSteps.map((stepText, i) => (
                                                            <div key={i} style={{
                                                                display: "flex", gap: "8px", alignItems: "flex-start",
                                                                padding: "5px 0",
                                                                borderBottom: i < nextSteps.length - 1 ? "1px solid rgba(59,130,246,0.1)" : "none",
                                                            }}>
                                                                <span style={{ color: C.accentLight, fontSize: "12px", flexShrink: 0, fontWeight: 700 }}>{i + 1}.</span>
                                                                <p style={{ margin: 0, fontSize: "12px", color: C.textSub, lineHeight: 1.55 }}>{stepText}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Fallback if no detailed reason */}
                                        {!isRapidFire && !llmDetail && reasons.length === 0 && triggered.length === 0 && (
                                            <p style={{ margin: 0, fontSize: "13px", color: C.textMuted, lineHeight: 1.6 }}>
                                                {message || "This transaction was blocked by our fraud detection system."}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* CTA buttons */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {/* Send OTP \u2014 shown for all three OTP-gate types */}
                                {needsOtp && onSendOtp && (
                                    <>
                                        {sendOtpError && (
                                            <p style={{
                                                textAlign: "center", margin: "0 0 6px",
                                                fontSize: "12px", color: C.danger, fontWeight: 600,
                                            }}>
                                                {sendOtpError}
                                            </p>
                                        )}
                                        <button
                                            onClick={handleStartOtp}
                                            disabled={sendingOtp}
                                            style={{
                                                width: "100%", padding: "13px",
                                                borderRadius: "12px",
                                                background: sendingOtp
                                                    ? C.surfaceAlt
                                                    : `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                                                border: "none", color: sendingOtp ? C.textMuted : "#fff",
                                                fontSize: "14px", fontWeight: 700,
                                                cursor: sendingOtp ? "not-allowed" : "pointer",
                                                boxShadow: sendingOtp ? "none" : `0 4px 20px ${accentColor}40`,
                                                fontFamily: "inherit",
                                                transition: "transform 0.15s, box-shadow 0.15s",
                                            }}
                                            onMouseEnter={e => { if (!sendingOtp) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${accentColor}55`; }}}
                                            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = sendingOtp ? "none" : `0 4px 20px ${accentColor}40`; }}
                                        >
                                            {sendingOtp ? "Sending OTP to Email…" : "🔐 Send OTP to Continue"}
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={onClose}
                                    style={{
                                        width: "100%", padding: "12px",
                                        borderRadius: "12px",
                                        background: "transparent",
                                        border: `1px solid ${C.border}`,
                                        color: C.textMuted,
                                        fontSize: "13px", fontWeight: 600,
                                        cursor: "pointer", fontFamily: "inherit",
                                        transition: "all 0.18s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.color = C.textSub; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.textMuted; }}
                                >
                                    Back to Transfer
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <>
                            <Steps current={2} />

                            <div style={{ textAlign: "center", marginBottom: "28px" }}>
                                <div style={{
                                    width: "80px", height: "80px", borderRadius: "50%",
                                    background: "rgba(59,130,246,0.12)",
                                    border: `2px solid ${C.accent}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "34px", margin: "0 auto 18px",
                                    boxShadow: `0 0 30px ${C.accentGlow}`,
                                }}>
                                    🔐
                                </div>
                                <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 900, letterSpacing: "-0.02em", color: C.text }}>
                                    Verify Your Identity
                                </h2>
                                <p style={{ margin: 0, fontSize: "13px", color: C.textMuted, lineHeight: 1.55 }}>
                                    We've sent a 6-digit OTP to your <strong style={{ color: C.accentLight }}>registered email</strong>.
                                    <br />Enter it below to proceed with the transaction.
                                </p>
                            </div>

                            {/* Info box */}
                            <div style={{
                                padding: "12px 16px",
                                background: "rgba(59,130,246,0.06)",
                                border: "1px solid rgba(59,130,246,0.18)",
                                borderRadius: "10px",
                                marginBottom: "24px",
                                display: "flex", gap: "10px", alignItems: "flex-start",
                            }}>
                                <span style={{ fontSize: "16px", flexShrink: 0 }}>ℹ️</span>
                                <p style={{ margin: 0, fontSize: "12px", color: C.textMuted, lineHeight: 1.6 }}>
                                    An OTP was sent to your <strong>registered email</strong>. Enter it below to bypass the rate-limit check and complete your transaction. The OTP is valid for <strong>5 minutes</strong>.
                                </p>
                            </div>

                            {/* OTP digit boxes */}
                            <div style={{ marginBottom: "8px" }}>
                                <OtpInput value={otp} onChange={setOtp} disabled={otpLoading} />
                            </div>

                            {/* Error */}
                            {otpError && (
                                <p style={{
                                    textAlign: "center", margin: "10px 0 0",
                                    fontSize: "12px", color: C.danger, fontWeight: 600,
                                    animation: "shake 0.4s ease",
                                }}>
                                    {otpError}
                                </p>
                            )}

                            {/* Resend */}
                            <div style={{ textAlign: "center", marginTop: "14px", marginBottom: "24px" }}>
                                {canResend ? (
                                    <button onClick={handleResend} style={{
                                        background: "none", border: "none", cursor: "pointer",
                                        color: C.accent, fontSize: "12px", fontWeight: 600, fontFamily: "inherit",
                                    }}>
                                        Resend OTP
                                    </button>
                                ) : (
                                    <p style={{ margin: 0, fontSize: "12px", color: C.textMuted }}>
                                        Resend OTP in <strong style={{ color: C.accentLight }}>{countdown}s</strong>
                                    </p>
                                )}
                            </div>

                            {/* Buttons */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                <button
                                    onClick={handleOtpSubmit}
                                    disabled={otpLoading || otp.replace(/\s/g, "").length < 6}
                                    style={{
                                        width: "100%", padding: "13px",
                                        borderRadius: "12px",
                                        background: otp.replace(/\s/g, "").length === 6
                                            ? `linear-gradient(135deg, ${C.accent}, #1D4ED8)`
                                            : C.surfaceAlt,
                                        border: "none",
                                        color: otp.replace(/\s/g, "").length === 6 ? "#fff" : C.textMuted,
                                        fontSize: "14px", fontWeight: 700,
                                        cursor: otp.replace(/\s/g, "").length === 6 ? "pointer" : "not-allowed",
                                        fontFamily: "inherit",
                                        transition: "all 0.2s",
                                        boxShadow: otp.replace(/\s/g, "").length === 6 ? `0 4px 20px ${C.accentGlow}` : "none",
                                    }}
                                >
                                    {otpLoading ? "Verifying…" : "Verify & Continue →"}
                                </button>
                                <button
                                    onClick={() => setStep(1)}
                                    disabled={otpLoading}
                                    style={{
                                        width: "100%", padding: "12px",
                                        borderRadius: "12px", background: "transparent",
                                        border: `1px solid ${C.border}`,
                                        color: C.textMuted, fontSize: "13px", fontWeight: 600,
                                        cursor: "pointer", fontFamily: "inherit", transition: "all 0.18s",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = C.surfaceAlt; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                                >
                                    ← Go Back
                                </button>
                            </div>
                        </>
                    )}

                    {/* Step 3: Success after OTP */}
                    {step === 3 && (
                        <>
                            <Steps current={3} />

                            <div style={{ textAlign: "center", padding: "20px 0 32px" }}>
                                <div style={{
                                    width: "88px", height: "88px", borderRadius: "50%",
                                    background: C.successBg,
                                    border: `2px solid ${C.success}`,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "38px", margin: "0 auto 20px",
                                    boxShadow: `0 0 40px rgba(16,185,129,0.3)`,
                                    animation: "txFailIn 0.4s ease",
                                }}>
                                    ✓
                                </div>
                                <h2 style={{ margin: "0 0 10px", fontSize: "24px", fontWeight: 900, color: C.success, letterSpacing: "-0.02em" }}>
                                    Identity Verified!
                                </h2>
                                <p style={{ margin: "0 0 28px", fontSize: "14px", color: C.textMuted, lineHeight: 1.6 }}>
                                    Your transaction has been completed successfully.
                                </p>
                                <button
                                    onClick={onClose}
                                    style={{
                                        padding: "13px 32px", borderRadius: "12px",
                                        background: `linear-gradient(135deg, ${C.success}, #059669)`,
                                        border: "none", color: "#fff",
                                        fontSize: "14px", fontWeight: 700,
                                        cursor: "pointer", fontFamily: "inherit",
                                        boxShadow: `0 4px 20px rgba(16,185,129,0.35)`,
                                    }}
                                >
                                    Done ✓
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    , document.body);
}
