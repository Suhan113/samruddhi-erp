import { useEffect, useState, useMemo } from "react";
import { db } from "../../services/database";
import { 
  RiSearchLine, 
  RiFilter3Line, 
  RiUserAddLine, 
  RiEditLine, 
  RiDeleteBinLine, 
  RiEyeLine, 
  RiCloseLine, 
  RiAttachment2,
  RiMapPinLine,
  RiFileListLine
} from "react-icons/ri";

const initialForm = {
  name: "",
  phone: "",
  address: "",
  village: "",
  taluk: "",
  district: "",
  crop_details: "",
  remarks: "",
  status: "Active",
  documents: []
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [villageFilter, setVillageFilter] = useState("All");

  // Form Modals
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [newDocumentName, setNewDocumentName] = useState("");

  // Detail drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [linkedPlots, setLinkedPlots] = useState([]);
  const [linkedSoilTests, setLinkedSoilTests] = useState([]);

  // Fetch customers
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await db.select("customers", "customer_number", true);
      setCustomers(data);
    } catch (err) {
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Fetch detailed plots and soil tests when a customer is selected
  useEffect(() => {
    async function fetchLinkedData() {
      if (!selectedCustomer) return;
      try {
        // Fetch plots linked to customer
        const plots = await db.selectWhere("plots", { customer_id: selectedCustomer.id });
        setLinkedPlots(plots);

        // Fetch all soil tests and filter for customer's plots
        const allTests = await db.select("soil_tests");
        const plotIds = plots.map(p => p.id);
        const filteredTests = allTests.filter(t => plotIds.includes(t.plot_id));
        setLinkedSoilTests(filteredTests);
      } catch (err) {
        console.error("Failed to load customer relations", err);
      }
    }
    fetchLinkedData();
  }, [selectedCustomer]);

  // Unique filter values
  const districts = useMemo(() => {
    const vals = customers.map(c => c.district).filter(Boolean);
    return ["All", ...new Set(vals)];
  }, [customers]);

  const villages = useMemo(() => {
    const vals = customers.map(c => c.village).filter(Boolean);
    return ["All", ...new Set(vals)];
  }, [customers]);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      const matchesSearch = 
        cust.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cust.phone.includes(searchTerm) ||
        cust.customer_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "All" || cust.status === statusFilter;
      const matchesDistrict = districtFilter === "All" || cust.district === districtFilter;
      const matchesVillage = villageFilter === "All" || cust.village === villageFilter;

      return matchesSearch && matchesStatus && matchesDistrict && matchesVillage;
    });
  }, [customers, searchTerm, statusFilter, districtFilter, villageFilter]);

  // Handle Form Submission (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        documents: JSON.stringify(form.documents)
      };

      if (editingId) {
        await db.update("customers", editingId, payload);
      } else {
        // Generate customer number inside client / DB wrapper
        await db.insert("customers", payload);
      }
      setShowModal(false);
      setForm(initialForm);
      setEditingId(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Error saving customer record.");
    }
  };

  // Open Edit Modal
  const handleEdit = (cust) => {
    setEditingId(cust.id);
    let docs = [];
    try {
      docs = typeof cust.documents === "string" ? JSON.parse(cust.documents) : (cust.documents || []);
    } catch (e) {
      docs = [];
    }
    setForm({
      name: cust.name || "",
      phone: cust.phone || "",
      address: cust.address || "",
      village: cust.village || "",
      taluk: cust.taluk || "",
      district: cust.district || "",
      crop_details: cust.crop_details || "",
      remarks: cust.remarks || "",
      status: cust.status || "Active",
      documents: docs
    });
    setShowModal(true);
  };

  // Delete Customer
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this customer? This will delete all linked plots and soil tests.")) {
      try {
        await db.delete("customers", id);
        if (selectedCustomer?.id === id) {
          setSelectedCustomer(null);
        }
        fetchCustomers();
      } catch (err) {
        console.error(err);
        alert("Failed to delete customer.");
      }
    }
  };

  // Add Document string helper
  const handleAddDocument = () => {
    if (!newDocumentName.trim()) return;
    setForm({
      ...form,
      documents: [...form.documents, { name: newDocumentName.trim(), url: "#" }]
    });
    setNewDocumentName("");
  };

  const handleRemoveDocument = (index) => {
    setForm({
      ...form,
      documents: form.documents.filter((_, i) => i !== index)
    });
  };

  // Helper to parse document JSON safely
  const parseDocs = (docField) => {
    if (!docField) return [];
    try {
      return typeof docField === "string" ? JSON.parse(docField) : docField;
    } catch {
      return [];
    }
  };

  return (
    <div style={containerStyle}>
      {/* Page Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>Customer Management</h1>
          <p style={{ color: "var(--text-muted)" }}>Manage farm customers, contact information, crops, and documentation</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(initialForm); setEditingId(null); setShowModal(true); }}>
          <RiUserAddLine size={18} />
          <span>Add Farmer</span>
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div style={statsGridStyle}>
        <div className="card-premium" style={statCardStyle}>
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Total Farmers</div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--primary-dark)" }}>{customers.length}</div>
        </div>
        <div className="card-premium" style={statCardStyle}>
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Active Portfolios</div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--primary)" }}>
            {customers.filter(c => c.status === "Active").length}
          </div>
        </div>
        <div className="card-premium" style={statCardStyle}>
          <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>Pending Soil Reviews</div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "var(--accent)" }}>
            {customers.filter(c => c.status === "Pending").length}
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="card-premium" style={filterBarStyle}>
        <div style={searchWrapperStyle}>
          <RiSearchLine style={searchIconStyle} size={18} />
          <input 
            type="text" 
            placeholder="Search by ID, Name, or Phone..."
            style={searchFieldStyle}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={filtersWrapperStyle}>
          <div style={filterGroupStyle}>
            <RiFilter3Line size={16} color="var(--text-muted)" />
            <select 
              className="form-input" 
              style={selectFilterStyle}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <select 
            className="form-input" 
            style={selectFilterStyle}
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="All">All Districts</option>
            {districts.filter(d => d !== "All").map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select 
            className="form-input" 
            style={selectFilterStyle}
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
          >
            <option value="All">All Villages</option>
            {villages.filter(v => v !== "All").map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left is Table, Right is Selected Customer Drawer */}
      <div style={mainContentGridStyle(!!selectedCustomer)}>
        {/* Table Panel */}
        <div className="card-premium" style={{ overflow: "hidden", padding: 0 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>Loading Farmers List...</div>
          ) : error ? (
            <div style={{ padding: "40px", textAlign: "center", color: "red" }}>{error}</div>
          ) : filteredCustomers.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No customer records match active filters.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Farmer ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Village & District</th>
                    <th>Target Crop</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((cust) => (
                    <tr key={cust.id} style={selectedCustomer?.id === cust.id ? selectedRowStyle : null}>
                      <td style={{ fontWeight: 600 }}>{cust.customer_number}</td>
                      <td>{cust.name}</td>
                      <td>{cust.phone}</td>
                      <td>{cust.village}, {cust.district}</td>
                      <td>{cust.crop_details}</td>
                      <td>
                        <span style={statusBadgeStyle(cust.status)}>{cust.status}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={actionsContainerStyle}>
                          <button 
                            style={actionIconBtnStyle} 
                            onClick={() => setSelectedCustomer(cust)}
                            title="View Relational Details"
                          >
                            <RiEyeLine size={16} />
                          </button>
                          <button 
                            style={actionIconBtnStyle} 
                            onClick={() => handleEdit(cust)}
                            title="Edit Farmer Profile"
                          >
                            <RiEditLine size={16} />
                          </button>
                          <button 
                            style={{ ...actionIconBtnStyle, color: "#ef4444" }} 
                            onClick={() => handleDelete(cust.id)}
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

        {/* Selected Customer Relational Details Panel */}
        {selectedCustomer && (
          <div className="card-premium animate-fade-in" style={detailPanelStyle}>
            <div style={detailHeaderStyle}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>Farmer Dossier</span>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginTop: "2px" }}>{selectedCustomer.name}</h3>
              </div>
              <button style={closeBtnStyle} onClick={() => setSelectedCustomer(null)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <div style={detailScrollStyle}>
              {/* Meta details */}
              <div style={detailSectionStyle}>
                <h4 style={sectionTitleStyle}>Basic Profile</h4>
                <div style={detailGridStyle}>
                  <div>
                    <label style={detailLabelStyle}>Customer Number</label>
                    <div style={detailValStyle}>{selectedCustomer.customer_number}</div>
                  </div>
                  <div>
                    <label style={detailLabelStyle}>Phone Connection</label>
                    <div style={detailValStyle}>{selectedCustomer.phone}</div>
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={detailLabelStyle}>Residential Address</label>
                    <div style={detailValStyle}>{selectedCustomer.address || "N/A"}</div>
                  </div>
                  <div>
                    <label style={detailLabelStyle}>Village / Taluk</label>
                    <div style={detailValStyle}>{selectedCustomer.village} / {selectedCustomer.taluk || "N/A"}</div>
                  </div>
                  <div>
                    <label style={detailLabelStyle}>District State</label>
                    <div style={detailValStyle}>{selectedCustomer.district}</div>
                  </div>
                  <div>
                    <label style={detailLabelStyle}>Focus Crop</label>
                    <div style={detailValStyle}>{selectedCustomer.crop_details || "N/A"}</div>
                  </div>
                  <div>
                    <label style={detailLabelStyle}>Status Flag</label>
                    <div>
                      <span style={statusBadgeStyle(selectedCustomer.status)}>{selectedCustomer.status}</span>
                    </div>
                  </div>
                  {selectedCustomer.remarks && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={detailLabelStyle}>Office Remarks</label>
                      <div style={detailValStyle}>{selectedCustomer.remarks}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Connected Plots */}
              <div style={detailSectionStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={sectionTitleStyle}>Linked Plots ({linkedPlots.length})</h4>
                </div>
                {linkedPlots.length === 0 ? (
                  <p style={emptySectionTextStyle}>No plot boundaries mapped yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {linkedPlots.map((plot) => (
                      <div key={plot.id} style={plotItemStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <RiMapPinLine size={16} color="var(--primary)" />
                          <div style={{ fontWeight: 600 }}>{plot.plot_number}</div>
                        </div>
                        <div style={plotMetaRowStyle}>
                          <span>Area: {plot.area} Acres</span>
                          <span>•</span>
                          <span>Irrigation: {plot.irrigation_type}</span>
                          <span>•</span>
                          <span>Soil: {plot.soil_type}</span>
                        </div>
                        {plot.gps_location && <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>GPS: {plot.gps_location}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Connected Soil Tests */}
              <div style={detailSectionStyle}>
                <h4 style={sectionTitleStyle}>Soil Test Records ({linkedSoilTests.length})</h4>
                {linkedSoilTests.length === 0 ? (
                  <p style={emptySectionTextStyle}>No soil reports registered yet.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {linkedSoilTests.map((test) => (
                      <div key={test.id} style={soilTestItemStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <RiFileListLine size={14} color="var(--accent)" />
                            <span style={{ fontWeight: 600, fontSize: "12px" }}>Report Date: {test.report_date}</span>
                          </div>
                          <span style={{ fontSize: "11px", background: "var(--bg-app)", padding: "2px 6px", borderRadius: "4px" }}>
                            pH: {test.ph || "N/A"}
                          </span>
                        </div>
                        <div style={soilNutrientsGridStyle}>
                          <div>N: {test.nitrogen || "N/A"}</div>
                          <div>P: {test.phosphorus || "N/A"}</div>
                          <div>K: {test.potassium || "N/A"}</div>
                          <div>OC: {test.organic_carbon || "N/A"}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents Attachment List */}
              <div style={detailSectionStyle}>
                <h4 style={sectionTitleStyle}>Farmer Documents</h4>
                {parseDocs(selectedCustomer.documents).length === 0 ? (
                  <p style={emptySectionTextStyle}>No attachments uploaded.</p>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
                    {parseDocs(selectedCustomer.documents).map((doc, idx) => (
                      <div key={idx} style={docBadgeStyle}>
                        <RiAttachment2 size={12} color="var(--primary)" />
                        <span>{doc.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Farmer Overlay Modal */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div className="card-premium animate-fade-in" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: "20px", fontWeight: 700 }}>
                {editingId ? "Modify Farmer Portfolio" : "Register New Farmer"}
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
                    placeholder="e.g. Ramesh Patil" 
                    required 
                  />
                </div>
                <div>
                  <label className="form-label">Phone Connection *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    placeholder="10 digit phone number" 
                    required 
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Full Address</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.address} 
                    onChange={(e) => setForm({ ...form, address: e.target.value })} 
                    placeholder="Gat / Survey Number, landmarks, street address" 
                  />
                </div>
                <div>
                  <label className="form-label">Village</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.village} 
                    onChange={(e) => setForm({ ...form, village: e.target.value })} 
                    placeholder="e.g. Nandgaon" 
                  />
                </div>
                <div>
                  <label className="form-label">Taluk</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.taluk} 
                    onChange={(e) => setForm({ ...form, taluk: e.target.value })} 
                    placeholder="e.g. Karad" 
                  />
                </div>
                <div>
                  <label className="form-label">District State</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.district} 
                    onChange={(e) => setForm({ ...form, district: e.target.value })} 
                    placeholder="e.g. Satara" 
                  />
                </div>
                <div>
                  <label className="form-label">Target Crops</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.crop_details} 
                    onChange={(e) => setForm({ ...form, crop_details: e.target.value })} 
                    placeholder="e.g. Sugarcane, Turmeric" 
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Special Remarks</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: "60px", resize: "vertical" }}
                    value={form.remarks} 
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })} 
                    placeholder="Soil behavior preferences, past recommendations notes..." 
                  />
                </div>
                <div>
                  <label className="form-label">Portfolio Status</label>
                  <select 
                    className="form-input"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
                
                {/* Documents form section */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Upload Documents (PDF/Images)</label>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="e.g. LandRegistry_Ramesh.pdf" 
                      value={newDocumentName}
                      onChange={(e) => setNewDocumentName(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={handleAddDocument}
                    >
                      Attach
                    </button>
                  </div>
                  
                  {/* Current docs listed */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {form.documents.map((doc, idx) => (
                      <div key={idx} style={docBadgeFormStyle}>
                        <span>{doc.name}</span>
                        <button 
                          type="button" 
                          style={removeDocBtnStyle} 
                          onClick={() => handleRemoveDocument(idx)}
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={modalActionsStyle}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Save Changes" : "Register Farmer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Visual layout style configurations
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "16px",
};

const statCardStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  padding: "18px 24px",
};

const filterBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
  padding: "16px 24px",
};

const searchWrapperStyle = {
  position: "relative",
  flex: 1,
  minWidth: "260px",
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
  transition: "border-color var(--transition-fast)",
};

const filtersWrapperStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const filterGroupStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const selectFilterStyle = {
  padding: "10px 14px",
  fontSize: "13px",
  width: "auto",
  minWidth: "130px",
};

const mainContentGridStyle = (showDrawer) => ({
  display: "grid",
  gridTemplateColumns: showDrawer ? "1.6fr 1fr" : "1fr",
  gap: "24px",
  alignItems: "start",
  transition: "all 0.3s ease",
});

const selectedRowStyle = {
  background: "rgba(16, 185, 129, 0.05)",
  borderLeft: "3px solid var(--primary)",
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
  transition: "all var(--transition-fast)",
};

const statusBadgeStyle = (status) => {
  const styles = {
    Active: { background: "var(--primary-light)", color: "var(--primary-hover)" },
    Pending: { background: "var(--accent-light)", color: "var(--accent)" },
    Draft: { background: "#f1f5f9", color: "#64748b" }
  };
  const current = styles[status] || styles.Draft;
  return {
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: "var(--radius-full)",
    background: current.background,
    color: current.color,
  };
};

// Detail panel
const detailPanelStyle = {
  position: "sticky",
  top: "90px",
  maxHeight: "calc(100vh - 120px)",
  display: "flex",
  flexDirection: "column",
  padding: "24px",
};

const detailHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  paddingBottom: "16px",
  borderBottom: "1px solid var(--border)",
  marginBottom: "16px",
};

const detailScrollStyle = {
  overflowY: "auto",
  flex: 1,
  paddingRight: "4px",
};

const closeBtnStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--text-muted)",
};

const detailSectionStyle = {
  marginBottom: "20px",
};

const sectionTitleStyle = {
  fontSize: "13px",
  fontWeight: 700,
  color: "var(--primary-dark)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "10px",
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const detailLabelStyle = {
  fontSize: "11px",
  color: "var(--text-muted)",
  fontWeight: 600,
};

const detailValStyle = {
  fontSize: "13px",
  color: "var(--text-main)",
  marginTop: "2px",
};

const plotItemStyle = {
  background: "var(--bg-app)",
  borderRadius: "var(--radius-md)",
  padding: "10px 14px",
  border: "1px solid var(--border)",
};

const plotMetaRowStyle = {
  fontSize: "11px",
  color: "var(--text-muted)",
  display: "flex",
  gap: "8px",
  marginTop: "2px",
};

const soilTestItemStyle = {
  background: "var(--bg-app)",
  borderRadius: "var(--radius-md)",
  padding: "10px 14px",
  border: "1px solid var(--border)",
};

const soilNutrientsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  fontSize: "11px",
  color: "var(--text-main)",
  fontWeight: 500,
  marginTop: "4px",
};

const emptySectionTextStyle = {
  fontSize: "12px",
  color: "var(--text-muted)",
  fontStyle: "italic",
};

const docBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  background: "var(--bg-app)",
  border: "1px solid var(--border)",
  padding: "4px 10px",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--text-main)",
};

// Modal elements
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
  maxWidth: "650px",
  maxHeight: "90vh",
  overflowY: "auto",
  padding: "32px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
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

const docBadgeFormStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "var(--bg-app)",
  border: "1px solid var(--border)",
  padding: "4px 8px 4px 12px",
  borderRadius: "8px",
  fontSize: "12px",
  color: "var(--text-main)",
};

const removeDocBtnStyle = {
  background: "transparent",
  border: "none",
  color: "#ef4444",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: "14px",
};