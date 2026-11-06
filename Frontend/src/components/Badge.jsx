import { C } from "../constants/colors";

export default function Badge({ text, type }) {

  const palette = {
    HIGH:    { bg: C.dangerBg,  color: C.danger,  border: "rgba(239,68,68,0.3)" },
    MEDIUM:  { bg: C.warningBg, color: C.warning,  border: "rgba(245,158,11,0.3)" },
    LOW:     { bg: C.successBg, color: C.success,  border: "rgba(16,185,129,0.3)" },
    SUCCESS: { bg: C.successBg, color: C.success,  border: "rgba(16,185,129,0.3)" },
    FLAGGED: { bg: C.dangerBg,  color: C.danger,  border: "rgba(239,68,68,0.3)" },
    PENDING: { bg: C.warningBg, color: C.warning,  border: "rgba(245,158,11,0.3)" },
    BLOCKED: { bg: C.dangerBg,  color: C.danger,  border: "rgba(239,68,68,0.3)" },
    ACTIVE:  { bg: C.successBg, color: C.success,  border: "rgba(16,185,129,0.3)" },
    default: { bg: C.infoBg,    color: C.accent,   border: "rgba(59,130,246,0.3)" },
  };

  const style = palette[type?.toUpperCase()] || palette.default;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      <span style={{
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        background: style.color,
        flexShrink: 0,
      }} />
      {text}
    </span>
  );
}