import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "../../services/database";
import {
  RiSearchLine, RiFilter3Line, RiMapPinAddLine, RiEditLine,
  RiDeleteBinLine, RiEyeLine, RiCloseLine, RiLeafLine,
  RiFlaskLine, RiFileTextLine, RiTimeLine, RiUserLine,
  RiMapPinLine, RiPlantLine, RiCalendarLine, RiArrowLeftLine,
  RiCheckboxCircleLine, RiAlertLine, RiImageLine, RiMoneyDollarCircleLine,
  RiGlobalLine, RiAddLine
} from "react-icons/ri";

// ─── Constants ───────────────────────────────────────────────────────────────
const CROPS = ["Arecanut", "Coconut", "Coffee", "Paddy", "Banana", "Mango", "Cashew", "Pepper", "Cardamom", "Sugarcane", "Ginger", "Turmeric", "Grapes", "Pomegranate", "Other"];
const VARIETIES = ["Local", "Mohitnagar", "Sreevardhan", "Thirthahalli", "Mangala", "Sumangala", "Hirehalli Dwarf", "Chowghat Orange Dwarf", "West Coast Tall", "Tiptur Tall", "Coorg Green Robusta", "Selection-9", "Other"];
const IRRIGATION_TYPES = ["Drip", "Sprinkler", "Flood", "Rainfed", "Canal", "Other"];
const LAND_TYPES = ["Plain", "Hilly", "Waterlogged", "Sandy", "Terraced", "Mixed"];
const SOIL_TYPES = ["Red", "Black", "Loamy", "Sandy", "Clayey", "Laterite", "Alluvial", "Other"];
const WATER_SOURCES = ["Borewell", "Open Well", "River/Stream", "Canal", "Rainwater", "Tank", "Other"];

const ORGANIC_MATERIALS_OPTIONS = [
  { value: "Cow Dung", color: "#d1fae5", text: "#065f46" },
  { value: "Poultry Manure", color: "#fef3c7", text: "#92400e" },
  { value: "Sheep Manure", color: "#ede9fe", text: "#4c1d95" },
  { value: "Goat Manure", color: "#dbeafe", text: "#1e40af" },
  { value: "Vermicompost", color: "#e0f2fe", text: "#0369a1" },
  { value: "Compost", color: "#fce7f3", text: "#9d174d" },
  { value: "Neem Cake", color: "#dcfce7", text: "#14532d" },
  { value: "Coconut Husk Compost", color: "#ffedd5", text: "#7c2d12" },
  { value: "Bio Compost", color: "#f3e8ff", text: "#6b21a8" },
  { value: "Other", color: "#f1f5f9", text: "#475569" },
];

const INITIAL_FORM = {
  customer_id: "",
  plot_number: "",
  plot_name: "",
  village: "",
  taluk: "",
  district: "",
  crop: "Arecanut",
  crop_variety: "Local",
  plantation_year: "",
  area: "",
  number_of_plants: "",
  gps_latitude: "",
  gps_longitude: "",
  google_maps_link: "",
  irrigation_type: "Drip",
  water_source: "Borewell",
  soil_type: "Red",
  land_type: "Plain",
  waterlogged_area: false,
  hilly_land: false,
  sandy_soil: false,
  organic_farming: false,
  farmer_has_cow_dung: false,
  farmer_has_poultry_manure: false,
  farmer_has_sheep_manure: false,
  farmer_has_compost: false,
  organic_materials: [],
  special_instructions: "",
  remarks: "",
  assigned_employee_id: "",
  status: "Active"
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatCurrency = (val) => {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val || 0);
};

function OrganicTag({ value, small }) {
  const opt = ORGANIC_MATERIALS_OPTIONS.find(o => o.value === value) || { color: "#f1f5f9", text: "#475569" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      fontSize: small ? "10px" : "11px", fontWeight: 600,
      padding: small ? "2px 6px" : "3px 8px",
      borderRadius: "20px",
      background: opt.color, color: opt.text,
      whiteSpace: "nowrap",
    }}>
      🟢 {value}
    </span>
  );
}

function StatusBadge({ label, type }) {
  const colors = {
    completed: { bg: "#d1fae5", color: "#065f46" },
    pending: { bg: "#fef3c7", color: "#92400e" },
    active: { bg: "#dbeafe", color: "#1e40af" },
    none: { bg: "#f1f5f9", color: "#64748b" },
    danger: { bg: "#fee2e2", color: "#991b1b" },
  };
  const c = colors[type] || colors.none;
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, padding: "3px 8px",
      borderRadius: "20px", background: c.bg, color: c.color, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Plots() {
  const [plots, setPlots] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [soilTests, setSoilTests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationMaterials, setRecommendationMaterials] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [doses, setDoses] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Custom related tables
  const [fieldVisits, setFieldVisits] = useState([]);
  const [plotPhotos, setPlotPhotos] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI Search and Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    customer: "All", village: "All", crop: "All", variety: "All",
    soilTestStatus: "All", recStatus: "All", currentDose: "All",
    irrigation: "All", landType: "All", assignedEmployee: "All", status: "All",
  });

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  // Detail view
  const [detailPlot, setDetailPlot] = useState(null);
  const [detailTab, setDetailTab] = useState("info");

  // Fetch all databases
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        p, c, st, rec, recM, mats, d, emp, fv, photosList, quotes, invs, pays
      ] = await Promise.all([
        db.select("plots"),
        db.select("customers"),
        db.select("soil_tests"),
        db.select("recommendations"),
        db.select("recommendation_materials"),
        db.select("materials"),
        db.select("dose_records"),
        db.select("employees"),
        db.select("field_visits"),
        db.select("plot_photos"),
        db.select("quotations"),
        db.select("invoices"),
        db.select("payments"),
      ]);
      
      setPlots(p || []);
      setCustomers(c || []);
      setSoilTests(st || []);
      setRecommendations(rec || []);
      setRecommendationMaterials(recM || []);
      setMaterials(mats || []);
      setDoses(d || []);
      setEmployees(emp || []);
      setFieldVisits(fv || []);
      setPlotPhotos(photosList || []);
      setQuotations(quotes || []);
      setInvoices(invs || []);
      setPayments(pays || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load ERP databases.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Maps for Relational Joins
  const customerMap = useMemo(() => {
    const m = {}; customers.forEach(c => { m[c.id] = c; }); return m;
  }, [customers]);

  const employeeMap = useMemo(() => {
    const m = {}; employees.forEach(e => { m[e.id] = e; }); return m;
  }, [employees]);

  // Derived datasets
  const plotEnriched = useMemo(() => {
    return plots.map(plot => {
      const plotTests = soilTests.filter(t => t.plot_id === plot.id);
      const plotTestIds = plotTests.map(t => t.id);
      const plotRecs = recommendations.filter(r => plotTestIds.includes(r.soil_test_id));
      const plotRecIds = plotRecs.map(r => r.id);
      const plotDoses = doses.filter(d => plotRecIds.includes(d.recommendation_id));

      const soilTestStatus = plotTests.length === 0 ? "pending" : "completed";
      const recStatus = plotRecs.length === 0 ? "pending" : "completed";

      const nextDose = plotDoses.filter(d => d.status === "Pending").sort((a, b) => a.dose_number - b.dose_number)[0];
      const currentDoseNum = nextDose ? `Dose ${nextDose.dose_number}` : (plotDoses.length > 0 ? "Completed" : "—");

      const organicMaterials = (() => {
        try {
          if (Array.isArray(plot.organic_materials)) return plot.organic_materials;
          if (typeof plot.organic_materials === "string") return JSON.parse(plot.organic_materials);
        } catch { }
        return [];
      })();

      const plotVisits = fieldVisits.filter(v => v.plot_id === plot.id);
      const photos = plotPhotos.filter(ph => ph.plot_id === plot.id);
      const plotQuotes = quotations.filter(q => q.plot_id === plot.id);
      const plotInvoices = invoices.filter(i => i.plot_id === plot.id);

      return {
        ...plot,
        _customer: customerMap[plot.customer_id] || {},
        _employee: employeeMap[plot.assigned_employee_id] || null,
        _soilTestStatus: soilTestStatus,
        _recStatus: recStatus,
        _currentDose: currentDoseNum,
        _nextDoseDate: nextDose?.planned_date || null,
        _organicMaterials: organicMaterials,
        _plotTests: plotTests,
        _plotRecs: plotRecs,
        _plotDoses: plotDoses,
        _fieldVisits: plotVisits,
        _plotPhotos: photos,
        _quotations: plotQuotes,
        _invoices: plotInvoices,
      };
    });
  }, [plots, customers, employees, soilTests, recommendations, doses, fieldVisits, plotPhotos, quotations, invoices, customerMap, employeeMap]);

  // List of villages for filters
  const villageList = useMemo(() => {
    const list = new Set();
    plotEnriched.forEach(p => {
      if (p.village) list.add(p.village);
      else if (p._customer?.village) list.add(p._customer.village);
    });
    return Array.from(list);
  }, [plotEnriched]);

  // Calculations for summary stats directly from enriched database
  const stats = useMemo(() => {
    const totalPlots = plotEnriched.length;
    const totalArea = plotEnriched.reduce((s, p) => s + Number(p.area || 0), 0);
    const totalPlants = plotEnriched.reduce((s, p) => s + Number(p.number_of_plants || 0), 0);
    const soilPending = plotEnriched.filter(p => p._soilTestStatus === "pending").length;
    const recPending = plotEnriched.filter(p => p._recStatus === "pending").length;
    const dosePending = plotEnriched.filter(p => p.status === "Active" && p._plotDoses.some(d => d.status === "Pending")).length;
    return { totalPlots, totalArea, totalPlants, soilPending, recPending, dosePending };
  }, [plotEnriched]);

  // Filtering implementation
  const filteredPlots = useMemo(() => {
    return plotEnriched.filter(p => {
      const s = searchTerm.toLowerCase();
      const matchSearch = !s ||
        (p._customer.name || "").toLowerCase().includes(s) ||
        (p.plot_number || "").toLowerCase().includes(s) ||
        (p.village || p._customer.village || "").toLowerCase().includes(s) ||
        (p.crop || "").toLowerCase().includes(s) ||
        (p.crop_variety || "").toLowerCase().includes(s);

      const matchCustomer = filters.customer === "All" || p.customer_id === filters.customer;
      const matchVillage = filters.village === "All" || p.village === filters.village || p._customer.village === filters.village;
      const matchCrop = filters.crop === "All" || p.crop === filters.crop;
      const matchVariety = filters.variety === "All" || p.crop_variety === filters.variety;
      const matchSoil = filters.soilTestStatus === "All" || p._soilTestStatus === filters.soilTestStatus;
      const matchRec = filters.recStatus === "All" || p._recStatus === filters.recStatus;
      
      let matchDose = true;
      if (filters.currentDose !== "All") {
        if (filters.currentDose === "Completed") {
          matchDose = p._currentDose === "Completed";
        } else {
          matchDose = p._currentDose.includes(filters.currentDose);
        }
      }
      
      const matchIrrigation = filters.irrigation === "All" || p.irrigation_type === filters.irrigation;
      const matchLand = filters.landType === "All" || p.land_type === filters.landType;
      const matchEmployee = filters.assignedEmployee === "All" || p.assigned_employee_id === filters.assignedEmployee;
      const matchStatus = filters.status === "All" || p.status === filters.status;

      return matchSearch && matchCustomer && matchVillage && matchCrop && matchVariety &&
        matchSoil && matchRec && matchDose && matchIrrigation &&
        matchLand && matchEmployee && matchStatus;
    });
  }, [plotEnriched, searchTerm, filters]);

  // ── Form Handlers ──────────────────────────────────────────────────────────
  const toggleOrganic = (val) => {
    const cur = form.organic_materials || [];
    setForm(f => ({
      ...f,
      organic_materials: cur.includes(val) ? cur.filter(x => x !== val) : [...cur, val],
    }));
  };

  const handleFarmerChange = (farmerId) => {
    const cust = customerMap[farmerId];
    if (cust) {
      setForm(f => ({
        ...f,
        customer_id: farmerId,
        village: cust.village || "",
        taluk: cust.taluk || "",
        district: cust.district || ""
      }));
    } else {
      setForm(f => ({ ...f, customer_id: farmerId }));
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  const payload = { ...form };

  // If customer_id is empty or the placeholder text, force it to null
  if (!payload.customer_id || payload.customer_id === "" || payload.customer_id === "— Select Customer —") {
    payload.customer_id = null;
  }

  // Basic validation - optional: remove if you allow plots without farmers
  if (payload.customer_id === null) {
    return alert("Please select a valid farmer from the list.");
  }

  payload.area = Number(payload.area) || 0;
  payload.number_of_plants = Number(payload.number_of_plants) || 0;
  payload.plantation_year = Number(payload.plantation_year) || null;
payload.organic_materials = JSON.stringify(payload.organic_materials || []);

payload.assigned_employee_id =
  payload.assigned_employee_id || null;

payload.customer_id =
  payload.customer_id || null;

console.log(payload);

  try {
     console.log("Payload:", payload);
    let response;
    if (editingId) {
      response = await db.update("plots", editingId, payload);
    } else {
      response = await db.insert("plots", payload);
    }
    
    // Check for database errors
    if (response && response.error) {
      throw new Error(response.error.message);
    }

    setShowModal(false);
    setForm(INITIAL_FORM);
    setEditingId(null);
    fetchData();
  } catch (err) {
    console.error("Database Error:", err);
    alert("Save failed: " + err.message);
  }
};
  const handleEdit = (plot) => {
    setEditingId(plot.id);
    setForm({
      customer_id: plot.customer_id || "",
      plot_number: plot.plot_number || "",
      plot_name: plot.plot_name || "",
      village: plot.village || "",
      taluk: plot.taluk || "",
      district: plot.district || "",
      crop: plot.crop || "Arecanut",
      crop_variety: plot.crop_variety || "Local",
      plantation_year: plot.plantation_year || "",
      area: plot.area || "",
      number_of_plants: plot.number_of_plants || "",
      gps_latitude: plot.gps_latitude || "",
      gps_longitude: plot.gps_longitude || "",
      google_maps_link: plot.google_maps_link || "",
      irrigation_type: plot.irrigation_type || "Drip",
      water_source: plot.water_source || "Borewell",
      soil_type: plot.soil_type || "Red",
      land_type: plot.land_type || "Plain",
      waterlogged_area: plot.waterlogged_area || false,
      hilly_land: plot.hilly_land || false,
      sandy_soil: plot.sandy_soil || false,
      organic_farming: plot.organic_farming || false,
      farmer_has_cow_dung: plot.farmer_has_cow_dung || false,
      farmer_has_poultry_manure: plot.farmer_has_poultry_manure || false,
      farmer_has_sheep_manure: plot.farmer_has_sheep_manure || false,
      farmer_has_compost: plot.farmer_has_compost || false,
      organic_materials: (() => {
        try { return Array.isArray(plot.organic_materials) ? plot.organic_materials : JSON.parse(plot.organic_materials || "[]"); } catch { return []; }
      })(),
      special_instructions: plot.special_instructions || "",
      remarks: plot.remarks || "",
      assigned_employee_id: plot.assigned_employee_id || "",
      status: plot.status || "Active"
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this plot and all linked soil tests, recommendations, doses, and visits?")) {
      await db.delete("plots", id);
      if (detailPlot?.id === id) setDetailPlot(null);
      fetchData();
    }
  };

  // Render detail view if a plot is selected
  if (detailPlot) {
    const p = plotEnriched.find(x => x.id === detailPlot.id) || detailPlot;
    return (
      <PlotDetailView
        plot={p}
        tab={detailTab}
        setTab={setDetailTab}
        employees={employees}
        materials={materials}
        recommendationMaterials={recommendationMaterials}
        payments={payments}
        onBack={() => setDetailPlot(null)}
        onEdit={() => { handleEdit(p); setDetailPlot(null); }}
        onRefresh={fetchData}
      />
    );
  }

  return (
    <div style={S.container}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div>
          <h1 style={S.pageTitle}>Plot Management</h1>
          <p style={S.pageSubtitle}>Central unit tracking farm configurations, soil records, dose schedules, and visits</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button className="btn-secondary" onClick={() => setShowFilters(f => !f)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <RiFilter3Line size={16} />
            <span>Filters</span>
          </button>
          <button className="btn-primary" onClick={() => { setForm(INITIAL_FORM); setEditingId(null); setShowModal(true); }} disabled={customers.length === 0}>
            <RiMapPinAddLine size={16} />
            <span>Add Plot</span>
          </button>
        </div>
      </div>

      {customers.length === 0 && !loading && (
        <div style={S.warnBanner}>⚠ A customer must be registered in the system before creating plots.</div>
      )}

      {/* ── Summary Stats Cards ── */}
      <div style={S.kpiGrid}>
        {[
          { label: "Total Plots", val: stats.totalPlots, color: "var(--primary-dark)" },
          { label: "Total Area", val: `${stats.totalArea.toFixed(1)} Ac`, color: "var(--primary)" },
          { label: "Total Plants", val: stats.totalPlants.toLocaleString(), color: "#7c3aed" },
          { label: "Soil Tests Pending", val: stats.soilPending, color: "#f59e0b" },
          { label: "Recommendations Pending", val: stats.recPending, color: "#ef4444" },
          { label: "Dose Schedules Active", val: stats.dosePending, color: "#2563eb" },
        ].map(k => (
          <div key={k.label} className="card-premium" style={S.kpiCard}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k.label}</div>
            <div style={{ fontSize: "28px", fontWeight: 800, color: k.color, marginTop: "4px" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ── Search & Filter Panel ── */}
      <div className="card-premium" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={S.searchWrapper}>
            <RiSearchLine size={16} style={S.searchIcon} />
            <input
              style={S.searchInput}
              placeholder="Search by customer, plot #, village, crop, variety..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select className="form-input" style={S.filterSelect} value={filters.crop} onChange={e => setFilters(f => ({ ...f, crop: e.target.value }))}>
            <option value="All">All Crops</option>
            {CROPS.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="form-input" style={S.filterSelect} value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            <option value="All">All Status</option>
            <option>Active</option><option>Completed</option>
          </select>
        </div>

        {showFilters && (
          <div style={S.filterGrid}>
            <div>
              <div style={S.filterLabel}>Farmer/Customer</div>
              <select className="form-input" style={S.filterSelect} value={filters.customer} onChange={e => setFilters(f => ({ ...f, customer: e.target.value }))}>
                <option value="All">All Farmers</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <div style={S.filterLabel}>Village</div>
              <select className="form-input" style={S.filterSelect} value={filters.village} onChange={e => setFilters(f => ({ ...f, village: e.target.value }))}>
                <option value="All">All Villages</option>
                {villageList.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div style={S.filterLabel}>Crop Variety</div>
              <select className="form-input" style={S.filterSelect} value={filters.variety} onChange={e => setFilters(f => ({ ...f, variety: e.target.value }))}>
                <option value="All">All Varieties</option>
                {VARIETIES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <div style={S.filterLabel}>Soil Test Status</div>
              <select className="form-input" style={S.filterSelect} value={filters.soilTestStatus} onChange={e => setFilters(f => ({ ...f, soilTestStatus: e.target.value }))}>
                <option value="All">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <div style={S.filterLabel}>Recommendation Status</div>
              <select className="form-input" style={S.filterSelect} value={filters.recStatus} onChange={e => setFilters(f => ({ ...f, recStatus: e.target.value }))}>
                <option value="All">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <div style={S.filterLabel}>Current Dose Status</div>
              <select className="form-input" style={S.filterSelect} value={filters.currentDose} onChange={e => setFilters(f => ({ ...f, currentDose: e.target.value }))}>
                <option value="All">All Doses</option>
                <option value="Dose 1">Dose 1</option>
                <option value="Dose 2">Dose 2</option>
                <option value="Dose 3">Dose 3</option>
                <option value="Dose 4">Dose 4</option>
                <option value="Completed">All Doses Completed</option>
              </select>
            </div>
            <div>
              <div style={S.filterLabel}>Irrigation Type</div>
              <select className="form-input" style={S.filterSelect} value={filters.irrigation} onChange={e => setFilters(f => ({ ...f, irrigation: e.target.value }))}>
                <option value="All">All Irrigation</option>
                {IRRIGATION_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={S.filterLabel}>Land Type</div>
              <select className="form-input" style={S.filterSelect} value={filters.landType} onChange={e => setFilters(f => ({ ...f, landType: e.target.value }))}>
                <option value="All">All Land Types</option>
                {LAND_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <div style={S.filterLabel}>Assigned Staff</div>
              <select className="form-input" style={S.filterSelect} value={filters.assignedEmployee} onChange={e => setFilters(f => ({ ...f, assignedEmployee: e.target.value }))}>
                <option value="All">All Employees</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button className="btn-secondary" style={{ fontSize: "12px", padding: "8px 14px", width: "100%" }} onClick={() => setFilters({ customer: "All", village: "All", crop: "All", variety: "All", soilTestStatus: "All", recStatus: "All", currentDose: "All", irrigation: "All", landType: "All", assignedEmployee: "All", status: "All" })}>
                Reset Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Summary Table View ── */}
      <div className="card-premium" style={{ overflow: "hidden", padding: 0 }}>
        {loading ? (
          <div style={S.emptyState}>Loading plot records...</div>
        ) : error ? (
          <div style={{ ...S.emptyState, color: "#ef4444" }}>{error}</div>
        ) : filteredPlots.length === 0 ? (
          <div style={S.emptyState}>
            <RiPlantLine size={40} color="var(--primary)" style={{ marginBottom: "12px" }} />
            <div style={{ fontWeight: 600, color: "var(--text-main)" }}>No plots matching filters</div>
            <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Add a plot or adjust search parameters</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Plot ID</th>
                  <th>Customer ID</th>
                  <th>Customer Name</th>
                  <th>Village</th>
                  <th>Plot Number</th>
                  <th>Crop</th>
                  <th>Variety</th>
                  <th>Number of Plants</th>
                  <th>Area (Acres)</th>
                  <th>Irrigation</th>
                  <th>Soil Test</th>
                  <th>Recommendation</th>
                  <th>Current Dose</th>
                  <th>Next Dose Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlots.map(plot => (
                  <tr key={plot.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--text-muted)" }}>
                      {plot.id?.slice(0, 8)}
                    </td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {plot._customer.customer_number || "—"}
                    </td>
                    <td style={{ fontWeight: 600 }}>{plot._customer.name || "—"}</td>
                    <td>{plot.village || plot._customer.village || "—"}</td>
                    <td style={{ fontWeight: 600 }}>{plot.plot_number}</td>
                    <td style={{ fontWeight: 600, color: "var(--primary-dark)" }}>{plot.crop}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{plot.crop_variety || "—"}</td>
                    <td>{plot.number_of_plants ? Number(plot.number_of_plants).toLocaleString() : "—"}</td>
                    <td>{plot.area ? `${plot.area} ac` : "—"}</td>
                    <td>
                      <StatusBadge label={plot.irrigation_type} type="active" />
                    </td>
                    <td>
                      <StatusBadge label={plot._soilTestStatus === "completed" ? "Completed" : "Pending"} type={plot._soilTestStatus === "completed" ? "completed" : "pending"} />
                    </td>
                    <td>
                      <StatusBadge label={plot._recStatus === "completed" ? "Completed" : "Pending"} type={plot._recStatus === "completed" ? "completed" : "pending"} />
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", fontWeight: 600 }}>{plot._currentDose}</span>
                    </td>
                    <td style={{ fontSize: "12px" }}>{plot._nextDoseDate || "—"}</td>
                    <td>
                      <StatusBadge label={plot.status} type={plot.status === "Active" ? "active" : "completed"} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        <ActionBtn icon={<RiEyeLine size={14} />} title="View Details" onClick={() => { setDetailPlot(plot); setDetailTab("info"); }} />
                        <ActionBtn icon={<RiEditLine size={14} />} title="Edit" onClick={() => handleEdit(plot)} />
                        <ActionBtn icon={<RiDeleteBinLine size={14} />} title="Delete" color="#ef4444" onClick={() => handleDelete(plot.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Multi-Tab Plot Add/Edit Modal Form ── */}
      {showModal && (
        <PlotFormModal
          form={form}
          setForm={setForm}
          editingId={editingId}
          customers={customers}
          employees={employees}
          onSubmit={handleSubmit}
          onClose={() => { setShowModal(false); setEditingId(null); }}
          toggleOrganic={toggleOrganic}
          handleFarmerChange={handleFarmerChange}
          CROPS={CROPS}
          VARIETIES={VARIETIES}
          IRRIGATION_TYPES={IRRIGATION_TYPES}
          LAND_TYPES={LAND_TYPES}
          SOIL_TYPES={SOIL_TYPES}
          WATER_SOURCES={WATER_SOURCES}
          ORGANIC_MATERIALS_OPTIONS={ORGANIC_MATERIALS_OPTIONS}
        />
      )}
    </div>
  );
}

// ─── Actions Button Helper ──────────────────────────────────────────────────
function ActionBtn({ icon, title, onClick, color }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        background: "var(--bg-app)", border: "1px solid var(--border)",
        borderRadius: "7px", width: "30px", height: "30px",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", color: color || "var(--text-main)",
        transition: "all 0.15s",
      }}
    >
      {icon}
    </button>
  );
}

// ─── Plot Detail View Component ──────────────────────────────────────────────
function PlotDetailView({
  plot, tab, setTab, employees, materials, recommendationMaterials, payments, onBack, onEdit, onRefresh
}) {
  const [activeModal, setActiveModal] = useState(null); // 'visit' | 'photo' | 'quote' | 'invoice' | 'dose'

  // Sub-modal Forms state
  const [visitForm, setVisitForm] = useState({
    visit_date: new Date().toISOString().split("T")[0],
    employee_id: "",
    purpose: "",
    notes: "",
    gps_location: plot.gps_latitude && plot.gps_longitude ? `${plot.gps_latitude}, ${plot.gps_longitude}` : "",
    photos: ""
  });

  const [photoForm, setPhotoForm] = useState({
    category: "Before Application",
    url: "",
    description: ""
  });

  const [financeForm, setFinanceForm] = useState({
    type: "quote", // 'quote' | 'invoice'
    quote_number: `SO-QT-${Date.now().toString().slice(-6)}`,
    invoice_number: `SO-INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split("T")[0],
    amount: "",
    status: "Draft",
    remarks: ""
  });

  const [selectedDose, setSelectedDose] = useState(null);
  const [doseForm, setDoseForm] = useState({
    applied_date: new Date().toISOString().split("T")[0],
    applied_by: "",
    materials_applied: "",
    quantity: "",
    field_remarks: ""
  });

  const TABS = [
    { key: "info", label: "Basic Information", icon: <RiLeafLine size={15} /> },
    { key: "organic", label: "Organic Available", icon: <RiPlantLine size={15} /> },
    { key: "soil", label: "Soil Test History", icon: <RiFlaskLine size={15} /> },
    { key: "recs", label: "Recommendations", icon: <RiFileTextLine size={15} /> },
    { key: "doses", label: "Dose Schedule", icon: <RiTimeLine size={15} /> },
    { key: "visits", label: "Field Visits", icon: <RiMapPinLine size={15} /> },
    { key: "photos", label: "Photos", icon: <RiImageLine size={15} /> },
    { key: "finance", label: "Finance", icon: <RiMoneyDollarCircleLine size={15} /> },
  ];

  // Submission operations
  const handleAddVisit = async (e) => {
    e.preventDefault();
    try {
      const parsedPhotos = visitForm.photos ? visitForm.photos.split(",").map(p => p.trim()) : [];
      await db.insert("field_visits", {
        plot_id: plot.id,
        visit_date: visitForm.visit_date,
        employee_id: visitForm.employee_id || null,
        purpose: visitForm.purpose,
        notes: visitForm.notes,
        gps_location: visitForm.gps_location,
        photos: JSON.stringify(parsedPhotos)
      });
      setActiveModal(null);
      onRefresh();
    } catch (err) {
      alert("Failed to save field visit.");
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    try {
      const url = photoForm.url || "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&w=400&q=80";
      await db.insert("plot_photos", {
        plot_id: plot.id,
        category: photoForm.category,
        url: url,
        description: photoForm.description
      });
      setActiveModal(null);
      setPhotoForm({ category: "Before Application", url: "", description: "" });
      onRefresh();
    } catch (err) {
      alert("Failed to save photo.");
    }
  };

  const handleAddFinance = async (e) => {
    e.preventDefault();
    try {
      if (financeForm.type === "quote") {
        await db.insert("quotations", {
          plot_id: plot.id,
          customer_id: plot.customer_id,
          quote_number: financeForm.quote_number,
          date: financeForm.date,
          amount: Number(financeForm.amount) || 0,
          status: financeForm.status,
          remarks: financeForm.remarks
        });
      } else {
        await db.insert("invoices", {
          plot_id: plot.id,
          customer_id: plot.customer_id,
          invoice_number: financeForm.invoice_number,
          date: financeForm.date,
          amount: Number(financeForm.amount) || 0,
          status: financeForm.status,
          remarks: financeForm.remarks
        });
      }
      setActiveModal(null);
      setFinanceForm({
        type: "quote",
        quote_number: `SO-QT-${Date.now().toString().slice(-6)}`,
        invoice_number: `SO-INV-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split("T")[0],
        amount: "",
        status: "Draft",
        remarks: ""
      });
      onRefresh();
    } catch (err) {
      alert("Failed to record finance transaction.");
    }
  };

  const handleCompleteDose = async (e) => {
    e.preventDefault();
    try {
      await db.update("dose_records", selectedDose.id, {
        applied_date: doseForm.applied_date,
        status: "Completed",
        materials_applied: `${doseForm.materials_applied} (Applied By: ${doseForm.applied_by})`,
        quantity: Number(doseForm.quantity) || null,
        field_remarks: doseForm.field_remarks
      });
      setSelectedDose(null);
      setActiveModal(null);
      onRefresh();
    } catch (err) {
      alert("Failed to record dose completion.");
    }
  };

  return (
    <div style={S.container}>
      {/* ── Back Header ── */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={onBack} style={S.backBtn}><RiArrowLeftLine size={18} /></button>
          <div>
            <h1 style={S.pageTitle}>{plot.plot_name || `Plot ${plot.plot_number}`}</h1>
            <p style={S.pageSubtitle}>
              Farmer: <span style={{ fontWeight: 700 }}>{plot._customer?.name}</span> · {plot.crop} {plot.crop_variety ? `(${plot.crop_variety})` : ""} · {plot.area} Acres
            </p>
          </div>
        </div>
        <button className="btn-secondary" onClick={onEdit}><RiEditLine size={15} /> Edit Plot Details</button>
      </div>

      {/* ── Sub Tabs Bar ── */}
      <div style={S.tabBar}>
        {TABS.map(t => (
          <button key={t.key} style={S.tabBtn(tab === t.key)} onClick={() => setTab(t.key)}>
            {t.icon} <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Content Views ── */}
      <div style={{ marginTop: "10px" }}>
        {tab === "info" && <PlotInfoTab plot={plot} />}
        {tab === "organic" && <PlotOrganicTab plot={plot} />}
        {tab === "soil" && <PlotSoilTab tests={plot._plotTests || []} onRefresh={onRefresh} />}
        {tab === "recs" && (
          <PlotRecsTab
            recs={plot._plotRecs || []}
            materials={materials}
            recommendationMaterials={recommendationMaterials}
          />
        )}
        {tab === "doses" && (
          <PlotDosesTab
            doses={plot._plotDoses || []}
            employees={employees}
            onCompleteDose={(dose) => {
              setSelectedDose(dose);
              setDoseForm({
                applied_date: new Date().toISOString().split("T")[0],
                applied_by: plot.assigned_employee_id ? (employees.find(e => e.id === plot.assigned_employee_id)?.name || "") : "",
                materials_applied: dose.materials_applied || "",
                quantity: dose.quantity || "",
                field_remarks: dose.field_remarks || ""
              });
              setActiveModal("dose");
            }}
          />
        )}
        {tab === "visits" && (
          <PlotVisitsTab
            visits={plot._fieldVisits || []}
            employees={employees}
            onAddVisit={() => {
              setVisitForm({
                visit_date: new Date().toISOString().split("T")[0],
                employee_id: plot.assigned_employee_id || "",
                purpose: "",
                notes: "",
                gps_location: plot.gps_latitude && plot.gps_longitude ? `${plot.gps_latitude}, ${plot.gps_longitude}` : "",
                photos: ""
              });
              setActiveModal("visit");
            }}
            onDelete={async (id) => {
              if (window.confirm("Delete this field visit log?")) {
                await db.delete("field_visits", id);
                onRefresh();
              }
            }}
          />
        )}
        {tab === "photos" && (
          <PlotPhotosTab
            photos={plot._plotPhotos || []}
            onAddPhoto={() => {
              setPhotoForm({ category: "Before Application", url: "", description: "" });
              setActiveModal("photo");
            }}
            onDelete={async (id) => {
              if (window.confirm("Remove this photo attachment?")) {
                await db.delete("plot_photos", id);
                onRefresh();
              }
            }}
          />
        )}
        {tab === "finance" && (
          <PlotFinanceTab
            plot={plot}
            payments={payments}
            onAddFinance={(type) => {
              setFinanceForm({
                type,
                quote_number: `SO-QT-${Date.now().toString().slice(-6)}`,
                invoice_number: `SO-INV-${Date.now().toString().slice(-6)}`,
                date: new Date().toISOString().split("T")[0],
                amount: "",
                status: "Draft",
                remarks: ""
              });
              setActiveModal("finance");
            }}
            onDeleteQuote={async (id) => {
              if (window.confirm("Delete this quotation record?")) {
                await db.delete("quotations", id);
                onRefresh();
              }
            }}
            onDeleteInvoice={async (id) => {
              if (window.confirm("Delete this invoice record?")) {
                await db.delete("invoices", id);
                onRefresh();
              }
            }}
          />
        )}
      </div>

      {/* ── Sub Modals overlays ── */}
      {activeModal === "visit" && (
        <div style={S.modalOverlay}>
          <div className="card-premium animate-fade-in" style={S.modalCard}>
            <div style={S.modalHeader}>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Log Field Visit</h3>
              <button style={S.closeBtn} onClick={() => setActiveModal(null)}><RiCloseLine size={20} /></button>
            </div>
            <form onSubmit={handleAddVisit}>
              <div style={S.formGrid}>
                <div>
                  <label className="form-label">Visit Date *</label>
                  <input type="date" className="form-input" value={visitForm.visit_date} onChange={e => setVisitForm({ ...visitForm, visit_date: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Visiting Employee</label>
                  <select className="form-input" value={visitForm.employee_id} onChange={e => setVisitForm({ ...visitForm, employee_id: e.target.value })}>
                    <option value="">-- Choose employee --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Visit Purpose *</label>
                  <input className="form-input" value={visitForm.purpose} onChange={e => setVisitForm({ ...visitForm, purpose: e.target.value })} placeholder="e.g., Routine Crop Check, Disease Inspection" required />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">GPS Location (Latitude, Longitude)</label>
                  <input className="form-input" value={visitForm.gps_location} onChange={e => setVisitForm({ ...visitForm, gps_location: e.target.value })} placeholder="e.g., 17.2856, 74.1834" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Photos (Comma separated image URLs)</label>
                  <input className="form-input" value={visitForm.photos} onChange={e => setVisitForm({ ...visitForm, photos: e.target.value })} placeholder="https://url1.com, https://url2.com" />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="form-label">Field Notes / Observations</label>
                  <textarea className="form-input" style={{ minHeight: "80px" }} value={visitForm.notes} onChange={e => setVisitForm({ ...visitForm, notes: e.target.value })} placeholder="Describe crop vigor, moisture levels, pest presence, recommendations..." />
                </div>
              </div>
              <div style={S.modalActions}>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Visit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "photo" && (
        <div style={S.modalOverlay}>
          <div className="card-premium animate-fade-in" style={{ ...S.modalCard, maxWidth: "450px" }}>
            <div style={S.modalHeader}>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Add Plot Photo</h3>
              <button style={S.closeBtn} onClick={() => setActiveModal(null)}><RiCloseLine size={20} /></button>
            </div>
            <form onSubmit={handleAddPhoto}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="form-label">Category *</label>
                  <select className="form-input" value={photoForm.category} onChange={e => setPhotoForm({ ...photoForm, category: e.target.value })} required>
                    <option>Before Application</option>
                    <option>After Application</option>
                    <option>Disease</option>
                    <option>Soil Sample</option>
                    <option>Crop Condition</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Image URL</label>
                  <input className="form-input" value={photoForm.url} onChange={e => setPhotoForm({ ...photoForm, url: e.target.value })} placeholder="Paste image link, or leave blank for placeholder" />
                </div>
                <div>
                  <label className="form-label">Description / Context</label>
                  <input className="form-input" value={photoForm.description} onChange={e => setPhotoForm({ ...photoForm, description: e.target.value })} placeholder="Describe what is visible in the photo..." />
                </div>
              </div>
              <div style={S.modalActions}>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Photo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "finance" && (
        <div style={S.modalOverlay}>
          <div className="card-premium animate-fade-in" style={{ ...S.modalCard, maxWidth: "500px" }}>
            <div style={S.modalHeader}>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>
                {financeForm.type === "quote" ? "Create Quotation" : "Log Invoice"}
              </h3>
              <button style={S.closeBtn} onClick={() => setActiveModal(null)}><RiCloseLine size={20} /></button>
            </div>
            <form onSubmit={handleAddFinance}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {financeForm.type === "quote" ? (
                  <div>
                    <label className="form-label">Quotation Number *</label>
                    <input className="form-input" value={financeForm.quote_number} onChange={e => setFinanceForm({ ...financeForm, quote_number: e.target.value })} required />
                  </div>
                ) : (
                  <div>
                    <label className="form-label">Invoice Number *</label>
                    <input className="form-input" value={financeForm.invoice_number} onChange={e => setFinanceForm({ ...financeForm, invoice_number: e.target.value })} required />
                  </div>
                )}
                <div>
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={financeForm.date} onChange={e => setFinanceForm({ ...financeForm, date: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-input" value={financeForm.amount} onChange={e => setFinanceForm({ ...financeForm, amount: e.target.value })} placeholder="Enter value in Rupees" required />
                </div>
                <div>
                  <label className="form-label">Status *</label>
                  {financeForm.type === "quote" ? (
                    <select className="form-input" value={financeForm.status} onChange={e => setFinanceForm({ ...financeForm, status: e.target.value })}>
                      <option>Draft</option>
                      <option>Sent</option>
                      <option>Approved</option>
                      <option>Rejected</option>
                    </select>
                  ) : (
                    <select className="form-input" value={financeForm.status} onChange={e => setFinanceForm({ ...financeForm, status: e.target.value })}>
                      <option>Draft</option>
                      <option>Sent</option>
                      <option>Paid</option>
                      <option>Partially Paid</option>
                      <option>Overdue</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="form-label">Remarks</label>
                  <input className="form-input" value={financeForm.remarks} onChange={e => setFinanceForm({ ...financeForm, remarks: e.target.value })} placeholder="Internal comments..." />
                </div>
              </div>
              <div style={S.modalActions}>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Record Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "dose" && selectedDose && (
        <div style={S.modalOverlay}>
          <div className="card-premium animate-fade-in" style={{ ...S.modalCard, maxWidth: "500px" }}>
            <div style={S.modalHeader}>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Apply Dose {selectedDose.dose_number}</h3>
              <button style={S.closeBtn} onClick={() => { setSelectedDose(null); setActiveModal(null); }}><RiCloseLine size={20} /></button>
            </div>
            <form onSubmit={handleCompleteDose}>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="form-label">Applied Date *</label>
                  <input type="date" className="form-input" value={doseForm.applied_date} onChange={e => setDoseForm({ ...doseForm, applied_date: e.target.value })} required />
                </div>
                <div>
                  <label className="form-label">Applied By / Verified By *</label>
                  <select className="form-input" value={doseForm.applied_by} onChange={e => setDoseForm({ ...doseForm, applied_by: e.target.value })} required>
                    <option value="">-- Choose employee --</option>
                    {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Materials Applied *</label>
                  <input className="form-input" value={doseForm.materials_applied} onChange={e => setDoseForm({ ...doseForm, materials_applied: e.target.value })} placeholder="e.g. Cow dung 1 ton, Neem cake 2 bags" required />
                </div>
                <div>
                  <label className="form-label">Quantity Applied (in Kg/Ltrs)</label>
                  <input type="number" className="form-input" value={doseForm.quantity} onChange={e => setDoseForm({ ...doseForm, quantity: e.target.value })} placeholder="Total quantity weight value" />
                </div>
                <div>
                  <label className="form-label">Field Notes / Remarks</label>
                  <input className="form-input" value={doseForm.field_remarks} onChange={e => setDoseForm({ ...doseForm, field_remarks: e.target.value })} placeholder="e.g. Good soil moisture, applied near base" />
                </div>
              </div>
              <div style={S.modalActions}>
                <button type="button" className="btn-secondary" onClick={() => { setSelectedDose(null); setActiveModal(null); }}>Cancel</button>
                <button type="submit" className="btn-primary">Confirm Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Detail Component 1: Basic Information ──────────────────────────────
function PlotInfoTab({ plot }) {
  const Field = ({ label, value, full }) => (
    <div style={full ? { gridColumn: "1 / -1" } : {}}>
      <div style={S.fieldLabel}>{label}</div>
      <div style={S.fieldValue}>{value || <span style={{ color: "var(--text-muted)" }}>—</span>}</div>
    </div>
  );

  const BoolBadge = ({ val, label }) => (
    <div style={{
      display: "flex", alignItems: "center", gap: "6px",
      padding: "8px 12px", background: val ? "#e6fcf5" : "#f8fafc",
      borderRadius: "8px", border: `1px solid ${val ? "#c3fae8" : "#cbd5e1"}`
    }}>
      {val ? <RiCheckboxCircleLine color="#087f5b" size={16} /> : <RiAlertLine color="#94a3b8" size={16} />}
      <span style={{ fontSize: "12px", fontWeight: 600, color: val ? "#096345" : "#475569" }}>{label}</span>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Specifications */}
      <div className="card-premium" style={{ padding: "24px" }}>
        <h3 style={S.sectionTitle}>Plot Information & Specifications</h3>
        <div style={S.infoGrid}>
          <Field label="Plot ID" value={plot.id} />
          <Field label="Plot Name" value={plot.plot_name} />
          <Field label="Plot Number" value={plot.plot_number} />
          <Field label="Farmer / Customer" value={plot._customer?.name} />
          <Field label="Crop" value={plot.crop} />
          <Field label="Variety" value={plot.crop_variety} />
          <Field label="Plantation Year" value={plot.plantation_year} />
          <Field label="Area (Acres)" value={plot.area ? `${plot.area} Acres` : null} />
          <Field label="Number of Plants" value={plot.number_of_plants ? Number(plot.number_of_plants).toLocaleString() : null} />
          <Field label="Village" value={plot.village || plot._customer?.village} />
          <Field label="Taluk" value={plot.taluk || plot._customer?.taluk} />
          <Field label="District" value={plot.district || plot._customer?.district} />
          <Field label="Soil Type" value={plot.soil_type} />
          <Field label="Land Type" value={plot.land_type} />
          <Field label="Irrigation Type" value={plot.irrigation_type} />
          <Field label="Water Source" value={plot.water_source} />
          <Field label="GPS Latitude" value={plot.gps_latitude} />
          <Field label="GPS Longitude" value={plot.gps_longitude} />
          
          <div>
            <div style={S.fieldLabel}>Google Maps Link</div>
            {plot.google_maps_link ? (
              <a href={plot.google_maps_link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "var(--primary-hover)", fontWeight: 700 }}>
                <RiGlobalLine size={14} /> Open GPS Coordinates
              </a>
            ) : (
              <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>—</span>
            )}
          </div>
          
          <Field label="Assigned Employee" value={plot._employee?.name} />
          {plot.special_instructions && <Field label="Special Instructions" value={plot.special_instructions} full />}
          {plot.remarks && <Field label="Remarks / General Comments" value={plot.remarks} full />}
        </div>
      </div>

      {/* Conditions Checklist */}
      <div className="card-premium" style={{ padding: "24px" }}>
        <h3 style={S.sectionTitle}>Land & Management Characteristics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px" }}>
          <BoolBadge val={plot.waterlogged_area} label="Waterlogged Area" />
          <BoolBadge val={plot.hilly_land} label="Hilly Land" />
          <BoolBadge val={plot.sandy_soil} label="Sandy Soil" />
          <BoolBadge val={plot.organic_farming} label="Organic Farming Only" />
          <BoolBadge val={plot.farmer_has_cow_dung} label="Has Own Cow Dung" />
          <BoolBadge val={plot.farmer_has_poultry_manure} label="Has Poultry Manure" />
          <BoolBadge val={plot.farmer_has_sheep_manure} label="Has Sheep Manure" />
          <BoolBadge val={plot.farmer_has_compost} label="Has Compost Pile" />
        </div>
      </div>
    </div>
  );
}

// ─── Tab Detail Component 2: Organic Materials Available ────────────────────
function PlotOrganicTab({ plot }) {
  const materialsList = plot._organicMaterials || [];

  return (
    <div className="card-premium" style={{ padding: "24px" }}>
      <h3 style={S.sectionTitle}>Organic Materials Available On-Site</h3>
      <p style={{ color: "var(--text-muted)", fontSize: "13px", marginBottom: "16px" }}>
        The farmer has verified availability of the following input materials directly on the plot:
      </p>
      {materialsList.length === 0 ? (
        <div style={{ padding: "30px 10px", textAlign: "center", color: "var(--text-muted)" }}>
          No organic materials recorded for this plot. Edit the plot details to toggle available materials.
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {materialsList.map(m => (
            <div key={m} style={{ transform: "scale(1.15)", margin: "4px" }}>
              <OrganicTag value={m} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab Detail Component 3: Soil Test History ──────────────────────────────
function PlotSoilTab({ tests }) {
  const [selectedReport, setSelectedReport] = useState(null);

  if (tests.length === 0) {
    return (
      <div className="card-premium" style={S.emptyState}>
        <RiFlaskLine size={40} color="var(--primary)" style={{ marginBottom: "12px" }} />
        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>No Soil Tests Recorded</div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>No soil analysis reports exist for this plot. Record a soil test in the Soil Tests section.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="card-premium" style={{ padding: 0, overflow: "hidden" }}>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Soil Test ID</th>
              <th>Report Date</th>
              <th>Laboratory</th>
              <th>pH</th>
              <th>Nitrogen (N)</th>
              <th>Phosphorus (P)</th>
              <th>Potassium (K)</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Report Metrics</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(t => (
              <tr key={t.id}>
                <td style={{ fontFamily: "monospace", fontSize: "12px" }}>{t.id?.slice(0, 8)}…</td>
                <td style={{ fontWeight: 600 }}>{t.report_date}</td>
                <td>{t.laboratory_name || "Regional Agri Lab"}</td>
                <td style={{ fontWeight: 700 }}>{t.ph || "—"}</td>
                <td>{t.nitrogen ? `${t.nitrogen} kg/Ac` : "—"}</td>
                <td>{t.phosphorus ? `${t.phosphorus} kg/Ac` : "—"}</td>
                <td>{t.potassium ? `${t.potassium} kg/Ac` : "—"}</td>
                <td>
                  <StatusBadge label="Completed" type="completed" />
                </td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn-secondary" style={{ fontSize: "11px", padding: "4px 10px" }} onClick={() => setSelectedReport(t)}>
                    View Nutrients
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <div style={S.modalOverlay}>
          <div className="card-premium animate-fade-in" style={{ ...S.modalCard, maxWidth: "600px" }}>
            <div style={S.modalHeader}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Report Date: {selectedReport.report_date}</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Lab: {selectedReport.laboratory_name || "Regional Agri Lab"}</p>
              </div>
              <button style={S.closeBtn} onClick={() => setSelectedReport(null)}><RiCloseLine size={20} /></button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", margin: "16px 0" }}>
              {[
                { label: "pH (Soil Reaction)", val: selectedReport.ph },
                { label: "EC (Salinity)", val: selectedReport.ec ? `${selectedReport.ec} dS/m` : null },
                { label: "Organic Carbon (OC)", val: selectedReport.organic_carbon ? `${selectedReport.organic_carbon} %` : null },
                { label: "Nitrogen (N)", val: selectedReport.nitrogen ? `${selectedReport.nitrogen} kg/Ac` : null },
                { label: "Phosphorus (P)", val: selectedReport.phosphorus ? `${selectedReport.phosphorus} kg/Ac` : null },
                { label: "Potassium (K)", val: selectedReport.potassium ? `${selectedReport.potassium} kg/Ac` : null },
                { label: "Sulphur (S)", val: selectedReport.sulphur ? `${selectedReport.sulphur} ppm` : null },
                { label: "Calcium (Ca)", val: selectedReport.calcium ? `${selectedReport.calcium} ppm` : null },
                { label: "Magnesium (Mg)", val: selectedReport.magnesium ? `${selectedReport.magnesium} ppm` : null },
                { label: "Zinc (Zn)", val: selectedReport.zinc ? `${selectedReport.zinc} ppm` : null },
                { label: "Boron (B)", val: selectedReport.boron ? `${selectedReport.boron} ppm` : null },
                { label: "Iron (Fe)", val: selectedReport.iron ? `${selectedReport.iron} ppm` : null },
                { label: "Manganese (Mn)", val: selectedReport.manganese ? `${selectedReport.manganese} ppm` : null },
                { label: "Copper (Cu)", val: selectedReport.copper ? `${selectedReport.copper} ppm` : null },
              ].map(cell => (
                <div key={cell.label} style={{ background: "var(--bg-app)", borderRadius: "8px", padding: "10px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{cell.label}</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "2px", color: "var(--text-main)" }}>{cell.val ?? "—"}</div>
                </div>
              ))}
            </div>
            
            {selectedReport.report_pdf_url && (
              <div style={{ marginTop: "12px" }}>
                <a href={selectedReport.report_pdf_url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ width: "100%", textAlign: "center" }}>
                  Download Full PDF Report
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Detail Component 4: Recommendation History ─────────────────────────
function PlotRecsTab({ recs, materials, recommendationMaterials }) {
  const [selectedRec, setSelectedRec] = useState(null);

  const enrichedRecs = useMemo(() => {
    return recs.map(rec => {
      const items = recommendationMaterials.filter(rm => rm.recommendation_id === rec.id);
      
      const enrichedItems = items.map(itm => {
        const materialObj = materials.find(m => m.id === itm.material_id) || {};
        return {
          ...itm,
          _materialName: materialObj.name || "Custom Mix",
          _unit: materialObj.unit || "Kg",
          _rate: materialObj.selling_rate || 0,
          _totalCost: (materialObj.selling_rate || 0) * (itm.total_quantity || 0)
        };
      });

      const totalCost = enrichedItems.reduce((sum, item) => sum + item._totalCost, 0);

      return {
        ...rec,
        _items: enrichedItems,
        _totalCost: totalCost
      };
    });
  }, [recs, materials, recommendationMaterials]);

  if (enrichedRecs.length === 0) {
    return (
      <div className="card-premium" style={S.emptyState}>
        <RiFileTextLine size={40} color="var(--primary)" style={{ marginBottom: "12px" }} />
        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>No Recommendations Prepared</div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Establish a prescription in the Recommendations module after uploading soil test reports.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="card-premium" style={{ padding: 0, overflow: "hidden" }}>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Rec Number</th>
              <th>Date Prepared</th>
              <th>Prepared By</th>
              <th>Status</th>
              <th>Total Estimated Cost</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {enrichedRecs.map(r => (
              <tr key={r.id}>
                <td style={{ fontFamily: "monospace", fontSize: "12px" }}>REC-{r.id?.slice(0, 5).toUpperCase()}</td>
                <td style={{ fontWeight: 600 }}>{r.recommendation_date}</td>
                <td>Agronomy Team</td>
                <td>
                  <StatusBadge label="Completed" type="completed" />
                </td>
                <td style={{ fontWeight: 700, color: "var(--primary-hover)" }}>{formatCurrency(r._totalCost)}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn-secondary" style={{ fontSize: "11px", padding: "4px 10px" }} onClick={() => setSelectedRec(r)}>
                    View Materials
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRec && (
        <div style={S.modalOverlay}>
          <div className="card-premium animate-fade-in" style={{ ...S.modalCard, maxWidth: "650px" }}>
            <div style={S.modalHeader}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Prescription REC-{selectedRec.id?.slice(0, 5).toUpperCase()}</h3>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Prescribed on: {selectedRec.recommendation_date}</p>
              </div>
              <button style={S.closeBtn} onClick={() => setSelectedRec(null)}><RiCloseLine size={20} /></button>
            </div>
            
            <div style={{ margin: "10px 0" }}>
              <div style={S.fieldLabel}>Agronomist Remarks</div>
              <div style={{ background: "var(--bg-app)", padding: "12px", borderRadius: "8px", fontSize: "13px", fontStyle: "italic", border: "1px solid var(--border)", marginBottom: "16px" }}>
                {selectedRec.remarks || "No additional recommendations remarks provided."}
              </div>
            </div>

            <div style={S.fieldLabel}>Prescribed Input Materials</div>
            <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
              <table className="premium-table" style={{ margin: 0 }}>
                <thead>
                  <tr style={{ background: "var(--bg-app)" }}>
                    <th>Material</th>
                    <th>Qty per Plant</th>
                    <th>Total Qty</th>
                    <th>Unit Cost</th>
                    <th style={{ textAlign: "right" }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRec._items.map(itm => (
                    <tr key={itm.id}>
                      <td style={{ fontWeight: 600 }}>{itm._materialName}</td>
                      <td>{itm.quantity_per_plant ? `${itm.quantity_per_plant} ${itm._unit}` : "—"}</td>
                      <td style={{ fontWeight: 700 }}>{itm.total_quantity} {itm._unit}</td>
                      <td>{formatCurrency(itm._rate)}</td>
                      <td style={{ fontWeight: 700, textAlign: "right" }}>{formatCurrency(itm._totalCost)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "var(--bg-app)", fontWeight: 800 }}>
                    <td colSpan="4" style={{ textAlign: "right", padding: "10px 14px" }}>Estimated Total:</td>
                    <td style={{ textAlign: "right", color: "var(--primary-hover)", padding: "10px 14px" }}>{formatCurrency(selectedRec._totalCost)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Detail Component 5: Four Dose Schedule ─────────────────────────────
function PlotDosesTab({ doses, onCompleteDose }) {
  const [activeDoseDetails, setActiveDoseDetails] = useState(null);
  
  if (doses.length === 0) {
    return (
      <div className="card-premium" style={S.emptyState}>
        <RiTimeLine size={40} color="var(--primary)" style={{ marginBottom: "12px" }} />
        <div style={{ fontWeight: 600, color: "var(--text-main)" }}>No Dose Schedule Instantiated</div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Apply doses relative to recommendations using the Doses module.</div>
      </div>
    );
  }

  const sortedDoses = [...doses].sort((a, b) => a.dose_number - b.dose_number);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
        {sortedDoses.map(dose => (
          <div key={dose.id} className="card-premium" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "14px", border: dose.status === "Completed" ? "1px solid #a7f3d0" : "1px solid var(--border)" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: 800, fontSize: "16px", color: "var(--primary-dark)" }}>Dose {dose.dose_number}</span>
                <StatusBadge label={dose.status} type={dose.status === "Completed" ? "completed" : "pending"} />
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div>Planned Date: <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{dose.planned_date || "—"}</span></div>
                <div>Applied Date: <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{dose.applied_date || "Not applied"}</span></div>
                {dose.applied_date && <div>Applied By: <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{dose.materials_applied?.includes("Applied By:") ? dose.materials_applied.split("Applied By:")[1].replace(")", "") : "Field Worker"}</span></div>}
              </div>
            </div>

            <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
              {dose.status === "Pending" ? (
                <button className="btn-primary" style={{ flex: 1, fontSize: "12px", padding: "6px" }} onClick={() => onCompleteDose(dose)}>
                  Record Application
                </button>
              ) : (
                <button className="btn-secondary" style={{ flex: 1, fontSize: "12px", padding: "6px" }} onClick={() => setActiveDoseDetails(dose)}>
                  View Materials
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {activeDoseDetails && (
        <div style={S.modalOverlay}>
          <div className="card-premium animate-fade-in" style={{ ...S.modalCard, maxWidth: "450px" }}>
            <div style={S.modalHeader}>
              <h3 style={{ fontSize: "18px", fontWeight: 700 }}>Dose {activeDoseDetails.dose_number} Materials</h3>
              <button style={S.closeBtn} onClick={() => setActiveDoseDetails(null)}><RiCloseLine size={20} /></button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={S.fieldLabel}>Materials Applied</div>
                <div style={{ background: "var(--bg-app)", padding: "10px", borderRadius: "8px", fontWeight: 600, fontSize: "13px" }}>
                  {activeDoseDetails.materials_applied ? activeDoseDetails.materials_applied.split(" (Applied By:")[0] : "Organic fertilizer compounds"}
                </div>
              </div>
              
              {activeDoseDetails.quantity && (
                <div>
                  <div style={S.fieldLabel}>Total Applied Quantity</div>
                  <div style={{ fontSize: "14px", fontWeight: 700 }}>{activeDoseDetails.quantity} Kg/Litres</div>
                </div>
              )}
              
              <div>
                <div style={S.fieldLabel}>Applied Date</div>
                <div>{activeDoseDetails.applied_date}</div>
              </div>
              
              {activeDoseDetails.field_remarks && (
                <div>
                  <div style={S.fieldLabel}>Field Observation Remarks</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>"{activeDoseDetails.field_remarks}"</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Detail Component 6: Field Visits ───────────────────────────────────
function PlotVisitsTab({ visits, employees, onAddVisit, onDelete }) {
  const empMap = useMemo(() => {
    const m = {}; employees.forEach(e => { m[e.id] = e; }); return m;
  }, [employees]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={S.sectionTitle}>Field Inspection Logs</h3>
        <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={onAddVisit}>
          <RiAddLine size={14} /> Record Field Visit
        </button>
      </div>

      {visits.length === 0 ? (
        <div className="card-premium" style={{ ...S.emptyState, padding: "40px" }}>
          <RiMapPinLine size={32} color="var(--text-muted)" style={{ marginBottom: "10px" }} />
          <div style={{ fontSize: "14px", fontWeight: 600 }}>No Field Visits Logged</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Record agricultural inspections directly on this tab.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {visits.map(v => {
            const empName = empMap[v.employee_id]?.name || "Field Worker";
            const photosList = (() => {
              try {
                if (Array.isArray(v.photos)) return v.photos;
                if (typeof v.photos === "string") return JSON.parse(v.photos);
              } catch {}
              return [];
            })();

            return (
              <div key={v.id} className="card-premium" style={{ padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "12px" }}>
                  <div>
                    <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--primary-dark)" }}>{v.purpose || "General Visit"}</h4>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      📅 {v.visit_date} · Inspected by: <span style={{ fontWeight: 600, color: "var(--text-main)" }}>{empName}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {v.gps_location && (
                      <span style={{ fontSize: "11px", background: "var(--bg-app)", border: "1px solid var(--border)", padding: "4px 8px", borderRadius: "5px", fontFamily: "monospace" }}>
                        📍 {v.gps_location}
                      </span>
                    )}
                    <button onClick={() => onDelete(v.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }} title="Delete visit report">
                      <RiDeleteBinLine size={16} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: "13px", color: "var(--text-main)", lineHeight: "1.6" }}>
                  {v.notes || "No visit comments logged."}
                </p>

                {photosList.length > 0 && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
                    {photosList.map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Visit field ${idx}`} style={{ width: "90px", height: "70px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border)" }} />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tab Detail Component 7: Photos ─────────────────────────────────────────
function PlotPhotosTab({ photos, onAddPhoto, onDelete }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  const categories = ["All", "Before Application", "After Application", "Disease", "Soil Sample", "Crop Condition", "Other"];

  const filteredPhotos = useMemo(() => {
    if (selectedCategory === "All") return photos;
    return photos.filter(p => p.category === selectedCategory);
  }, [photos, selectedCategory]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        {/* Category filters */}
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                fontSize: "12px", padding: "6px 12px", borderRadius: "20px", cursor: "pointer",
                border: "1px solid var(--border)",
                background: selectedCategory === cat ? "var(--primary-dark)" : "var(--bg-card)",
                color: selectedCategory === cat ? "var(--text-white)" : "var(--text-muted)",
                fontWeight: 600,
                transition: "all 0.15s"
              }}
            >
              {cat}
            </button>
          ))}
        </div>
        <button className="btn-primary" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={onAddPhoto}>
          <RiImageLine size={14} /> Add Photo
        </button>
      </div>

      {filteredPhotos.length === 0 ? (
        <div className="card-premium" style={{ ...S.emptyState, padding: "40px" }}>
          <RiImageLine size={32} color="var(--text-muted)" style={{ marginBottom: "10px" }} />
          <div style={{ fontSize: "14px", fontWeight: 600 }}>No Photos Found</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>No images recorded for category "{selectedCategory}" on this plot.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          {filteredPhotos.map(p => (
            <div key={p.id} className="card-premium" style={{ padding: "10px", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ position: "relative" }}>
                  <img src={p.url} alt={p.description} style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px" }} />
                  <span style={{ position: "absolute", top: "6px", left: "6px", fontSize: "9px", fontWeight: 700, padding: "2px 6px", background: "rgba(0,0,0,0.7)", color: "white", borderRadius: "10px" }}>
                    {p.category}
                  </span>
                </div>
                <p style={{ fontSize: "12px", marginTop: "8px", fontWeight: 600, color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                  {p.description || "Field observation image"}
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "8px", marginTop: "10px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{p.created_at || "—"}</span>
                <button onClick={() => onDelete(p.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }} title="Remove photo">
                  <RiDeleteBinLine size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab Detail Component 8: Finance ────────────────────────────────────────
function PlotFinanceTab({ plot, payments, onAddFinance, onDeleteQuote, onDeleteInvoice }) {
  // Quotations and Invoices filters
  const quotes = plot._quotations || [];
  const invs = plot._invoices || [];

  // Summary computations
  const totalInvoiced = invs.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const totalQuoted = quotes.reduce((sum, q) => sum + Number(q.amount || 0), 0);

  // Payments received for this customer
  const customerPayments = payments.filter(p => p.customer_id === plot.customer_id);
  const totalPaid = customerPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const pendingAmount = Math.max(0, totalInvoiced - totalPaid);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Finance summaries */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {[
          { label: "Total Quoted", val: formatCurrency(totalQuoted), color: "#7c3aed" },
          { label: "Total Invoiced", val: formatCurrency(totalInvoiced), color: "var(--primary-dark)" },
          { label: "Payments Received", val: formatCurrency(totalPaid), color: "var(--primary)" },
          { label: "Pending Balance", val: formatCurrency(pendingAmount), color: "#ef4444" },
        ].map(k => (
          <div key={k.label} className="card-premium" style={{ padding: "16px 20px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>{k.label}</div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: k.color, marginTop: "6px" }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Quotations lists */}
      <div className="card-premium" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary-dark)" }}>Quotations Log</h4>
          <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "11px" }} onClick={() => onAddFinance("quote")}>
            Create Quotation
          </button>
        </div>
        {quotes.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
            No quotations recorded for this plot.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Quote Number</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600 }}>{q.quote_number}</td>
                    <td>{q.date}</td>
                    <td>
                      <StatusBadge label={q.status} type={q.status === "Approved" ? "completed" : q.status === "Rejected" ? "danger" : "pending"} />
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(q.amount)}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{q.remarks || "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button onClick={() => onDeleteQuote(q.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}>
                        <RiDeleteBinLine size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoices lists */}
      <div className="card-premium" style={{ padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--primary-dark)" }}>Sales Invoices</h4>
          <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "11px" }} onClick={() => onAddFinance("invoice")}>
            Log Invoice
          </button>
        </div>
        {invs.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
            No sales invoices logged.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Invoice Number</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {invs.map(i => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600 }}>{i.invoice_number}</td>
                    <td>{i.date}</td>
                    <td>
                      <StatusBadge label={i.status} type={i.status === "Paid" ? "completed" : i.status === "Overdue" ? "danger" : "pending"} />
                    </td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(i.amount)}</td>
                    <td style={{ fontSize: "12px", color: "var(--text-muted)" }}>{i.remarks || "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button onClick={() => onDeleteInvoice(i.id)} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}>
                        <RiDeleteBinLine size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub Component: Plot Form Modal ──────────────────────────────────────────
function PlotFormModal({
  form, setForm, editingId, customers, employees, onSubmit, onClose, toggleOrganic, handleFarmerChange,
  CROPS, VARIETIES, IRRIGATION_TYPES, LAND_TYPES, SOIL_TYPES, WATER_SOURCES, ORGANIC_MATERIALS_OPTIONS
}) {
  const [formTab, setFormTab] = useState("basic");
  
  const FORM_TABS = [
    { key: "basic", label: "Basic Info" },
    { key: "characteristics", label: "Characteristics" },
    { key: "organic", label: "Organic Available" },
    { key: "gps", label: "GPS & Special Instructions" },
  ];

  return (
    <div style={S.modalOverlay}>
      <div className="card-premium animate-fade-in" style={S.modalCard}>
        <div style={S.modalHeader}>
          <h3 style={{ fontSize: "18px", fontWeight: 700 }}>{editingId ? "Edit Plot Parameters" : "Add Plot Unit"}</h3>
          <button style={S.closeBtn} onClick={onClose}><RiCloseLine size={20} /></button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: "flex", gap: "4px", paddingBottom: "16px", borderBottom: "1px solid var(--border)", marginBottom: "20px", flexWrap: "wrap" }}>
          {FORM_TABS.map(t => (
            <button key={t.key} type="button" style={{ ...S.tabBtn(formTab === t.key), fontSize: "12px", padding: "6px 12px" }} onClick={() => setFormTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit}>
          {formTab === "basic" && (
            <div style={S.formGrid}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Farmer / Customer *</label>
              <select 
  className="form-input" 
  value={form.customer_id || ""} // If it is null, it becomes ""
  onChange={e => handleFarmerChange(e.target.value)}
>
  <option value="">— Select Customer —</option>
  {customers.map(c => (
    <option key={c.id} value={c.id}>{c.name} ({c.customer_number})</option>
  ))}
</select>
              </div>
              <div>
                <label className="form-label">Plot Number * (e.g. Plot-1)</label>
                <input className="form-input" value={form.plot_number} onChange={e => setForm(f => ({ ...f, plot_number: e.target.value }))} placeholder="Plot-1" required />
              </div>
              <div>
                <label className="form-label">Plot Name (Alias)</label>
                <input className="form-input" value={form.plot_name} onChange={e => setForm(f => ({ ...f, plot_name: e.target.value }))} placeholder="e.g. Home Field" />
              </div>
              <div>
                <label className="form-label">Crop Type *</label>
                <select className="form-input" value={form.crop} onChange={e => setForm(f => ({ ...f, crop: e.target.value }))} required>
                  {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Variety *</label>
                <select className="form-input" value={form.crop_variety} onChange={e => setForm(f => ({ ...f, crop_variety: e.target.value }))} required>
                  {VARIETIES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Area (Acres) *</label>
                <input type="number" step="0.01" className="form-input" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} placeholder="e.g. 2.5" required />
              </div>
              <div>
                <label className="form-label">Total Number of Plants</label>
                <input type="number" className="form-input" value={form.number_of_plants} onChange={e => setForm(f => ({ ...f, number_of_plants: e.target.value }))} placeholder="e.g. 500" />
              </div>
              <div>
                <label className="form-label">Plantation Year</label>
                <input type="number" className="form-input" value={form.plantation_year} onChange={e => setForm(f => ({ ...f, plantation_year: e.target.value }))} placeholder="e.g. 2019" />
              </div>
              <div>
                <label className="form-label">Assigned Supervisor</label>
                <select className="form-input" value={form.assigned_employee_id} onChange={e => setForm(f => ({ ...f, assigned_employee_id: e.target.value }))}>
                  <option value="">— Choose Staff —</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Workflow Status</label>
                <select className="form-input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option>Active</option>
                  <option>Completed</option>
                </select>
              </div>
            </div>
          )}

          {formTab === "characteristics" && (
            <div style={S.formGrid}>
              <div>
                <label className="form-label">Irrigation Type</label>
                <select className="form-input" value={form.irrigation_type} onChange={e => setForm(f => ({ ...f, irrigation_type: e.target.value }))}>
                  {IRRIGATION_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Water Source</label>
                <select className="form-input" value={form.water_source} onChange={e => setForm(f => ({ ...f, water_source: e.target.value }))}>
                  {WATER_SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Soil Type</label>
                <select className="form-input" value={form.soil_type} onChange={e => setForm(f => ({ ...f, soil_type: e.target.value }))}>
                  {SOIL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Land Topography</label>
                <select className="form-input" value={form.land_type} onChange={e => setForm(f => ({ ...f, land_type: e.target.value }))}>
                  {LAND_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Boolean switches */}
              <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                {[
                  { key: "waterlogged_area", label: "Waterlogged Area" },
                  { key: "hilly_land", label: "Hilly Land" },
                  { key: "sandy_soil", label: "Sandy Soil" },
                  { key: "organic_farming", label: "Organic Farming Only" },
                  { key: "farmer_has_cow_dung", label: "Farmer Has Own Cow Dung" },
                  { key: "farmer_has_poultry_manure", label: "Farmer Has Poultry Manure" },
                  { key: "farmer_has_sheep_manure", label: "Farmer Has Sheep Manure" },
                  { key: "farmer_has_compost", label: "Farmer Has Compost Pile" },
                ].map(item => (
                  <div key={item.key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id={item.key}
                      checked={form[item.key] || false}
                      onChange={e => setForm(f => ({ ...f, [item.key]: e.target.checked }))}
                      style={{ cursor: "pointer", width: "16px", height: "16px" }}
                    />
                    <label htmlFor={item.key} style={{ fontSize: "13px", fontWeight: 600, cursor: "pointer", color: "var(--text-main)" }}>
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formTab === "organic" && (
            <div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>Select all organic materials available on this specific plot:</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                {ORGANIC_MATERIALS_OPTIONS.map(opt => {
                  const selected = (form.organic_materials || []).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleOrganic(opt.value)}
                      style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "10px 14px", borderRadius: "10px", cursor: "pointer",
                        border: selected ? `2px solid ${opt.text}` : "1px solid var(--border)",
                        background: selected ? opt.color : "var(--bg-app)",
                        color: selected ? opt.text : "var(--text-muted)",
                        fontWeight: selected ? 700 : 500, fontSize: "13px",
                        transition: "all 0.15s",
                      }}
                    >
                      <span>{selected ? "🟢" : "⬜"}</span>
                      {opt.value}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {formTab === "gps" && (
            <div style={S.formGrid}>
              <div>
                <label className="form-label">GPS Latitude</label>
                <input className="form-input" value={form.gps_latitude} onChange={e => setForm(f => ({ ...f, gps_latitude: e.target.value }))} placeholder="e.g. 17.2856" />
              </div>
              <div>
                <label className="form-label">GPS Longitude</label>
                <input className="form-input" value={form.gps_longitude} onChange={e => setForm(f => ({ ...f, gps_longitude: e.target.value }))} placeholder="e.g. 74.1834" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Google Maps Navigation Link</label>
                <input className="form-input" value={form.google_maps_link} onChange={e => setForm(f => ({ ...f, google_maps_link: e.target.value }))} placeholder="https://maps.google.com/..." />
              </div>
              <div>
                <label className="form-label">Village Override</label>
                <input className="form-input" value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} placeholder="Inherited from farmer if blank" />
              </div>
              <div>
                <label className="form-label">Taluk Override</label>
                <input className="form-input" value={form.taluk} onChange={e => setForm(f => ({ ...f, taluk: e.target.value }))} placeholder="Inherited if blank" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">District Override</label>
                <input className="form-input" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="Inherited if blank" />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Special Instructions for Field Workers</label>
                <textarea className="form-input" style={{ minHeight: "60px" }} value={form.special_instructions} onChange={e => setForm(f => ({ ...f, special_instructions: e.target.value }))} placeholder="Any directives on soil gathering, spraying timings, etc..." />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Remarks / History Notes</label>
                <textarea className="form-input" style={{ minHeight: "60px" }} value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="General plot notes..." />
              </div>
            </div>
          )}

          <div style={S.modalActions}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">{editingId ? "Save Plot Changes" : "Create Plot"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const S = {
  container: { display: "flex", flexDirection: "column", gap: "20px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" },
  pageTitle: { fontSize: "26px", fontWeight: 700, marginBottom: "2px" },
  pageSubtitle: { fontSize: "13px", color: "var(--text-muted)" },
  warnBanner: { background: "#fffbeb", border: "1px solid #fef3c7", color: "#b45309", padding: "12px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: 600 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "14px" },
  kpiCard: { padding: "18px 20px" },
  searchWrapper: { position: "relative", flex: 1, minWidth: "260px", display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: "12px", color: "var(--text-muted)" },
  searchInput: { width: "100%", padding: "10px 14px 10px 38px", background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", fontSize: "13px", outline: "none" },
  filterSelect: { padding: "10px 12px", fontSize: "12px", minWidth: "140px", width: "auto" },
  filterGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "12px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--border)" },
  filterLabel: { fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" },
  emptyState: { padding: "60px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center" },
  backBtn: { background: "var(--bg-app)", border: "1px solid var(--border)", borderRadius: "8px", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-main)" },
  tabBar: { display: "flex", gap: "4px", flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: "0" },
  tabBtn: (active) => ({
    display: "flex", alignItems: "center", gap: "6px",
    padding: "10px 16px", background: "transparent", border: "none",
    borderBottom: active ? "3.5px solid var(--primary)" : "3px solid transparent",
    color: active ? "var(--primary-dark)" : "var(--text-muted)",
    fontWeight: active ? 800 : 500, fontSize: "13.5px", cursor: "pointer",
    marginBottom: "-1.5px", transition: "all 0.15s",
  }),
  sectionTitle: { fontSize: "12px", fontWeight: 800, color: "var(--primary-dark)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" },
  infoGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" },
  fieldLabel: { fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" },
  fieldValue: { fontSize: "13.5px", fontWeight: 700, color: "var(--text-main)" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalCard: { width: "100%", maxWidth: "660px", maxHeight: "90vh", overflowY: "auto", padding: "28px" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  closeBtn: { background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)" },
};
