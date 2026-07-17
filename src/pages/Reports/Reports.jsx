import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "../../services/database";
import { 
  RiFileExcelLine, 
  RiFilePdfLine, 
  RiDatabaseLine,
  RiRefreshLine,
  RiUploadCloud2Line,
  RiCloseLine,
  RiSearchLine,
  RiFilter3Line,
  RiDeleteBinLine,
  RiDownload2Line,
  RiAttachment2,
  RiFileLine
} from "react-icons/ri";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("vault"); // "vault" | "exports"
  
  // Datasets
  const [customers, setCustomers] = useState([]);
  const [uploadedReports, setUploadedReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tab 1: Vault state
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    customer: "All",
    location: "All",
    fileType: "All"
  });

  // Modal for upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    customer_id: "",
    location: "",
    file_type: "PDF",
    file_name: "",
    file_url: "",
    remarks: ""
  });

  // Tab 2: Exports state
  const [exportType, setExportType] = useState("customers");
  const [exportData, setExportData] = useState([]);
  const [exportLoading, setExportLoading] = useState(false);

  // Fetch baseline data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [custs, reports] = await Promise.all([
        db.select("customers"),
        db.select("uploaded_reports")
      ]);
      setCustomers(custs || []);
      setUploadedReports(reports || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load records from database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load Tab 2: Export Data
  const loadExportData = async () => {
    setExportLoading(true);
    try {
      let result = [];
      if (exportType === "customers") {
        result = await db.select("customers");
      } else if (exportType === "plots") {
        result = await db.select("plots");
      } else if (exportType === "soil_tests") {
        result = await db.select("soil_tests");
      } else if (exportType === "recommendations") {
        result = await db.select("recommendations");
      } else if (exportType === "doses") {
        result = await db.select("dose_records");
      } else if (exportType === "finance") {
        const pay = await db.select("payments");
        const exp = await db.select("expenses");
        const pur = await db.select("purchases");
        
        result = [
          ...pay.map(p => ({ date: p.payment_date, type: "Revenue Received", desc: "Customer UPI/Cash", amount: p.amount })),
          ...exp.map(e => ({ date: e.expense_date, type: "Operating Expense", desc: e.category, amount: -e.amount })),
          ...pur.map(p => ({ date: p.purchase_date, type: "Supplier Purchase", desc: "Bulk Input", amount: -(p.amount || p.total_amount || 0) }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      setExportData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "exports") {
      loadExportData();
    }
  }, [exportType, activeTab]);

  // Map for Customer name & details
  const customerMap = useMemo(() => {
    const map = {};
    customers.forEach(c => { map[c.id] = c; });
    return map;
  }, [customers]);

  // File Upload Handlers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (clamped to 5MB for localStorage safety)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB for browser sandbox compatibility.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      // Determine file category type
      const extension = file.name.split(".").pop().toLowerCase();
      let derivedType = "PDF";
      if (["xls", "xlsx", "csv"].includes(extension)) {
        derivedType = "Excel";
      }

      setUploadForm(prev => ({
        ...prev,
        file_name: file.name,
        file_url: event.target.result, // base64 string
        file_type: derivedType
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFarmerChange = (customerId) => {
    const selected = customerMap[customerId];
    setUploadForm(prev => ({
      ...prev,
      customer_id: customerId,
      location: selected ? (selected.village || selected.district || "") : ""
    }));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.customer_id) return alert("Please map a farmer to this report.");
    if (!uploadForm.file_url) return alert("Please select a PDF or Excel document to upload.");

    const farmer = customerMap[uploadForm.customer_id];

    try {
      const payload = {
        customer_id: uploadForm.customer_id,
        customer_name: farmer ? farmer.name : "Unknown Farmer",
        location: uploadForm.location || farmer?.village || "Unknown Location",
        title: uploadForm.title || "Untitled Document",
        file_type: uploadForm.file_type,
        file_name: uploadForm.file_name,
        file_url: uploadForm.file_url,
        remarks: uploadForm.remarks
      };

      await db.insert("uploaded_reports", payload);
      setShowUploadModal(false);
      setUploadForm({
        title: "",
        customer_id: "",
        location: "",
        file_type: "PDF",
        file_name: "",
        file_url: "",
        remarks: ""
      });
      fetchData();
      alert("Document uploaded and mapped successfully!");
    } catch (err) {
      alert("Error uploading document: " + err.message);
    }
  };

  const handleDeleteReport = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this report from the vault?")) {
      try {
        await db.delete("uploaded_reports", id);
        fetchData();
      } catch (err) {
        alert("Error deleting report: " + err.message);
      }
    }
  };

  // Filtered Uploads list
  const filteredReports = useMemo(() => {
    return uploadedReports.filter(r => {
      const s = searchTerm.toLowerCase();
      const matchSearch = !s || 
        (r.title || "").toLowerCase().includes(s) ||
        (r.customer_name || "").toLowerCase().includes(s) ||
        (r.location || "").toLowerCase().includes(s) ||
        (r.file_name || "").toLowerCase().includes(s);

      const matchCustomer = filters.customer === "All" || r.customer_id === filters.customer;
      const matchLocation = filters.location === "All" || r.location === filters.location;
      const matchFileType = filters.fileType === "All" || r.file_type === filters.fileType;

      return matchSearch && matchCustomer && matchLocation && matchFileType;
    });
  }, [uploadedReports, searchTerm, filters]);

  // Derived Filter Options
  const locationsList = useMemo(() => {
    const set = new Set();
    uploadedReports.forEach(r => { if (r.location) set.add(r.location); });
    return Array.from(set);
  }, [uploadedReports]);

  // Vault Statistics
  const stats = useMemo(() => {
    const total = uploadedReports.length;
    const pdfs = uploadedReports.filter(r => r.file_type === "PDF").length;
    const excels = uploadedReports.filter(r => r.file_type === "Excel").length;
    const uniqueFarmers = new Set(uploadedReports.map(r => r.customer_id)).size;
    return { total, pdfs, excels, uniqueFarmers };
  }, [uploadedReports]);

  // Exporter Functions
  const handleExportCSV = () => {
    if (exportData.length === 0) return;
    const headers = Object.keys(exportData[0]);
    const csvRows = [
      headers.join(","),
      ...exportData.map(row => 
        headers.map(header => {
          const val = row[header];
          const escaped = ("" + (val || "")).replace(/"/g, '\\"');
          return `"${escaped}"`;
        }).join(",")
      )
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `samruddhi_${exportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div style={S.container}>
      {/* ── Header ── */}
      <div style={S.header} className="no-print">
        <div>
          <h1 style={S.pageTitle}>Reports & Vault</h1>
          <p style={S.pageSubtitle}>Upload and store farmer documents, or query and export structural spreadsheets</p>
        </div>
        
        <div style={{ display: "flex", gap: "10px" }}>
          {activeTab === "vault" ? (
            <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
              <RiUploadCloud2Line size={16} />
              <span>Upload Document</span>
            </button>
          ) : (
            <>
              <button className="btn-secondary" onClick={handleExportCSV} disabled={exportData.length === 0}>
                <RiFileExcelLine size={16} />
                <span>Export CSV</span>
              </button>
              <button className="btn-primary" onClick={handlePrintPDF} disabled={exportData.length === 0}>
                <RiFilePdfLine size={16} />
                <span>Print PDF</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div style={S.tabBar} className="no-print">
        <button style={S.tabBtn(activeTab === "vault")} onClick={() => setActiveTab("vault")}>
          <RiAttachment2 size={16} />
          <span>Report Document Vault</span>
        </button>
        <button style={S.tabBtn(activeTab === "exports")} onClick={() => setActiveTab("exports")}>
          <RiDatabaseLine size={16} />
          <span>Database Exporter</span>
        </button>
      </div>

      {/* ── TAB 1: Document Vault ── */}
      {activeTab === "vault" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Summary stats */}
          <div style={S.kpiGrid}>
            {[
              { label: "Uploaded Documents", val: stats.total, color: "var(--primary-dark)" },
              { label: "PDF Reports", val: stats.pdfs, color: "#ef4444" },
              { label: "Excel Worksheets", val: stats.excels, color: "#10b981" },
              { label: "Linked Farmers", val: stats.uniqueFarmers, color: "#7c3aed" }
            ].map(k => (
              <div key={k.label} className="card-premium" style={S.kpiCard}>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{k.label}</div>
                <div style={{ fontSize: "28px", fontWeight: 800, color: k.color, marginTop: "4px" }}>{k.val}</div>
              </div>
            ))}
          </div>

          {/* Search + Filter controls */}
          <div className="card-premium" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={S.searchWrapper}>
                <RiSearchLine size={16} style={S.searchIcon} />
                <input
                  style={S.searchInput}
                  placeholder="Search by title, farmer, location, file name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <select className="form-input" style={S.filterSelect} value={filters.fileType} onChange={e => setFilters(f => ({ ...f, fileType: e.target.value }))}>
                <option value="All">All Formats</option>
                <option value="PDF">PDF Only</option>
                <option value="Excel">Excel Only</option>
              </select>
              <button className="btn-secondary" onClick={() => setShowFilters(f => !f)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <RiFilter3Line size={16} />
                <span>More Filters</span>
              </button>
            </div>

            {showFilters && (
              <div style={S.filterGrid}>
                <div>
                  <div style={S.filterLabel}>Farmer / Owner</div>
                  <select className="form-input" style={S.filterSelect} value={filters.customer} onChange={e => setFilters(f => ({ ...f, customer: e.target.value }))}>
                    <option value="All">All Farmers</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={S.filterLabel}>Location (Village)</div>
                  <select className="form-input" style={S.filterSelect} value={filters.location} onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}>
                    <option value="All">All Locations</option>
                    {locationsList.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button className="btn-secondary" style={{ fontSize: "12px", padding: "8px 14px", width: "100%" }} onClick={() => setFilters({ customer: "All", location: "All", fileType: "All" })}>
                    Reset Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Documents Table */}
          <div className="card-premium" style={{ overflow: "hidden", padding: 0 }}>
            {loading ? (
              <div style={S.emptyState}>Loading Vault files...</div>
            ) : filteredReports.length === 0 ? (
              <div style={S.emptyState}>
                <RiFileLine size={40} color="var(--primary)" style={{ marginBottom: "12px" }} />
                <div style={{ fontWeight: 600, color: "var(--text-main)" }}>No files in vault</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Upload a PDF report or Excel spreadsheet sheet mapping it to a farmer.</div>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Document Title</th>
                      <th>Farmer / Customer</th>
                      <th>Location</th>
                      <th>File Name</th>
                      <th>Type</th>
                      <th>Upload Date</th>
                      <th>Remarks</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map(report => (
                      <tr key={report.id}>
                        <td style={{ fontWeight: 700, color: "var(--primary-dark)" }}>{report.title}</td>
                        <td style={{ fontWeight: 600 }}>{report.customer_name}</td>
                        <td>{report.location}</td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "monospace" }}>{report.file_name}</td>
                        <td>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700,
                            padding: "3px 8px", borderRadius: "12px",
                            background: report.file_type === "PDF" ? "#fee2e2" : "#d1fae5",
                            color: report.file_type === "PDF" ? "#991b1b" : "#065f46"
                          }}>
                            {report.file_type === "PDF" ? <RiFilePdfLine /> : <RiFileExcelLine />}
                            {report.file_type}
                          </span>
                        </td>
                        <td>{report.created_at ? report.created_at.split("T")[0] : "—"}</td>
                        <td style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {report.remarks || "—"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <a 
                              href={report.file_url} 
                              download={report.file_name} 
                              className="btn-secondary" 
                              title="Download document file"
                              style={{ padding: "4px 8px", fontSize: "11px", display: "flex", gap: "4px", alignItems: "center" }}
                            >
                              <RiDownload2Line size={13} />
                              <span>Download</span>
                            </a>
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="btn-secondary"
                              title="Delete from vault"
                              style={{ padding: "6px", color: "#ef4444" }}
                            >
                              <RiDeleteBinLine size={13} />
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
        </div>
      )}

      {/* ── TAB 2: Exporter tool ── */}
      {activeTab === "exports" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="card-premium no-print" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <RiDatabaseLine size={18} color="var(--text-muted)" />
              <select 
                className="form-input" 
                style={S.filterSelect}
                value={exportType}
                onChange={(e) => setExportType(e.target.value)}
              >
                <option value="customers">Customers Directory Report</option>
                <option value="plots">Land Plots Census</option>
                <option value="soil_tests">Soil Chemistry Lab Reports</option>
                <option value="recommendations">Customized Fertilizer Recipes</option>
                <option value="doses">Dose Scheduled Timeline</option>
                <option value="finance">Revenue & Expense Cashbook</option>
              </select>
              <button className="btn-secondary" style={{ padding: "10px" }} onClick={loadExportData} title="Reload Data">
                <RiRefreshLine size={16} />
              </button>
            </div>
          </div>

          <div className="card-premium print-full-width" style={{ padding: 0, overflow: "hidden" }}>
            {/* Header visible ONLY during printing */}
            <div style={S.printHeader} className="print-only">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "2px solid #064e3b", paddingBottom: "12px", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, color: "#064e3b" }}>Samruddhi Organics ERP</h2>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#6b7280" }}>
                    Official Operational Report • {exportType.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {exportLoading ? (
              <div style={{ padding: "40px", textAlign: "center" }}>Compiling report records...</div>
            ) : exportData.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No records found for active category.</div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      {Object.keys(exportData[0]).filter(k => k !== "id" && k !== "created_at" && k !== "updated_at").map(key => (
                        <th key={key}>{key.replace(/_/g, " ").toUpperCase()}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.map((row, idx) => (
                      <tr key={idx}>
                        {Object.keys(row).filter(k => k !== "id" && k !== "created_at" && k !== "updated_at").map((key, subIdx) => (
                          <td key={subIdx}>
                            {typeof row[key] === "object" ? JSON.stringify(row[key]) : "" + row[key]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Upload Report Modal ── */}
      {showUploadModal && (
        <div style={S.modalOverlay}>
          <div className="card-premium animate-fade-in" style={S.modalCard}>
            <div style={S.modalHeader}>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Upload File to Vault</h3>
              <button style={S.closeBtn} onClick={() => setShowUploadModal(false)}><RiCloseLine size={20} /></button>
            </div>
            
            <form onSubmit={handleUploadSubmit}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="form-label">Farmer / Customer Portfolio *</label>
                  <select className="form-input" value={uploadForm.customer_id} onChange={e => handleFarmerChange(e.target.value)} required>
                    <option value="">-- Select Farmer --</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.customer_number})</option>)}
                  </select>
                </div>

                <div>
                  <label className="form-label">Report Document Title *</label>
                  <input className="form-input" value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} placeholder="e.g. Soil Quality Report - West Plot" required />
                </div>

                <div>
                  <label className="form-label">Location (Village / Town) *</label>
                  <input className="form-input" value={uploadForm.location} onChange={e => setUploadForm({ ...uploadForm, location: e.target.value })} placeholder="Inherited from farmer if blank" />
                </div>

                {/* File picker */}
                <div>
                  <label className="form-label">Document Attachment (PDF or Excel/CSV) *</label>
                  <div style={{
                    border: "2px dashed var(--border)", borderRadius: "10px", padding: "20px",
                    textAlign: "center", background: "var(--bg-app)", position: "relative",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px"
                  }}>
                    <RiUploadCloud2Line size={32} color="var(--primary)" />
                    {uploadForm.file_name ? (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--primary-dark)" }}>{uploadForm.file_name}</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>({uploadForm.file_type} format parsed)</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        Click to select or drag PDF, XLS, XLSX, CSV files here (Max 5MB)
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept=".pdf,.xls,.xlsx,.csv" 
                      onChange={handleFileChange}
                      style={{
                        position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                        opacity: 0, cursor: "pointer"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Additional Remarks</label>
                  <textarea className="form-input" style={{ minHeight: "80px" }} value={uploadForm.remarks} onChange={e => setUploadForm({ ...uploadForm, remarks: e.target.value })} placeholder="Details of findings, recommendations linked to this report..." />
                </div>
              </div>

              <div style={S.modalActions}>
                <button type="button" className="btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!uploadForm.file_url}>Upload File</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  container: { display: "flex", flexDirection: "column", gap: "20px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  pageTitle: { fontSize: "26px", fontWeight: 700, marginBottom: "2px" },
  pageSubtitle: { fontSize: "13px", color: "var(--text-muted)" },
  tabBar: { display: "flex", gap: "4px", flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: "0" },
  tabBtn: (active) => ({
    display: "flex", alignItems: "center", gap: "6px",
    padding: "10px 16px", background: "transparent", border: "none",
    borderBottom: active ? "3.5px solid var(--primary)" : "3px solid transparent",
    color: active ? "var(--primary-dark)" : "var(--text-muted)",
    fontWeight: active ? 800 : 500, fontSize: "13.5px", cursor: "pointer",
    marginBottom: "-1.5px", transition: "all 0.15s",
  }),
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" },
  kpiCard: { padding: "18px 20px" },
  searchWrapper: { position: "relative", flex: 1, minWidth: "260px", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: "12px", color: "var(--text-muted)" },
  searchInput: { width: "100%", padding: "10px 14px 10px 38px", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px", outline: "none" },
  filterSelect: { padding: "10px 12px", fontSize: "12px", minWidth: "160px", width: "auto" },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" },
  filterLabel: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" },
  emptyState: { padding: "60px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalCard: { width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto", padding: "28px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  closeBtn: { background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)" },
  printHeader: { marginBottom: "20px" }
};
