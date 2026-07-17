import { useEffect, useState, useMemo } from "react";
import { db } from "../../services/database";
import { 
  RiCalculatorLine, 
  RiTruckLine, 
  RiShoppingBagLine, 
  RiMoneyDollarCircleLine 
} from "react-icons/ri";

export default function Inventory() {
  const [recommendations, setRecommendations] = useState([]);
  const [recMaterials, setRecMaterials] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [plots, setPlots] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Selected recommendation filter
  const [selectedRecId, setSelectedRecId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const rData = await db.select("recommendations");
      const rmData = await db.select("recommendation_materials");
      const mData = await db.select("materials");
      const pData = await db.select("plots");
      const cData = await db.select("customers");
      const sData = await db.select("suppliers");

      setRecommendations(rData);
      setRecMaterials(rmData);
      setMaterials(mData);
      setPlots(pData);
      setCustomers(cData);
      setSuppliers(sData);

      if (rData.length > 0) {
        setSelectedRecId(rData[0].id);
      }
    } catch (err) {
      setError("Failed to fetch Purchase Estimator data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const materialMap = useMemo(() => {
    const map = {};
    materials.forEach(m => { map[m.id] = m; });
    return map;
  }, [materials]);

  const supplierMap = useMemo(() => {
    const map = {};
    suppliers.forEach(s => { map[s.id] = s; });
    return map;
  }, [suppliers]);

  // Selected Recommendation Object
  const selectedRec = useMemo(() => {
    return recommendations.find(r => r.id === selectedRecId) || null;
  }, [recommendations, selectedRecId]);

  // Calculation details for selected recommendation
  const estimatorItems = useMemo(() => {
    if (!selectedRec) return [];
    
    // Fetch prescribed materials for this recommendation
    const items = recMaterials.filter(rm => rm.recommendation_id === selectedRec.id);
    
    // Calculate details
    return items.map(item => {
      const mat = materialMap[item.material_id] || { name: "Unknown Input", purchase_rate: 0, unit: "Kg", supplier_id: "" };
      const supplier = supplierMap[mat.supplier_id] || { name: "Local Market" };
      
      const qtyRequired = item.total_quantity;
      const estimatedCost = qtyRequired * (mat.purchase_rate || 0);

      return {
        id: item.id,
        materialName: mat.name,
        quantity: qtyRequired,
        unit: mat.unit,
        purchaseRate: mat.purchase_rate,
        estimatedCost,
        suggestedSupplier: supplier.name
      };
    });
  }, [selectedRec, recMaterials, materialMap, supplierMap]);

  // Totals
  const grandTotalCost = useMemo(() => {
    return estimatorItems.reduce((sum, item) => sum + item.estimatedCost, 0);
  }, [estimatorItems]);

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "4px" }}>Purchase Estimator</h1>
          <p style={{ color: "var(--text-muted)" }}>Estimate bulk material purchasing quantities and costs based on active customized recommendations</p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "40px", textAlign: "center" }}>Loading Estimator Console...</div>
      ) : error ? (
        <div style={{ padding: "40px", textAlign: "center", color: "red" }}>{error}</div>
      ) : recommendations.length === 0 ? (
        <div className="card-premium" style={{ padding: "40px", textAlign: "center" }}>
          No active fertilizer prescriptions found. Please generate a recommendation first.
        </div>
      ) : (
        <div style={contentGridStyle}>
          {/* Recommendation Selector Card */}
          <div className="card-premium" style={{ padding: "24px" }}>
            <h3 style={sectionTitleStyle}>Select Prescribed Recommendation</h3>
            <div style={{ marginTop: "12px" }}>
              <select 
                className="form-input" 
                value={selectedRecId}
                onChange={(e) => setSelectedRecId(e.target.value)}
              >
                {recommendations.map(r => {
                  const test = db.selectById ? db.selectById("soil_tests", r.soil_test_id) : null;
                  const plot = test ? plotMap[test.plot_id] : null;
                  const farmer = plot ? customerMap[plot.customer_id] : null;
                  return (
                    <option key={r.id} value={r.id}>
                      SO-REC-{r.id.slice(0, 5).toUpperCase()} {farmer ? `(${farmer.name})` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedRec && (
              <div style={recSummaryBoxStyle}>
                <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--primary-dark)" }}>Recommendation Summary</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                  Date Prescribed: {selectedRec.recommendation_date}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-main)", marginTop: "4px", fontStyle: "italic" }}>
                  "{selectedRec.remarks || "No additional remarks"}"
                </div>
              </div>
            )}
          </div>

          {/* Calculator Output Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Grand Total cost card */}
            <div className="card-premium" style={totalCostCardStyle}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={iconCircleStyle}>
                  <RiMoneyDollarCircleLine size={24} color="var(--primary)" />
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Estimated Total Purchase Cost</div>
                  <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-main)", marginTop: "2px" }}>
                    ₹{grandTotalCost.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations List */}
            <div className="card-premium" style={{ overflow: "hidden", padding: 0 }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
                <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Bulk Material Purchase Breakdown</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Material Name</th>
                      <th>Quantity to Buy</th>
                      <th>Unit Rate (Purchase)</th>
                      <th>Estimated Cost</th>
                      <th>Suggested Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimatorItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600 }}>{item.materialName}</td>
                        <td style={{ fontWeight: 700 }}>{item.quantity} {item.unit}</td>
                        <td>₹{item.purchaseRate} / {item.unit}</td>
                        <td style={{ fontWeight: 700, color: "var(--primary-hover)" }}>
                          ₹{item.estimatedCost.toLocaleString("en-IN")}
                        </td>
                        <td>
                          <span style={supplierBadgeStyle}>
                            <RiTruckLine size={12} />
                            <span>{item.suggestedSupplier}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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

const sectionTitleStyle = {
  fontSize: "13px",
  fontWeight: 700,
  color: "var(--primary-dark)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const contentGridStyle = {
  display: "grid",
  gridTemplateColumns: "300px 1fr",
  gap: "24px",
  alignItems: "start",
};

const recSummaryBoxStyle = {
  marginTop: "16px",
  padding: "12px",
  borderRadius: "8px",
  background: "var(--bg-app)",
  border: "1px solid var(--border)",
};

const totalCostCardStyle = {
  padding: "24px",
  background: "linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.08) 100%)",
  border: "1px solid rgba(16, 185, 129, 0.2)",
};

const iconCircleStyle = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  background: "rgba(16, 185, 129, 0.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const supplierBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "11px",
  fontWeight: 600,
  padding: "4px 8px",
  borderRadius: "var(--radius-full)",
  background: "#f1f5f9",
  color: "#475569",
};
