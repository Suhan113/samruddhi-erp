import { useEffect, useState, useMemo } from "react";
import { db } from "../../services/database";
import { 
  RiPlantLine, 
  RiSearchLine, 
  RiAddCircleLine, 
  RiEditLine, 
  RiDeleteBinLine, 
  RiCloseLine 
} from "react-icons/ri";

const initialForm = {
  name: "",
  category: "Organic",
  unit: "Kg",
  stock: 0,
  purchase_rate: "",
  selling_rate: "",
  supplier_id: null,
  remarks: ""
};

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
      const mData = await db.select("materials");
      const sData = await db.select("suppliers");
      setMaterials(mData);
      setSuppliers(sData);
    } catch (err) {
      setError("Failed to fetch materials from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const supplierMap = useMemo(() => {
    const map = {};
    suppliers.forEach(s => { map[s.id] = s; });
    return map;
  }, [suppliers]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        stock: Number(form.stock),
        purchase_rate: Number(form.purchase_rate),
        selling_rate: Number(form.selling_rate)
      };

      if (editingId) {
        await db.update("materials", editingId, payload);
      } else {
        await db.insert("materials", payload);
      }

      setShowModal(false);
      setForm(initialForm);
      setEditingId(null);
      fetchData();
      alert("Material record updated successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving material rate card.");
    }
  };

  const handleEdit = (mat) => {
    setEditingId(mat.id);
    setForm({
      name: mat.name || "",
      category: mat.category || "Organic",
      unit: mat.unit || "Kg",
      stock: mat.stock || 0,
      purchase_rate: mat.purchase_rate || "",
      selling_rate: mat.selling_rate || "",
      supplier_id: mat.supplier_id || "",
      remarks: mat.remarks || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        await db.delete("materials", id);
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Failed to delete material.");
      }
    }
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>Materials Master</h1>
          <p style={{ color: "var(--text-muted)" }}>Registry of organic bio-fertilizers, soil conditioners, and chemical inputs</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => { setForm(initialForm); setEditingId(null); setShowModal(true); }}
        >
          <RiAddCircleLine size={18} />
          <span>Add Material input</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card-premium" style={filterBarStyle}>
        <div style={searchWrapperStyle}>
          <RiSearchLine style={searchIconStyle} size={18} />
          <input 
            type="text" 
            placeholder="Search by material name or category..."
            style={searchFieldStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="card-premium" style={{ overflow: "hidden", padding: 0 }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>Loading Materials...</div>
        ) : filteredMaterials.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No materials found.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Material Name</th>
                  <th>Category</th>
                  <th>Standard Unit</th>
                  <th>Current Stock</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>Default Supplier</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map((mat) => {
                  const supplier = supplierMap[mat.supplier_id] || { name: "Not assigned" };
                  return (
                    <tr key={mat.id}>
                      <td style={{ fontWeight: 600 }}>{mat.name}</td>
                      <td>
                        <span style={categoryBadgeStyle(mat.category)}>{mat.category}</span>
                      </td>
                      <td>{mat.unit}</td>
                      <td style={{ fontWeight: 700 }}>{mat.stock}</td>
                      <td>₹{mat.purchase_rate}</td>
                      <td>₹{mat.selling_rate}</td>
                      <td>{supplier.name}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={actionsContainerStyle}>
                          <button 
                            style={actionIconBtnStyle} 
                            onClick={() => handleEdit(mat)}
                            title="Modify rate"
                          >
                            <RiEditLine size={16} />
                          </button>
                          <button 
                            style={{ ...actionIconBtnStyle, color: "#ef4444" }} 
                            onClick={() => handleDelete(mat.id)}
                            title="Delete"
                          >
                            <RiDeleteBinLine size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                {editingId ? "Modify Material input" : "Add Material input"}
              </h3>
              <button style={closeBtnStyle} onClick={() => setShowModal(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={modalFormStyle}>
              <div style={modalFormGridStyle}>
                <div>
                  <label className="form-label">Material Name *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    placeholder="e.g. Natural Potassium" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Category *</label>
                  <select 
                    className="form-input"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="Organic">Organic Bio-Manure</option>
                    <option value="Chemical">Chemical fertilizer</option>
                    <option value="Conditioner">Soil Conditioner</option>
                    <option value="Micronutrient">Micronutrient mixture</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Measurement Unit *</label>
                  <select 
                    className="form-input"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  >
                    <option value="Kg">Kg</option>
                    <option value="Tonne">Tonne</option>
                    <option value="Bag (50kg)">Bag (50kg)</option>
                    <option value="Litre">Litre</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Initial Stock *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-input" 
                    value={form.stock} 
                    onChange={(e) => setForm({ ...form, stock: e.target.value })} 
                    placeholder="0.00" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Standard Purchase Rate (₹) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={form.purchase_rate} 
                    onChange={(e) => setForm({ ...form, purchase_rate: e.target.value })} 
                    placeholder="Purchase price" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Standard Selling Rate (₹) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={form.selling_rate} 
                    onChange={(e) => setForm({ ...form, selling_rate: e.target.value })} 
                    placeholder="Selling price" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Suggested Supplier</label>
                  <select 
                    className="form-input"
                    value={form.supplier_id}
                    onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                  >
                    <option value="">-- Choose supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Remarks</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: "60px" }}
                    value={form.remarks} 
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })} 
                    placeholder="Special warehousing parameters, application hints..." 
                  />
                </div>
              </div>

              <div style={modalActionsStyle}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Material
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

const categoryBadgeStyle = (category) => {
  const styles = {
    Organic: { bg: "var(--primary-light)", col: "var(--primary-hover)" },
    Chemical: { bg: "#eff6ff", col: "#2563eb" },
    Conditioner: { bg: "#fff7ed", col: "#c2410c" }
  };
  const cur = styles[category] || { bg: "#f1f5f9", col: "#64748b" };
  return {
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    background: cur.bg,
    color: cur.col,
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
