export default function Spinner({ size = 22, color = "#3B82F6" }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `2.5px solid rgba(59,130,246,0.2)`,
        borderTopColor: color,
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
        verticalAlign: "middle",
      }}
      aria-label="Loading"
    />
  );
}