import { useState } from "react";

import Input from "../components/Input";
import Button from "../components/Button";
import Toast from "../components/Toast";

import { useToast } from "../hooks/UseToast";
import { api } from "../api/api";
import { C } from "../constants/colors";

export default function AuthPage({ onLogin }) {

  const [view, setView] = useState("login");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    role: "USER",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { toasts, add, remove } = useToast();

  function set(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  function validate() {
    const err = {};
    if (view === "signup") {
      if (form.full_name.trim().length < 2)
        err.full_name = "At least 2 characters";
      if (!/^(\+91)?[6-9]\d{9}$/.test(form.phone_number.replace(/[\s\-()]/g, "")))
        err.phone_number = "Valid 10-digit Indian number";
    }
    if (!form.email.includes("@")) err.email = "Enter a valid email";
    if (form.password.length < 8) err.password = "Minimum 8 characters";
    return err;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      if (view === "login") {
        const data = await api("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        localStorage.setItem("token", data.access_token);
        onLogin(data.access_token);
      } else {
        await api("/auth/signup", { method: "POST", body: JSON.stringify(form) });
        add("Account created! Please sign in.", "success");
        setTimeout(() => setView("login"), 1500);
      }
    } catch (error) {
      add(error.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Toast toasts={toasts} remove={remove} />

      <div style={{
        minHeight: "100vh",
        display: "flex",
        background: C.bg,
      }}>

        {/* ── Left Panel ──────────────────────────────── */}
        {/* ── Left Panel ──────────────────────────────────── */}
        <div
          className="auth-left"
          style={{
            width: "50%",
            minHeight: "100vh",
            background: "linear-gradient(145deg,#060B18 0%,#0D1526 55%,#0A1628 100%)",
            borderRight: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative glow blobs */}
          <div style={{
            position: "absolute", top: "-140px", right: "-120px",
            width: "520px", height: "520px", borderRadius: "50%",
            background: "radial-gradient(circle,rgba(59,130,246,0.09) 0%,transparent 70%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "-100px", left: "-80px",
            width: "380px", height: "380px", borderRadius: "50%",
            background: "radial-gradient(circle,rgba(245,158,11,0.06) 0%,transparent 70%)",
            pointerEvents: "none",
          }} />

          {/* ─── Centered content block ─── */}
          <div style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: "40px",
            padding: "0 clamp(28px, 5vw, 56px)",
            maxWidth: "480px",
            width: "100%",
          }}>

            {/* Logo row */}
            <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
              <div style={{
                width: "46px", height: "46px",
                borderRadius: "13px",
                background: "linear-gradient(135deg,#F59E0B,#D97706)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 0 28px rgba(245,158,11,0.35)",
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none">
                  <path d="M12 2L4 6v6c0 5.25 3.5 10.14 8 11.35C16.5 22.14 20 17.25 20 12V6L12 2z"/>
                </svg>
              </div>
              <div>
                <p style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: 800,
                  color: C.text,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}>
                  FraudShield
                </p>
                <p style={{
                  margin: 0,
                  fontSize: "10px",
                  color: C.gold,
                  letterSpacing: "0.13em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}>
                  AI Banking Security
                </p>
              </div>
            </div>

            {/* Hero copy */}
            <div>
              <p style={{
                margin: "0 0 14px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: C.accent,
              }}>
                Banking Security Platform
              </p>

              <h1 style={{
                margin: "0 0 20px",
                fontSize: "clamp(26px,3.2vw,40px)",
                fontWeight: 900,
                lineHeight: 1.15,
                color: C.text,
                letterSpacing: "-0.03em",
              }}>
                Real-time fraud
                <br />
                detection for
                <br />
                <span style={{
                  background: "linear-gradient(135deg,#60A5FA,#3B82F6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  modern banking.
                </span>
              </h1>

              <p style={{
                margin: 0,
                color: C.textMuted,
                fontSize: "14.5px",
                lineHeight: 1.75,
                maxWidth: "360px",
              }}>
                Every transaction monitored in real-time. Fraud alerts raised
                instantly. Admins act fast to protect your money.
              </p>
            </div>

            {/* Feature badge pills */}
            {/* <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {[
                {
                  label: "Live Monitoring",
                  svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>,
                },
                {
                  label: "Audit Trail",
                  svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>,
                },
                {
                  label: "Instant Block",
                  svg: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>,
                },
              ].map(({ label, svg }) => (
                <div key={label} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 14px",
                  background: "rgba(59,130,246,0.09)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  borderRadius: "20px",
                }}>
                  <span style={{ display: "flex", alignItems: "center", color: C.accent }}>{svg}</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: C.textSub }}>{label}</span>
                </div>
              ))}
            </div> */}
          </div>

          <style>{`
            @media (max-width: 768px) {
              .auth-left { display: none !important; }
            }
          `}</style>
        </div>

        {/* ── Right Panel ─────────────────────────────── */}
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "clamp(24px,5vw,60px) clamp(16px,4vw,40px)",
        }}>
          <div style={{ width: "100%", maxWidth: "420px" }}>

            {/* Tab switcher */}
            <div style={{
              display: "flex",
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "14px",
              padding: "5px",
              marginBottom: "32px",
            }}>
              {["login", "signup"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setView(tab); setErrors({}); }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: view === tab
                      ? "linear-gradient(135deg,#3B82F6,#1D4ED8)"
                      : "transparent",
                    color: view === tab ? "#fff" : C.textMuted,
                    fontWeight: 700,
                    fontSize: "13px",
                    transition: "all 0.2s ease",
                    boxShadow: view === tab ? "0 4px 12px rgba(59,130,246,0.3)" : "none",
                    fontFamily: "inherit",
                    letterSpacing: "0.02em",
                  }}
                >
                  {tab === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div style={{ marginBottom: "28px" }}>
              <h2 style={{
                margin: "0 0 6px",
                fontSize: "clamp(1.4rem,2.5vw,1.8rem)",
                fontWeight: 800,
                color: C.text,
                letterSpacing: "-0.02em",
              }}>
                {view === "login" ? "Welcome back" : "Join FraudShield"}
              </h2>
              <p style={{ margin: 0, color: C.textMuted, fontSize: "14px" }}>
                {view === "login"
                  ? "Sign in to access your secure banking dashboard."
                  : "Create your account in under a minute."}
              </p>
            </div>

            {/* Form card */}
            <div style={{
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: "18px",
              padding: "28px 26px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            }}>
              <form onSubmit={handleSubmit} noValidate>

                {view === "signup" && (
                  <>
                    <Input
                      label="Full Name"
                      type="text"
                      placeholder="Anmol Kumar"
                      value={form.full_name}
                      onChange={set("full_name")}
                      error={errors.full_name}
                      autoComplete="name"
                    />
                    <Input
                      label="Mobile Number"
                      type="tel"
                      placeholder="9876543210"
                      value={form.phone_number}
                      onChange={set("phone_number")}
                      error={errors.phone_number}
                      hint="10-digit Indian mobile number"
                    />
                  </>
                )}

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={set("email")}
                  error={errors.email}
                  autoComplete="email"
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder={view === "signup" ? "Min. 8 characters" : "Your password"}
                  value={form.password}
                  onChange={set("password")}
                  error={errors.password}
                  autoComplete={view === "login" ? "current-password" : "new-password"}
                />

                {view === "signup" && (
                  <div style={{ marginBottom: "18px" }}>
                    <label style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: C.textMuted,
                      marginBottom: "7px",
                    }}>
                      Account Type
                    </label>
                    <select
                      value={form.role}
                      onChange={set("role")}
                      style={{
                        width: "100%",
                        padding: "11px 14px",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        background: C.surfaceAlt,
                        border: `1.5px solid ${C.border}`,
                        borderRadius: "10px",
                        outline: "none",
                        color: C.text,
                        boxSizing: "border-box",
                        cursor: "pointer",
                      }}
                    >
                      <option value="USER" style={{ background: C.surface }}>
                        User — Personal Banking
                      </option>
                      <option value="ADMIN" style={{ background: C.surface }}>
                        Admin — Platform Management
                      </option>
                    </select>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  style={{ width: "100%", marginTop: "6px" }}
                >
                  {view === "login" ? "Sign In →" : "Create Account →"}
                </Button>

              </form>
            </div>

            <p style={{
              textAlign: "center",
              marginTop: "20px",
              fontSize: "12px",
              color: C.textMuted,
            }}>
              256-bit Encrypted &middot; SOC 2 Compliant &middot; AI-Powered Protection
            </p>
          </div>
        </div>
      </div>
    </>
  );
}