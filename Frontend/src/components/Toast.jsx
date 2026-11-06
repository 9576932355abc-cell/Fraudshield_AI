import { useEffect, useState } from "react";
import { C } from "../constants/colors";

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(toast.id), 300);
    }, 3700);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const config = {
    success: { color: C.success, icon: "✓", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.3)" },
    error:   { color: C.danger,  icon: "✕", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)" },
    warning: { color: C.warning, icon: "⚠", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)" },
    info:    { color: C.accent,  icon: "ℹ", bg: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.3)" },
  };

  const cfg = config[toast.type] || config.info;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 18px",
        marginBottom: "10px",
        background: "rgba(13,21,38,0.95)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${cfg.border}`,
        borderLeft: `4px solid ${cfg.color}`,
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        minWidth: "300px",
        maxWidth: "400px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(30px)",
        transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <span style={{
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        background: cfg.bg,
        color: cfg.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: 700,
        flexShrink: 0,
        marginTop: "1px",
      }}>
        {cfg.icon}
      </span>
      <p style={{ margin: 0, fontSize: "13px", color: C.text, lineHeight: 1.4, flex: 1 }}>
        {toast.message}
      </p>
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "none",
          border: "none",
          color: C.textMuted,
          cursor: "pointer",
          fontSize: "14px",
          padding: "0",
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}

export default function Toast({ toasts, remove }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column-reverse",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={remove} />
      ))}
    </div>
  );
}