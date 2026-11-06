import { useState, useEffect, useRef } from "react";
import { C } from "../constants/colors";
import { api } from "../api/api";

const PAGE_TITLES = {
  dashboard:       { label: "Dashboard",       sub: "Overview of your account activity" },
  transfer:        { label: "Transfer Money",  sub: "Send funds securely" },
  transactions:    { label: "Transactions",    sub: "Your complete transaction history" },
  alerts:          { label: "My Alerts",       sub: "Fraud alerts on your account" },
  account:         { label: "My Account",      sub: "Account details and balance" },
  profile:         { label: "Update Profile",  sub: "Manage your personal information" },
  "admin-alerts":    { label: "Fraud Alerts",  sub: "Review and resolve alerts" },
  "admin-users":     { label: "Manage Users",  sub: "View and control user accounts" },
  "admin-auditlogs": { label: "Audit Logs",    sub: "System activity trail" },
};

export default function Navbar({ user, activePage }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [account, setAccount] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Load account info once when dropdown opens
  useEffect(() => {
    if (dropdownOpen && !account) {
      api("/accounts/me")
        .then(setAccount)
        .catch(() => {});
    }
  }, [dropdownOpen, account]);

  const pageInfo = PAGE_TITLES[activePage] || { label: "FraudShield", sub: "" };

  return (
    <header style={{
      height: "80px",
      background: C.bgAlt,
      borderBottom: `1px solid ${C.sidebarBorder}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      {/* Left: Page title */}
      <div>
        <h2 style={{
          margin: 0,
          fontSize: "25px",
          fontWeight: 800,
          color: C.text,
          letterSpacing: "-0.01em",
          lineHeight: 1.2,
        }}>
          {pageInfo.label}
        </h2>
        {pageInfo.sub && (
          <p style={{
            margin: 0,
            fontSize: "11px",
            color: C.textMuted,
            marginTop: "1px",
          }}>
            {pageInfo.sub}
          </p>
        )}
      </div>

      {/* Right: Profile button */}
      <div style={{ position: "relative" }} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "7px 14px 7px 8px",
            background: dropdownOpen ? "rgba(59,130,246,0.12)" : "rgba(241,245,249,0.04)",
            border: `1px solid ${dropdownOpen ? "rgba(59,130,246,0.3)" : C.border}`,
            borderRadius: "10px",
            cursor: "pointer",
            transition: "all 0.18s ease",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            if (!dropdownOpen) {
              e.currentTarget.style.background = "rgba(241,245,249,0.07)";
              e.currentTarget.style.borderColor = "rgba(59,130,246,0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (!dropdownOpen) {
              e.currentTarget.style.background = "rgba(241,245,249,0.04)";
              e.currentTarget.style.borderColor = C.border;
            }
          }}
        >
          {/* Avatar */}
          <div style={{
            width: "30px",
            height: "30px",
            borderRadius: "50%",
            background: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}>
            {(user?.full_name || "U")[0].toUpperCase()}
          </div>
          <div style={{ textAlign: "left" }}>
            <p style={{ margin: 0, fontSize: "12.5px", fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
              {user?.full_name}
            </p>
            <p style={{ margin: 0, fontSize: "10px", color: C.textMuted, lineHeight: 1.2 }}>
              {user?.role === "ADMIN" ? "Administrator" : "Personal Account"}
            </p>
          </div>
          {/* Chevron */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke={C.textMuted}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              marginLeft: "2px",
              transition: "transform 0.2s",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {/* Dropdown panel */}
        {dropdownOpen && (
          <div style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "300px",
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: "16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.55)",
            overflow: "hidden",
            animation: "fadeIn 0.18s ease",
            zIndex: 200,
          }}>
            {/* Header */}
            <div style={{
              padding: "18px 20px 16px",
              background: "linear-gradient(135deg,rgba(59,130,246,0.12),rgba(59,130,246,0.04))",
              borderBottom: `1px solid ${C.borderLight}`,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 800,
                color: "#fff",
                flexShrink: 0,
                boxShadow: "0 0 16px rgba(59,130,246,0.3)",
              }}>
                {(user?.full_name || "U")[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: C.text }}>
                  {user?.full_name}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: C.textMuted, marginTop: "2px" }}>
                  {user?.email}
                </p>
                <span style={{
                  display: "inline-block",
                  marginTop: "4px",
                  padding: "1px 8px",
                  borderRadius: "20px",
                  fontSize: "9px",
                  fontWeight: 800,
                  background: user?.role === "ADMIN" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.12)",
                  color: user?.role === "ADMIN" ? C.gold : C.accent,
                  border: `1px solid ${user?.role === "ADMIN" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.25)"}`,
                  letterSpacing: "0.06em",
                }}>
                  {user?.role || "USER"}
                </span>
              </div>
            </div>

            {/* Account info rows */}
            <div style={{ padding: "12px 0" }}>
              <p style={{
                margin: "0 20px 10px",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.textFaint,
              }}>
                Account Information
              </p>

              {account ? (
                <>
                  <AccountRow
                    label="Account Number"
                    value={account.account_number}
                    mono
                    accent
                  />
                  <AccountRow
                    label="Available Balance"
                    value={`₹ ${Number(account.balance || 0).toLocaleString("en-IN")}`}
                    valueColor={C.success}
                  />
                  <AccountRow
                    label="Account Type"
                    value={account.account_type || "SAVINGS"}
                  />
                  <AccountRow
                    label="Account Status"
                    value="ACTIVE"
                    valueColor={C.success}
                  />
                </>
              ) : (
                <div style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(59,130,246,0.2)",
                    borderTopColor: C.accent,
                    borderRadius: "50%",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  <span style={{ fontSize: "12px", color: C.textMuted }}>Loading account info...</span>
                </div>
              )}

              {user?.phone_number && (
                <AccountRow label="Phone" value={user.phone_number} />
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function AccountRow({ label, value, mono = false, accent = false, valueColor }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 20px",
    }}>
      <span style={{ fontSize: "11px", color: C.textMuted, fontWeight: 500 }}>
        {label}
      </span>
      <span style={{
        fontSize: mono ? "12px" : "12.5px",
        fontWeight: 700,
        color: valueColor || (accent ? C.accentLight : C.textSub),
        fontFamily: mono ? "'Courier New', monospace" : "inherit",
        letterSpacing: mono ? "0.04em" : "normal",
      }}>
        {value}
      </span>
    </div>
  );
}