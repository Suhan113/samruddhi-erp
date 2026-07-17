import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "../../services/database";
import {
  RiUserLine,
  RiLandscapeLine,
  RiAddCircleLine,
  RiDeleteBinLine,
  RiSave3Line,
  RiSearchLine,
  RiArrowLeftLine,
  RiHistoryLine,
  RiPrinterLine,
  RiFileExcelLine,
  RiCoinsLine,
  RiFileList3Line,
  RiInformationLine,
  RiCloseLine,
  RiEyeLine
} from "react-icons/ri";

export default function Doses() {
  // Datasets from database
  const [customers, setCustomers] = useState([]);
  const [plots, setPlots] = useState([]);
  const [doses, setDoses] = useState([]);
  const [doseMaterials, setDoseMaterials] = useState([]);
  const [doseVersions, setDoseVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Navigation Target
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPlotId, setSelectedPlotId] = useState("");
  const [activeDoseStage, setActiveDoseStage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Clean local state form for the selected Customer + Plot + Dose combination
  const [doseMeta, setDoseMeta] = useState({
    planned_date: "",
    due_date: "",
    status: "Pending",
    prepared_by: "Amit Shinde",
    remarks: ""
  });

  // Custom manual typing rows
  const [doseMaterialsRows, setDoseMaterialsRows] = useState([]);

  // Report Modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("dose_sheet");

  // History Modal states
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);

  // Fetch initial base tables
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cData, pData, dData, dmData, dvData] = await Promise.all([
        db.select("customers"),
        db.select("plots"),
        db.select("dose_records"),
        db.select("dose_materials"),
        db.select("dose_versions")
      ]);
      setCustomers(cData || []);
      setPlots(pData || []);
      setDoses(dData || []);
      setDoseMaterials(dmData || []);
      setDoseVersions(dvData || []);
    } catch (err) {
      console.error("Database connection failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived filtered dropdown arrays
  const filteredPlotsDropdown = useMemo(() => {
    if (!selectedCustomerId) return [];
    return plots.filter(p => p.customer_id === selectedCustomerId);
  }, [plots, selectedCustomerId]);

  const currentSelectedPlot = useMemo(() => {
    return plots.find(p => p.id === selectedPlotId) || null;
  }, [plots, selectedPlotId]);

  // Active plot doses list
  const activePlotDoses = useMemo(() => {
    if (!selectedCustomerId || !selectedPlotId) return [];
    return doses
      .filter(d => d.customer_id === selectedCustomerId && d.plot_id === selectedPlotId)
      .sort((a, b) => a.dose_number - b.dose_number);
  }, [doses, selectedCustomerId, selectedPlotId]);

  // Active Dose Record
  const activeDoseRecord = useMemo(() => {
    return activePlotDoses.find(d => d.dose_number === activeDoseStage) || null;
  }, [activePlotDoses, activeDoseStage]);

  const plantPopulation = useMemo(() => {
    if (!currentSelectedPlot) return 0;
    return Number(currentSelectedPlot.number_of_plants) || Math.round(Number(currentSelectedPlot.area || 0) * 300);
  }, [currentSelectedPlot]);

  // Load saved inputs whenever Customer, Plot, or Dose number changes
  useEffect(() => {
    if (!selectedCustomerId || !selectedPlotId) {
      setDoseMaterialsRows([]);
      return;
    }

    if (activeDoseRecord) {
      setDoseMeta({
        planned_date: activeDoseRecord.planned_date || "",
        due_date: activeDoseRecord.due_date || "",
        status: activeDoseRecord.status || "Pending",
        prepared_by: activeDoseRecord.prepared_by || "Amit Shinde",
        remarks: activeDoseRecord.remarks || ""
      });

      const matchedMaterials = doseMaterials.filter(dm => dm.dose_record_id === activeDoseRecord.id);
      setDoseMaterialsRows(matchedMaterials.map(m => ({
        material_name: m.material_name || "",
        category: m.category || "Organic",
        quantity_per_plant: m.quantity_per_plant || 0,
        total_quantity: m.total_quantity || 0,
        unit: m.unit || "Kg",
        remarks: m.remarks || ""
      })));
    } else {
      setDoseMeta({
        planned_date: "",
        due_date: "",
        status: "Pending",
        prepared_by: "Amit Shinde",
        remarks: ""
      });
      setDoseMaterialsRows([]);
    }
  }, [selectedCustomerId, selectedPlotId, activeDoseStage, activeDoseRecord, doseMaterials]);

  // Auto initialize default 4-dose schedule if plot is mapped but has 0 doses
  useEffect(() => {
    if (selectedCustomerId && selectedPlotId && doses.length > 0 && activePlotDoses.length === 0 && !loading) {
      const initializeDefaultDoses = async () => {
        try {
          for (let i = 1; i <= 4; i++) {
            const planned = new Date();
            planned.setDate(planned.getDate() + (i - 1) * 30);
            const due = new Date(planned);
            due.setDate(due.getDate() + 7);

            await db.insert("dose_records", {
              customer_id: selectedCustomerId,
              plot_id: selectedPlotId,
              dose_number: i,
              planned_date: planned.toISOString().split("T")[0],
              due_date: due.toISOString().split("T")[0],
              status: "Pending",
              prepared_by: "Amit Shinde",
              remarks: `Default Dose Stage ${i} initial setup`
            });
          }
          await fetchData();
        } catch (err) {
          console.error("Failed to seed default doses", err);
        }
      };
      initializeDefaultDoses();
    }
  }, [selectedCustomerId, selectedPlotId, activePlotDoses, doses, loading, fetchData]);

  // Flexible Dose Count Handler
  const handleDoseCountChange = async (newCount) => {
    if (!selectedCustomerId || !selectedPlotId) return;
    const currentCount = activePlotDoses.length;
    if (newCount === currentCount) return;

    if (newCount < currentCount) {
      const confirmText = `You are reducing the dose schedule count from ${currentCount} to ${newCount}. This will permanently delete planned Dose ${newCount + 1} to Dose ${currentCount} and all their mapped materials. Proceed?`;
      if (!window.confirm(confirmText)) return;

      try {
        const dosesToDelete = activePlotDoses.slice(newCount);
        for (const d of dosesToDelete) {
          await db.delete("dose_records", d.id);
        }
        await fetchData();
        setActiveDoseStage(1);
        alert(`Dose schedule successfully truncated to ${newCount} doses.`);
      } catch (err) {
        alert("Failed to update dose schedule splits count: " + err.message);
      }
    } else {
      try {
        const baseDate = new Date();
        for (let i = currentCount + 1; i <= newCount; i++) {
          const planned = new Date(baseDate);
          planned.setDate(planned.getDate() + (i - 1) * 30);
          const due = new Date(planned);
          due.setDate(due.getDate() + 7);

          await db.insert("dose_records", {
            customer_id: selectedCustomerId,
            plot_id: selectedPlotId,
            dose_number: i,
            planned_date: planned.toISOString().split("T")[0],
            due_date: due.toISOString().split("T")[0],
            status: "Pending",
            prepared_by: "Amit Shinde",
            remarks: `Automatically instantiated Dose Split ${i}.`
          });
        }
        await fetchData();
        alert(`Dose schedule extended to ${newCount} splits.`);
      } catch (err) {
        alert("Failed to extend splits count: " + err.message);
      }
    }
  };

  // Row manipulation handlers
  const handleAddNewInputRow = () => {
    setDoseMaterialsRows(prev => [
      ...prev,
      { material_name: "", category: "Organic", quantity_per_plant: 0, total_quantity: 0, unit: "Kg", remarks: "" }
    ]);
  };

  const handleRemoveInputRow = (idx) => {
    setDoseMaterialsRows(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateRowValue = (idx, field, value) => {
    setDoseMaterialsRows(prev =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );
  };

  // Real-time category weight summaries
  const summaries = useMemo(() => {
    let organic = 0;
    let chemical = 0;
    let biofertilizer = 0;
    let micronutrient = 0;
    let amendment = 0;

    doseMaterialsRows.forEach(row => {
      const targetWeight = Number(row.total_quantity || 0);

      if (row.category === "Organic") organic += targetWeight;
      else if (row.category === "Chemical") chemical += targetWeight;
      else if (row.category === "Biofertilizer") biofertilizer += targetWeight;
      else if (row.category === "Micronutrient") micronutrient += targetWeight;
      else if (row.category === "Amendment") amendment += targetWeight;
    });

    return { organic, chemical, biofertilizer, micronutrient, amendment };
  }, [doseMaterialsRows]);

  // Process and save explicitly for this client plot profile node
  const handleSaveCustomerDosePlan = async () => {
    if (!selectedCustomerId || !selectedPlotId) return alert("Please map a customer and land plot first.");

    try {
      const allSavedDoses = await db.select("dose_records");
      let currentDoseId = "";

      const existingRecord = allSavedDoses.find(d =>
        d.customer_id === selectedCustomerId &&
        d.plot_id === selectedPlotId &&
        Number(d.dose_number) === Number(activeDoseStage)
      );

      const metaPayload = {
        customer_id: selectedCustomerId,
        plot_id: selectedPlotId,
        dose_number: Number(activeDoseStage),
        ...doseMeta
      };

      if (existingRecord) {
        currentDoseId = existingRecord.id;
        await db.update("dose_records", existingRecord.id, metaPayload);
      } else {
        const createdRecord = await db.insert("dose_records", metaPayload);
        currentDoseId = createdRecord.id;
      }

      // Wipe previous entries bound to this sub-stage record node
      const allDoseMaterials = await db.select("dose_materials");
      const itemsToDelete = allDoseMaterials.filter(dm => dm.dose_record_id === currentDoseId);
      for (const item of itemsToDelete) {
        await db.delete("dose_materials", item.id);
      }

      // Insert fresh typing entries
      for (const row of doseMaterialsRows) {
        await db.insert("dose_materials", {
          dose_record_id: currentDoseId,
          material_name: row.material_name,
          category: row.category,
          quantity_per_plant: Number(row.quantity_per_plant),
          total_quantity: Number(row.total_quantity),
          unit: row.unit,
          remarks: row.remarks
        });
      }

      // Save Version audit trail record
      const plotVersions = doseVersions.filter(v => v.dose_record_id === currentDoseId);
      const nextVersion = plotVersions.length + 1;

      await db.insert("dose_versions", {
        dose_record_id: currentDoseId,
        version: nextVersion,
        saved_data: JSON.stringify({
          planned_date: doseMeta.planned_date,
          due_date: doseMeta.due_date,
          status: doseMeta.status,
          prepared_by: doseMeta.prepared_by,
          remarks: doseMeta.remarks,
          materials: doseMaterialsRows
        }),
        modified_by: "Amit Shinde",
        modified_date: new Date().toISOString()
      });

      alert(`Dose ${activeDoseStage} data saved securely for this custom plan. Version ${nextVersion} saved.`);
      await fetchData();
    } catch (err) {
      alert("Error saving application layout configurations: " + err.message);
    }
  };

  // Load audit trail logs
  const activeVersions = useMemo(() => {
    if (!activeDoseRecord) return [];
    return doseVersions
      .filter(v => v.dose_record_id === activeDoseRecord.id)
      .sort((a, b) => b.version - a.version);
  }, [doseVersions, activeDoseRecord]);

  const handleViewVersion = (record) => {
    try {
      const parsed = JSON.parse(record.saved_data);
      setSelectedVersion({
        version: record.version,
        modified_by: record.modified_by,
        modified_date: record.modified_date,
        ...parsed
      });
      setShowVersionModal(true);
    } catch (err) {
      alert("Failed to read version data.");
    }
  };

  // CSV Exporter Utility
  const handleExportReportCSV = () => {
    if (!currentSelectedPlot) return;
    const farmer = customers.find(c => c.id === selectedCustomerId) || {};

    let csv = "data:text/csv;charset=utf-8,";

    if (reportType === "dose_sheet") {
      csv += `Samruddhi Organics - Dose Sheet,Plot: ${currentSelectedPlot.plot_number},Farmer: ${farmer.name}\n`;
      csv += `Dose Stage: Dose ${activeDoseStage},Status: ${doseMeta.status},Due Date: ${doseMeta.due_date}\n\n`;
      csv += "Material Name,Category,Quantity Per Plant,Total Quantity,Unit,Remarks\n";
      doseMaterialsRows.forEach(row => {
        csv += `"${row.material_name}","${row.category}",${row.quantity_per_plant},${row.total_quantity},"${row.unit}","${row.remarks || ""}"\n`;
      });
    } else if (reportType === "material_req") {
      csv += `Samruddhi Organics - Plot Material Requirements,Plot: ${currentSelectedPlot.plot_number},Farmer: ${farmer.name}\n\n`;
      csv += "Material Name,Category,Quantity Required,Unit\n";

      const totals = {};
      activePlotDoses.forEach(d => {
        const mats = doseMaterials.filter(dm => dm.dose_record_id === d.id);
        mats.forEach(m => {
          const uniqueKey = m.material_name || "Unspecified Input";
          if (!totals[uniqueKey]) totals[uniqueKey] = { total: 0, category: m.category || "Organic", unit: m.unit || "Kg" };
          totals[uniqueKey].total += Number(m.total_quantity || 0);
        });
      });

      Object.keys(totals).forEach(key => {
        csv += `"${key}","${totals[key].category}",${totals[key].total},"${totals[key].unit}"\n`;
      });
    } else {
      csv += `Samruddhi Organics - Fertilizer Schedule,Plot: ${currentSelectedPlot.plot_number},Farmer: ${farmer.name}\n\n`;
      csv += "Dose Stage,Planned Date,Due Date,Status,Prepared By,Remarks\n";
      activePlotDoses.forEach(d => {
        csv += `Dose ${d.dose_number},${d.planned_date},${d.due_date},${d.status},"${d.prepared_by}","${d.remarks || ""}"\n`;
      });
    }

    const encoded = encodeURI(csv);
    const link = document.createElement("a");
    link.setAttribute("href", encoded);
    link.setAttribute("download", `Plot_${currentSelectedPlot.plot_number}_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Target Portfolio Selection Header */}
      <div className="card-premium" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "var(--primary-dark)" }}>
            Target Customer Plan Selection Matrix
          </h2>
          {selectedCustomerId && selectedPlotId && (
            <button type="button" className="btn-secondary" onClick={() => setShowReportModal(true)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <RiPrinterLine size={16} />
              <span>Print / Export Sheets</span>
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label className="form-label">1. Select Active Customer Portfolio *</label>
            <select
              className="form-input"
              value={selectedCustomerId}
              onChange={e => { setSelectedCustomerId(e.target.value); setSelectedPlotId(""); }}
            >
              <option value="">-- Select Target Farmer Account --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.customer_number})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">2. Select Target Mapped Land Plot *</label>
            <select
              className="form-input"
              value={selectedPlotId}
              onChange={e => setSelectedPlotId(e.target.value)}
              disabled={!selectedCustomerId}
            >
              <option value="">-- Select Target Land Plot Unit --</option>
              {filteredPlotsDropdown.map(p => (
                <option key={p.id} value={p.id}>{p.plot_number} - {p.plot_name || "Untitled Plot"} ({p.crop})</option>
              ))}
            </select>
          </div>
        </div>

        {selectedCustomerId && selectedPlotId && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Crop: <strong>{currentSelectedPlot?.crop} ({currentSelectedPlot?.variety || "Local"})</strong> • Plants Count: <strong>{plantPopulation}</strong> • Area: <strong>{currentSelectedPlot?.area} Acres</strong>
            </div>

            {/* Flexible splits count selector */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>Splits Count:</span>
              {[2, 3, 4].map(count => (
                <button
                  key={count}
                  type="button"
                  onClick={() => handleDoseCountChange(count)}
                  style={{
                    padding: "4px 10px", fontSize: "11px", fontWeight: 700, borderRadius: "4px", cursor: "pointer",
                    background: activePlotDoses.length === count ? "var(--primary)" : "transparent",
                    color: activePlotDoses.length === count ? "#ffffff" : "var(--text-muted)",
                    border: "1px solid var(--border)"
                  }}
                >
                  {count} Doses
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Workspace Canvas */}
      {selectedCustomerId && selectedPlotId ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Dose Timelines Selection Strips */}
          <div style={{ display: "flex", gap: "10px", borderBottom: "2px solid var(--border)", paddingBottom: "10px" }}>
            {activePlotDoses.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setActiveDoseStage(d.dose_number)}
                style={{
                  padding: "12px 24px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeDoseStage === d.dose_number ? 800 : 500,
                  background: activeDoseStage === d.dose_number ? "var(--primary)" : "var(--bg-card)",
                  color: activeDoseStage === d.dose_number ? "#ffffff" : "var(--text-main)",
                  border: "1px solid var(--border)"
                }}
              >
                Configure Dose Stage {d.dose_number} ({d.status})
              </button>
            ))}
          </div>

          {/* Core Configuration Layout Panels Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "20px", alignItems: "start" }}>

            {/* Left Workspace Panel */}
            <div className="card-premium" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>
                  Manual Material Entry Layout Matrix (Dose Split Stage {activeDoseStage})
                </h3>
                <button type="button" className="btn-primary" onClick={handleSaveCustomerDosePlan}>
                  <RiSave3Line size={16} />
                  <span>Save Stage {activeDoseStage} Parameters</span>
                </button>
              </div>

              {/* Sub Meta configurations details layout rows */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "16px" }}>
                <div>
                  <label className="form-label">Planned Execution Date</label>
                  <input type="date" className="form-input" value={doseMeta.planned_date} onChange={e => setDoseMeta({ ...doseMeta, planned_date: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Due Cutoff Date</label>
                  <input type="date" className="form-input" value={doseMeta.due_date} onChange={e => setDoseMeta({ ...doseMeta, due_date: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Current Execution Status</label>
                  <select className="form-input" value={doseMeta.status} onChange={e => setDoseMeta({ ...doseMeta, status: e.target.value })}>
                    <option value="Pending">Pending application</option>
                    <option value="Completed">Completed application</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label className="form-label">Application Directives Remarks</label>
                <input className="form-input" value={doseMeta.remarks} onChange={e => setDoseMeta({ ...doseMeta, remarks: e.target.value })} placeholder="Type placement remarks or humidity warnings for field workers..." />
              </div>

              {/* Interactive Multiple Materials Matrix Table Block */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "var(--primary-dark)" }}>
                    Mix Recipe Ingredients (Free Typing Input Canvas)
                  </h4>
                  <button type="button" className="btn-secondary" style={{ fontSize: "12px", padding: "6px 12px" }} onClick={handleAddNewInputRow}>
                    + Add New Custom Material Line
                  </button>
                </div>

                {doseMaterialsRows.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", background: "var(--bg-app)", borderRadius: "8px", border: "1px dashed var(--border)", color: "var(--text-muted)", fontSize: "13px" }}>
                    This dosage layer snapshot is currently empty. Click "+ Add New Custom Material Line" to type any commercial manure or chemical input.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table className="premium-table" style={{ fontSize: "13px", tableLayout: "fixed", width: "100%" }}>
                      <thead>
                        <tr>
                          <th style={{ width: "25%" }}>Type Material Name (Free Text)</th>
                          <th style={{ width: "18%" }}>Category Type</th>
                          <th style={{ width: "12%" }}>Qty / Tree</th>
                          <th style={{ width: "15%" }}>Manual Total Quantity</th>
                          <th style={{ width: "10%" }}>Unit (e.g. Kg)</th>
                          <th style={{ width: "15%" }}>Mixing/Field Instructions</th>
                          <th style={{ width: "5%", textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doseMaterialsRows.map((row, idx) => {
                          const totalCalculated = (row.quantity_per_plant || 0) * plantPopulation;
                          return (
                            <tr key={idx}>
                              <td>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ padding: "12px 10px", fontSize: "13px", fontWeight: 600, width: "100%", height: "40px", display: "block", boxSizing: "border-box" }}
                                  value={row.material_name}
                                  onChange={e => handleUpdateRowValue(idx, "material_name", e.target.value)}
                                  placeholder="e.g. Premium Poultry Manure"
                                />
                              </td>
                              <td>
                                <select
                                  className="form-input"
                                  style={{ padding: "6px 10px", fontSize: "12px", width: "100%", height: "40px", display: "block", boxSizing: "border-box" }}
                                  value={row.category}
                                  onChange={e => handleUpdateRowValue(idx, "category", e.target.value)}
                                >
                                  <option value="Organic">Organic Materials</option>
                                  <option value="Chemical">Chemical Fertilizers</option>
                                  <option value="Biofertilizer">Biofertilizers</option>
                                  <option value="Micronutrient">Micronutrients</option>
                                  <option value="Amendment">Soil Amendments</option>
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.001"
                                  className="form-input"
                                  style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, width: "100%", height: "40px", display: "block", boxSizing: "border-box" }}
                                  value={row.quantity_per_plant || ""}
                                  onChange={e => handleUpdateRowValue(idx, "quantity_per_plant", e.target.value ? Number(e.target.value) : "")}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="form-input"
                                  style={{ padding: "6px 10px", textAlign: "right", fontWeight: 700, width: "100%", height: "40px", display: "block", boxSizing: "border-box", color: "var(--primary-dark)" }}
                                  value={row.total_quantity || ""}
                                  onChange={e => handleUpdateRowValue(idx, "total_quantity", e.target.value ? Number(e.target.value) : "")}
                                  placeholder="Enter Bulk Qty"
                                />
                              </td>
                              <td>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ padding: "6px 10px", fontSize: "12px", textAlign: "center", width: "100%", height: "40px", display: "block", boxSizing: "border-box" }}
                                  value={row.unit}
                                  onChange={e => handleUpdateRowValue(idx, "unit", e.target.value)}
                                  placeholder="Kg"
                                />
                              </td>
                              <td>
                                <input
                                  className="form-input"
                                  style={{ padding: "6px 10px", width: "100%", height: "40px", display: "block", boxSizing: "border-box" }}
                                  value={row.remarks}
                                  onChange={e => handleUpdateRowValue(idx, "remarks", e.target.value)}
                                  placeholder="Instructions..."
                                />
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  type="button"
                                  style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}
                                  onClick={() => handleRemoveInputRow(idx)}
                                >
                                  <RiDeleteBinLine size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Weight Category summaries & Version Sidebar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

              {/* Weight Category summaries card */}
              <div className="card-premium" style={{ padding: "20px" }}>
                <h4 style={{ margin: "0 0 12px 0", fontSize: "11px", fontWeight: 700, color: "var(--primary-dark)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Dose Split Category Weights
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { label: "Organic Materials", val: summaries.organic, bg: "#e6f4ea", color: "var(--primary-dark)" },
                    { label: "Chemical Fertilizers", val: summaries.chemical, bg: "#dbeafe", color: "#1e3a8a" },
                    { label: "Biofertilizers", val: summaries.biofertilizer, bg: "#f3e8ff", color: "#6b21a8" },
                    { label: "Micronutrients", val: summaries.micronutrient, bg: "#ffedd5", color: "#9a3412" },
                    { label: "Soil Amendments", val: summaries.amendment, bg: "#f3f4f6", color: "#111827" }
                  ].map(item => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderRadius: "8px", background: item.bg }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: item.color }}>{item.label}</span>
                      <span style={{ fontSize: "12px", fontWeight: 800, color: item.color }}>{item.val.toFixed(1)} Kg</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Version audit log panel */}
              <div className="card-premium" style={{ padding: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid var(--border)", paddingBottom: "10px", marginBottom: "12px" }}>
                  <RiHistoryLine size={16} color="var(--primary)" />
                  <h4 style={{ fontSize: "13px", fontWeight: 700, margin: 0 }}>Version History Audits</h4>
                </div>

                {activeVersions.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", padding: "10px 0" }}>
                    No audit records registered yet. Save parameters to compile Version 1.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto" }}>
                    {activeVersions.map(v => (
                      <div key={v.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "12px" }}>Version {v.version}</div>
                          <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {v.modified_by} • {v.modified_date.split("T")[0]}
                          </div>
                        </div>
                        <button type="button" className="btn-secondary" style={{ padding: "4px 8px", fontSize: "11px" }} onClick={() => handleViewVersion(v)}>
                          <RiEyeLine size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      ) : (
        <div className="card-premium" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
          Please complete steps 1 and 2 above by selecting a specific customer portfolio and plot node to unlock the manual quantity editor canvas.
        </div>
      )}

      {/* ─── REPORTS PRINTING MODAL OVERLAY ─── */}
      {showReportModal && currentSelectedPlot && (
        <div style={S.modalOverlay} className="no-print-overlay">
          <div className="card-premium print-modal-full" style={S.reportModalCard}>
            <div style={S.modalHeader} className="no-print">
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 800 }}>Print Sheets & Export Center</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Select sheet type to download structured CSV or print custom layouts.
                </p>
              </div>
              <button type="button" style={S.closeBtn} onClick={() => setShowReportModal(false)}><RiCloseLine size={22} /></button>
            </div>

            {/* Type selector */}
            <div style={S.reportTypeBar} className="no-print">
              {[
                { type: "dose_sheet", label: "Dose Sheet (Single Stage)" },
                { type: "schedule", label: "Farmer Fertilizer Schedule" },
                { type: "material_req", label: "Plot Material Requirement" },
                { type: "checklist", label: "Field Worker Checklist" }
              ].map(r => (
                <button
                  key={r.type}
                  type="button"
                  style={S.reportTypeBtn(reportType === r.type)}
                  onClick={() => setReportType(r.type)}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Export actions */}
            <div style={S.exportActionsBar} className="no-print">
              <button type="button" className="btn-secondary" onClick={handleExportReportCSV}>
                <RiFileExcelLine size={16} />
                <span>Export Excel (CSV)</span>
              </button>
              <button type="button" className="btn-primary" onClick={handlePrintReportPDF}>
                <RiPrinterLine size={16} />
                <span>Print PDF Layout</span>
              </button>
            </div>

            <div style={S.printableWrapper} className="printable-document">

              {/* Letterhead */}
              <div style={S.reportLetterhead}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #064e3b", paddingBottom: "10px" }}>
                  <div>
                    <h2 style={{ color: "#064e3b", fontSize: "22px", fontWeight: 800 }}>SAMRUDDHI ORGANICS ERP</h2>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)" }}>Agronomy fertilizer application scheduling program</span>
                  </div>
                  <div style={{ textAlign: "right", fontSize: "11px", color: "var(--text-muted)" }}>
                    <div>Report date: {new Date().toISOString().split("T")[0]}</div>
                    <div>Plot ID: {currentSelectedPlot.plot_number}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "12px", background: "#f9fafb", borderRadius: "8px", border: "1px solid var(--border)", marginTop: "14px", fontSize: "12px" }}>
                  <div>
                    <div>Farmer: <strong>{(customers.find(c => c.id === selectedCustomerId) || {}).name}</strong></div>
                    <div>Mobile: <strong>{(customers.find(c => c.id === selectedCustomerId) || {}).phone || "—"}</strong></div>
                    <div>Village: <strong>{currentSelectedPlot.village}</strong></div>
                  </div>
                  <div>
                    <div>Crop: <strong>{currentSelectedPlot.crop} ({currentSelectedPlot.variety || "Local"})</strong></div>
                    <div>Plants Count: <strong>{plantPopulation} plants</strong></div>
                    <div>Plot Area: <strong>{currentSelectedPlot.area} Acres</strong></div>
                  </div>
                </div>
              </div>

              {/* REPORT VIEW 1: Dose Stage Sheet */}
              {reportType === "dose_sheet" && (
                <div style={{ marginTop: "20px" }}>
                  <h3 style={S.printTitle}>Dose Split Stage {activeDoseStage} Material Prescription</h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px", fontSize: "12px" }}>
                    <div>Planned Application Date: <strong>{doseMeta.planned_date || "—"}</strong></div>
                    <div>Due Date: <strong>{doseMeta.due_date || "—"}</strong></div>
                    <div>Prepared By Agronomist: <strong>{doseMeta.prepared_by || "—"}</strong></div>
                    <div>Status: <strong style={{ color: doseMeta.status === "Completed" ? "#047857" : "#b45309" }}>{doseMeta.status}</strong></div>
                  </div>

                  <table className="premium-table printable-table" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th>Material Inputs</th>
                        <th>Category</th>
                        <th style={{ textAlign: "right" }}>Qty / Plant</th>
                        <th style={{ textAlign: "right" }}>Total Required</th>
                        <th>Unit</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doseMaterialsRows.map((row, idx) => {
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 700 }}>{row.material_name || "—"}</td>
                            <td>{row.category || "—"}</td>
                            <td style={{ textAlign: "right" }}>{row.quantity_per_plant}</td>
                            <td style={{ textAlign: "right", fontWeight: 800 }}>{Number(row.total_quantity).toFixed(1)}</td>
                            <td>{row.unit || "Kg"}</td>
                            <td>{row.remarks || "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* REPORT VIEW 2: Farmer schedule */}
              {reportType === "schedule" && (
                <div style={{ marginTop: "20px" }}>
                  <h3 style={S.printTitle}>Complete fertilizer application schedule (timeline)</h3>

                  <table className="premium-table printable-table" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th>Dose Stage</th>
                        <th>Planned Date</th>
                        <th>Due Date (Cutoff)</th>
                        <th>Instructions / Details</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePlotDoses.map(d => (
                        <tr key={d.id}>
                          <td style={{ fontWeight: 700 }}>Dose Split {d.dose_number}</td>
                          <td>{d.planned_date || "—"}</td>
                          <td>{d.due_date || "—"}</td>
                          <td style={{ fontSize: "11px" }}>{d.remarks || "—"}</td>
                          <td>
                            <strong style={{ color: d.status === "Completed" ? "#047857" : "#b45309" }}>{d.status}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* REPORT VIEW 3: Plot Material Requirements */}
              {reportType === "material_req" && (
                <div style={{ marginTop: "20px" }}>
                  <h3 style={S.printTitle}>Consolidated fertilizer & input requirement projection</h3>
                  <p style={{ fontSize: "11.5px", color: "var(--text-muted)", marginBottom: "14px" }}>
                    Combined materials quantities required to purchase/warehouse for the entire split schedule program.
                  </p>

                  <table className="premium-table printable-table" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th>Material Input Name</th>
                        <th>Category</th>
                        <th style={{ textAlign: "right" }}>Cumulative Weight Required</th>
                        <th>Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const totals = {};
                        activePlotDoses.forEach(d => {
                          const mats = doseMaterials.filter(dm => dm.dose_record_id === d.id);
                          mats.forEach(m => {
                            const uniqueKey = m.material_name || "Unspecified Input";
                            if (!totals[uniqueKey]) totals[uniqueKey] = { total: 0, category: m.category || "Organic", unit: m.unit || "Kg" };
                            totals[uniqueKey].total += Number(m.total_quantity || 0);
                          });
                        });

                        return Object.keys(totals).map(matKey => {
                          return (
                            <tr key={matKey}>
                              <td style={{ fontWeight: 700 }}>{matKey}</td>
                              <td>{totals[matKey].category}</td>
                              <td style={{ textAlign: "right", fontWeight: 800 }}>{totals[matKey].total.toFixed(1)}</td>
                              <td>{totals[matKey].unit}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              )}

              {reportType === "checklist" && (
                <div style={{ marginTop: "20px" }}>
                  <h3 style={S.printTitle}>Field Application Sign-off Checklist (Stage {activeDoseStage})</h3>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px", fontSize: "12px" }}>
                    <div>Planned Application Date: <strong>{doseMeta.planned_date || "—"}</strong></div>
                    <div>Due Date: <strong>{doseMeta.due_date || "—"}</strong></div>
                  </div>

                  <table className="premium-table printable-table" style={{ fontSize: "12px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "30px" }}>[✓]</th>
                        <th>Material Input</th>
                        <th style={{ textAlign: "right" }}>Target Qty</th>
                        <th>Packaging Details</th>
                        <th>Applied Date</th>
                        <th>Field Worker Initial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doseMaterialsRows.map((row, idx) => {
                        return (
                          <tr key={idx}>
                            <td style={{ fontSize: "16px", textAlign: "center", border: "1.5px solid var(--border)" }}>[  ]</td>
                            <td style={{ fontWeight: 700 }}>{row.material_name || "—"}</td>
                            <td style={{ textAlign: "right", fontWeight: 800 }}>{Number(row.total_quantity).toFixed(1)} {row.unit || "Kg"}</td>
                            <td>{row.unit || "Kg"}</td>
                            <td style={{ borderBottom: "1px solid #ccc" }}></td>
                            <td style={{ borderBottom: "1px solid #ccc" }}></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div style={{ marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", fontSize: "12px" }}>
                    <div style={{ borderTop: "1.5px solid #000", paddingTop: "6px", textAlign: "center" }}>
                      Field Supervisor Signature
                    </div>
                    <div style={{ borderTop: "1.5px solid #000", paddingTop: "6px", textAlign: "center" }}>
                      Farmer Signature / Consent
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ─── HISTORICAL VERSION SNAPSHOT VIEW MODAL OVERLAY ─── */}
      {showVersionModal && selectedVersion && (
        <div style={S.modalOverlay}>
          <div className="card-premium animate-fade-in" style={S.modalCard}>
            <div style={S.modalHeader}>
              <h3 style={{ fontSize: "16px", fontWeight: 800 }}>
                Version {selectedVersion.version} Historical Record
              </h3>
              <button type="button" style={S.closeBtn} onClick={() => setShowVersionModal(false)}><RiCloseLine size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", padding: "8px 0" }}>
                <div>Modified By: <strong>{selectedVersion.modified_by}</strong></div>
                <div>Modified Date: <strong>{selectedVersion.modified_date.split("T")[0]}</strong></div>
              </div>

              <div style={{ background: "var(--bg-app)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                <strong>Remarks:</strong> {selectedVersion.remarks || "—"}
              </div>

              <h4 style={{ fontSize: "12px", fontWeight: 700, color: "var(--primary-dark)", textTransform: "uppercase", marginTop: "12px" }}>Historical Prescribed Inputs</h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "250px", overflowY: "auto" }}>
                {selectedVersion.materials.map((m, idx) => {
                  return (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px" }}>
                      <div>
                        <strong>{m.material_name || "Unspecified Input"}</strong>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Dosage: {m.quantity_per_plant} {m.unit || "Kg"} / tree
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: "var(--primary-dark)" }}>
                        {Number(m.total_quantity).toFixed(1)} {m.unit || "Kg"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
              <button type="button" className="btn-primary" onClick={() => setShowVersionModal(false)}>Close Archive</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Styles
const S = {
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalCard: { width: "100%", maxWidth: "460px", padding: "26px" },
  reportModalCard: { width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: "16px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: "14px" },
  closeBtn: { background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" },
  reportTypeBar: { display: "flex", gap: "4px", borderBottom: "1.5px solid var(--border)", paddingBottom: "4px" },
  reportTypeBtn: (active) => ({
    padding: "8px 14px", fontSize: "12.5px", fontWeight: active ? 700 : 500, cursor: "pointer", border: "none", background: "transparent",
    borderBottom: active ? "3px solid var(--primary)" : "3px solid transparent",
    color: active ? "var(--primary-dark)" : "var(--text-muted)", transition: "all 0.15s"
  }),
  exportActionsBar: { display: "flex", gap: "10px", justifyContent: "flex-end", borderBottom: "1px solid var(--border)", paddingBottom: "12px" },
  printableWrapper: { background: "#ffffff", padding: "24px", color: "#1f2937" },
  reportLetterhead: { marginBottom: "20px" },
  printTitle: { fontSize: "16px", fontWeight: 800, color: "#064e3b", margin: "10px 0", borderBottom: "1px solid #e5e7eb", paddingBottom: "6px" }
};