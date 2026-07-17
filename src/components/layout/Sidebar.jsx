import { NavLink } from "react-router-dom";
import {
  RiDashboardLine,
  RiGroupLine,
  RiLandscapeLine,
  RiFlaskLine,
  RiFileTextLine,
  RiTimeLine,
  RiPlantLine,
  RiDatabase2Line,
  RiTeamLine,
  RiTruckLine,
  RiCoinsLine,
  RiBarChartLine,
  RiSettings4Line,
  RiLeafLine
} from "react-icons/ri";

const menuItems = [
  { to: "/", label: "Dashboard", icon: RiDashboardLine },
  { to: "/customers", label: "Customers", icon: RiGroupLine },
  { to: "/plots", label: "Plots", icon: RiLandscapeLine },
  { to: "/soil-tests", label: "Soil Tests", icon: RiFlaskLine },
  { to: "/recommendations", label: "Recommendations", icon: RiFileTextLine },
  { to: "/doses", label: "Dose Planner", icon: RiTimeLine },
  { to: "/materials", label: "Materials Master", icon: RiPlantLine },
  { to: "/inventory", label: "Inventory", icon: RiDatabase2Line },
  { to: "/employees", label: "Employees", icon: RiTeamLine },
  { to: "/suppliers", label: "Suppliers", icon: RiTruckLine },
  { to: "/finance", label: "Finance Module", icon: RiCoinsLine },
  { to: "/reports", label: "Reports Module", icon: RiBarChartLine },
  { to: "/settings", label: "Settings", icon: RiSettings4Line },
];

export default function Sidebar() {
  return (
    <aside style={sidebarStyle}>
      {/* Brand Header */}
      <div style={{ ...brandStyle, padding: "20px", display: "flex", justifyContent: "center", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <img
          src="/logo.png"
          alt="Samruddhi Organics"
          style={{ width: "100%", maxHeight: "90px", objectFit: "contain" }}
        />
      </div>

      {/* Nav Menu */}
      <nav style={navStyle}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                ...linkStyle,
                background: isActive ? "rgba(16, 185, 129, 0.15)" : "transparent",
                color: isActive ? "#ffffff" : "#a7f3d0",
                fontWeight: isActive ? "600" : "400",
                borderLeft: isActive ? "4px solid #10b981" : "4px solid transparent",
                paddingLeft: isActive ? "12px" : "16px",
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer info */}
      <div style={footerStyle}>
        <p style={versionStyle}>v1.0.0 (Commercial)</p>
      </div>
    </aside>
  );
}

// Styling definitions
const sidebarStyle = {
  width: "260px",
  background: "var(--bg-sidebar)",
  color: "#ffffff",
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  position: "sticky",
  top: 0,
  borderRight: "1px solid rgba(16, 185, 129, 0.1)",
  zIndex: 100,
};

const brandStyle = {
  padding: "24px 20px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
};

const logoIconStyle = {
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: "rgba(16, 185, 129, 0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(16, 185, 129, 0.2)",
};

const brandTitleStyle = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#ffffff",
  lineHeight: "1.2",
};

const brandSubtitleStyle = {
  fontSize: "11px",
  color: "#34d399",
  letterSpacing: "0.05em",
  textTransform: "uppercase",
};

const navStyle = {
  flex: 1,
  padding: "20px 0",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  overflowY: "auto",
};

const linkStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 16px",
  textDecoration: "none",
  fontSize: "13px",
  transition: "all var(--transition-fast)",
};

const footerStyle = {
  padding: "16px 20px",
  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
  textAlign: "center",
};

const versionStyle = {
  fontSize: "11px",
  color: "#34d399",
  opacity: 0.6,
};