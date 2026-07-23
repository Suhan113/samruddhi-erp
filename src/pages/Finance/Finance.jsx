import { useEffect, useState, useMemo, useCallback } from "react";
import { db } from "../../services/database";
import {
  RiCoinsFill,
  RiArrowRightUpLine,
  RiArrowRightDownLine,
  RiCoinsLine,
  RiUserLine,
  RiAddCircleLine,
  RiDeleteBinLine,
  RiPrinterLine,
  RiFileExcelLine,
  RiCloseLine
} from "react-icons/ri";

export default function Finance() {
  // Datasets
  const [payments, setPayments] = useState([]);      // Customer Inflow
  const [purchases, setPurchases] = useState([]);    // Supplier Inventory Outflow
  const [expenses, setExpenses] = useState([]);      // Operational Outflow
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Global Active Selection State (Forces absolute cross-module separation per client)
  const [selectedCustomerId, setSelectedCustomerId] = useState("All");
  const [activeTab, setActiveTab] = useState("payments");

  // Modals Toggles
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Voucher Forms State
  const [paymentForm, setPaymentForm] = useState({
    customer_id: "",
    amount: "",
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "UPI",
    remarks: ""
  });

  const [purchaseForm, setPurchaseForm] = useState({
    customer_id: "", // Tied strictly to a customer
    supplier_id: "",
    amount: "",
    purchase_date: new Date().toISOString().split("T")[0],
    remarks: ""
  });

  const [expenseForm, setExpenseForm] = useState({
    customer_id: "", // Tied strictly to a customer
    amount: "",
    category: "Transport",
    expense_date: new Date().toISOString().split("T")[0],
    description: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payData, purData, expData, cData, sData] = await Promise.all([
        db.select("payments"),
        db.select("purchases"),
        db.select("expenses"),
        db.select("customers"),
        db.select("suppliers")
      ]);

      setPayments(payData || []);
      setPurchases(purData || []);
      setExpenses(expData || []);
      setCustomers(cData || []);
      setSuppliers(sData || []);
    } catch (err) {
      console.error("Failed to load global transaction books", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Structural Maps
  const customerMap = useMemo(() => Object.fromEntries(customers.map(c => [c.id, c])), [customers]);
  const supplierMap = useMemo(() => Object.fromEntries(suppliers.map(s => [s.id, s])), [suppliers]);

  // Isolate books data arrays by individual Customer Reference Filter
  const clientFilteredBooks = useMemo(() => {
    const pays = payments.filter(p => selectedCustomerId === "All" || p.customer_id === selectedCustomerId);
    const purs = purchases.filter(p => selectedCustomerId === "All" || p.customer_id === selectedCustomerId);
    const exps = expenses.filter(e => selectedCustomerId === "All" || e.customer_id === selectedCustomerId);
    return { pays, purs, exps };
  }, [payments, purchases, expenses, selectedCustomerId]);

  // Dynamic automatic accounting totals loop calculations
  const totals = useMemo(() => {
    const totalRev = clientFilteredBooks.pays.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalSupplierPurchases = clientFilteredBooks.purs.reduce((sum, p) => sum + Number(p.amount || p.total_amount || 0), 0);
    const totalOperatingExpenses = clientFilteredBooks.exps.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalExp = totalSupplierPurchases + totalOperatingExpenses;
    const netProfit = totalRev - totalExp;

    return { totalRev, totalSupplierPurchases, totalOperatingExpenses, totalExp, netProfit };
  }, [clientFilteredBooks]);

  // Submissions operations handlers
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.insert("payments", { ...paymentForm, amount: Number(paymentForm.amount) });
      setShowPaymentModal(false);
      setPaymentForm({ customer_id: "", amount: "", payment_date: new Date().toISOString().split("T")[0], payment_method: "UPI", remarks: "" });
      fetchData();
    } catch (err) {
      alert("Error saving transaction");
    }
  };

  const handlePurchaseSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.insert("purchases", { ...purchaseForm, amount: Number(purchaseForm.amount) });
      setShowPurchaseModal(false);
      setPurchaseForm({ customer_id: "", supplier_id: "", amount: "", purchase_date: new Date().toISOString().split("T")[0], remarks: "" });
      fetchData();
    } catch (err) {
      alert("Error saving transaction");
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.insert("expenses", { ...expenseForm, amount: Number(expenseForm.amount) });
      setShowExpenseModal(false);
      setExpenseForm({ customer_id: "", amount: "", category: "Transport", expense_date: new Date().toISOString().split("T")[0], description: "" });
      fetchData();
    } catch (err) {
      alert("Error saving transaction");
    }
  };

  const handleDeleteTransaction = async (table, id) => {
    if (window.confirm("Delete this entry safely from sandbox database logs?")) {
      await db.delete(table, id);
      fetchData();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Dynamic customer Separation Context Controller */}
      <div className="card-premium" style={{ padding: "20px", display: "flex", alignItems: "center", gap: "14px" }}>
        <RiUserLine size={22} color="var(--primary-dark)" />
        <div style={{ flex: 1 }}>
          <label className="form-label" style={{ marginBottom: "4px" }}>Filter Financial Records by Customer Portfolio Mapping *</label>
          <select
            className="form-input"
            value={selectedCustomerId}
            onChange={e => setSelectedCustomerId(e.target.value)}
            style={{ fontWeight: 700 }}
          >
            <option value="All">All Transactions (Global Business View)</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.customer_number || "Active Portfolio"})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <div className="card-premium" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Total Revenue</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "green", marginTop: "6px" }}>₹{totals.totalRev.toLocaleString("en-IN")}</div>
        </div>

        <div className="card-premium" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Supplier Purchases</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#ef4444", marginTop: "6px" }}>₹{totals.totalSupplierPurchases.toLocaleString("en-IN")}</div>
        </div>

        <div className="card-premium" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Operating Expenses</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#f59e0b", marginTop: "6px" }}>₹{totals.totalOperatingExpenses.toLocaleString("en-IN")}</div>
        </div>

        <div className="card-premium" style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, textTransform: "uppercase" }}>Net Profit Margin</div>
          <div style={{ fontSize: "24px", fontWeight: 800, color: totals.netProfit >= 0 ? "var(--primary-dark)" : "#ef4444", marginTop: "6px" }}>₹{totals.netProfit.toLocaleString("en-IN")}</div>
        </div>
      </div>

      {/* Action triggers */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
        <button type="button" className="btn-secondary" onClick={() => setShowPurchaseModal(true)}>Record Supplier Purchase</button>
        <button type="button" className="btn-secondary" onClick={() => setShowExpenseModal(true)}>Record Operating Expense</button>
        <button type="button" className="btn-primary" onClick={() => setShowPaymentModal(true)}><RiCoinsFill /> Record Customer Payment</button>
      </div>

      {/* Tabs Layout lists */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", gap: "12px" }}>
        <button type="button" style={{ background: "none", border: "none", padding: "12px", cursor: "pointer", borderBottom: activeTab === "payments" ? "3px solid var(--primary)" : "3px solid transparent", fontWeight: activeTab === "payments" ? 700 : 500 }} onClick={() => setActiveTab("payments")}>Customer Payments ({clientFilteredBooks.pays.length})</button>
        <button type="button" style={{ background: "none", border: "none", padding: "12px", cursor: "pointer", borderBottom: activeTab === "purchases" ? "3px solid var(--primary)" : "3px solid transparent", fontWeight: activeTab === "purchases" ? 700 : 500 }} onClick={() => setActiveTab("purchases")}>Supplier Purchases ({clientFilteredBooks.purs.length})</button>
        <button type="button" style={{ background: "none", border: "none", padding: "12px", cursor: "pointer", borderBottom: activeTab === "expenses" ? "3px solid var(--primary)" : "3px solid transparent", fontWeight: activeTab === "expenses" ? 700 : 500 }} onClick={() => setActiveTab("expenses")}>Operating Expenses ({clientFilteredBooks.exps.length})</button>
      </div>

      {/* Data Table Workspace View */}
      <div className="card-premium" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}>Syncing cash book ledgers...</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="premium-table">
              {activeTab === "payments" && (
                <>
                  <thead>
                    <tr><th>Payment Date</th><th>Customer Portfolio</th><th>Amount Paid</th><th>Method</th><th>Remarks</th><th style={{ textAlign: "right" }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {clientFilteredBooks.pays.map(p => (
                      <tr key={p.id}>
                        <td>{p.payment_date}</td>
                        <td style={{ fontWeight: 600 }}>{customerMap[p.customer_id]?.name || "Direct Cash Entry"}</td>
                        <td style={{ fontWeight: 700, color: "green" }}>₹{p.amount.toLocaleString("en-IN")}</td>
                        <td>{p.payment_method}</td>
                        <td>{p.remarks || "—"}</td>
                        <td style={{ textAlign: "right" }}><button type="button" style={{ background: "none", border: "none", color: "red", cursor: "pointer" }} onClick={() => handleDeleteTransaction("payments", p.id)}><RiDeleteBinLine /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === "purchases" && (
                <>
                  <thead>
                    <tr><th>Purchase Date</th><th>Mapped Customer Target</th><th>Supplier Profile</th><th>Amount Spent</th><th>Invoice Remarks</th><th style={{ textAlign: "right" }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {clientFilteredBooks.purs.map(p => (
                      <tr key={p.id}>
                        <td>{p.purchase_date}</td>
                        <td style={{ fontWeight: 600 }}>{customerMap[p.customer_id]?.name || "Unassigned"}</td>
                        <td>{supplierMap[p.supplier_id]?.name || "Bulk Stock Material Loading"}</td>
                        <td style={{ fontWeight: 700, color: "red" }}>₹{(p.amount || p.total_amount || 0).toLocaleString("en-IN")}</td>
                        <td>{p.remarks || "—"}</td>
                        <td style={{ textAlign: "right" }}><button type="button" style={{ background: "none", border: "none", color: "red", cursor: "pointer" }} onClick={() => handleDeleteTransaction("purchases", p.id)}><RiDeleteBinLine /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === "expenses" && (
                <>
                  <thead>
                    <tr><th>Expense Date</th><th>Mapped Customer Target</th><th>Category</th><th>Amount Spent</th><th>Description</th><th style={{ textAlign: "right" }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {clientFilteredBooks.exps.map(e => (
                      <tr key={e.id}>
                        <td>{e.expense_date}</td>
                        <td style={{ fontWeight: 600 }}>{customerMap[e.customer_id]?.name || "General Operating Cost"}</td>
                        <td><strong>{e.category}</strong></td>
                        <td style={{ fontWeight: 700, color: "red" }}>₹{e.amount.toLocaleString("en-IN")}</td>
                        <td>{e.description || "—"}</td>
                        <td style={{ textAlign: "right" }}><button type="button" style={{ background: "none", border: "none", color: "red", cursor: "pointer" }} onClick={() => handleDeleteTransaction("expenses", e.id)}><RiDeleteBinLine /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          </div>
        )}
      </div>

      {/* VOUCHER ADDITION OVERLAYS */}
      {showPaymentModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card-premium" style={{ width: "420px", padding: "24px" }}>
            <h3>Log Customer Receipt Settlement</h3>
            <form onSubmit={handlePaymentSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
              <select className="form-input" required value={paymentForm.customer_id} onChange={e => setPaymentForm({ ...paymentForm, customer_id: e.target.value })}>
                <option value="">-- Mapped Customer Portfolio Account * --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="form-input" type="number" required placeholder="Amount Value (₹) *" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
              <input className="form-input" type="date" required value={paymentForm.payment_date} onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
              <select className="form-input" value={paymentForm.payment_method} onChange={e => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}><option>UPI</option><option>Cash</option><option>Net Banking</option></select>
              <input className="form-input" placeholder="Voucher narrative remarks..." value={paymentForm.remarks} onChange={e => setPaymentForm({ ...paymentForm, remarks: e.target.value })} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post Cash Inflow</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPurchaseModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card-premium" style={{ width: "420px", padding: "24px" }}>
            <h3>Log Supplier Purchase Bill</h3>
            <form onSubmit={handlePurchaseSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
              <select className="form-input" required value={purchaseForm.customer_id} onChange={e => setPurchaseForm({ ...purchaseForm, customer_id: e.target.value })}>
                <option value="">-- Bind to Customer Target * --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="form-input" required value={purchaseForm.supplier_id} onChange={e => setPurchaseForm({ ...purchaseForm, supplier_id: e.target.value })}>
                <option value="">-- Supplier Master Lookup * --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input className="form-input" type="number" required placeholder="Invoice Bill Value (₹) *" value={purchaseForm.amount} onChange={e => setPurchaseForm({ ...purchaseForm, amount: e.target.value })} />
              <input className="form-input" type="date" required value={purchaseForm.purchase_date} onChange={e => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })} />
              <input className="form-input" placeholder="Invoice reference remarks..." value={purchaseForm.remarks} onChange={e => setPurchaseForm({ ...purchaseForm, remarks: e.target.value })} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowPurchaseModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post Purchase Debit</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showExpenseModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card-premium" style={{ width: "420px", padding: "24px" }}>
            <h3>Log Mapped Operating Expense</h3>
            <form onSubmit={handleExpenseSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "16px" }}>
              <select className="form-input" required value={expenseForm.customer_id} onChange={e => setExpenseForm({ ...expenseForm, customer_id: e.target.value })}>
                <option value="">-- Bind to Customer Target * --</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="form-input" value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}>
                <option>Labour</option><option>Transport</option><option>Rent</option><option>Diesel</option><option>Food</option>
              </select>
              <input className="form-input" type="number" required placeholder="Voucher Value (₹) *" value={expenseForm.amount} onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              <input className="form-input" type="date" required value={expenseForm.expense_date} onChange={e => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
              <input className="form-input" placeholder="Voucher descriptions..." value={expenseForm.description} onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })} />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowExpenseModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Post Operating Debit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
