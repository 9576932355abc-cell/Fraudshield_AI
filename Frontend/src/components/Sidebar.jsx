import { useState } from "react";
import { C } from "../constants/colors";

// SVG icon components — no emojis
const Icons = {
  Dashboard:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  Transfer:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  Transactions: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Alerts:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Account:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  Profile:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  FraudAlerts:  () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Users:        () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  AuditLogs:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Logout:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Menu:         () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  Shield:       () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
};

const NAV_ITEMS = [
  { key: "dashboard",    label: "Dashboard",       Icon: Icons.Dashboard },
  { key: "transfer",     label: "Transfer Money",  Icon: Icons.Transfer },
  { key: "transactions", label: "Transactions",    Icon: Icons.Transactions },
  { key: "alerts",       label: "My Alerts",       Icon: Icons.Alerts },
  { key: "account",      label: "My Account",      Icon: Icons.Account },
  { key: "profile",      label: "Update Profile",  Icon: Icons.Profile },
];

const ADMIN_ITEMS = [
  { key: "admin-alerts",    label: "Fraud Alerts",  Icon: Icons.FraudAlerts },
  { key: "admin-users",     label: "Manage Users",  Icon: Icons.Users },
  { key: "admin-auditlogs", label: "Audit Logs",    Icon: Icons.AuditLogs },
];

function NavBtn({ item, active, onClick, isAdmin }) {
  const [hov, setHov] = useState(false);
  const isActive = active === item.key;
  const { Icon } = item;

  const accentColor = isAdmin ? C.gold : C.accent;
  const accentLightColor = isAdmin ? "#FCD34D" : C.accentLight;

  return (
    <button
      onClick={() => onClick(item.key)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={item.label}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "11px",
        padding: "10px 14px",
        marginBottom: "2px",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        background: isActive
          ? isAdmin
            ? "linear-gradient(135deg,rgba(245,158,11,0.18),rgba(245,158,11,0.08))"
            : "linear-gradient(135deg,rgba(59,130,246,0.22),rgba(59,130,246,0.10))"
          : hov
          ? "rgba(241,245,249,0.05)"
          : "transparent",
        color: isActive ? accentLightColor : hov ? C.textSub : C.textMuted,
        fontSize: "13.5px",
        fontWeight: isActive ? 700 : 500,
        textAlign: "left",
        transition: "all 0.16s ease",
        borderLeft: isActive ? `2.5px solid ${accentColor}` : "2.5px solid transparent",
        fontFamily: "inherit",
        letterSpacing: "0.01em",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", flexShrink: 0, opacity: isActive ? 1 : 0.7 }}>
        <Icon />
      </span>
      <span>{item.label}</span>
      {isActive && (
        <span style={{
          marginLeft: "auto",
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: accentColor,
          boxShadow: `0 0 6px ${accentColor}`,
          flexShrink: 0,
        }} />
      )}
    </button>
  );
}

function LogoutBtn({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%",
        padding: "10px",
        border: `1.5px solid ${hov ? C.danger : "rgba(239,68,68,0.25)"}`,
        borderRadius: "10px",
        background: hov ? "rgba(239,68,68,0.10)" : "transparent",
        color: hov ? C.danger : "rgba(239,68,68,0.65)",
        cursor: "pointer",
        fontWeight: 600,
        fontSize: "13px",
        transition: "all 0.16s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        fontFamily: "inherit",
      }}
    >
      <Icons.Logout /> Sign Out
    </button>
  );
}

export default function Sidebar({ user, active, setActive, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = user?.role === "ADMIN";

  function handleNav(key) {
    setActive(key);
    setMobileOpen(false);
  }

  const sidebarContent = (
    <aside
      style={{
        width: "256px",
        height: "100vh",
        background: C.sidebar,
        borderRight: `1px solid ${isAdmin ? "rgba(245,158,11,0.15)" : C.sidebarBorder}`,
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Logo */}
      <div style={{
        padding: "24px 20px 20px",
        borderBottom: `1px solid ${isAdmin ? "rgba(245,158,11,0.12)" : C.sidebarBorder}`,
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}>
        <div style={{
          width: "34px",
          height: "34px",
          borderRadius: "9px",
          background: "linear-gradient(135deg,#F59E0B,#D97706)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 0 14px rgba(245,158,11,0.3)",
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.14 8 11.35C16.5 22.14 20 17.25 20 12V6L12 2z"/>
          </svg>
        </div>
        <div>
          <p style={{
            margin: 0,
            fontSize: "25px",
            fontWeight: 800,
            color: C.text,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}>
            FraudShield
          </p>
          <p style={{
            margin: 0,
            fontSize: "9px",
            color: isAdmin ? C.gold : C.textMuted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}>
            {isAdmin ? "Administrator" : "AI Banking Security"}
          </p>
        </div>
      </div>

      {/* Admin identity badge */}
      {isAdmin && (
        <div style={{
          margin: "12px 10px 0",
          padding: "10px 14px",
          background: "linear-gradient(135deg,rgba(245,158,11,0.15),rgba(217,119,6,0.08))",
          border: "1px solid rgba(245,158,11,0.25)",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "9px",
        }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "7px",
            background: "rgba(245,158,11,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icons.Shield />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: C.gold }}>Admin Access</p>
            <p style={{ margin: 0, fontSize: "10px", color: "rgba(245,158,11,0.6)" }}>Full system privileges</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>

        {/* ── Admin view: only admin panel items ── */}
        {isAdmin ? (
          <>
            <p style={{
              margin: "4px 4px 10px",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.gold,
            }}>
              Admin Panel
            </p>
            {ADMIN_ITEMS.map((item) => (
              <NavBtn key={item.key} item={item} active={active} onClick={handleNav} isAdmin={true} />
            ))}
          </>
        ) : (
          /* ── Regular user view ── */
          <>
            <p style={{
              margin: "0 4px 8px",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.textFaint,
            }}>
              Navigation
            </p>
            {NAV_ITEMS.map((item) => (
              <NavBtn key={item.key} item={item} active={active} onClick={handleNav} isAdmin={false} />
            ))}
          </>
        )}
      </nav>

      {/* User info + Logout */}
      <div style={{
        padding: "14px 10px",
        borderTop: `1px solid ${isAdmin ? "rgba(245,158,11,0.12)" : C.sidebarBorder}`,
      }}>
        {/* User info strip */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 10px",
          marginBottom: "10px",
          background: "rgba(241,245,249,0.03)",
          borderRadius: "8px",
          border: `1px solid ${C.borderLight}`,
        }}>
          <div style={{
            width: "30px", height: "30px", borderRadius: "50%",
            background: isAdmin
              ? "linear-gradient(135deg,#F59E0B,#D97706)"
              : "linear-gradient(135deg,#3B82F6,#1D4ED8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0,
          }}>
            {user?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user?.full_name || "User"}
            </p>
            <p style={{ margin: 0, fontSize: "10px", color: isAdmin ? C.gold : C.textMuted, fontWeight: 500 }}>
              {user?.email || ""}
            </p>
          </div>
        </div>
        <LogoutBtn onClick={onLogout} />
      </div>
    </aside>
  );

  return (
    <>
      <style>{`
        @media (min-width: 769px) {
          .fs-sidebar-desktop { display: flex !important; }
          .fs-mobile-toggle { display: none !important; }
        }
        @media (max-width: 768px) {
          .fs-sidebar-desktop { display: none !important; }
          .fs-mobile-toggle { display: flex !important; }
        }
      `}</style>

      {/* Desktop sidebar — rendered once */}
      <div className="fs-sidebar-desktop" style={{ display: "none" }}>
        {sidebarContent}
      </div>

      {/* Mobile hamburger button */}
      <button
        className="fs-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        style={{
          display: "none",
          position: "fixed",
          top: "14px",
          left: "14px",
          zIndex: 1100,
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: C.surface,
          border: `1px solid ${C.border}`,
          color: C.text,
          cursor: "pointer",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
        }}
      >
        <Icons.Menu />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1200,
            display: "flex",
          }}
        >
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              flex: 1,
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(4px)",
            }}
          />
          <div style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            animation: "slideInLeft 0.25s ease",
          }}>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}