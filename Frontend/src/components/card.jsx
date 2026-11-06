import { C } from "../constants/colors";

export default function Card({ children, style = {}, className = "" }) {
  return (
    <div
      className={className}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
        transition: "border-color 0.2s, box-shadow 0.2s",
        ...style,
      }}
    >
      {children}
    </div>
  );
}