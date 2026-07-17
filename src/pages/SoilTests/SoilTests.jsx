import { useEffect, useState, useMemo } from "react";
import { db } from "../../services/database";
import { 
  RiSearchLine, 
  RiFilter3Line, 
  RiFlaskLine, 
  RiEditLine, 
  RiDeleteBinLine, 
  RiEyeLine, 
  RiCloseLine,
  RiFileListLine
} from "react-icons/ri";

const initialForm = {
  customer_id: "",
  plot_id: "",
  laboratory_name: "",
  report_number: "",
  sample_collection_date: "",
  report_date: "",
  ph: "",
  ec: "",
  organic_carbon: "",
  nitrogen: "",
  phosphorus: "",
  potassium: "",
  sulphur: "",
  calcium: "",
  magnesium: "",
  zinc: "",
  boron: "",
  iron: "",
  manganese: "",
  copper: "",
  prepared_by: "",
  report_status: "Pending",
  remarks: ""
};

export default function SoilTests() {
  const [soilTests, setSoilTests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Form Modals
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  // Detail drawer
  const [selectedTest, setSelectedTest] = useState(null);
  const [linkedPlot, setLinkedPlot] = useState(null);
  const [linkedCustomer, setLinkedCustomer] = useState(null);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const stData = await db.select("soil_tests");
      const cData = await db.select("customers");
      const pData = await db.select("plots");
      setSoilTests(stData);
      setCustomers(cData);
      setPlots(pData);
    } catch (err) {
      setError("Failed to fetch soil test databases.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch relational details when selectedTest changes
  useEffect(() => {
    if (!selectedTest) return;
    const plot = plots.find(p => p.id === selectedTest.plot_id) || null;
    setLinkedPlot(plot);
    if (plot) {
      const cust = customers.find(c => c.id === plot.customer_id) || null;
      setLinkedCustomer(cust);
    } else {
      setLinkedCustomer(null);
    }
  }, [selectedTest, plots, customers]);

  // Create mappings for the table
  const plotMap = useMemo(() => {
    const map = {};
    plots.forEach(p => { map[p.id] = p; });
    return map;
  }, [plots]);

  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach(c => { map[c.id] = c; });
    return map;
  }, [customers]);

  // Filtered plots based on selected customer inside the Form
  const formFilteredPlots = useMemo(() => {
    if (!form.customer_id) return [];
    return plots.filter(p => p.customer_id === form.customer_id);
  }, [form.customer_id, plots]);

  // Filtered soil reports
  const filteredTests = useMemo(() => {
    return soilTests.filter(test => {
      const plot = plotMap[test.plot_id] || {};
      const customer = customerMap[plot.customer_id] || {};
      
      const matchesSearch = 
        (customer.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plot.plot_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (test.report_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (test.laboratory_name || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "All" || test.report_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [soilTests, searchTerm, statusFilter, plotMap, customerMap]);

  // Handle Form Submission (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.plot_id) {
      alert("Please select a specific land plot.");
      return;
    }

    try {
      const payload = {
        ...form,
        ph: form.ph ? Number(form.ph) : null,
        ec: form.ec ? Number(form.ec) : null,
        organic_carbon: form.organic_carbon ? Number(form.organic_carbon) : null,
        nitrogen: form.nitrogen ? Number(form.nitrogen) : null,
        phosphorus: form.phosphorus ? Number(form.phosphorus) : null,
        potassium: form.potassium ? Number(form.potassium) : null,
        sulphur: form.sulphur ? Number(form.sulphur) : null,
        calcium: form.calcium ? Number(form.calcium) : null,
        magnesium: form.magnesium ? Number(form.magnesium) : null,
        zinc: form.zinc ? Number(form.zinc) : null,
        boron: form.boron ? Number(form.boron) : null,
        iron: form.iron ? Number(form.iron) : null,
        manganese: form.manganese ? Number(form.manganese) : null,
        copper: form.copper ? Number(form.copper) : null,
      };

      if (editingId) {
        await db.update("soil_tests", editingId, payload);
      } else {
        await db.insert("soil_tests", payload);
      }
      setShowModal(false);
      setForm(initialForm);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving soil report.");
    }
  };

  // Open Edit Modal
  const handleEdit = (test) => {
    setEditingId(test.id);
    const plot = plots.find(p => p.id === test.plot_id) || {};
    setForm({
      customer_id: plot.customer_id || "",
      plot_id: test.plot_id || "",
      laboratory_name: test.laboratory_name || "",
      report_number: test.report_number || "",
      sample_collection_date: test.sample_collection_date || "",
      report_date: test.report_date || "",
      ph: test.ph !== null ? test.ph : "",
      ec: test.ec !== null ? test.ec : "",
      organic_carbon: test.organic_carbon !== null ? test.organic_carbon : "",
      nitrogen: test.nitrogen !== null ? test.nitrogen : "",
      phosphorus: test.phosphorus !== null ? test.phosphorus : "",
      potassium: test.potassium !== null ? test.potassium : "",
      sulphur: test.sulphur !== null ? test.sulphur : "",
      calcium: test.calcium !== null ? test.calcium : "",
      magnesium: test.magnesium !== null ? test.magnesium : "",
      zinc: test.zinc !== null ? test.zinc : "",
      boron: test.boron !== null ? test.boron : "",
      iron: test.iron !== null ? test.iron : "",
      manganese: test.manganese !== null ? test.manganese : "",
      copper: test.copper !== null ? test.copper : "",
      prepared_by: test.prepared_by || "",
      report_status: test.report_status || "Pending",
      remarks: test.remarks || ""
    });
    setShowModal(true);
  };

  // Delete Soil Report
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this soil report? This will delete all connected fertilizer recommendations.")) {
      try {
        await db.delete("soil_tests", id);
        if (selectedTest?.id === id) {
          setSelectedTest(null);
        }
        fetchData();
      } catch (err) {
        console.error(err);
        alert("Failed to delete soil report.");
      }
    }
  };

  return (
    <div style={containerStyle}>
      {/* Page Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>Soil Test Logs</h1>
          <p style={{ color: "var(--text-muted)" }}>Record chemical macro-nutrients and micro-nutrients from laboratory samples</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => { setForm(initialForm); setEditingId(null); setShowModal(true); }}
          disabled={plots.length === 0}
        >
          <RiFlaskLine size={18} />
          <span>Add Soil Test Report</span>
        </button>
      </div>

      {/* Warning if no plots mapped */}
      {plots.length === 0 && !loading && (
        <div style={warningBannerStyle}>
          Please register a farmer and map a land plot boundary before uploading soil chemical reports.
        </div>
      )}

      {/* Search and Filters */}
      <div className="card-premium" style={filterBarStyle}>
        <div style={searchWrapperStyle}>
          <RiSearchLine style={searchIconStyle} size={18} />
          <input 
            type="text" 
            placeholder="Search by Farmer, Plot, Lab, or Report #..."
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
              <option value="Pending">Pending Analysis</option>
              <option value="Awaiting Prescription">Awaiting Prescription</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Table + Relational details view */}
      <div style={mainContentGridStyle(!!selectedTest)}>
        <div className="card-premium" style={{ overflow: "hidden", padding: 0 }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>Loading Soil Reports...</div>
          ) : error ? (
            <div style={{ padding: "40px", textAlign: "center", color: "red" }}>{error}</div>
          ) : filteredTests.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No reports matching active criteria.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Report Number</th>
                    <th>Farmer Name</th>
                    <th>Plot Number</th>
                    <th>Report Date</th>
                    <th>pH / EC</th>
                    <th>Organic Carbon</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTests.map((test) => {
                    const plot = plotMap[test.plot_id] || {};
                    const farmer = customerMap[plot.customer_id] || { name: "Unknown Farmer" };
                    return (
                      <tr key={test.id} style={selectedTest?.id === test.id ? selectedRowStyle : null}>
                        <td style={{ fontWeight: 600 }}>{test.report_number || `Report #${test.id.slice(0, 5)}`}</td>
                        <td>{farmer.name}</td>
                        <td>{plot.plot_number}</td>
                        <td>{test.report_date}</td>
                        <td>pH: {test.ph} | EC: {test.ec}</td>
                        <td>{test.organic_carbon}%</td>
                        <td>
                          <span style={statusBadgeStyle(test.report_status || "Pending")}>{test.report_status || "Pending"}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={actionsContainerStyle}>
                            <button 
                              style={actionIconBtnStyle} 
                              onClick={() => setSelectedTest(test)}
                              title="View Chemistry Values"
                            >
                              <RiEyeLine size={16} />
                            </button>
                            <button 
                              style={actionIconBtnStyle} 
                              onClick={() => handleEdit(test)}
                              title="Edit Report"
                            >
                              <RiEditLine size={16} />
                            </button>
                            <button 
                              style={{ ...actionIconBtnStyle, color: "#ef4444" }} 
                              onClick={() => handleDelete(test.id)}
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

        {/* Selected Test Relational Details Panel */}
        {selectedTest && (
          <div className="card-premium animate-fade-in" style={detailPanelStyle}>
            <div style={detailHeaderStyle}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>Chemical Dossier</span>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginTop: "2px" }}>
                  {selectedTest.report_number || `Report #${selectedTest.id.slice(0, 5)}`}
                </h3>
              </div>
              <button style={closeBtnStyle} onClick={() => setSelectedTest(null)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <div style={detailScrollStyle}>
              {/* Lab details */}
              <div style={detailSectionStyle}>
                <h4 style={sectionTitleStyle}>Laboratory Info</h4>
                <div style={detailGridStyle}>
                  <div>
                    <label style={detailLabelStyle}>Laboratory Name</label>
                    <div style={detailValStyle}>{selectedTest.laboratory_name || "N/A"}</div>
                  </div>
                  <div>
                    <label style={detailLabelStyle}>Sample Collection Date</label>
                    <div style={detailValStyle}>{selectedTest.sample_collection_date || "N/A"}</div>
                  </div>
                  <div>
                    <label style={detailLabelStyle}>Report Date</label>
                    <div style={detailValStyle}>{selectedTest.report_date}</div>
                  </div>
                  <div>
                    <label style={detailLabelStyle}>Agronomist Signed</label>
                    <div style={detailValStyle}>{selectedTest.prepared_by || "Awaiting signature"}</div>
                  </div>
                </div>
              </div>

              {/* Farmer and Plot details */}
              {linkedCustomer && linkedPlot && (
                <div style={detailSectionStyle}>
                  <h4 style={sectionTitleStyle}>Source Coordinates</h4>
                  <div style={infoCardStyle}>
                    <div style={{ fontWeight: 700 }}>{linkedCustomer.name}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Plot: {linkedPlot.plot_number} ({linkedPlot.area} Acres, {linkedPlot.soil_type} Soil)
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Location: {linkedCustomer.village}, {linkedCustomer.district}
                    </div>
                  </div>
                </div>
              )}

              {/* Chemistry & Nutrients Grid (All 14 fields) */}
              <div style={detailSectionStyle}>
                <h4 style={sectionTitleStyle}>Soil Physical & Chemical Profile</h4>
                <div style={chemistryGridStyle}>
                  {/* pH */}
                  <div style={chemItemStyle(Number(selectedTest.ph) < 6.5 || Number(selectedTest.ph) > 8.0)}>
                    <span>pH</span>
                    <strong>{selectedTest.ph}</strong>
                    <small>{Number(selectedTest.ph) < 6.5 ? "Acidic" : Number(selectedTest.ph) > 8.0 ? "Alkaline" : "Normal"}</small>
                  </div>
                  {/* EC */}
                  <div style={chemItemStyle(Number(selectedTest.ec) > 0.8)}>
                    <span>EC (Salinity)</span>
                    <strong>{selectedTest.ec} ds/m</strong>
                    <small>{Number(selectedTest.ec) > 0.8 ? "High Salinity" : "Normal"}</small>
                  </div>
                  {/* Organic Carbon */}
                  <div style={chemItemStyle(Number(selectedTest.organic_carbon) < 0.5)}>
                    <span>Organic Carbon</span>
                    <strong>{selectedTest.organic_carbon}%</strong>
                    <small>{Number(selectedTest.organic_carbon) < 0.5 ? "Low" : "Normal"}</small>
                  </div>
                  {/* Nitrogen */}
                  <div style={chemItemStyle(Number(selectedTest.nitrogen) < 250)}>
                    <span>Nitrogen (N)</span>
                    <strong>{selectedTest.nitrogen} kg/ha</strong>
                    <small>{Number(selectedTest.nitrogen) < 250 ? "Deficient" : "Normal"}</small>
                  </div>
                  {/* Phosphorus */}
                  <div style={chemItemStyle(Number(selectedTest.phosphorus) < 15)}>
                    <span>Phosphorus (P)</span>
                    <strong>{selectedTest.phosphorus} kg/ha</strong>
                    <small>{Number(selectedTest.phosphorus) < 15 ? "Deficient" : "Normal"}</small>
                  </div>
                  {/* Potassium */}
                  <div style={chemItemStyle(Number(selectedTest.potassium) < 200)}>
                    <span>Potassium (K)</span>
                    <strong>{selectedTest.potassium} kg/ha</strong>
                    <small>{Number(selectedTest.potassium) < 200 ? "Deficient" : "Normal"}</small>
                  </div>
                  {/* Sulphur */}
                  <div style={chemItemStyle(Number(selectedTest.sulphur) < 10)}>
                    <span>Sulphur (S)</span>
                    <strong>{selectedTest.sulphur} ppm</strong>
                    <small>{Number(selectedTest.sulphur) < 10 ? "Deficient" : "Normal"}</small>
                  </div>
                  {/* Calcium */}
                  <div style={chemItemStyle(false)}>
                    <span>Calcium (Ca)</span>
                    <strong>{selectedTest.calcium || "N/A"} ppm</strong>
                    <small>Secondary</small>
                  </div>
                  {/* Magnesium */}
                  <div style={chemItemStyle(false)}>
                    <span>Magnesium (Mg)</span>
                    <strong>{selectedTest.magnesium || "N/A"} ppm</strong>
                    <small>Secondary</small>
                  </div>
                  {/* Zinc */}
                  <div style={chemItemStyle(Number(selectedTest.zinc) < 0.6)}>
                    <span>Zinc (Zn)</span>
                    <strong>{selectedTest.zinc || "N/A"} ppm</strong>
                    <small>{Number(selectedTest.zinc) < 0.6 ? "Deficient" : "Normal"}</small>
                  </div>
                  {/* Boron */}
                  <div style={chemItemStyle(Number(selectedTest.boron) < 0.5)}>
                    <span>Boron (B)</span>
                    <strong>{selectedTest.boron || "N/A"} ppm</strong>
                    <small>{Number(selectedTest.boron) < 0.5 ? "Deficient" : "Normal"}</small>
                  </div>
                  {/* Iron */}
                  <div style={chemItemStyle(false)}>
                    <span>Iron (Fe)</span>
                    <strong>{selectedTest.iron || "N/A"} ppm</strong>
                    <small>Micronutrient</small>
                  </div>
                  {/* Manganese */}
                  <div style={chemItemStyle(false)}>
                    <span>Manganese (Mn)</span>
                    <strong>{selectedTest.manganese || "N/A"} ppm</strong>
                    <small>Micronutrient</small>
                  </div>
                  {/* Copper */}
                  <div style={chemItemStyle(false)}>
                    <span>Copper (Cu)</span>
                    <strong>{selectedTest.copper || "N/A"} ppm</strong>
                    <small>Micronutrient</small>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              {selectedTest.remarks && (
                <div style={detailSectionStyle}>
                  <h4 style={sectionTitleStyle}>Office Remarks</h4>
                  <p style={{ fontSize: "13px", background: "var(--bg-app)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                    {selectedTest.remarks}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Soil Report Modal Overlay */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div className="card-premium animate-fade-in" style={modalCardStyle}>
            <div style={modalHeaderStyle}>
              <h3 style={{ fontSize: "20px", fontWeight: 700 }}>
                {editingId ? "Modify Soil Report" : "Register Soil Lab Report"}
              </h3>
              <button style={closeBtnStyle} onClick={() => setShowModal(false)}>
                <RiCloseLine size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={modalFormStyle}>
              <div style={modalFormGridStyle}>
                <div>
                  <label className="form-label">Select Farmer *</label>
                  <select 
                    className="form-input"
                    value={form.customer_id}
                    onChange={(e) => setForm({ ...form, customer_id: e.target.value, plot_id: "" })}
                    required
                  >
                    <option value="">-- Choose farmer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.customer_number})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Select Mapped Land Plot *</label>
                  <select 
                    className="form-input"
                    value={form.plot_id}
                    onChange={(e) => setForm({ ...form, plot_id: e.target.value })}
                    required
                    disabled={!form.customer_id}
                  >
                    <option value="">-- Choose plot --</option>
                    {formFilteredPlots.map(p => (
                      <option key={p.id} value={p.id}>{p.plot_number} ({p.area} acres)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Laboratory Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.laboratory_name} 
                    onChange={(e) => setForm({ ...form, laboratory_name: e.target.value })} 
                    placeholder="e.g. Satara District Soil Lab" 
                  />
                </div>

                <div>
                  <label className="form-label">Report ID/Number</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.report_number} 
                    onChange={(e) => setForm({ ...form, report_number: e.target.value })} 
                    placeholder="e.g. ST-2026-9821" 
                  />
                </div>

                <div>
                  <label className="form-label">Sample Collection Date</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={form.sample_collection_date} 
                    onChange={(e) => setForm({ ...form, sample_collection_date: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="form-label">Report Date *</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={form.report_date} 
                    onChange={(e) => setForm({ ...form, report_date: e.target.value })} 
                    required 
                  />
                </div>

                {/* Nutrients Grid inputs (14 parameters) */}
                <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "8px" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>Soil Chemistry values</h4>
                  <div style={modalNutrientsGridStyle}>
                    <div>
                      <label className="form-label">pH Level</label>
                      <input type="number" step="0.01" className="form-input" value={form.ph} onChange={(e) => setForm({ ...form, ph: e.target.value })} placeholder="pH" />
                    </div>
                    <div>
                      <label className="form-label">EC (Salinity)</label>
                      <input type="number" step="0.01" className="form-input" value={form.ec} onChange={(e) => setForm({ ...form, ec: e.target.value })} placeholder="ds/m" />
                    </div>
                    <div>
                      <label className="form-label">Organic Carbon</label>
                      <input type="number" step="0.01" className="form-input" value={form.organic_carbon} onChange={(e) => setForm({ ...form, organic_carbon: e.target.value })} placeholder="%" />
                    </div>
                    <div>
                      <label className="form-label">Nitrogen (N)</label>
                      <input type="number" className="form-input" value={form.nitrogen} onChange={(e) => setForm({ ...form, nitrogen: e.target.value })} placeholder="kg/ha" />
                    </div>
                    <div>
                      <label className="form-label">Phosphorus (P)</label>
                      <input type="number" className="form-input" value={form.phosphorus} onChange={(e) => setForm({ ...form, phosphorus: e.target.value })} placeholder="kg/ha" />
                    </div>
                    <div>
                      <label className="form-label">Potassium (K)</label>
                      <input type="number" className="form-input" value={form.potassium} onChange={(e) => setForm({ ...form, potassium: e.target.value })} placeholder="kg/ha" />
                    </div>
                    <div>
                      <label className="form-label">Sulphur (S)</label>
                      <input type="number" step="0.01" className="form-input" value={form.sulphur} onChange={(e) => setForm({ ...form, sulphur: e.target.value })} placeholder="ppm" />
                    </div>
                    <div>
                      <label className="form-label">Calcium (Ca)</label>
                      <input type="number" className="form-input" value={form.calcium} onChange={(e) => setForm({ ...form, calcium: e.target.value })} placeholder="ppm" />
                    </div>
                    <div>
                      <label className="form-label">Magnesium (Mg)</label>
                      <input type="number" className="form-input" value={form.magnesium} onChange={(e) => setForm({ ...form, magnesium: e.target.value })} placeholder="ppm" />
                    </div>
                    <div>
                      <label className="form-label">Zinc (Zn)</label>
                      <input type="number" step="0.01" className="form-input" value={form.zinc} onChange={(e) => setForm({ ...form, zinc: e.target.value })} placeholder="ppm" />
                    </div>
                    <div>
                      <label className="form-label">Boron (B)</label>
                      <input type="number" step="0.01" className="form-input" value={form.boron} onChange={(e) => setForm({ ...form, boron: e.target.value })} placeholder="ppm" />
                    </div>
                    <div>
                      <label className="form-label">Iron (Fe)</label>
                      <input type="number" step="0.01" className="form-input" value={form.iron} onChange={(e) => setForm({ ...form, iron: e.target.value })} placeholder="ppm" />
                    </div>
                    <div>
                      <label className="form-label">Manganese (Mn)</label>
                      <input type="number" step="0.01" className="form-input" value={form.manganese} onChange={(e) => setForm({ ...form, manganese: e.target.value })} placeholder="ppm" />
                    </div>
                    <div>
                      <label className="form-label">Copper (Cu)</label>
                      <input type="number" step="0.01" className="form-input" value={form.copper} onChange={(e) => setForm({ ...form, copper: e.target.value })} placeholder="ppm" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label">Responsible Agronomist</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={form.prepared_by} 
                    onChange={(e) => setForm({ ...form, prepared_by: e.target.value })} 
                    placeholder="e.g. Agronomist Patil" 
                  />
                </div>

                <div>
                  <label className="form-label">Status</label>
                  <select 
                    className="form-input"
                    value={form.report_status}
                    onChange={(e) => setForm({ ...form, report_status: e.target.value })}
                  >
                    <option value="Pending">Pending Analysis</option>
                    <option value="Awaiting Prescription">Awaiting Prescription</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">General Remarks</label>
                  <textarea 
                    className="form-input" 
                    style={{ minHeight: "60px", resize: "vertical" }}
                    value={form.remarks} 
                    onChange={(e) => setForm({ ...form, remarks: e.target.value })} 
                    placeholder="Visual deficiencies noted, soil texture notes..." 
                  />
                </div>
              </div>

              <div style={modalActionsStyle}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Save Changes" : "Submit Lab Report"}
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
  flexWrap: "wrap",
  gap: "16px",
};

const warningBannerStyle = {
  background: "#fef2f2",
  border: "1px solid #fca5a5",
  color: "#991b1b",
  padding: "12px 18px",
  borderRadius: "var(--radius-md)",
  fontSize: "14px",
  fontWeight: 500,
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
  minWidth: "150px",
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
    Completed: { background: "var(--primary-light)", color: "var(--primary-hover)" },
    "Awaiting Prescription": { background: "var(--accent-light)", color: "var(--accent)" },
    Pending: { background: "#f1f5f9", color: "#64748b" }
  };
  const current = styles[status] || styles.Pending;
  return {
    fontSize: "11px",
    fontWeight: 700,
    padding: "4px 8px",
    borderRadius: "var(--radius-full)",
    background: current.background,
    color: current.color,
  };
};

// Detail drawer
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

const infoCardStyle = {
  background: "var(--bg-app)",
  borderRadius: "var(--radius-md)",
  padding: "14px",
  border: "1px solid var(--border)",
};

const chemistryGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
  gap: "10px",
};

const chemItemStyle = (isDeficient) => ({
  background: isDeficient ? "rgba(239, 68, 68, 0.05)" : "var(--bg-app)",
  border: isDeficient ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  padding: "10px 8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: "2px",
});

// Modal overlays
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
  maxWidth: "750px",
  maxHeight: "92vh",
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

const modalNutrientsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
  gap: "12px",
};

const modalActionsStyle = {
  display: "flex",
  justifydynamic: "flex-end",
  justifyContent: "flex-end",
  gap: "12px",
  borderTop: "1px solid var(--border)",
  paddingTop: "20px",
  marginTop: "12px",
};