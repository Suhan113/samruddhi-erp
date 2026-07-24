 import { useEffect, useState, useMemo } from "react";

import { db } from "../../services/database";

import {

  RiFileTextLine,

  RiSearchLine,

  RiAddCircleLine,

  RiEyeLine,

  RiDeleteBinLine,

  RiCloseLine,

  RiPlantLine,

  RiFileList2Line

} from "react-icons/ri";


const initialForm = {

  soil_test_id: "",

  recommendation_date: "",

  remarks: ""

};


export default function Recommendations() {

  const [recommendations, setRecommendations] = useState([]);

  const [soilTests, setSoilTests] = useState([]);

  const [plots, setPlots] = useState([]);

  const [customers, setCustomers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // Search

  const [searchTerm, setSearchTerm] = useState("");


  // Modals & Forms

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState(initialForm);

  const [selectedMaterialsList, setSelectedMaterialsList] = useState([]);


  // Detail drawer

  const [selectedRec, setSelectedRec] = useState(null);

  const [recMaterials, setRecMaterials] = useState([]);

  const [recDoses, setRecDoses] = useState([]);


  const fetchData = async () => {

    setLoading(true);

    try {

      const rData = await db.select("recommendations");

      const stData = await db.select("soil_tests");

      const pData = await db.select("plots");

      const cData = await db.select("customers");

      setRecommendations(rData);

      setSoilTests(stData);

      setPlots(pData);

      setCustomers(cData);

    } catch (err) {

      setError("Failed to fetch recommendation tables.");

    } finally {

      setLoading(false);

    }

  };


  useEffect(() => {

    fetchData();

  }, []);


  // Fetch sub-details for the selected recommendation drawer

  const loadRecDetails = async (rec) => {

    setSelectedRec(rec);

    try {

      // Fetch materials prescribed

      const allRecM = await db.select("recommendation_materials");

      const filteredRecM = allRecM.filter(m => m.recommendation_id === rec.id);

      setRecMaterials(filteredRecM);


      // Fetch 4 doses generated

      const allDoses = await db.select("dose_records");

      const filteredDoses = allDoses.filter(d => d.recommendation_id === rec.id);

      setRecDoses(filteredDoses);

    } catch (err) {

      console.error("Error loading sub-details", err);

    }

  };


  // Mappings

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


  const testMap = useMemo(() => {

    const map = {};

    soilTests.forEach(t => { map[t.id] = t; });

    return map;

  }, [soilTests]);


  // Filtered soil reports available for recommendation (those not yet prescribed)

  const availableSoilTests = useMemo(() => {

    const prescribedIds = recommendations.map(r => r.soil_test_id);

    return soilTests.filter(st => !prescribedIds.includes(st.id));

  }, [soilTests, recommendations]);


  // Search filtering

  const filteredRecs = useMemo(() => {

    return recommendations.filter(rec => {

      const test = testMap[rec.soil_test_id] || {};

      const plot = plotMap[test.plot_id] || {};

      const customer = customerMap[plot.customer_id] || {};


      return (

        customer.name || ""

      ).toLowerCase().includes(searchTerm.toLowerCase()) ||

        (plot.plot_number || "").toLowerCase().includes(searchTerm.toLowerCase());

    });

  }, [recommendations, searchTerm, testMap, plotMap, customerMap]);


  // Add material row in the Form builder (Updated to Free Typing Structures)

  const addMaterialRow = () => {

    setSelectedMaterialsList([

      ...selectedMaterialsList,

      { material_name: "", category: "Organic", quantity_per_plant: 0, total_quantity: 0, unit: "Kg", remarks: "" }

    ]);

  };


  // Remove material row in the Form builder

  const removeMaterialRow = (idx) => {

    const list = [...selectedMaterialsList];

    list.splice(idx, 1);

    setSelectedMaterialsList(list);

  };


  // Update material row values in Form

  const updateMaterialRow = (idx, field, value) => {

    setSelectedMaterialsList(prev =>

      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))

    );

  };


  // Form Submission & Automatic 4-Dose Generation

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!form.soil_test_id) {

      alert("Please select a specific soil report analysis.");

      return;

    }

    if (selectedMaterialsList.length === 0) {

      alert("Please prescribe at least one organic or chemical input material.");

      return;

    }


    try {

      // 1. Insert Recommendation

      const newRec = await db.insert("recommendations", {

        soil_test_id: form.soil_test_id,

        recommendation_date: form.recommendation_date,

        remarks: form.remarks

      });


      // 2. Fetch linked plot plant count to compute total material needed

      const testObj = soilTests.find(t => t.id === form.soil_test_id);

      const plotObj = plots.find(p => p.id === testObj.plot_id);


      // 3. Save prescribed materials manually entered free-text entries

      for (const mat of selectedMaterialsList) {

        await db.insert("recommendation_materials", {

          recommendation_id: newRec.id,

          material_name: mat.material_name,

          category: mat.category,

          quantity_per_plant: Number(mat.quantity_per_plant),

          total_quantity: Number(mat.total_quantity),

          unit: mat.unit,

          remarks: mat.remarks

        });

      }


      // 4. Automatically generate 4 doses matching manual structure text descriptors

      const materialDescriptions = selectedMaterialsList.map(item => {

        return `${item.material_name || "Input"} (${item.total_quantity} ${item.unit || "Kg"})`;

      }).join(", ");


      const baseDate = new Date(form.recommendation_date);

      for (let doseNo = 1; doseNo <= 4; doseNo++) {

        const planned = new Date(baseDate);

        planned.setDate(planned.getDate() + (doseNo - 1) * 30);


        await db.insert("dose_records", {

          recommendation_id: newRec.id,

          customer_id: plotObj.customer_id,

          plot_id: plotObj.id,

          dose_number: doseNo,

          planned_date: planned.toISOString().split("T")[0],

          due_date: planned.toISOString().split("T")[0],

          applied_date: null,

          materials_applied: materialDescriptions,

          quantity: selectedMaterialsList.reduce((sum, item) => sum + Number(item.total_quantity || 0), 0),

          status: "Pending",

          field_remarks: ""

        });

      }


      // 5. Update Soil Test status to 'Completed'

      await db.update("soil_tests", form.soil_test_id, { report_status: "Completed" });


      setShowModal(false);

      setForm(initialForm);

      setSelectedMaterialsList([]);

      fetchData();

      alert("Fertilizer prescription generated successfully! 4 doses created.");

    } catch (err) {

      console.error(err);

      alert("Error saving prescription recipe.");

    }

  };


  // Delete prescription

  const handleDelete = async (id) => {

  if (!window.confirm("Delete this recommendation?")) return;


  try {

    // Delete recommendation materials first

    await db.deleteWhere("recommendation_materials", {

      recommendation_id: id,

    });


    // Delete dose records

    await db.deleteWhere("dose_records", {

      recommendation_id: id,

    });


    // Finally delete recommendation

    await db.delete("recommendations", id);


    fetchData();

  } catch (err) {

    console.error(err);

    alert("Failed to delete recommendation.");

  }

};


  return (

    <div style={containerStyle}>

      {/* Header */}

      <div style={headerStyle}>

        <div>

          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>Fertilizer Recommendations</h1>

          <p style={{ color: "var(--text-muted)" }}>Formulate customized organic & chemical nutrient prescriptions based on soil analysis</p>

        </div>

        <button

          className="btn-primary"

          onClick={() => { setForm(initialForm); setSelectedMaterialsList([]); setShowModal(true); }}

          disabled={availableSoilTests.length === 0}

        >

          <RiAddCircleLine size={18} />

          <span>New Recommendation Recipe</span>

        </button>

      </div>


      {/* Warning */}

      {availableSoilTests.length === 0 && !loading && (

        <div style={warningBannerStyle}>

          All uploaded soil tests have already been processed. Upload a new soil test to create recommendations.

        </div>

      )}


      {/* Search */}

      <div className="card-premium" style={filterBarStyle}>

        <div style={searchWrapperStyle}>

          <RiSearchLine style={searchIconStyle} size={18} />

          <input

            type="text"

            placeholder="Search by Farmer or Plot number..."

            style={searchFieldStyle}

            value={searchTerm}

            onChange={(e) => setSearchTerm(e.target.value)}

          />

        </div>

      </div>


      {/* Main Grid */}

      <div style={mainContentGridStyle(!!selectedRec)}>

        <div className="card-premium" style={{ overflow: "hidden", padding: 0 }}>

          {loading ? (

            <div style={{ padding: "40px", textAlign: "center" }}>Loading prescriptions...</div>

          ) : filteredRecs.length === 0 ? (

            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>No recommendations recorded.</div>

          ) : (

            <div style={{ overflowX: "auto" }}>

              <table className="premium-table">

                <thead>

                  <tr>

                    <th>Recommendation ID</th>

                    <th>Farmer Name</th>

                    <th>Plot Number</th>

                    <th>Prescription Date</th>

                    <th>Doses Status</th>

                    <th style={{ textAlign: "right" }}>Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {filteredRecs.map((rec) => {

                    const testObj = testMap[rec.soil_test_id] || {};

                    const plotObj = plotMap[testObj.plot_id] || {};

                    const farmer = customerMap[plotObj.customer_id] || { name: "Unknown Farmer" };


                    return (

                      <tr key={rec.id} style={selectedRec?.id === rec.id ? selectedRowStyle : null}>

                        <td style={{ fontWeight: 600 }}>SO-REC-{rec.id.slice(0, 5).toUpperCase()}</td>

                        <td>{farmer.name}</td>

                        <td>{plotObj.plot_number}</td>

                        <td>{rec.recommendation_date}</td>

                        <td>

                          <span style={statusBadgeStyle("Active")}>Active (4 Doses)</span>

                        </td>

                        <td style={{ textAlign: "right" }}>

                          <div style={actionsContainerStyle}>

                            <button

                              style={actionIconBtnStyle}

                              onClick={() => loadRecDetails(rec)}

                              title="View Recipe & Doses"

                            >

                              <RiEyeLine size={16} />

                            </button>

                            <button

                              style={{ ...actionIconBtnStyle, color: "#ef4444" }}

                              onClick={() => handleDelete(rec.id)}

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


        {/* Prescription details drawer */}

        {selectedRec && (

          <div className="card-premium animate-fade-in" style={detailPanelStyle}>

            <div style={detailHeaderStyle}>

              <div>

                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>Recipe Dossier</span>

                <h3 style={{ fontSize: "20px", fontWeight: 700, marginTop: "2px" }}>

                  SO-REC-{selectedRec.id.slice(0, 5).toUpperCase()}

                </h3>

              </div>

              <button style={closeBtnStyle} onClick={() => setSelectedRec(null)}>

                <RiCloseLine size={20} />

              </button>

            </div>


            <div style={detailScrollStyle}>

              <div style={detailSectionStyle}>

                <h4 style={sectionTitleStyle}>General Details</h4>

                <div style={detailGridStyle}>

                  <div>

                    <label style={detailLabelStyle}>Prescription Date</label>

                    <div style={detailValStyle}>{selectedRec.recommendation_date}</div>

                  </div>

                  <div>

                    <label style={detailLabelStyle}>Office Notes</label>

                    <div style={detailValStyle}>{selectedRec.remarks || "No notes"}</div>

                  </div>

                </div>

              </div>


              {/* Prescribed materials list */}

              <div style={detailSectionStyle}>

                <h4 style={sectionTitleStyle}>Prescribed Inputs</h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>

                  {recMaterials.map(rm => {

                    return (

                      <div key={rm.id} style={materialItemStyle}>

                        <div>

                          <strong style={{ fontSize: "13px" }}>{rm.material_name}</strong>

                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>

                            Dosage: {rm.category} • {rm.quantity_per_plant} units / tree

                          </div>

                        </div>

                        <div style={materialQtyStyle}>

                          {rm.total_quantity} {rm.unit || "Kg"}

                        </div>

                      </div>

                    );

                  })}

                </div>

              </div>


              {/* 4 Doses Status logs */}

              <div style={detailSectionStyle}>

                <h4 style={sectionTitleStyle}>Four Dose Application Planner</h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

                  {recDoses.map(dose => (

                    <div key={dose.id} style={doseItemStyle}>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

                        <span style={{ fontWeight: 700, fontSize: "13px" }}>Dose {dose.dose_number}</span>

                        <span style={doseStatusBadgeStyle(dose.status)}>{dose.status}</span>

                      </div>

                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>

                        Due: {dose.planned_date} {dose.applied_date && `• Applied: ${dose.applied_date}`}

                      </div>

                    </div>

                  ))}

                </div>

              </div>

            </div>

          </div>

        )}

      </div>


      {/* Recipe Builder Modal */}

      {showModal && (

        <div style={modalOverlayStyle}>

          <div className="card-premium animate-fade-in" style={modalCardStyle}>

            <div style={modalHeaderStyle}>

              <h3 style={{ fontSize: "20px", fontWeight: 700 }}>Formulate Fertilizer Recipe</h3>

              <button style={closeBtnStyle} onClick={() => setShowModal(false)}>

                <RiCloseLine size={20} />

              </button>

            </div>


            <form onSubmit={handleSubmit} style={modalFormStyle}>

              <div style={modalFormGridStyle}>

                <div>

                  <label className="form-label">Select Unprocessed Soil Test *</label>

                  <select

                    className="form-input"

                    value={form.soil_test_id}

                    onChange={(e) => setForm({ ...form, soil_test_id: e.target.value })}

                    required

                  >

                    <option value="">-- Choose soil test report --</option>

                    {availableSoilTests.map(st => {

                      const plot = plotMap[st.plot_id] || {};

                      const farmer = customerMap[plot.customer_id] || {};

                      return (

                        <option key={st.id} value={st.id}>

                          {farmer.name} - {plot.plot_number} (Lab ID: {st.report_number || st.id.slice(0, 5)})

                        </option>

                      );

                    })}

                  </select>

                </div>


                <div>

                  <label className="form-label">Recommendation Date *</label>

                  <input

                    type="date"

                    className="form-input"

                    value={form.recommendation_date}

                    onChange={(e) => setForm({ ...form, recommendation_date: e.target.value })}

                    required

                  />

                </div>


                <div style={{ gridColumn: "1 / -1" }}>

                  <label className="form-label">Nutrient analysis & Recipe Notes</label>

                  <textarea

                    className="form-input"

                    style={{ minHeight: "60px" }}

                    value={form.remarks}

                    onChange={(e) => setForm({ ...form, remarks: e.target.value })}

                    placeholder="Enter diagnostic notes and organic application schedule instructions..."

                  />

                </div>


                {/* Recipe Materials builder */}

                <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--border)", paddingTop: "16px", marginTop: "10px" }}>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>

                    <h4 style={{ fontSize: "14px", fontWeight: 700 }}>Prescribe Input Materials (Free Text Inputs Canvas)</h4>

                    <button type="button" className="btn-secondary" onClick={addMaterialRow} style={{ padding: "6px 12px", fontSize: "12px" }}>

                      + Append Material Line

                    </button>

                  </div>


                  {selectedMaterialsList.length === 0 ? (

                    <div style={{ padding: "16px", textAlign: "center", background: "var(--bg-app)", borderRadius: "8px", border: "1px dashed var(--border)", fontSize: "13px", color: "var(--text-muted)" }}>

                      No materials selected. Click '+ Append Material Line' to begin prescribing free-text rows.

                    </div>

                  ) : (

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>

                      {selectedMaterialsList.map((row, idx) => (

                        <div key={idx} style={{ display: "flex", gap: "6px", alignItems: "center" }}>

                          <input

                            type="text"

                            className="form-input"

                            style={{ width: "25%" }}

                            placeholder="Material Name"

                            value={row.material_name}

                            onChange={(e) => updateMaterialRow(idx, "material_name", e.target.value)}

                            required

                          />

                          <select

                            className="form-input"

                            style={{ width: "15%" }}

                            value={row.category}

                            onChange={(e) => updateMaterialRow(idx, "category", e.target.value)}

                          >

                            <option value="Organic">Organic</option>

                            <option value="Chemical">Chemical</option>

                            <option value="Biofertilizer">Biofertilizer</option>

                            <option value="Micronutrient">Micronutrient</option>

                            <option value="Amendment">Amendment</option>

                          </select>

                          <input

                            className="form-input"

                            type="number"

                            step="0.001"

                            style={{ width: "12%" }}

                            placeholder="Qty/Tree"

                            value={row.quantity_per_plant}

                            onChange={(e) => updateMaterialRow(idx, "quantity_per_plant", e.target.value)}

                          />

                          <input

                            className="form-input"

                            type="number"

                            step="0.01"

                            style={{ width: "15%" }}

                            placeholder="Total Bulk Qty"

                            value={row.total_quantity}

                            onChange={(e) => updateMaterialRow(idx, "total_quantity", e.target.value)}

                            required

                          />

                          <input

                            type="text"

                            className="form-input"

                            style={{ width: "10%" }}

                            placeholder="Unit (Kg)"

                            value={row.unit}

                            onChange={(e) => updateMaterialRow(idx, "unit", e.target.value)}

                          />

                          <input

                            type="text"

                            className="form-input"

                            style={{ width: "18%" }}

                            placeholder="Remarks"

                            value={row.remarks}

                            onChange={(e) => updateMaterialRow(idx, "remarks", e.target.value)}

                          />

                          <button type="button" onClick={() => removeMaterialRow(idx)} style={deleteRowBtnStyle}>

                            ✕

                          </button>

                        </div>

                      ))}

                    </div>

                  )}

                </div>

              </div>


              <div style={modalActionsStyle}>

                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>

                  Cancel

                </button>

                <button type="submit" className="btn-primary">

                  Generate Recommendation

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}


// Styles

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

  background: "#fffbeb",

  border: "1px solid #fde047",

  color: "#a16207",

  padding: "12px 18px",

  borderRadius: "var(--radius-md)",

  fontSize: "14px",

  fontWeight: 500,

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


const mainContentGridStyle = (showDrawer) => ({

  display: "grid",

  gridTemplateColumns: showDrawer ? "1.6fr 1fr" : "1fr",

  gap: "24px",

  alignItems: "start",

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

};


const statusBadgeStyle = (status) => ({

  fontSize: "11px",

  fontWeight: 700,

  padding: "4px 8px",

  borderRadius: "var(--radius-full)",

  background: "var(--primary-light)",

  color: "var(--primary-hover)",

});


// Detail drawer styles

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

  fontSize: "12px",

  fontWeight: 700,

  color: "var(--primary-dark)",

  textTransform: "uppercase",

  letterSpacing: "0.05em",

  marginBottom: "10px",

};


const detailGridStyle = {

  display: "grid",

  gridTemplateColumns: "1fr",

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


const materialItemStyle = {

  background: "var(--bg-app)",

  borderRadius: "var(--radius-md)",

  padding: "12px 16px",

  border: "1px solid var(--border)",

  display: "flex",

  justifyContent: "space-between",

  alignItems: "center",

};


const materialQtyStyle = {

  fontWeight: 800,

  color: "var(--primary-hover)",

  fontSize: "14px",

};


const doseItemStyle = {

  background: "rgba(16, 185, 129, 0.02)",

  borderRadius: "var(--radius-md)",

  padding: "12px 16px",

  border: "1px solid var(--border)",

};


const doseStatusBadgeStyle = (status) => {

  const isPending = status === "Pending";

  return {

    fontSize: "10px",

    fontWeight: 700,

    padding: "2px 6px",

    borderRadius: "var(--radius-full)",

    background: isPending ? "#fffbeb" : "var(--primary-light)",

    color: isPending ? "#b45309" : "var(--primary-hover)",

  };

};


// Modal styles

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

  maxWidth: "850px",

  maxHeight: "92vh",

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


const deleteRowBtnStyle = {

  background: "rgba(239, 68, 68, 0.08)",

  color: "#ef4444",

  border: "1px solid rgba(239, 68, 68, 0.15)",

  width: "36px",

  height: "36px",

  borderRadius: "8px",

  cursor: "pointer",

  display: "flex",

  alignItems: "center",

  justifyContent: "center",

}; 
