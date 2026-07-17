import { useAuth } from "../../contexts/AuthContext";
import { 
  RiLogoutBoxRLine, 
  RiUserLine, 
  RiSearchLine, 
  RiNotification3Line 
} from "react-icons/ri";

export default function Navbar() {
  const { user, logout } = useAuth();
  
  // Format current date
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <header className="glass-effect" style={headerStyle}>
      {/* Brand & Logo */}
      <div style={brandWrapperStyle}>
        <img 
          src="/logo.png" 
          alt="Samruddhi Organics Logo" 
          style={logoImgStyle} 
        />
        <div style={titleContainerStyle}>
          <h2 style={titleStyle}>Samruddhi Organics ERP</h2>
          <span style={badgeStyle}>
            {import.meta.env.VITE_SUPABASE_URL ? "Supabase Cloud" : "Local Engine"}
          </span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div style={searchBarWrapperStyle}>
        <RiSearchLine size={16} color="var(--text-muted)" style={searchIconStyle} />
        <input 
          type="text" 
          placeholder="Global ERP Search (Farmers, Soil Tests, Recommendations...)" 
          style={searchInputStyle} 
        />
      </div>

      {/* Date, Notifications & Profile */}
      <div style={rightActionsStyle}>
        {/* Current Date */}
        <div style={dateDisplayStyle}>
          {today}
        </div>

        {/* Notifications Icon */}
        <div style={iconBadgeWrapperStyle}>
          <RiNotification3Line size={18} color="var(--text-main)" />
          <span style={notificationDotStyle}>3</span>
        </div>

        {/* User Profile */}
        {user && (
          <div style={profileStyle}>
            <div style={avatarStyle}>
              <RiUserLine size={15} color="#064e3b" />
            </div>
            <div style={userInfoStyle}>
              <span style={nameStyle}>{user.name}</span>
              <span style={roleStyle}>{user.role || "Administrator"}</span>
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={logout} style={logoutBtnStyle} title="Sign Out">
          <RiLogoutBoxRLine size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}

// Styling definitions
const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 24px",
  height: "70px",
  position: "sticky",
  top: 0,
  zIndex: 90,
  borderBottom: "1px solid var(--border)",
  background: "var(--bg-header)",
  backdropFilter: "blur(12px)",
  gap: "16px",
};

const brandWrapperStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const logoImgStyle = {
  height: "38px",
  width: "38px",
  objectFit: "contain",
  borderRadius: "6px",
  background: "#000000",
  padding: "2px",
  border: "1px solid rgba(255, 255, 255, 0.15)",
};

const titleContainerStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "1px",
};

const titleStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "var(--text-main)",
  lineHeight: "1.2",
};

const badgeStyle = {
  fontSize: "9px",
  fontWeight: 600,
  padding: "1px 6px",
  borderRadius: "var(--radius-full)",
  background: "rgba(16, 185, 129, 0.1)",
  color: "var(--primary-hover)",
  border: "1px solid rgba(16, 185, 129, 0.15)",
};

const searchBarWrapperStyle = {
  position: "relative",
  flex: 1,
  maxWidth: "400px",
  display: "flex",
  alignItems: "center",
};

const searchIconStyle = {
  position: "absolute",
  left: "12px",
};

const searchInputStyle = {
  width: "100%",
  padding: "8px 12px 8px 36px",
  borderRadius: "var(--radius-md)",
  background: "var(--bg-app)",
  border: "1px solid var(--border)",
  fontSize: "13px",
  color: "var(--text-main)",
  outline: "none",
  transition: "border-color var(--transition-fast)",
};

const rightActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

const dateDisplayStyle = {
  fontSize: "12px",
  color: "var(--text-muted)",
  fontWeight: 600,
  background: "rgba(0,0,0,0.02)",
  padding: "6px 12px",
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
};

const iconBadgeWrapperStyle = {
  position: "relative",
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  background: "var(--bg-app)",
  border: "1px solid var(--border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all var(--transition-fast)",
};

const notificationDotStyle = {
  position: "absolute",
  top: "-2px",
  right: "-2px",
  background: "#ef4444",
  color: "#ffffff",
  fontSize: "9px",
  fontWeight: 700,
  borderRadius: "50%",
  width: "15px",
  height: "15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const profileStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  paddingRight: "12px",
  borderRight: "1px solid var(--border)",
};

const avatarStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  background: "var(--primary-light)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid rgba(16, 185, 129, 0.15)",
};

const userInfoStyle = {
  display: "flex",
  flexDirection: "column",
};

const nameStyle = {
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-main)",
  lineHeight: "1.2",
};

const roleStyle = {
  fontSize: "10px",
  color: "var(--text-muted)",
};

const logoutBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  background: "transparent",
  border: "1px solid rgba(239, 68, 68, 0.15)",
  borderRadius: "var(--radius-md)",
  color: "#ef4444",
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 600,
  transition: "all var(--transition-fast)",
};