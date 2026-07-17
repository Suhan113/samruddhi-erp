import { useEffect, useState, useMemo } from "react";
import { db } from "../../services/database";
import { 
  RiTruckLine, 
  RiSearchLine, 
  RiAddCircleLine, 
  RiEditLine, 
  RiDeleteBinLine, 
  RiCloseLine 
} from "react-icons/ri";

const initialForm = {
  name: "",
  contact_person: "",
  phone: "",
  email: "",
  gst: "",
  address: "",
  remarks: ""
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Form Modals
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sData = await db.select("suppliers");
      setSuppliers(sData);
    } catch (err) {
      setError("Failed to fetch suppliers database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contact_person || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await db.update("suppliers", editingId, form);
      } else {
        await db.insert("suppliers", form);
      }

      setShowModal(false);
      setForm(initialForm);
      setEditingId(null);
      fetchData();
      alert("Supplier records updated!");
    } catch (err) {
      console.error(err);
      alert("Error saving supplier details.");
    }
  };

  const handleEdit = (sup) => {
    setEditingId(sup.id);
    setForm({
      name: sup.name || "",
      contact_person: sup.contact_person || "",
      phone: sup.phone || "",
      email: sup.email || "",
      gst: sup.gst || "",
      address: sup.address || "",
      remarks: sup.remarks || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await db.delete("suppliers", id);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Failed to delete supplier.");
      }
    }
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>Supplier Management</h1>
          <p style={{ color: "var(--text-muted)" }}>Registry of fertilizer companies, composting vendors, and micronutrient suppliers</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => { setForm(initialForm); setEditingId(null); setShowModal(true); }}
        >
          <RiAddCircleLine size={18} />
          <span>Add Supplier Registry</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card-premium" style={filterBarStyle}>
        <div style={searchWrapperStyle}>
          <RiSearchLine style={searchIconStyle} size={18} />
          <input 
            type="text" 
            placeholder="Search by supplier name or contact..."
            style={searchFieldStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-premium" style={{ overflow: "hidden", padding: 0 }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>Loading Suppliers...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No suppliers registered.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Supplier Name</th>
                  <th>Contact Person</th>
                  <th>Phone / Email</th>
                  <th>GST Identification</th>
                  <th>Address</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id}>
                    <td style={{ fontWeight: 600 }}>{sup.name}</td>
                    <td>{sup.contact_person}</td>
                    <td>
                      <div>{sup.phone}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{sup.email}</div>
                    </td>
                    <td>{sup.gst || "N/A"}</td>
                    <td>{sup.address}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={actionsContainerStyle}>
                        <button 
                          style={actionIconBtnStyle} 
                          onClick={() => handleEdit(sup)}
                          title="Edit Supplier"
                        >
                          <RiEditLine size={16} />
                        </button>
                        <button 
                          style={{ ...actionIconBtnStyle, color: "#ef4444" }} 
                          onClick={() => handleDelete(sup.id)}
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
                {editingId ? "Modify Supplier Registry" : "Add Supplier Registry"}
              </h3>
              <button style={closeBtnStyle} onClick={() => setShowModal(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={modalFormStyle}>
              <div style={modalFormGridStyle}>
                <div>
                  <label className="form-label">Supplier Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    placeholder="e.g. Green Earth Organics" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Contact Person *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.contact_person} 
                    onChange={(e) => setForm({ ...form, contact_person: e.target.value })} 
                    placeholder="e.g. Vijay Patil" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Mobile Number *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    placeholder="e.g. 9850123456" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    placeholder="e.g. contact@greenearth.com" 
                  />
                </div>

                <div>
                  <label className="form-label">GST Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.gst} 
                    onChange={(e) => setForm({ ...form, gst: e.target.value })} 
                    placeholder="e.g. 27AAAAA1111A1Z1" 
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Supplier Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.address} 
                    onChange={(e) => setForm({ ...form, address: e.target.value })} 
                    placeholder="Street, City, Pincode" 
                  />
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Remarks</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: "60px" }}
                    value={form.remarks} 
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })} 
                    placeholder="Delivery lead times, payment terms description..." 
                  />
                </div>
              </div>

              <div style={modalActionsStyle}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Supplier
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
  maxWidth: "600px",
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
  gridTemplateColumns: "1fr 1fr",
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
