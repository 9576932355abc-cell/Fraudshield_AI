import { C } from "../constants/colors";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      height: "48px",
      background: C.bgAlt,
      borderTop: `1px solid ${C.sidebarBorder}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      flexShrink: 0,
    }}>
      <p style={{
        margin: 0,
        fontSize: "11px",
        color: C.textFaint,
        fontWeight: 500,
      }}>
        &copy; {year} FraudShield AI &mdash; Banking Security Platform
      </p>
      <p style={{
        margin: 0,
        fontSize: "11px",
        color: C.textFaint,
        fontWeight: 500,
      }}>
        Powered by AI &middot; 256-bit Encrypted &middot; SOC 2 Compliant
      </p>
    </footer>
  );
}
