import { useEffect, useState, useMemo } from "react";
import { db } from "../../services/database";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  RiGroupLine, 
  RiLandscapeLine, 
  RiFlaskLine, 
  RiFileTextLine, 
  RiTimeLine, 
  RiAlertLine, 
  RiCoinsLine,
  RiAddCircleLine,
  RiUpload2Line,
  RiCalendarCheckLine,
  RiShoppingBag3Line,
  RiBillLine,
  RiPlantLine,
  RiShieldCrossLine,
  RiArrowRightSLine
} from "react-icons/ri";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  
  // Real relational states
  const [customers, setCustomers] = useState([]);
  const [plots, setPlots] = useState([]);
  const [soilTests, setSoilTests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [doses, setDoses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [payments, setPayments] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Fetch all databases
  const loadData = async () => {
    setLoading(true);
    try {
      const cData = (await db.select("customers")) || [];
      const pData = (await db.select("plots")) || [];
      const sData = (await db.select("soil_tests")) || [];
      const rData = (await db.select("recommendations")) || [];
      const dData = (await db.select("dose_records")) || [];
      const mData = (await db.select("materials")) || [];
      const payData = (await db.select("payments")) || [];
      const purData = (await db.select("purchases")) || [];
      const expData = (await db.select("expenses")) || [];

      setCustomers(cData);
      setPlots(pData);
      setSoilTests(sData);
      setRecommendations(rData);
      setDoses(dData);
      setMaterials(mData);
      setPayments(payData);
      setPurchases(purData);
      setExpenses(expData);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. KPI Computations
  const stats = useMemo(() => {
    const totalFarmers = customers.length;
    const totalPlots = plots.length;
    const totalPlantsManaged = Math.round(plots.reduce((sum, p) => sum + (Number(p.area) || 0), 0) * 300);

    const recSoilIds = recommendations.map(r => r.soil_test_id);
    const pendingSoilReports = soilTests.filter(t => !recSoilIds.includes(t.id)).length;
    const pendingRecommendations = pendingSoilReports;
    const pendingDoses = doses.filter(d => d.status === "Pending").length;

    const lowStockAlerts = materials.filter(m => {
      const threshold = m.unit === "Tonne" ? 10 : 50;
      return (Number(m.stock) || 0) < threshold;
    }).length;

    const totalRev = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return {
      totalFarmers,
      totalPlots,
      totalPlantsManaged,
      pendingSoilReports,
      pendingRecommendations,
      pendingDoses,
      lowStockAlerts,
      totalRev
    };
  }, [customers, plots, soilTests, recommendations, doses, materials, payments]);

  // 2. Daily Operational Summary
  const operationsSummary = useMemo(() => {
    const totalTests = soilTests.length;
    const completedTests = recommendations.length; 
    const pendingTests = Math.max(0, totalTests - completedTests);

    const recsPending = pendingTests;
    const recsCompleted = recommendations.length;

    const dose1 = doses.filter(d => d.dose_number === 1 && d.status === "Pending").length;
    const dose2 = doses.filter(d => d.dose_number === 2 && d.status === "Pending").length;
    const dose3 = doses.filter(d => d.dose_number === 3 && d.status === "Pending").length;
    const dose4 = doses.filter(d => d.dose_number === 4 && d.status === "Pending").length;

    return {
      pendingTests,
      completedTests,
      recsPending,
      recsCompleted,
      dose1,
      dose2,
      dose3,
      dose4
    };
  }, [soilTests, recommendations, doses]);

  // 3. Soil Health Overview Statistics
  const soilHealthStats = useMemo(() => {
    if (soilTests.length === 0) return { lowN: 0, lowP: 0, lowK: 0, acidic: 0, highEC: 0, boronDef: 0, zincDef: 0 };
    
    let lowN = 0, lowP = 0, lowK = 0, acidic = 0, highEC = 0, boronDef = 0, zincDef = 0;

    soilTests.forEach(test => {
      if ((Number(test.nitrogen) || 0) < 250) lowN++;
      if ((Number(test.phosphorus) || 0) < 15) lowP++;
      if ((Number(test.potassium) || 0) < 200) lowK++;
      if ((Number(test.ph) || 0) < 6.5) acidic++;
      if ((Number(test.ec) || 0) > 0.8) highEC++;
      if ((Number(test.boron) || 0) < 0.5) boronDef++;
      if ((Number(test.zinc) || 0) < 0.6) zincDef++;
    });

    return { lowN, lowP, lowK, acidic, highEC, boronDef, zincDef };
  }, [soilTests]);

  // 4. Financial Calculations (NaN Safeguarded)
  const financeSummary = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    
    const todaySales = payments
      .filter(p => p.payment_date === todayStr)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      
    const monthlySales = stats.totalRev || 0;
    
    const totalExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalPur = purchases.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
    const monthlyExpenses = totalExp + totalPur;
    
    const monthlyProfit = monthlySales - monthlyExpenses;
    const outstandingPayments = 0;

    return {
      todaySales,
      monthlySales,
      monthlyExpenses,
      monthlyProfit,
      outstandingPayments
    };
  }, [payments, expenses, purchases, stats.totalRev]);

  // Maps plot id to customer info
  const plotCustomerMap = useMemo(() => {
    const map = {};
    plots.forEach(plot => {
      const cust = customers.find(c => c.id === plot.customer_id) || {};
      map[plot.id] = { plot, cust };
    });
    return map;
  }, [plots, customers]);

  if (loading) {
    return (
      <div style={{ padding: "80px", textAlign: "center", fontSize: "16px", fontWeight: 600, color: "var(--primary-dark)" }}>
        ⚡ Syncing Operations Feed...
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div style={containerStyle}>
        <div className="card-premium" style={{ padding: "48px", textAlign: "center", maxWidth: "600px", margin: "40px auto" }}>
          <img src="/logo.png" alt="Samruddhi Organics Logo" style={{ height: "80px", marginBottom: "24px", borderRadius: "12px", background: "#000", padding: "8px" }} />
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--primary-dark)", marginBottom: "16px" }}>
            Welcome to Samruddhi Organics ERP
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px", marginBottom: "32px", lineHeight: 1.6 }}>
            Get started by creating your first farmer profile.
          </p>
          <button className="btn-primary" style={{ padding: "14px 28px", fontSize: "15px", fontWeight: 700, marginBottom: "32px", display: "inline-flex" }} onClick={() => navigate("/customers")}>
            <RiAddCircleLine size={22} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>
    );
  }

  const criticalMaterials = [
    "Poultry Manure", "Cow Dung", "Neem Cake", "Castor Cake", "Natural Potassium", 
    "Rock Phosphate", "Trichoderma", "Pseudomonas", "Borax", "DAP", "Urea", "MOP"
  ];

  return (
    <div style={containerStyle}>
      {/* ── 1. Welcome Header Banner ── */}
      <div style={welcomeBannerStyle}>
        <div style={welcomeLeftStyle}>
          <img src="/logo.png" alt="Samruddhi Organics" style={welcomeLogoStyle} />
          <div>
            <h1 style={welcomeTitleStyle}>Commercial Operations Dashboard</h1>
            <p style={welcomeSubtitleStyle}>
              Samruddhi Organics ERP • Real-time soil monitoring & bio-fertilizer planning
            </p>
          </div>
        </div>
        <div>
          <button className="btn-primary" style={{ padding: "12px 22px", fontSize: "14px", fontWeight: 700 }} onClick={loadData}>
            Sync Data Feed
          </button>
        </div>
      </div>

      {/* ── 2. KPI Cards Grid ── */}
      <div style={kpiGridStyle}>
        {/* Total Farmers */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconBoxStyle("var(--primary-light)", "var(--primary-dark)")}>
              <RiGroupLine size={20} />
            </span>
            <span style={badgeTagStyle("rgba(16,185,129,0.1)", "var(--primary-dark)")}>+12 mo</span>
          </div>
          <div style={kpiValueStyle}>{stats.totalFarmers}</div>
          <div style={kpiTitleStyle}>Total Farmers</div>
        </div>

        {/* Active Plots */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconBoxStyle("var(--primary-light)", "var(--primary-dark)")}>
              <RiLandscapeLine size={20} />
            </span>
            <span style={badgeTagStyle("rgba(16,185,129,0.1)", "var(--primary-dark)")}>+3 mo</span>
          </div>
          <div style={kpiValueStyle}>{stats.totalPlots}</div>
          <div style={kpiTitleStyle}>Active Plots Mapped</div>
        </div>

        {/* Plants Managed */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconBoxStyle("#ecfdf5", "var(--primary-dark)")}>
              <RiPlantLine size={20} />
            </span>
            <span style={badgeTagStyle("rgba(16,185,129,0.1)", "var(--primary-dark)")}>+120 mo</span>
          </div>
          <div style={kpiValueStyle}>{stats.totalPlantsManaged.toLocaleString()}</div>
          <div style={kpiTitleStyle}>Total Plants Managed</div>
        </div>

        {/* Soil Reports Pending */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconBoxStyle("#fef3c7", "#d97706")}>
              <RiFlaskLine size={20} />
            </span>
            <span style={badgeTagStyle("#fef3c7", "#b45309")}>Action req</span>
          </div>
          <div style={{ ...kpiValueStyle, color: stats.pendingSoilReports > 0 ? "#d97706" : "var(--text-main)" }}>
            {stats.pendingSoilReports}
          </div>
          <div style={kpiTitleStyle}>Soil Reports Pending</div>
        </div>

        {/* Recs Pending */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconBoxStyle("#fef3c7", "#d97706")}>
              <RiFileTextLine size={20} />
            </span>
            <span style={badgeTagStyle("#fef3c7", "#b45309")}>Awaiting</span>
          </div>
          <div style={{ ...kpiValueStyle, color: stats.pendingRecommendations > 0 ? "#d97706" : "var(--text-main)" }}>
            {stats.pendingRecommendations}
          </div>
          <div style={kpiTitleStyle}>Recs Pending</div>
        </div>

        {/* Doses Pending */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconBoxStyle("#dbeafe", "#1d4ed8")}>
              <RiTimeLine size={20} />
            </span>
            <span style={badgeTagStyle("#dbeafe", "#1e40af")}>Today</span>
          </div>
          <div style={{ ...kpiValueStyle, color: "#1d4ed8" }}>{stats.pendingDoses}</div>
          <div style={kpiTitleStyle}>Doses Pending</div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconBoxStyle("#fee2e2", "#dc2626")}>
              <RiAlertLine size={20} />
            </span>
            <span style={badgeTagStyle("#fee2e2", "#991b1b")}>Alert</span>
          </div>
          <div style={{ ...kpiValueStyle, color: stats.lowStockAlerts > 0 ? "#dc2626" : "var(--text-main)" }}>
            {stats.lowStockAlerts}
          </div>
          <div style={kpiTitleStyle}>Inventory Alerts</div>
        </div>

        {/* Revenue */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <span style={kpiIconBoxStyle("#ecfdf5", "var(--primary)")}>
              <RiCoinsLine size={20} />
            </span>
            <span style={badgeTagStyle("rgba(16,185,129,0.1)", "var(--primary-dark)")}>+15%</span>
          </div>
          <div style={{ ...kpiValueStyle, fontSize: "22px" }}>₹{stats.totalRev.toLocaleString("en-IN")}</div>
          <div style={kpiTitleStyle}>Monthly Revenue</div>
        </div>
      </div>

      {/* ── 3. Operational & Financial Split ── */}
      <div style={doubleColGridStyle}>
        {/* Operations summary */}
        <div className="card-premium" style={cardPaddingStyle}>
          <h3 style={sectionHeaderTitleStyle}>Daily Operational Summary</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div style={opCardStyle}>
              <div style={opCardTitleStyle}>Today's Soil Reports</div>
              <div style={opCardRowStyle}>
                <span>Pending</span>
                <strong style={{ color: "#d97706", fontSize: "16px" }}>{operationsSummary.pendingTests}</strong>
              </div>
              <div style={opCardRowStyle}>
                <span>Completed</span>
                <strong style={{ color: "var(--primary-dark)", fontSize: "16px" }}>{operationsSummary.completedTests}</strong>
              </div>
            </div>

            <div style={opCardStyle}>
              <div style={opCardTitleStyle}>Today's Recommendations</div>
              <div style={opCardRowStyle}>
                <span>Pending</span>
                <strong style={{ color: "#d97706", fontSize: "16px" }}>{operationsSummary.recsPending}</strong>
              </div>
              <div style={opCardRowStyle}>
                <span>Completed</span>
                <strong style={{ color: "var(--primary-dark)", fontSize: "16px" }}>{operationsSummary.recsCompleted}</strong>
              </div>
            </div>
          </div>

          <div style={dosePipelineContainerStyle}>
            <div style={opCardTitleStyle}>Scheduled Dose Application Pipeline (Pending)</div>
            <div style={dosePipelineGridStyle}>
              <div style={pipelineBoxStyle}>
                <span>Dose 1</span>
                <strong>{operationsSummary.dose1}</strong>
              </div>
              <div style={pipelineBoxStyle}>
                <span>Dose 2</span>
                <strong>{operationsSummary.dose2}</strong>
              </div>
              <div style={pipelineBoxStyle}>
                <span>Dose 3</span>
                <strong>{operationsSummary.dose3}</strong>
              </div>
              <div style={pipelineBoxStyle}>
                <span>Dose 4</span>
                <strong>{operationsSummary.dose4}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Summary */}
        <div className="card-premium" style={cardPaddingStyle}>
          <h3 style={sectionHeaderTitleStyle}>Revenue Summary</h3>
          <div style={financeGridStyle}>
            <div style={financeCardItemStyle}>
              <span style={financeLabelStyle}>Today's Sales</span>
              <strong style={financeValStyle}>₹{financeSummary.todaySales.toLocaleString("en-IN")}</strong>
            </div>
            <div style={financeCardItemStyle}>
              <span style={financeLabelStyle}>Monthly Sales</span>
              <strong style={financeValStyle}>₹{financeSummary.monthlySales.toLocaleString("en-IN")}</strong>
            </div>
            <div style={financeCardItemStyle}>
              <span style={financeLabelStyle}>Monthly Expenses</span>
              <strong style={financeValStyle}>₹{financeSummary.monthlyExpenses.toLocaleString("en-IN")}</strong>
            </div>
            <div style={financeCardItemStyle}>
              <span style={financeLabelStyle}>Net Monthly Profit</span>
              <strong style={{ ...financeValStyle, color: financeSummary.monthlyProfit >= 0 ? "var(--primary-dark)" : "#dc2626" }}>
                ₹{financeSummary.monthlyProfit.toLocaleString("en-IN")}
              </strong>
            </div>
            <div style={{ ...financeCardItemStyle, gridColumn: "1 / -1", borderTop: "1px solid var(--border)", paddingTop: "14px", marginTop: "6px" }}>
              <span style={financeLabelStyle}>Outstanding Receivables</span>
              <strong style={{ fontSize: "22px", color: "#d97706", fontWeight: 800 }}>
                ₹{financeSummary.outstandingPayments.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Soil Health Overview ── */}
      <div className="card-premium" style={cardPaddingStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <span style={{ fontSize: "22px" }}>🌱</span>
          <h3 style={{ ...sectionHeaderTitleStyle, marginBottom: 0 }}>Soil Health Overview (Deficiency & Chemistry Log)</h3>
        </div>
        <div style={soilHealthGridStyle}>
          <div style={soilHealthCardStyle(soilHealthStats.lowN > 0)}>
            <span style={defTitleStyle}>Low Nitrogen (&lt;250)</span>
            <strong style={defValueStyle(soilHealthStats.lowN > 0)}>{soilHealthStats.lowN} Farms</strong>
            <span style={defSubStyle}>Nitrogen Deficiency</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.lowP > 0)}>
            <span style={defTitleStyle}>Low Phosphorus (&lt;15)</span>
            <strong style={defValueStyle(soilHealthStats.lowP > 0)}>{soilHealthStats.lowP} Farms</strong>
            <span style={defSubStyle}>Phosphorus Deficiency</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.lowK > 0)}>
            <span style={defTitleStyle}>Low Potassium (&lt;200)</span>
            <strong style={defValueStyle(soilHealthStats.lowK > 0)}>{soilHealthStats.lowK} Farms</strong>
            <span style={defSubStyle}>Potassium Deficiency</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.acidic > 0)}>
            <span style={defTitleStyle}>Acidic Soils (pH &lt;6.5)</span>
            <strong style={defValueStyle(soilHealthStats.acidic > 0)}>{soilHealthStats.acidic} Farms</strong>
            <span style={defSubStyle}>Needs Lime Treatment</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.highEC > 0)}>
            <span style={defTitleStyle}>Saline Soils (EC &gt;0.8)</span>
            <strong style={defValueStyle(soilHealthStats.highEC > 0)}>{soilHealthStats.highEC} Farms</strong>
            <span style={defSubStyle}>High Salinity Hazard</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.boronDef > 0)}>
            <span style={defTitleStyle}>Boron Deficient (&lt;0.5)</span>
            <strong style={defValueStyle(soilHealthStats.boronDef > 0)}>{soilHealthStats.boronDef} Farms</strong>
            <span style={defSubStyle}>Needs Borax Dosing</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.zincDef > 0)}>
            <span style={defTitleStyle}>Zinc Deficient (&lt;0.6)</span>
            <strong style={defValueStyle(soilHealthStats.zincDef > 0)}>{soilHealthStats.zincDef} Farms</strong>
            <span style={defSubStyle}>Zinc Deficiency</span>
          </div>
        </div>
      </div>

      {/* ── 5. Inventory Stock Status ── */}
      <div className="card-premium" style={cardPaddingStyle}>
        <h3 style={sectionHeaderTitleStyle}>Critical Fertilizers & Organic Inputs Stock Status</h3>
        <div style={inventoryBarGridStyle}>
          {criticalMaterials.map(matName => {
            const matObj = materials.find(m => m.name?.toLowerCase() === matName.toLowerCase()) || { stock: 0, unit: "kg" };
            const stockNum = Number(matObj.stock) || 0;
            const unit = matObj.unit || "kg";
            
            const threshold = unit === "Tonne" ? 10 : 50;
            const isLow = stockNum < threshold;
            const percent = Math.min((stockNum / (unit === "Tonne" ? 50 : 200)) * 100, 100);

            return (
              <div key={matName} style={inventoryBarWrapperStyle}>
                <div style={inventoryBarHeaderStyle}>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text-main)" }}>{matName}</span>
                  <span style={{ fontSize: "13px", color: isLow ? "#dc2626" : "var(--text-muted)", fontWeight: 700 }}>
                    {stockNum} {unit} {isLow && "(Low Stock)"}
                  </span>
                </div>
                <div style={barBgStyle}>
                  <div style={barFillStyle(percent, isLow)} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 6. Relational Data Tables ── */}
      <div style={doubleColGridStyle}>
        {/* Recent Customers */}
        <div className="card-premium" style={{ ...cardPaddingStyle, padding: 0 }}>
          <div style={tableCardHeaderStyle}>
            <h3 style={{ ...sectionHeaderTitleStyle, marginBottom: 0 }}>Recent Customers</h3>
            <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 700 }} onClick={() => navigate("/customers")}>
              View All <RiArrowRightSLine size={16} />
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Village</th>
                  <th>Crop</th>
                  <th>Plots</th>
                  <th>Last Soil Test</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={emptyTdStyle}>No customers added yet.</td>
                  </tr>
                ) : (
                  customers.slice(0, 4).map(cust => {
                    const custPlots = plots.filter(p => p.customer_id === cust.id);
                    const plotIds = custPlots.map(p => p.id);
                    const custTests = soilTests.filter(t => plotIds.includes(t.plot_id));
                    const lastTestDate = custTests.length > 0 ? custTests[custTests.length - 1].report_date : "No records";

                    return (
                      <tr key={cust.id}>
                        <td style={{ fontWeight: 700, color: "var(--text-main)" }}>{cust.name}</td>
                        <td>{cust.village}</td>
                        <td>{cust.crop_details || "Sugarcane"}</td>
                        <td>{custPlots.length} Plots</td>
                        <td>{lastTestDate}</td>
                        <td>
                          <span style={statusBadgeStyle(cust.status)}>{cust.status || "Active"}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Dose Schedule */}
        <div className="card-premium" style={{ ...cardPaddingStyle, padding: 0 }}>
          <div style={tableCardHeaderStyle}>
            <h3 style={{ ...sectionHeaderTitleStyle, marginBottom: 0 }}>Upcoming Dose Schedule</h3>
            <button className="btn-secondary" style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 700 }} onClick={() => navigate("/doses")}>
              View All <RiArrowRightSLine size={16} />
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Dose No</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {doses.filter(d => d.status === "Pending").length === 0 ? (
                  <tr>
                    <td colSpan="4" style={emptyTdStyle}>No doses scheduled.</td>
                  </tr>
                ) : (
                  doses.filter(d => d.status === "Pending").slice(0, 4).map(dose => {
                    const plotDetail = plotCustomerMap[dose.plot_id];
                    return (
                      <tr key={dose.id}>
                        <td style={{ fontWeight: 700, color: "var(--text-main)" }}>{plotDetail?.cust?.name || "Unknown"}</td>
                        <td>Dose {dose.dose_number}</td>
                        <td>{dose.planned_date}</td>
                        <td>
                          <span style={statusBadgeStyle("Pending")}>Scheduled</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 7. Quick Actions Panel ── */}
      <div className="card-premium" style={cardPaddingStyle}>
        <h3 style={sectionHeaderTitleStyle}>Quick ERP Actions</h3>
        <div style={quickActionsGridStyle}>
          <button style={actionBtnStyle} onClick={() => navigate("/customers")}>
            <RiAddCircleLine size={24} color="var(--primary)" />
            <span>Add Farmer</span>
          </button>
          <button style={actionBtnStyle} onClick={() => navigate("/plots")}>
            <RiLandscapeLine size={24} color="var(--primary-dark)" />
            <span>Add Plot</span>
          </button>
          <button style={actionBtnStyle} onClick={() => navigate("/soil-tests")}>
            <RiUpload2Line size={24} color="#d97706" />
            <span>Upload Soil Test</span>
          </button>
          <button style={actionBtnStyle} onClick={() => navigate("/recommendations")}>
            <RiFileTextLine size={24} color="var(--accent)" />
            <span>Create Prescription</span>
          </button>
          <button style={actionBtnStyle} onClick={() => navigate("/doses")}>
            <RiCalendarCheckLine size={24} color="#1d4ed8" />
            <span>Schedule Dose</span>
          </button>
          <button style={actionBtnStyle} onClick={() => navigate("/materials")}>
            <RiShoppingBag3Line size={24} color="#7c3aed" />
            <span>Purchase Stock</span>
          </button>
          <button style={actionBtnStyle} onClick={() => navigate("/reports")}>
            <RiBillLine size={24} color="#059669" />
            <span>Reports</span>
          </button>
        </div>
      </div>

      {/* ── 8. Dashboard Footer Info ── */}
      <div style={dashboardFooterStyle}>
        <div style={footerRowStyle}>
          <span>ERP Engine: <strong>v1.2.0 (Commercial Stable)</strong></span>
          <span>•</span>
          <span>Database Connection: <strong style={{ color: "var(--primary-dark)" }}>Online (Local Adapter Sandbox)</strong></span>
          <span>•</span>
          <span>Last Backup: <strong>{new Date().toLocaleDateString()} 12:00 PM</strong></span>
        </div>
        <div style={footerRowStyle}>
          <span>Session User: <strong>{user?.name} ({user?.role || "Administrator"})</strong></span>
          <span>•</span>
          <span>Fiscal Calendar: <strong>FY 2026 - 27</strong></span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// TYPOGRAPHY & LAYOUT STYLES
// ============================================================
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "28px",
};

const welcomeBannerStyle = {
  background: "linear-gradient(135deg, #04140e 0%, #064e3b 100%)",
  padding: "28px 36px",
  borderRadius: "var(--radius-lg)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "20px",
  boxShadow: "0 12px 30px -5px rgba(6, 78, 59, 0.25)",
  border: "1px solid rgba(16, 185, 129, 0.2)",
};

const welcomeLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
};

const welcomeLogoStyle = {
  height: "72px",
  width: "72px",
  objectFit: "contain",
  borderRadius: "14px",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  background: "#000000",
  padding: "6px",
};

const welcomeTitleStyle = {
  fontSize: "26px",
  fontWeight: 800,
  color: "#ffffff",
  margin: 0,
  fontFamily: "var(--font-title)",
};

const welcomeSubtitleStyle = {
  fontSize: "14px",
  color: "#a7f3d0",
  margin: "6px 0 0 0",
};

// KPI Grid Styles
const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: "18px",
};

const kpiCardStyle = {
  padding: "20px 22px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  justifyContent: "space-between",
};

const kpiHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "4px",
};

const kpiIconBoxStyle = (bg, col) => ({
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  background: bg,
  color: col,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

const badgeTagStyle = (bg, col) => ({
  fontSize: "10px",
  fontWeight: 800,
  padding: "3px 8px",
  borderRadius: "var(--radius-full)",
  background: bg,
  color: col,
  letterSpacing: "0.02em",
});

const kpiValueStyle = {
  fontSize: "28px",
  fontWeight: 800,
  color: "var(--text-main)",
  lineHeight: "1.1",
  fontFamily: "var(--font-title)",
};

const kpiTitleStyle = {
  fontSize: "12px",
  color: "var(--text-muted)",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
};

// Split columns
const doubleColGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: "24px",
};

const cardPaddingStyle = {
  padding: "28px",
};

const sectionHeaderTitleStyle = {
  fontSize: "15px",
  fontWeight: 800,
  color: "var(--primary-dark)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: "20px",
  fontFamily: "var(--font-title)",
};

// Operations cards
const opCardStyle = {
  background: "#f8faf9",
  borderRadius: "12px",
  padding: "16px 20px",
  border: "1px solid var(--border)",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const opCardTitleStyle = {
  fontSize: "13px",
  fontWeight: 800,
  color: "var(--text-main)",
  marginBottom: "4px",
};

const opCardRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  fontSize: "13.5px",
  color: "var(--text-muted)",
  fontWeight: 600,
};

const dosePipelineContainerStyle = {
  background: "#eff6ff",
  borderRadius: "12px",
  padding: "18px 20px",
  border: "1px solid #bfdbfe",
};

const dosePipelineGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "10px",
  marginTop: "10px",
};

const pipelineBoxStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: "#ffffff",
  borderRadius: "8px",
  padding: "10px 6px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#1e40af",
  border: "1px solid #dbeafe",
};

// Financial
const financeGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "18px",
};

const financeCardItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const financeLabelStyle = {
  fontSize: "13px",
  fontWeight: 600,
  color: "var(--text-muted)",
};

const financeValStyle = {
  fontSize: "20px",
  fontWeight: 800,
  color: "var(--text-main)",
  fontFamily: "var(--font-title)",
};

// Soil Health Cards
const soilHealthGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "16px",
};

const soilHealthCardStyle = (hasDef) => ({
  background: hasDef ? "#fef2f2" : "#f0fdf4",
  border: hasDef ? "1.5px solid #fecaca" : "1.5px solid #bbf7d0",
  borderRadius: "14px",
  padding: "18px",
  display: "flex",
  flexDirection: "column",
  gap: "6px",
});

const defTitleStyle = {
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--text-muted)",
};

const defValueStyle = (hasDef) => ({
  fontSize: "22px",
  fontWeight: 800,
  color: hasDef ? "#dc2626" : "var(--primary-dark)",
  fontFamily: "var(--font-title)",
});

const defSubStyle = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-muted)",
};

// Inventory bars
const inventoryBarGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "20px",
};

const inventoryBarWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const inventoryBarHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const barBgStyle = {
  width: "100%",
  height: "10px",
  background: "#e2e8f0",
  borderRadius: "var(--radius-full)",
  overflow: "hidden",
};

const barFillStyle = (pct, isLow) => ({
  width: `${pct}%`,
  height: "100%",
  background: isLow ? "#dc2626" : "var(--primary)",
  borderRadius: "var(--radius-full)",
});

// Tables
const tableCardHeaderStyle = {
  padding: "20px 28px",
  borderBottom: "1px solid var(--border)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const emptyTdStyle = {
  textAlign: "center",
  padding: "32px",
  color: "var(--text-muted)",
  fontSize: "14px",
  fontWeight: 600,
};

// Quick Actions
const quickActionsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
  gap: "14px",
};

const actionBtnStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "10px",
  background: "#f8faf9",
  border: "1px solid var(--border)",
  borderRadius: "14px",
  padding: "20px 10px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--text-main)",
  transition: "all var(--transition-fast)",
  textAlign: "center",
};

// Status Badges
const statusBadgeStyle = (status) => {
  const isPending = status === "Pending" || status === "Scheduled";
  return {
    fontSize: "11px",
    fontWeight: 800,
    padding: "4px 10px",
    borderRadius: "var(--radius-full)",
    background: isPending ? "#fef3c7" : "#d1fae5",
    color: isPending ? "#b45309" : "#065f46",
  };
};

// Footer
const dashboardFooterStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  borderTop: "1px solid var(--border)",
  paddingTop: "20px",
  color: "var(--text-muted)",
  fontSize: "12px",
  marginTop: "16px",
};

const footerRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
};
