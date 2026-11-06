import { useState } from "react";
import { C } from "../constants/colors";

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  hint,
  disabled = false,
  autoComplete,
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: "18px" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: focused ? C.accentLight : C.textMuted,
            marginBottom: "7px",
            transition: "color 0.2s",
          }}
        >
          {label}
        </label>
      )}

      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          padding: "11px 14px",
          fontSize: "14px",
          fontFamily: "inherit",
          color: disabled ? C.textMuted : C.text,
          background: disabled ? "rgba(13,21,38,0.5)" : C.surfaceAlt,
          border: `1.5px solid ${
            error
              ? C.danger
              : focused
              ? C.accent
              : C.border
          }`,
          borderRadius: "10px",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s, box-shadow 0.2s",
          boxShadow: focused && !error ? `0 0 0 3px rgba(59,130,246,0.15)` : "none",
          cursor: disabled ? "not-allowed" : "text",
          opacity: disabled ? 0.6 : 1,
        }}
      />

      {error && (
        <p
          style={{
            marginTop: "5px",
            fontSize: "12px",
            color: C.danger,
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          ⚠ {error}
        </p>
      )}

      {hint && !error && (
        <p style={{ marginTop: "4px", fontSize: "11px", color: C.textMuted }}>
          {hint}
        </p>
      )}
    </div>
  );
}