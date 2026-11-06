import { useEffect, useState } from "react";

import { api } from "../../api/api";
import { C } from "../../constants/colors";
import Badge from "../../components/Badge";
import Button from "../../components/Button";
import Spinner from "../../components/Spinner";

function UserCard({ user, onBlock }) {
    const [hov, setHov] = useState(false);
    const isBlocked = user.status === "BLOCKED" || user.is_blocked || user.is_active === false;

    return (
        <div
            onMouseEnter={() => setHov(true)}
            onMouseLeave={() => setHov(false)}
            style={{
                background: hov ? C.surfaceAlt : C.surface,
                border: `1px solid ${hov ? C.accent + "35" : C.border}`,
                borderRadius: "14px",
                padding: "18px 22px",
                marginBottom: "12px",
                transition: "all 0.2s ease",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "14px",
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                {/* Avatar */}
                <div style={{
                    width: "44px", height: "44px",
                    borderRadius: "50%",
                    background: isBlocked
                        ? "rgba(239,68,68,0.15)"
                        : "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                    border: `2px solid ${isBlocked ? "rgba(239,68,68,0.3)" : "rgba(59,130,246,0.3)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "18px", fontWeight: 800, color: "#fff",
                    flexShrink: 0,
                }}>
                    {(user.full_name || "U")[0].toUpperCase()}
                </div>

                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: C.text }}>
                            {user.full_name}
                        </h3>
                        <span style={{
                            padding: "2px 8px",
                            borderRadius: "20px",
                            fontSize: "10px",
                            fontWeight: 700,
                            background: user.role === "ADMIN" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.1)",
                            color: user.role === "ADMIN" ? C.gold : C.accent,
                            border: `1px solid ${user.role === "ADMIN" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.2)"}`,
                        }}>
                            {user.role || "USER"}
                        </span>
                    </div>
                    <p style={{ margin: "3px 0 0", fontSize: "12px", color: C.textMuted }}>{user.email}</p>
                    {user.account_number && (
                        <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: C.textFaint, fontFamily: "monospace", fontWeight: 600 }}>
                            Account No: {user.account_number}
                        </p>
                    )}
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Badge
                    text={isBlocked ? "Blocked" : "Active"}
                    type={isBlocked ? "BLOCKED" : "ACTIVE"}
                />
                <Button
                    variant={isBlocked ? "secondary" : "danger"}
                    size="sm"
                    onClick={() => onBlock(user.id || user.user_id, isBlocked)}
                >
                    {isBlocked ? "Unblock" : "Block"}
                </Button>
            </div>
        </div>
    );
}

export default function AdminUsersPage({ toast }) {

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => { loadUsers(); }, []);

    async function loadUsers() {
        setLoading(true);
        try {
            const data = await api("/admin/users");
            setUsers(Array.isArray(data) ? data : data.users || []);
        } catch (err) {
            toast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    async function blockUser(id, isBlocked) {
        const action = isBlocked ? "unblock" : "block";
        try {
            await api(`/admin/users/${id}/${action}`, { method: "PATCH" });
            loadUsers();
            toast(`User ${isBlocked ? "unblocked" : "blocked"} successfully`, "success");
        } catch (err) {
            toast(err.message, "error");
        }
    }

    const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.account_number?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <p style={{
                    margin: "0 0 4px", fontSize: "12px", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase", color: C.gold,
                }}>
                    Admin Panel
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: "-0.02em" }}>
                        Manage Users
                    </h1>
                    <span style={{
                        padding: "8px 16px",
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: "20px",
                        fontSize: "13px",
                        fontWeight: 700,
                        color: C.textMuted,
                    }}>
                        {users.length} Users
                    </span>
                </div>
                <p style={{ marginTop: "6px", fontSize: "14px", color: C.textMuted }}>
                    View and manage all registered users.
                </p>
            </div>

            {/* Search */}
            <div style={{ marginBottom: "20px", position: "relative" }}>
                <span style={{
                    position: "absolute", left: "14px", top: "50%",
                    transform: "translateY(-50%)",
                    color: C.textMuted, pointerEvents: "none",
                    display: "flex", alignItems: "center",
                }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </span>
                <input
                    placeholder="Search by name, email, or account number..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "11px 14px 11px 42px",
                        fontSize: "14px",
                        fontFamily: "inherit",
                        color: C.text,
                        background: C.surface,
                        border: `1.5px solid ${C.border}`,
                        borderRadius: "12px",
                        outline: "none",
                        boxSizing: "border-box",
                    }}
                    onFocus={(e) => e.target.style.borderColor = C.accent}
                    onBlur={(e) => e.target.style.borderColor = C.border}
                />
            </div>

            {loading ? (
                <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    minHeight: "40vh", gap: "16px",
                }}>
                    <Spinner size={36} />
                    <p style={{ color: C.textMuted, fontSize: "14px" }}>Loading users...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{
                    background: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: "16px", padding: "48px 32px", textAlign: "center",
                }}>
                    <h3 style={{ color: C.text }}>No Users Found</h3>
                </div>
            ) : (
                filtered.map(u => (
                    <UserCard key={u.id || u.user_id} user={u} onBlock={blockUser} />
                ))
            )}
        </div>
    );
}