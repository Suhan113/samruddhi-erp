import { useEffect, useState, useMemo } from "react";
import { db } from "../../services/database";
import { 
  RiTeamLine, 
  RiSearchLine, 
  RiAddCircleLine, 
  RiEditLine, 
  RiDeleteBinLine, 
  RiCloseLine 
} from "react-icons/ri";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  role: "Field Worker",
  status: "Active"
};

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Modals & forms
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const eData = await db.select("employees");
      setEmployees(eData);
    } catch (err) {
      setError("Failed to fetch employees database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await db.update("employees", editingId, form);
      } else {
        await db.insert("employees", form);
      }

      setShowModal(false);
      setForm(initialForm);
      setEditingId(null);
      fetchData();
      alert("Employee profile saved!");
    } catch (err) {
      console.error(err);
      alert("Error saving employee profile.");
    }
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setForm({
      name: emp.name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      role: emp.role || "Field Worker",
      status: emp.status || "Active"
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await db.delete("employees", id);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Failed to delete employee.");
      }
    }
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>Employee Directory</h1>
          <p style={{ color: "var(--text-muted)" }}>Registry of field workers, agronomists, managers, and operational staff</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => { setForm(initialForm); setEditingId(null); setShowModal(true); }}
        >
          <RiAddCircleLine size={18} />
          <span>Add Employee Profile</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card-premium" style={filterBarStyle}>
        <div style={searchWrapperStyle}>
          <RiSearchLine style={searchIconStyle} size={18} />
          <input 
            type="text" 
            placeholder="Search by employee name or role..."
            style={searchFieldStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-premium" style={{ overflow: "hidden", padding: 0 }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>Loading Employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No staff profiles logged.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Primary Email</th>
                  <th>Phone Number</th>
                  <th>Assigned Role</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.phone}</td>
                    <td>
                      <span style={roleBadgeStyle(emp.role)}>{emp.role}</span>
                    </td>
                    <td>
                      <span style={statusBadgeStyle(emp.status)}>{emp.status}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={actionsContainerStyle}>
                        <button 
                          style={actionIconBtnStyle} 
                          onClick={() => handleEdit(emp)}
                          title="Edit Profile"
                        >
                          <RiEditLine size={16} />
                        </button>
                        <button 
                          style={{ ...actionIconBtnStyle, color: "#ef4444" }} 
                          onClick={() => handleDelete(emp.id)}
                          title="Delete"
                        >
                          <RiDeleteBinLine size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div className="card-premium animate-fade-in" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: "20px", fontWeight: 700 }}>
                {editingId ? "Modify Employee profile" : "Add Employee profile"}
              </h3>
              <button style={closeBtnStyle} onClick={() => setShowModal(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={modalFormStyle}>
              <div style={modalFormGridStyle}>
                <div>
                  <label className="form-label">Full Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    placeholder="e.g. Dnyaneshwar Yadav" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Email Address *</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    placeholder="e.g. dnyanesh@samruddhi.com" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Primary Mobile *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    placeholder="e.g. 9011223344" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Operational Role *</label>
                  <select 
                    className="form-input"
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    <option value="Admin">Administrator</option>
                    <option value="Staff">Operations Manager</option>
                    <option value="Agronomist">Field Agronomist</option>
                    <option value="Field Worker">Field Worker / Supervisor</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Employment Status *</label>
                  <select 
                    className="form-input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Active">Active Duty</option>
                    <option value="Inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div style={modalActionsStyle}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

const filterBarStyle = {
  display: "flex",
  alignItems: "center",
  padding: "16px 24px",
};

const searchWrapperStyle = {
  position: "relative",
  flex: 1,
  maxWidth: "400px",
  display: "flex",
  alignItems: "center",
};

const searchIconStyle = {
  position: "absolute",
  left: "14px",
  color: "var(--text-muted)",
};

const searchFieldStyle = {
  width: "100%",
  padding: "12px 16px 12px 42px",
  background: "var(--bg-app)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  fontSize: "14px",
  outline: "none",
};

const actionsContainerStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "6px",
};

const actionIconBtnStyle = {
  background: "var(--bg-app)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  width: "32px",
  height: "32px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: "var(--text-main)",
};

const roleBadgeStyle = (role) => {
  const styles = {
    Admin: { bg: "#fee2e2", col: "#991b1b" },
    Staff: { bg: "#eff6ff", col: "#1e40af" },
    Agronomist: { bg: "var(--primary-light)", col: "var(--primary-hover)" }
  };
  const cur = styles[role] || { bg: "#f1f5f9", col: "#475569" };
  return {
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    background: cur.bg,
    color: cur.col,
  };
};

const statusBadgeStyle = (status) => {
  const isActive = status === "Active";
  return {
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    background: isActive ? "var(--primary-light)" : "#fee2e2",
    color: isActive ? "var(--primary-hover)" : "#ef4444",
  };
};

const modalOverlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0, 0, 0, 0.4)",
  backdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const modalCardStyle = {
  width: "100%",
  maxWidth: "500px",
  maxHeight: "90vh",
  overflowY: "auto",
  padding: "32px",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: "16px",
  borderBottom: "1px solid var(--border)",
  marginBottom: "24px",
};

const modalFormStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const modalFormGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: "16px",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  borderTop: "1px solid var(--border)",
  paddingTop: "20px",
  marginTop: "12px",
};

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
};
