import { useState } from "react";

import Input from "../components/Input";
import Button from "../components/Button";
import Card from "../components/card";

import { api } from "../api/api";
import { C } from "../constants/colors";

export default function ProfilePage({ user, toast }) {

    const [fullName, setFullName] = useState(user?.full_name || "");
    const [phone, setPhone] = useState(user?.phone_number || "");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);

    async function updateProfile(e) {
        e.preventDefault();
        setLoading(true);
        try {
            await api("/users/me", {
                method: "PATCH",
                body: JSON.stringify({ full_name: fullName, phone_number: phone }),
            });
            toast("Profile updated successfully", "success");
        } catch (err) {
            toast(err.message, "error");
        } finally {
            setLoading(false);
        }
    }

    async function changePassword(e) {
        e.preventDefault();
        if (!password || password.length < 8) {
            toast("Password must be at least 8 characters", "error");
            return;
        }
        setPwdLoading(true);
        try {
            await api("/users/change-password", {
                method: "PATCH",
                body: JSON.stringify({ password }),
            });
            setPassword("");
            toast("Password changed successfully", "success");
        } catch (err) {
            toast(err.message, "error");
        } finally {
            setPwdLoading(false);
        }
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <p style={{
                    margin: "0 0 4px", fontSize: "12px", fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent,
                }}>
                    Account Settings
                </p>
                <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: "-0.02em" }}>
                    My Profile
                </h1>
                <p style={{ marginTop: "6px", fontSize: "14px", color: C.textMuted }}>
                    Manage your personal information and security.
                </p>
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
                gap: "24px",
                alignItems: "start",
            }}>

                {/* Profile Update */}
                <Card>
                    {/* Avatar section */}
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "24px",
                        paddingBottom: "20px",
                        borderBottom: `1px solid ${C.borderLight}`,
                    }}>
                        <div style={{
                            width: "64px", height: "64px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "26px", fontWeight: 800, color: "#fff",
                            boxShadow: "0 0 20px rgba(59,130,246,0.3)",
                            flexShrink: 0,
                        }}>
                            {(user?.full_name || "U")[0].toUpperCase()}
                        </div>
                        <div>
                            <h3 style={{ margin: "0 0 4px", color: C.text, fontWeight: 800 }}>
                                {user?.full_name}
                            </h3>
                            <p style={{ margin: 0, fontSize: "13px", color: C.textMuted }}>
                                {user?.email}
                            </p>
                            <span style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                marginTop: "6px",
                                padding: "2px 10px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 700,
                                background: user?.role === "ADMIN" ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.12)",
                                color: user?.role === "ADMIN" ? C.gold : C.accent,
                                border: `1px solid ${user?.role === "ADMIN" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.25)"}`,
                            }}>
                                {user?.role || "USER"}
                            </span>
                        </div>
                    </div>

                    <h3 style={{ margin: "0 0 18px", color: C.text, fontWeight: 700, fontSize: "14px" }}>
                        Update Information
                    </h3>

                    <form onSubmit={updateProfile}>
                        <Input
                            label="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                        <Input
                            label="Phone Number"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                        <Input
                            label="Email Address"
                            value={user?.email}
                            disabled
                        />
                        <Button
                            type="submit"
                            loading={loading}
                            style={{ width: "100%", marginTop: "4px" }}
                        >
                            Save Changes
                        </Button>
                    </form>
                </Card>

                {/* Change Password */}
                <Card>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                        <div style={{
                            width: "40px", height: "40px", borderRadius: "12px",
                            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.danger} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: C.text, fontWeight: 800, fontSize: "15px" }}>
                                Change Password
                            </h3>
                            <p style={{ margin: 0, fontSize: "12px", color: C.textMuted }}>
                                Update your account password
                            </p>
                        </div>
                    </div>

                    <div style={{
                        padding: "12px 14px",
                        background: "rgba(245,158,11,0.08)",
                        border: "1px solid rgba(245,158,11,0.2)",
                        borderRadius: "10px",
                        marginBottom: "20px",
                    }}>
                        <p style={{ margin: 0, fontSize: "12px", color: C.warning, lineHeight: 1.5 }}>
                            ⚠ Use a strong password with at least 8 characters, including numbers and symbols.
                        </p>
                    </div>

                    <form onSubmit={changePassword}>
                        <Input
                            type="password"
                            label="New Password"
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            variant="danger"
                            loading={pwdLoading}
                            style={{ width: "100%", marginTop: "4px" }}
                        >
                            Update Password
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}