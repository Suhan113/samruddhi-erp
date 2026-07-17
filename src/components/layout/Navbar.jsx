import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  RiDashboardLine, RiGroupLine, RiLandscapeLine, RiFlaskLine,
  RiFileTextLine, RiTimeLine, RiPlantLine, RiDatabase2Line,
  RiTeamLine, RiTruckLine, RiCoinsLine, RiBarChartLine,
  RiSettings4Line, RiLogoutBoxRLine, RiUserLine,
  RiSearchLine, RiNotification3Line, RiMenuLine, RiCloseLine
} from "react-icons/ri";

const menuItems = [
  { to: "/", label: "Dashboard", icon: RiDashboardLine },
  { to: "/customers", label: "Customers", icon: RiGroupLine },
  { to: "/plots", label: "Plots", icon: RiLandscapeLine },
  { to: "/soil-tests", label: "Soil Tests", icon: RiFlaskLine },
  { to: "/recommendations", label: "Recommendations", icon: RiFileTextLine },
  { to: "/doses", label: "Dose Planner", icon: RiTimeLine },
  { to: "/materials", label: "Materials", icon: RiPlantLine },
  { to: "/inventory", label: "Inventory", icon: RiDatabase2Line },
  { to: "/employees", label: "Employees", icon: RiTeamLine },
  { to: "/suppliers", label: "Suppliers", icon: RiTruckLine },
  { to: "/finance", label: "Finance", icon: RiCoinsLine },
  { to: "/reports", label: "Reports", icon: RiBarChartLine },
  { to: "/settings", label: "Settings", icon: RiSettings4Line },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Format current date matching en-IN standard regional settings
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="top-navbar">
        {/* ── Row 1: Brand / Search / Global Actions ── */}
        <div className="top-navbar-header">
          {/* Hamburger trigger button (visible below 768px breakline) */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle navigation map"
          >
            {mobileMenuOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
          </button>

          {/* Brand & Logo Engine Configuration indicator */}
          <div className="top-navbar-brand">
            <img src="/logo.png" alt="Samruddhi Organics Logo" />
            <div className="top-navbar-title">
              <h2>Samruddhi Organics ERP</h2>
              <span>
                {import.meta.env.VITE_SUPABASE_URL ? "Supabase Cloud" : "Local Engine"}
              </span>
            </div>
          </div>

          {/* Global Search Bar (Responsive hidden on layout phone widths) */}
          <div className="top-navbar-search">
            <RiSearchLine size={15} />
            <input 
              type="text" 
              placeholder="Global ERP Search (Farmers, Soil Tests, Recommendations...)" 
            />
          </div>

          {/* Right Area Global Actions Panel */}
          <div className="top-navbar-actions">
            <div className="top-navbar-date">{today}</div>

            <div className="top-navbar-notif" title="Notifications">
              <RiNotification3Line size={17} />
              <span className="top-navbar-notif-dot">3</span>
            </div>

            {user && (
              <div className="top-navbar-profile">
                <div className="top-navbar-avatar">
                  <RiUserLine size={15} />
                </div>
                <div className="top-navbar-userinfo">
                  <span className="name">{user.name}</span>
                  <span className="role">{user.role || "Administrator"}</span>
                </div>
              </div>
            )}

            <button className="top-navbar-logout" onClick={logout} title="Sign Out">
              <RiLogoutBoxRLine size={15} />
              <span className="logout-label">Sign Out</span>
            </button>
          </div>
        </div>

        {/* ── Row 2: Desktop Horizontal Link Array ── */}
        <nav className="top-navbar-nav desktop-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `top-nav-link${isActive ? " active" : ""}`
                }
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* ── Mobile Drawer Layout: Dynamic sliding drawer module ── */}
        <div className={`mobile-nav-drawer${mobileMenuOpen ? " open" : ""}`}>
          <div className="mobile-nav-search">
            <RiSearchLine size={15} />
            <input type="text" placeholder="Search ERP system..." />
          </div>

          <nav className="mobile-nav-links">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `mobile-nav-link${isActive ? " active" : ""}`
                  }
                  onClick={closeMobileMenu}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {user && (
            <div className="mobile-nav-footer">
              <div className="mobile-nav-user">
                <div className="top-navbar-avatar">
                  <RiUserLine size={15} />
                </div>
                <div className="top-navbar-userinfo">
                  <span className="name">{user.name}</span>
                  <span className="role">{user.role || "Administrator"}</span>
                </div>
              </div>
              <button 
                className="top-navbar-logout" 
                onClick={() => { logout(); closeMobileMenu(); }}
              >
                <RiLogoutBoxRLine size={15} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Mobile Nav Backdrop Layer Mask ── */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={closeMobileMenu} />
      )}
    </>
  );
}
