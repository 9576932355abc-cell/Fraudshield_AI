import { useState, useEffect } from "react";

import AuthPage from "./pages/AuthPage";
import TransactionsPage from "./pages/TransactionsPage";
import DashboardPage from "./pages/DashboardPage";
import AccountPage from "./pages/AccountPage";
import MyAlertsPage from "./pages/MyAlertsPage";
import ProfilePage from "./pages/ProfilePage";
import TransferPage from "./pages/TransferPage";
import AdminAlertsPage from "./pages/admin/AdminAlertsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Spinner from "./components/Spinner";
import Toast from "./components/Toast";

import { useToast } from "./hooks/UseToast";
import { api } from "./api/api";
import { C } from "./constants/colors";

export default function App() {

    const [token, setToken] = useState(
        () => localStorage.getItem("token")
    );
    const [user, setUser]     = useState(null);
    const [active, setActive] = useState("dashboard");

    // When user data loads, redirect admin to admin panel by default
    useEffect(() => {
        if (user?.role === "ADMIN" && active === "dashboard") {
            setActive("admin-alerts");
        }
    }, [user]);
    const [loading, setLoading] = useState(false);

    const { toasts, add, remove } = useToast();

    useEffect(() => {
        if (!token) return;
        async function loadUser() {
            setLoading(true);
            try {
                const data = await api("/users/me");
                setUser(data);
            } catch {
                localStorage.removeItem("token");
                setToken(null);
            } finally {
                setLoading(false);
            }
        }
        loadUser();
    }, [token]);

    function handleLogin(t) { setToken(t); }

    function handleLogout() {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setActive("dashboard");
    }

    // Redirect to login when the access token expires (401 from API)
    useEffect(() => {
        function onSessionExpired() {
            setToken(null);
            setUser(null);
            setActive("dashboard");
            add("Your session has expired. Please log in again.", "error");
        }
        window.addEventListener("session-expired", onSessionExpired);
        return () => window.removeEventListener("session-expired", onSessionExpired);
    }, []);

    if (!token) {
        return <AuthPage onLogin={handleLogin} />;
    }

    if (loading || !user) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: C.bg,
                gap: "16px",
            }}>
                <div style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg,#F59E0B,#D97706)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 28px rgba(245,158,11,0.3)",
                }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="white" stroke="none">
                        <path d="M12 2L4 6v6c0 5.25 3.5 10.14 8 11.35C16.5 22.14 20 17.25 20 12V6L12 2z"/>
                    </svg>
                </div>
                <Spinner size={28} />
                <p style={{ color: C.textMuted, fontSize: "13px", margin: 0 }}>
                    Loading your account...
                </p>
            </div>
        );
    }

    const pages = {
        dashboard:         <DashboardPage user={user} toast={add} />,
        account:           <AccountPage />,
        alerts:            <MyAlertsPage toast={add} />,
        profile:           <ProfilePage user={user} setUser={setUser} toast={add} />,
        transfer:          <TransferPage toast={add} />,
        transactions:      <TransactionsPage toast={add} />,
        "admin-alerts":    <AdminAlertsPage toast={add} />,
        "admin-users":     <AdminUsersPage toast={add} />,
        "admin-auditlogs": <AdminAuditLogsPage toast={add} />,
    };

    return (
        <>
            <Toast toasts={toasts} remove={remove} />

            {/* App shell: sidebar left + content right */}
            <div style={{
                display: "flex",
                height: "100vh",
                overflow: "hidden",
                background: C.bg,
            }}>
                {/* Sidebar — full height, does not scroll with content */}
                <Sidebar
                    user={user}
                    active={active}
                    setActive={setActive}
                    onLogout={handleLogout}
                />

                {/* Right side: navbar (fixed) + scrollable main + footer (fixed) */}
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    minWidth: 0,
                    height: "100vh",
                    overflow: "hidden",
                }}>
                    <Navbar user={user} activePage={active} />

                    <main style={{
                        flex: 1,
                        overflowY: "auto",
                        overflowX: "hidden",
                        padding: "clamp(20px,3vw,36px) clamp(16px,3vw,36px)",
                    }}>
                        <div className="page-wrapper">
                            {pages[active]}
                        </div>
                    </main>

                    <Footer />
                </div>
            </div>
        </>
    );
}