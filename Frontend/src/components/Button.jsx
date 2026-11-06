import { useState } from "react";
import { C } from "../constants/colors";
import Spinner from "./Spinner";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  type = "button",
  style = {},
  loading = false,
}) {
  const [hovered, setHovered] = useState(false);

  const sizes = {
    sm: { padding: "8px 18px", fontSize: "13px" },
    md: { padding: "10px 22px", fontSize: "14px" },
    lg: { padding: "13px 28px", fontSize: "15px" },
  };

  const variants = {
    primary: {
      background: hovered && !disabled
        ? "linear-gradient(135deg,#60A5FA,#2563EB)"
        : C.accentGrad,
      color: "#fff",
      border: "none",
      boxShadow: hovered && !disabled ? "0 0 20px rgba(59,130,246,0.45)" : "0 2px 8px rgba(59,130,246,0.25)",
    },
    secondary: {
      background: hovered && !disabled ? "rgba(59,130,246,0.12)" : "transparent",
      color: C.accentLight,
      border: `1.5px solid ${C.accent}`,
      boxShadow: "none",
    },
    danger: {
      background: hovered && !disabled
        ? "linear-gradient(135deg,#F87171,#DC2626)"
        : "linear-gradient(135deg,#EF4444,#B91C1C)",
      color: "#fff",
      border: "none",
      boxShadow: hovered && !disabled ? "0 0 16px rgba(239,68,68,0.4)" : "0 2px 8px rgba(239,68,68,0.2)",
    },
    ghost: {
      background: hovered && !disabled ? "rgba(241,245,249,0.06)" : "transparent",
      color: C.textSub,
      border: `1.5px solid ${C.borderLight}`,
      boxShadow: "none",
    },
  };

  const v = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        padding: sizes[size].padding,
        fontSize: sizes[size].fontSize,
        fontFamily: "inherit",
        fontWeight: 600,
        borderRadius: "10px",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease",
        transform: hovered && !disabled ? "translateY(-1px)" : "none",
        outline: "none",
        letterSpacing: "0.02em",
        ...v,
        ...style,
      }}
    >
      {loading ? <Spinner size={16} color="#fff" /> : children}
    </button>
  );
}