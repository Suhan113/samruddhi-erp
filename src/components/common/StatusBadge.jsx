export default function StatusBadge({ value }) {
  const palette = {
    Active: { background: "#dcfce7", color: "#166534" },
    Pending: { background: "#fef3c7", color: "#92400e" },
    Draft: { background: "#e0f2fe", color: "#075985" },
  };

  const style = palette[value] || { background: "#e5e7eb", color: "#374151" };

  return (
    <span style={{ padding: "6px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, background: style.background, color: style.color }}>
      {value}
    </span>
  );
}
