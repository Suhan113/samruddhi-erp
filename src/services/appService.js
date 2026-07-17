const STORAGE_KEY = "samruddhi-erp-session";
const DEFAULT_USERS = [
  { id: "admin-1", name: "Admin", email: "admin@samruddhi.com", password: "admin123" },
];

const DEFAULT_CUSTOMERS = [
  {
    id: "CUST-1001",
    name: "Ramesh Patil",
    phone: "9876543210",
    village: "Nandgaon",
    district: "Satara",
    crop: "Sugarcane",
    remarks: "Prefers organic inputs",
    status: "Active",
  },
  {
    id: "CUST-1002",
    name: "Sanjay More",
    phone: "9765432109",
    village: "Koregaon",
    district: "Pune",
    crop: "Cotton",
    remarks: "Needs soil test follow-up",
    status: "Pending",
  },
];

export function signIn(email, password) {
  const user = DEFAULT_USERS.find((entry) => entry.email === email && entry.password === password);

  if (!user) {
    return { success: false, message: "Invalid email or password" };
  }

  const session = { id: user.id, name: user.name, email: user.email };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return { success: true, user: session };
}

export function signOut() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getStoredSession() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getCustomers() {
  const stored = localStorage.getItem("samruddhi-customers");
  if (!stored) {
    localStorage.setItem("samruddhi-customers", JSON.stringify(DEFAULT_CUSTOMERS));
    return DEFAULT_CUSTOMERS;
  }

  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_CUSTOMERS;
  }
}

export function saveCustomer(customer) {
  const customers = getCustomers();
  const nextCustomers = [...customers, customer];
  localStorage.setItem("samruddhi-customers", JSON.stringify(nextCustomers));
  return nextCustomers;
}

export function getDashboardStats() {
  const customers = getCustomers();
  return {
    customers: customers.length,
    pendingRecommendations: 4,
    pendingDoses: 7,
    lowStockItems: 3,
    monthlyRevenue: "₹3,42,000",
  };
}
