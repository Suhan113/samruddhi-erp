export default function PageCard({ title, subtitle, children, actions }) {
  return (
    <div style={{ background: "white", borderRadius: "16px", padding: "20px", boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", gap: "12px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px" }}>{title}</h2>
          {subtitle ? <p style={{ margin: "4px 0 0", color: "#6b7280" }}>{subtitle}</p> : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}
