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
  RiFileListLine,
  RiCheckboxCircleLine,
  RiArrowRightUpLine,
  RiArrowRightDownLine,
  RiAddCircleLine,
  RiUpload2Line,
  RiCalendarCheckLine,
  RiShoppingBag3Line,
  RiBillLine,
  RiUserLine,
  RiInformationLine,
  RiDatabaseLine
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
      const cData = await db.select("customers");
      const pData = await db.select("plots");
      const sData = await db.select("soil_tests");
      const rData = await db.select("recommendations");
      const dData = await db.select("dose_records");
      const mData = await db.select("materials");
      const payData = await db.select("payments");
      const purData = await db.select("purchases");
      const expData = await db.select("expenses");

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
    // Total Farmers
    const totalFarmers = customers.length;
    // Total Active Plots
    const totalPlots = plots.length;
    // Estimated plants managed (let's assume 300 plants per acre average)
    const totalPlantsManaged = Math.round(plots.reduce((sum, p) => sum + Number(p.area), 0) * 300);

    // Soil reports pending (Soil tests that don't have recommendations)
    const recSoilIds = recommendations.map(r => r.soil_test_id);
    const pendingSoilReports = soilTests.filter(t => !recSoilIds.includes(t.id)).length;

    // Recommendations pending
    const pendingRecommendations = pendingSoilReports; // If soil test exists without recommendation

    // Doses pending (Doses in 'Pending' status)
    const pendingDoses = doses.filter(d => d.status === "Pending").length;

    // Inventory alerts (stock below 50)
    const lowStockAlerts = materials.filter(m => {
      const threshold = m.unit === "Tonne" ? 10 : 50;
      return Number(m.stock) < threshold;
    }).length;

    // Monthly Revenue (Total payments in database)
    const totalRev = payments.reduce((sum, p) => sum + Number(p.amount), 0);

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
    // Soil tests split
    const totalTests = soilTests.length;
    const completedTests = recommendations.length; 
    const pendingTests = totalTests - completedTests;

    // Recommendations split
    const recsPending = pendingTests;
    const recsCompleted = recommendations.length;

    // Doses counts per stage
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
    
    let lowN = 0;
    let lowP = 0;
    let lowK = 0;
    let acidic = 0;
    let highEC = 0;
    let boronDef = 0;
    let zincDef = 0;

    soilTests.forEach(test => {
      if (Number(test.nitrogen) < 250) lowN++;
      if (Number(test.phosphorus) < 15) lowP++;
      if (Number(test.potassium) < 200) lowK++;
      if (Number(test.ph) < 6.5) acidic++;
      if (Number(test.ec) > 0.8) highEC++;
      if (Number(test.boron) < 0.5) boronDef++;
      if (Number(test.zinc) < 0.6) zincDef++;
    });

    return { lowN, lowP, lowK, acidic, highEC, boronDef, zincDef };
  }, [soilTests]);

  // 4. Financial Calculations
  const financeSummary = useMemo(() => {
    const todaySales = payments
      .filter(p => p.payment_date === new Date().toISOString().split("T")[0])
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const monthlySales = stats.totalRev;
    const monthlyExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0) + purchases.reduce((sum, p) => sum + Number(p.total_amount), 0);
    const monthlyProfit = monthlySales - monthlyExpenses;

    // Since we don't track invoices yet, outstanding payments is 0
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
    return <div style={{ padding: "40px", textAlign: "center" }}>Initializing Operations Console...</div>;
  }

  if (customers.length === 0) {
    return (
      <div style={containerStyle}>
        <div className="card-premium" style={{ padding: "48px", textAlign: "center", maxWidth: "600px", margin: "0 auto", marginTop: "40px" }}>
          <img src="/logo.png" alt="Samruddhi Organics Logo" style={{ height: "80px", marginBottom: "24px", borderRadius: "12px", background: "#000", padding: "8px" }} />
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--primary-dark)", marginBottom: "16px" }}>
            Welcome to Samruddhi Organics ERP
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "16px", marginBottom: "32px", lineHeight: 1.6 }}>
            Get started by creating your first customer.
          </p>
          <button className="btn-primary" style={{ padding: "12px 24px", fontSize: "16px", marginBottom: "32px", display: "inline-flex" }} onClick={() => navigate("/customers")}>
            <RiAddCircleLine size={20} />
            <span>Add Customer</span>
          </button>
          
          <div style={{ background: "var(--bg-app)", borderRadius: "var(--radius-md)", padding: "24px", textAlign: "left", border: "1px solid var(--border)" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-main)", marginBottom: "16px" }}>After adding customers you can:</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}><RiLandscapeLine color="var(--primary)" /> Create Plots</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}><RiUpload2Line color="var(--primary)" /> Upload Soil Reports</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}><RiFileTextLine color="var(--primary)" /> Generate Recommendations</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}><RiCalendarCheckLine color="var(--primary)" /> Plan Four Doses</li>
              <li style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}><RiCoinsLine color="var(--primary)" /> Track Payments</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 12 critical materials required
  const criticalMaterials = [
    "Poultry Manure", "Cow Dung", "Neem Cake", "Castor Cake", "Natural Potassium", 
    "Rock Phosphate", "Trichoderma", "Pseudomonas", "Borax", "DAP", "Urea", "MOP"
  ];

  return (
    <div style={containerStyle}>
      {/* 1. Welcome Header Banner */}
      <div style={welcomeBannerStyle}>
        <div style={welcomeLeftStyle}>
          <img 
            src="/logo.png" 
            alt="Samruddhi Organics Logo" 
            style={welcomeLogoStyle}
          />
          <div>
            <h1 style={welcomeTitleStyle}>Commercial Operations Dashboard</h1>
            <p style={welcomeSubtitleStyle}>
              Samruddhi Organics ERP • Real-time soil monitoring & bio-fertilizer planning
            </p>
          </div>
        </div>
        <div style={welcomeRightStyle}>
          <button className="btn-primary" onClick={loadData}>Sync Data Feed</button>
        </div>
      </div>

      {/* 2. KPI Cards Grid (8 Cards) */}
      <div style={kpiGridStyle}>
        {/* KPI 1 */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <RiGroupLine size={18} color="var(--primary)" />
            <span style={kpiTrendStyle(true)}>+12 mo</span>
          </div>
          <div style={kpiValueStyle}>{stats.totalFarmers}</div>
          <div style={kpiTitleStyle}>Total Farmers</div>
        </div>

        {/* KPI 2 */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <RiLandscapeLine size={18} color="var(--primary)" />
            <span style={kpiTrendStyle(true)}>+3 mo</span>
          </div>
          <div style={kpiValueStyle}>{stats.totalPlots}</div>
          <div style={kpiTitleStyle}>Active Plots Mapped</div>
        </div>

        {/* KPI 3 */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <RiLandscapeLine size={18} color="var(--primary-dark)" />
            <span style={kpiTrendStyle(true)}>+120 mo</span>
          </div>
          <div style={kpiValueStyle}>{stats.totalPlantsManaged.toLocaleString()}</div>
          <div style={kpiTitleStyle}>Total Plants Managed</div>
        </div>

        {/* KPI 4 */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <RiFlaskLine size={18} color="#f59e0b" />
            <span style={kpiTrendStyle(false, true)}>Action req</span>
          </div>
          <div style={{ ...kpiValueStyle, color: "#f59e0b" }}>{stats.pendingSoilReports}</div>
          <div style={kpiTitleStyle}>Soil Reports Pending</div>
        </div>

        {/* KPI 5 */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <RiFileTextLine size={18} color="#f59e0b" />
            <span style={kpiTrendStyle(false, true)}>Awaiting</span>
          </div>
          <div style={{ ...kpiValueStyle, color: "#f59e0b" }}>{stats.pendingRecommendations}</div>
          <div style={kpiTitleStyle}>Recs Pending</div>
        </div>

        {/* KPI 6 */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <RiTimeLine size={18} color="#2563eb" />
            <span style={kpiTrendStyle(false, false, true)}>Today</span>
          </div>
          <div style={{ ...kpiValueStyle, color: "#2563eb" }}>{stats.pendingDoses}</div>
          <div style={kpiTitleStyle}>Doses Pending</div>
        </div>

        {/* KPI 7 */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <RiAlertLine size={18} color="#ef4444" />
            <span style={kpiTrendStyle(false, false, false, true)}>Alert</span>
          </div>
          <div style={{ ...kpiValueStyle, color: stats.lowStockAlerts > 0 ? "#ef4444" : "var(--text-main)" }}>
            {stats.lowStockAlerts}
          </div>
          <div style={kpiTitleStyle}>Inventory Alerts</div>
        </div>

        {/* KPI 8 */}
        <div className="card-premium" style={kpiCardStyle}>
          <div style={kpiHeaderStyle}>
            <RiCoinsLine size={18} color="var(--primary)" />
            <span style={kpiTrendStyle(true)}>+15%</span>
          </div>
          <div style={kpiValueStyle}>₹{stats.totalRev.toLocaleString("en-IN")}</div>
          <div style={kpiTitleStyle}>Monthly Revenue</div>
        </div>
      </div>

      {/* 3. Daily Work Summary & Revenue Summary Split */}
      <div style={doubleColGridStyle}>
        {/* Operations summary */}
        <div className="card-premium" style={cardPaddingStyle}>
          <h3 style={sectionTitleStyle}>Daily Operational Summary</h3>
          <div style={opSummaryGridStyle}>
            <div style={opBoxStyle("#ecfdf5", "var(--primary-dark)")}>
              <div style={opTitleStyle}>Today's Soil Reports</div>
              <div style={opStatRowStyle}>
                <div>Pending: <strong style={{ color: "#f59e0b" }}>{operationsSummary.pendingTests}</strong></div>
                <div>Completed: <strong style={{ color: "var(--primary-dark)" }}>{operationsSummary.completedTests}</strong></div>
              </div>
            </div>

            <div style={opBoxStyle("#f0fdf4", "var(--primary-dark)")}>
              <div style={opTitleStyle}>Today's recommendations</div>
              <div style={opStatRowStyle}>
                <div>Pending: <strong style={{ color: "#f59e0b" }}>{operationsSummary.recsPending}</strong></div>
                <div>Completed: <strong style={{ color: "var(--primary-dark)" }}>{operationsSummary.recsCompleted}</strong></div>
              </div>
            </div>

            <div style={{ ...opBoxStyle("#eff6ff", "#1e40af"), gridColumn: "1 / -1" }}>
              <div style={opTitleStyle}>Scheduled Dose Application Pipeline (Pending Doses)</div>
              <div style={dosePipelineGridStyle}>
                <div style={pipelineItemStyle}>
                  <span>Dose 1</span>
                  <strong>{operationsSummary.dose1}</strong>
                </div>
                <div style={pipelineItemStyle}>
                  <span>Dose 2</span>
                  <strong>{operationsSummary.dose2}</strong>
                </div>
                <div style={pipelineItemStyle}>
                  <span>Dose 3</span>
                  <strong>{operationsSummary.dose3}</strong>
                </div>
                <div style={pipelineItemStyle}>
                  <span>Dose 4</span>
                  <strong>{operationsSummary.dose4}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Summary Widget */}
        <div className="card-premium" style={cardPaddingStyle}>
          <h3 style={sectionTitleStyle}>Revenue Summary</h3>
          <div style={financeGridStyle}>
            <div style={financeItemStyle}>
              <span>Today's Sales</span>
              <strong>₹{financeSummary.todaySales.toLocaleString("en-IN")}</strong>
            </div>
            <div style={financeItemStyle}>
              <span>Monthly Sales</span>
              <strong>₹{financeSummary.monthlySales.toLocaleString("en-IN")}</strong>
            </div>
            <div style={financeItemStyle}>
              <span>Monthly Expenses</span>
              <strong>₹{financeSummary.monthlyExpenses.toLocaleString("en-IN")}</strong>
            </div>
            <div style={financeItemStyle}>
              <span>Net Monthly Profit</span>
              <strong style={{ color: financeSummary.monthlyProfit >= 0 ? "var(--primary)" : "#ef4444" }}>
                ₹{financeSummary.monthlyProfit.toLocaleString("en-IN")}
              </strong>
            </div>
            <div style={{ ...financeItemStyle, gridColumn: "1 / -1", borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "4px" }}>
              <span>Outstanding Customer Receivables</span>
              <strong style={{ color: "#f59e0b", fontSize: "18px" }}>
                ₹{financeSummary.outstandingPayments.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Soil Health Overview (Special Agriculture Widget) */}
      <div className="card-premium" style={cardPaddingStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <span style={{ fontSize: "20px" }}>🌱</span>
          <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Soil Health Overview (Deficiency & Chemistry Log)</h3>
        </div>
        <div style={soilHealthGridStyle}>
          <div style={soilHealthCardStyle(soilHealthStats.lowN > 0, "N")}>
            <span style={defTitleStyle}>Low Nitrogen (&lt;250)</span>
            <strong style={defValueStyle(soilHealthStats.lowN > 0)}>{soilHealthStats.lowN} Farms</strong>
            <span style={defSubStyle}>Nitrogen Deficiency</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.lowP > 0, "P")}>
            <span style={defTitleStyle}>Low Phosphorus (&lt;15)</span>
            <strong style={defValueStyle(soilHealthStats.lowP > 0)}>{soilHealthStats.lowP} Farms</strong>
            <span style={defSubStyle}>Phosphorus Deficiency</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.lowK > 0, "K")}>
            <span style={defTitleStyle}>Low Potassium (&lt;200)</span>
            <strong style={defValueStyle(soilHealthStats.lowK > 0)}>{soilHealthStats.lowK} Farms</strong>
            <span style={defSubStyle}>Potassium Deficiency</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.acidic > 0, "pH")}>
            <span style={defTitleStyle}>Acidic Soils (pH &lt;6.5)</span>
            <strong style={defValueStyle(soilHealthStats.acidic > 0)}>{soilHealthStats.acidic} Farms</strong>
            <span style={defSubStyle}>Needs Lime Treatment</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.highEC > 0, "EC")}>
            <span style={defTitleStyle}>Saline Soils (EC &gt;0.8)</span>
            <strong style={defValueStyle(soilHealthStats.highEC > 0)}>{soilHealthStats.highEC} Farms</strong>
            <span style={defSubStyle}>High Salinity Hazard</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.boronDef > 0, "B")}>
            <span style={defTitleStyle}>Boron Deficient (&lt;0.5)</span>
            <strong style={defValueStyle(soilHealthStats.boronDef > 0)}>{soilHealthStats.boronDef} Farms</strong>
            <span style={defSubStyle}>Needs Borax Dosing</span>
          </div>

          <div style={soilHealthCardStyle(soilHealthStats.zincDef > 0, "Zn")}>
            <span style={defTitleStyle}>Zinc Deficient (&lt;0.6)</span>
            <strong style={defValueStyle(soilHealthStats.zincDef > 0)}>{soilHealthStats.zincDef} Farms</strong>
            <span style={defSubStyle}>Zinc Sulphate Deficiency</span>
          </div>
        </div>
      </div>

      {/* 5. Inventory Stock Status Widget */}
      <div className="card-premium" style={cardPaddingStyle}>
        <h3 style={sectionTitleStyle}>Critical Fertilizers & Organic Inputs Stock Status</h3>
        <div style={inventoryBarGridStyle}>
          {criticalMaterials.map(matName => {
            const matObj = materials.find(m => m.name.toLowerCase() === matName.toLowerCase()) || { stock: 0, unit: "kg" };
            const stockNum = Number(matObj.stock);
            const unit = matObj.unit || "kg";
            
            // Define thresholds for low stock
            const threshold = unit === "Tonne" ? 10 : 50;
            const isLow = stockNum < threshold;
            // Percent for progress bar (max 200 for normalization)
            const percent = Math.min((stockNum / (unit === "Tonne" ? 50 : 200)) * 100, 100);

            return (
              <div key={matName} style={inventoryBarWrapperStyle}>
                <div style={inventoryBarHeaderStyle}>
                  <span style={{ fontWeight: 600, fontSize: "13px" }}>{matName}</span>
                  <span style={{ fontSize: "12px", color: isLow ? "#ef4444" : "var(--text-muted)", fontWeight: 700 }}>
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

      {/* 6. Dashboard Charts (Monthly Revenue, Customer Growth, Soil Reports completed, generated recs) */}
      <div style={doubleColGridStyle}>
        {/* Left Chart: Revenue Trend & Customer Growth (Visual CSS representation) */}
        <div className="card-premium" style={cardPaddingStyle}>
          <h3 style={sectionTitleStyle}>Monthly Commercial Trends</h3>
          {payments.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No financial records available.
            </div>
          ) : (
            <>
              <div style={chartContainerStyle}>
                <div style={chartYAxisStyle}>
                  <span>₹{Math.max(50000, stats.totalRev).toLocaleString("en-IN")}</span>
                  <span>₹{Math.round(Math.max(50000, stats.totalRev) / 2).toLocaleString("en-IN")}</span>
                  <span>₹{Math.round(Math.max(50000, stats.totalRev) / 4).toLocaleString("en-IN")}</span>
                  <span>0</span>
                </div>
                <div style={barChartGridStyle}>
                  <div style={chartBarColStyle}>
                    <div style={chartBarFillStyle(Math.min(100, (stats.totalRev / Math.max(50000, stats.totalRev)) * 100), "var(--primary-dark)")} />
                    <span>Current</span>
                  </div>
                </div>
              </div>
              <div style={chartLegendStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", background: "var(--primary-dark)", borderRadius: "2px" }} />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Completed Payments (₹{stats.totalRev.toLocaleString("en-IN")})</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Chart: Activity Metrics (Soil Tests vs Recommendations Generated) */}
        <div className="card-premium" style={cardPaddingStyle}>
          <h3 style={sectionTitleStyle}>Agronomic Activity Log</h3>
          {soilTests.length === 0 && recommendations.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              No agronomic activities logged.
            </div>
          ) : (
            <>
              <div style={chartContainerStyle}>
                <div style={chartYAxisStyle}>
                  <span>40 Tests</span>
                  <span>20 Tests</span>
                  <span>10 Tests</span>
                  <span>0</span>
                </div>
                <div style={barChartGridStyle}>
                  <div style={chartBarColStyle}>
                    <div style={{ display: "flex", gap: "4px", height: "100%", alignItems: "flex-end" }}>
                      <div style={chartBarFillStyle(Math.min(100, (soilTests.length / 40) * 100), "#2563eb", "12px")} />
                      <div style={chartBarFillStyle(Math.min(100, (recommendations.length / 40) * 100), "#10b981", "12px")} />
                    </div>
                    <span>Current</span>
                  </div>
                </div>
              </div>
              <div style={chartLegendStyle}>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", background: "#2563eb", borderRadius: "2px" }} />
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Soil Reports ({soilTests.length})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "10px", height: "10px", background: "#10b981", borderRadius: "2px" }} />
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Prescriptions ({recommendations.length})</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 7. Relational Tables Section (Recent Customers, Recent Recs, Dose Schedules) */}
      <div style={tableGridStyle}>
        {/* Recent Customers */}
        <div className="card-premium" style={{ ...cardPaddingStyle, padding: 0, gridColumn: "1 / -1" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Recent Customers</h3>
            <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => navigate("/customers")}>
              View All
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                      No customers added yet.
                    </td>
                  </tr>
                ) : (
                  customers.slice(0, 4).map(cust => {
                    const custPlots = plots.filter(p => p.customer_id === cust.id);
                    const plotIds = custPlots.map(p => p.id);
                    const custTests = soilTests.filter(t => plotIds.includes(t.plot_id));
                    const lastTestDate = custTests.length > 0 ? custTests[custTests.length - 1].report_date : "No records";

                    return (
                      <tr key={cust.id}>
                        <td style={{ fontWeight: 600 }}>{cust.name}</td>
                        <td>{cust.village}</td>
                        <td>{cust.crop_details || "Sugarcane"}</td>
                        <td>{custPlots.length} Plots</td>
                        <td>{lastTestDate}</td>
                        <td>
                          <span style={statusBadgeStyle(cust.status)}>{cust.status}</span>
                        </td>
                        <td>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: "4px 8px", fontSize: "11px" }}
                            onClick={() => navigate("/customers")}
                          >
                            View dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Recommendations */}
        <div className="card-premium" style={{ ...cardPaddingStyle, padding: 0 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Recent Fertilizer Recommendations</h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Farmer</th>
                  <th>Plot</th>
                  <th>Date Issued</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                      No recommendations available.
                    </td>
                  </tr>
                ) : (
                  recommendations.slice(0, 3).map(rec => {
                    const test = soilTests.find(t => t.id === rec.soil_test_id);
                    const plotDetail = test ? plotCustomerMap[test.plot_id] : null;
                    return (
                      <tr key={rec.id}>
                        <td style={{ fontWeight: 600 }}>{plotDetail?.cust?.name || "Unknown"}</td>
                        <td>{plotDetail?.plot?.plot_number || "Unknown"}</td>
                        <td>{rec.recommendation_date}</td>
                        <td>
                          <span style={statusBadgeStyle("Active")}>Dispatched</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Doses */}
        <div className="card-premium" style={{ ...cardPaddingStyle, padding: 0 }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ ...sectionTitleStyle, margin: 0 }}>Upcoming Dose Schedule</h3>
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
                    <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "var(--text-muted)" }}>
                      No doses scheduled.
                    </td>
                  </tr>
                ) : (
                  doses.filter(d => d.status === "Pending").slice(0, 3).map(dose => {
                    const plotDetail = plotCustomerMap[dose.plot_id];
                    return (
                      <tr key={dose.id}>
                        <td style={{ fontWeight: 600 }}>{plotDetail?.cust?.name || "Unknown"}</td>
                        <td>Dose {dose.dose_number}</td>
                        <td>{dose.planned_date}</td>
                        <td>
                          <span style={badgeStyle("#fffbeb", "#b45309")}>Scheduled</span>
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

      {/* 8. Quick Actions & Notifications Grid */}
      <div style={doubleColGridStyle}>
        {/* Quick Actions Panel */}
        <div className="card-premium" style={cardPaddingStyle}>
          <h3 style={sectionTitleStyle}>Quick ERP Actions</h3>
          <div style={quickActionsGridStyle}>
            <button style={actionBtnStyle} onClick={() => navigate("/customers")}>
              <RiAddCircleLine size={20} color="var(--primary)" />
              <span>Add Farmer</span>
            </button>
            <button style={actionBtnStyle} onClick={() => navigate("/plots")}>
              <RiLandscapeLine size={20} color="var(--primary-dark)" />
              <span>Add Land Plot</span>
            </button>
            <button style={actionBtnStyle} onClick={() => navigate("/soil-tests")}>
              <RiUpload2Line size={20} color="#f59e0b" />
              <span>Upload Soil Report</span>
            </button>
            <button style={actionBtnStyle} onClick={() => navigate("/recommendations")}>
              <RiFileTextLine size={20} color="var(--accent)" />
              <span>Create Prescr.</span>
            </button>
            <button style={actionBtnStyle} onClick={() => navigate("/doses")}>
              <RiCalendarCheckLine size={20} color="#2563eb" />
              <span>Schedule Dose</span>
            </button>
            <button style={actionBtnStyle} onClick={() => navigate("/materials")}>
              <RiShoppingBag3Line size={20} color="#7c3aed" />
              <span>Purchase Stock</span>
            </button>
            <button style={actionBtnStyle} onClick={() => navigate("/reports")}>
              <RiBillLine size={20} color="#059669" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Notifications & Warning Alerts Panel */}
        <div className="card-premium" style={cardPaddingStyle}>
          <h3 style={sectionTitleStyle}>Operations Alert Feed</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {stats.lowStockAlerts > 0 && (
              <div style={alertItemStyle("danger")}>
                <RiAlertLine size={18} />
                <div>
                  <div style={{ fontWeight: 600 }}>Low stock warning</div>
                  <div style={{ fontSize: "11px" }}>{stats.lowStockAlerts} critical fertilizer items are below safety stock thresholds.</div>
                </div>
              </div>
            )}

            {stats.pendingSoilReports > 0 && (
              <div style={alertItemStyle("warning")}>
                <RiFlaskLine size={18} />
                <div>
                  <div style={{ fontWeight: 600 }}>Soil reports waiting prescription</div>
                  <div style={{ fontSize: "11px" }}>{stats.pendingSoilReports} soil analyses are logged without customized recommendations.</div>
                </div>
              </div>
            )}

            <div style={alertItemStyle("info")}>
              <RiTimeLine size={18} />
              <div>
                <div style={{ fontWeight: 600 }}>Today's application checklist</div>
                <div style={{ fontSize: "11px" }}>{stats.pendingDoses} planned fertilizer applications are pending worker sign-off today.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 9. Recent Activities Timeline */}
      <div className="card-premium" style={cardPaddingStyle}>
        <h3 style={sectionTitleStyle}>Recent Database Event Timeline</h3>
        <div style={timelineContainerStyle}>
          <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: "13px", marginLeft: "-16px" }}>
            No recent activities logged in the database yet.
          </div>
        </div>
      </div>

      {/* 10. Dashboard Footer info */}
      <div style={dashboardFooterStyle}>
        <div style={footerRowStyle}>
          <span>ERP Engine: <strong>v1.2.0 (Commercial Stable)</strong></span>
          <span>•</span>
          <span>Database Connection: <strong style={{ color: "var(--primary)" }}>Online (Local adapter sandbox)</strong></span>
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

// Inline styling configurations matching modern agricultural ERP requirements
const containerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "24px",
};

const welcomeBannerStyle = {
  background: "linear-gradient(135deg, #04140e 0%, #064e3b 100%)",
  padding: "24px 32px",
  borderRadius: "var(--radius-lg)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "16px",
  boxShadow: "0 10px 25px -5px rgba(6, 78, 59, 0.2)",
  border: "1px solid rgba(16, 185, 129, 0.15)",
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
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  background: "#000000",
  padding: "4px",
};

const welcomeTitleStyle = {
  fontSize: "24px",
  fontWeight: 700,
  color: "#ffffff",
  margin: 0,
};

const welcomeSubtitleStyle = {
  fontSize: "13px",
  color: "#a7f3d0",
  margin: "4px 0 0 0",
};

const welcomeRightStyle = {
  display: "flex",
  alignItems: "center",
};

// KPI
const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "16px",
};

const kpiCardStyle = {
  padding: "16px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  position: "relative",
};

const kpiHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "8px",
};

const kpiTrendStyle = (isUp, isWarn, isBlue, isRed) => {
  let bg = "rgba(16, 185, 129, 0.1)";
  let col = "var(--primary-hover)";
  if (isWarn) {
    bg = "rgba(245, 158, 11, 0.1)";
    col = "#d97706";
  } else if (isBlue) {
    bg = "rgba(37, 99, 235, 0.1)";
    col = "#2563eb";
  } else if (isRed) {
    bg = "rgba(239, 68, 68, 0.1)";
    col = "#ef4444";
  }
  return {
    fontSize: "9px",
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: "var(--radius-full)",
    background: bg,
    color: col,
  };
};

const kpiValueStyle = {
  fontSize: "22px",
  fontWeight: 800,
  color: "var(--text-main)",
};

const kpiTitleStyle = {
  fontSize: "11px",
  color: "var(--text-muted)",
  fontWeight: 600,
};

// Double col split
const doubleColGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: "24px",
};

const cardPaddingStyle = {
  padding: "24px",
};

const sectionTitleStyle = {
  fontSize: "14px",
  fontWeight: 700,
  color: "var(--primary-dark)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "16px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

// Operations summary boxes
const opSummaryGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
};

const opBoxStyle = (bg, borderCol) => ({
  background: bg,
  borderRadius: "var(--radius-md)",
  padding: "16px",
  border: `1px solid rgba(16, 185, 129, 0.1)`,
  display: "flex",
  flexDirection: "column",
  gap: "8px",
});

const opTitleStyle = {
  fontSize: "12px",
  fontWeight: 700,
  color: "var(--text-main)",
};

const opStatRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "13px",
  color: "var(--text-muted)",
};

const dosePipelineGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  gap: "8px",
  marginTop: "4px",
};

const pipelineItemStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  background: "rgba(255, 255, 255, 0.5)",
  borderRadius: "8px",
  padding: "8px 4px",
  fontSize: "11px",
};

// Soil Health deficiency card design
const soilHealthGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "16px",
};

const soilHealthCardStyle = (hasDef, label) => {
  const bg = hasDef ? "rgba(239, 68, 68, 0.03)" : "rgba(16, 185, 129, 0.03)";
  const border = hasDef ? "1px solid rgba(239, 68, 68, 0.15)" : "1px solid rgba(16, 185, 129, 0.15)";
  return {
    background: bg,
    border: border,
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    position: "relative",
  };
};

const defTitleStyle = {
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-muted)",
};

const defValueStyle = (hasDef) => ({
  fontSize: "18px",
  fontWeight: 800,
  color: hasDef ? "#ef4444" : "var(--primary-hover)",
});

const defSubStyle = {
  fontSize: "10px",
  color: "var(--text-muted)",
};

// Financial
const financeGridStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "16px",
};

const financeItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  fontSize: "12px",
};

// Inventory bars
const inventoryBarGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "16px",
};

const inventoryBarWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const inventoryBarHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const barBgStyle = {
  width: "100%",
  height: "8px",
  background: "var(--border)",
  borderRadius: "var(--radius-full)",
  overflow: "hidden",
};

const barFillStyle = (pct, isLow) => ({
  width: `${pct}%`,
  height: "100%",
  background: isLow ? "#ef4444" : "var(--primary)",
  borderRadius: "var(--radius-full)",
});

// CSS Charts
const chartContainerStyle = {
  height: "180px",
  position: "relative",
  display: "flex",
  alignItems: "flex-end",
  borderLeft: "1px solid var(--border)",
  borderBottom: "1px solid var(--border)",
  padding: "10px 10px 0 10px",
  marginTop: "16px",
};

const chartYAxisStyle = {
  position: "absolute",
  left: "-42px",
  top: 0,
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  fontSize: "9px",
  color: "var(--text-muted)",
  textAlign: "right",
  width: "36px",
};

const barChartGridStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  justifyContent: "space-around",
  alignItems: "flex-end",
};

const chartBarColStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
  width: "25%",
  fontSize: "10px",
  color: "var(--text-muted)",
};

const chartBarFillStyle = (pct, fill, wd = "24px") => ({
  width: wd,
  height: `${pct}%`,
  background: fill,
  borderRadius: "4px 4px 0 0",
});

const chartLegendStyle = {
  display: "flex",
  justifyContent: "center",
  marginTop: "12px",
};

// Relational tables layout
const tableGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.2fr 1fr",
  gap: "24px",
};

// Quick Actions
const quickActionsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
  gap: "12px",
};

const actionBtnStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  background: "var(--bg-app)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
  padding: "16px 8px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 600,
  color: "var(--text-main)",
  transition: "all var(--transition-fast)",
  textAlign: "center",
};

const alertItemStyle = (type) => {
  const styles = {
    danger: { bg: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.15)", col: "#ef4444" },
    warning: { bg: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.15)", col: "#b45309" },
    info: { bg: "rgba(37, 99, 235, 0.05)", border: "1px solid rgba(37, 99, 235, 0.15)", col: "#2563eb" }
  };
  const cur = styles[type] || styles.info;
  return {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px 16px",
    background: cur.bg,
    border: cur.border,
    color: cur.col,
    borderRadius: "var(--radius-md)",
    fontSize: "12px",
  };
};

// Timeline
const timelineContainerStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  position: "relative",
  paddingLeft: "16px",
  borderLeft: "1px dashed var(--border)",
  marginLeft: "8px",
  marginTop: "8px",
};

const timelineItemWrapStyle = {
  display: "flex",
  position: "relative",
};

const timelineBulletStyle = (bg) => ({
  position: "absolute",
  left: "-21px",
  top: "4px",
  width: "9px",
  height: "9px",
  borderRadius: "50%",
  background: bg,
  border: "2px solid #ffffff",
});

const timelineContentStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px",
  fontSize: "12px",
};

// Status and Badge helpers
const statusBadgeStyle = (status) => {
  const styles = {
    Active: { bg: "var(--primary-light)", col: "var(--primary-hover)" },
    Pending: { bg: "var(--accent-light)", col: "var(--accent)" },
    Draft: { bg: "#f1f5f9", col: "#64748b" }
  };
  const cur = styles[status] || styles.Draft;
  return {
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "var(--radius-full)",
    background: cur.bg,
    color: cur.col,
  };
};

const badgeStyle = (bg, col) => ({
  fontSize: "11px",
  fontWeight: 700,
  padding: "2px 8px",
  borderRadius: "var(--radius-full)",
  background: bg,
  color: col,
});

// Footer
const dashboardFooterStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  borderTop: "1px solid var(--border)",
  paddingTop: "16px",
  color: "var(--text-muted)",
  fontSize: "11px",
  marginTop: "12px",
};

const footerRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};