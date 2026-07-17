import { useState } from "react";
import { clearLocalStorageDb } from "../../services/localStorageDb";
import { seedDemoData } from "../../services/seedDb";
import { 
  RiSettings4Line, 
  RiBuilding2Line, 
  RiDatabase2Line, 
  RiShieldUserLine 
} from "react-icons/ri";

export default function Settings() {
  const [activeSection, setActiveSection] = useState("company");

  const [companyForm, setCompanyForm] = useState({
    name: "Samruddhi Organics Private Limited",
    phone: "+91 9876543210",
    email: "operations@samruddhi.com",
    gst: "27AAAAA1111A1Z1",
    address: "Gat No 415, Nandgaon, Karad, Satara, Maharashtra - 415110"
  });

  const handleResetSandbox = () => {
    if (window.confirm("WARNING: This will delete all data and reset the database to an empty state. Proceed?")) {
      clearLocalStorageDb();
      window.location.reload();
    }
  };

  const handleSeedSandbox = () => {
    if (window.confirm("This will populate the database with sample farmers, plots, and recommendations for testing. Proceed?")) {
      seedDemoData();
      window.location.reload();
    }
  };

  const handleSaveCompany = (e) => {
    e.preventDefault();
    alert("Company metadata profile updated locally!");
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>System Configurations</h1>
          <p style={{ color: "var(--text-muted)" }}>Manage regional metadata parameters, database nodes, and user authorization levels</p>
        </div>
      </div>

      <div style={layoutGridStyle}>
        {/* Navigation Sidebar */}
        <div className="card-premium" style={navCardStyle}>
          <button 
            style={navButtonStyle(activeSection === "company")} 
            onClick={() => setActiveSection("company")}
          >
            <RiBuilding2Line size={18} />
            <span>Company Profile</span>
          </button>
          <button 
            style={navButtonStyle(activeSection === "users")} 
            onClick={() => setActiveSection("users")}
          >
            <RiShieldUserLine size={18} />
            <span>Access Control</span>
          </button>
          <button 
            style={navButtonStyle(activeSection === "database")} 
            onClick={() => setActiveSection("database")}
          >
            <RiDatabase2Line size={18} />
            <span>Database Sandbox</span>
          </button>
        </div>

        {/* Configurations pane */}
        <div className="card-premium" style={{ padding: "24px" }}>
          {activeSection === "company" && (
            <div>
              <h3 style={sectionTitleStyle}>Corporate Identity & Invoicing Meta</h3>
              <form onSubmit={handleSaveCompany} style={formStyle}>
                <div style={formGridStyle}>
                  <div>
                    <label className="form-label">Registered Corporate Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={companyForm.name} 
                      onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">Primary Office Phone</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={companyForm.phone} 
                      onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">Support Email Address</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={companyForm.email} 
                      onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="form-label">GST Identification Number</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={companyForm.gst} 
                      onChange={(e) => setCompanyForm({ ...companyForm, gst: e.target.value })} 
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label className="form-label">Complete Registered Address</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={companyForm.address} 
                      onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} 
                    />
                  </div>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: "16px" }}>
                  Save Company Config
                </button>
              </form>
            </div>
          )}

          {activeSection === "users" && (
            <div>
              <h3 style={sectionTitleStyle}>Access Authorization Levels</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>
                Active user roles map permissions inside modules:
              </p>
              <div style={userTableWrapperStyle}>
                <div style={userRowStyle}>
                  <div>
                    <strong>Administrator</strong>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Full systems controls, database resets, and finance ledgers</div>
                  </div>
                  <span style={badgeStyle}>Admin Role</span>
                </div>
                <div style={userRowStyle}>
                  <div>
                    <strong>Operations Manager</strong>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Upload soil tests, register farmers, generate recommendations</div>
                  </div>
                  <span style={badgeStyle}>Staff Role</span>
                </div>
                <div style={userRowStyle}>
                  <div>
                    <strong>Field Agronomist</strong>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Read soil analysis reports, view dose planners on mobile</div>
                  </div>
                  <span style={badgeStyle}>Agronomist Role</span>
                </div>
              </div>
            </div>
          )}

          {activeSection === "database" && (
            <div>
              <h3 style={sectionTitleStyle}>Sandbox Database Controller</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "20px" }}>
                The application operates offline using an HTML5 LocalStorage database engine. You can reset the sandbox to its initial seed data state below:
              </p>
              <div style={dangerBoxStyle}>
                <h4 style={{ color: "#991b1b", fontSize: "14px", fontWeight: 700, marginBottom: "6px" }}>Factory Reset Sandbox</h4>
                <p style={{ fontSize: "12px", color: "#b91c1c", marginBottom: "16px" }}>
                  This action will permanently delete all customer details, mapped plots, nutrient analysis, doses, and payment transactions. This cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button className="btn-primary" style={{ background: "#ef4444", border: "1px solid #ef4444" }} onClick={handleResetSandbox}>
                    Reset LocalStorage database sandbox
                  </button>
                  <button className="btn-secondary" style={{ background: "white", color: "#064e3b" }} onClick={handleSeedSandbox}>
                    Seed Sample Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Styling definitions
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const layoutGridStyle = {
  display: "grid",
  gridTemplateColumns: "240px 1fr",
  gap: "24px",
  alignItems: "start",
};

const navCardStyle = {
  display: "flex",
  flexDirection: "column",
  padding: "12px",
  gap: "4px",
};

const navButtonStyle = (isActive) => ({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: isActive ? "rgba(16, 185, 129, 0.1)" : "transparent",
  color: isActive ? "var(--primary-dark)" : "var(--text-muted)",
  border: "none",
  borderRadius: "var(--radius-md)",
  padding: "12px 16px",
  cursor: "pointer",
  fontWeight: isActive ? 700 : 500,
  fontSize: "13px",
  textAlign: "left",
  outline: "none",
});

const sectionTitleStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "var(--primary-dark)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "20px",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
};

const userTableWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const userRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "var(--bg-app)",
  borderRadius: "var(--radius-md)",
  padding: "16px",
  border: "1px solid var(--border)",
};

const badgeStyle = {
  fontSize: "11px",
  fontWeight: 700,
  padding: "4px 8px",
  borderRadius: "var(--radius-full)",
  background: "var(--primary-light)",
  color: "var(--primary-hover)",
};

const dangerBoxStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  borderRadius: "var(--radius-md)",
  padding: "20px",
};
