import { NavLink } from "react-router-dom";
import {
  RiDashboardLine, RiGroupLine, RiLandscapeLine, RiFlaskLine,
  RiFileTextLine, RiTimeLine, RiPlantLine, RiDatabase2Line,
  RiTeamLine, RiTruckLine, RiCoinsLine, RiBarChartLine,
  RiSettings4Line
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
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="Samruddhi Organics" />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p>v1.0.0 (Commercial)</p>
      </div>
    </aside>
  );
}