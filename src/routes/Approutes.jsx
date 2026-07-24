import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Pages
import Dashboard from "../pages/Dashboard/Dashboard";
import Customers from "../pages/Customers/Customers";
import Plots from "../pages/Plots/Plots";
import SoilTests from "../pages/SoilTests/SoilTests";
import Recommendations from "../pages/Recommendations/Recommendations";
import Doses from "../pages/Doses/Doses";
import Materials from "../pages/Materials/Materials";
import Inventory from "../pages/Inventory/Inventory";
import Employees from "../pages/Employees/Employees";
import Suppliers from "../pages/Suppliers/Suppliers";
import Finance from "../pages/Finance/Finance";
import Reports from "../pages/Reports/Reports";
import Settings from "../pages/Settings/Settings";
import Login from "../pages/Login/Login";

// Layout
import MainLayout from "../components/layout/MainLayout";
import { RiLeafLine } from "react-icons/ri";
import ProtocolGuide from "../pages/ProtocolGuide";

// Route Guard for Authenticated Users
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return user ? children : <Navigate to="/login" replace />;
}

// Route Guard for Guests
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return !user ? children : <Navigate to="/" replace />;
}

// Beautiful Loading screen
function LoadingScreen() {
  return (
    <div style={loadingContainerStyle}>
      <div style={spinnerContainerStyle}>
        <RiLeafLine size={48} color="#10b981" style={spinnerIconStyle} />
        <h2 style={loadingTextStyle}>Loading Samruddhi ERP...</h2>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Guest Routes */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        {/* Protected Dashboard & Module Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="plots" element={<Plots />} />
          <Route path="soil-tests" element={<SoilTests />} />
          <Route path="recommendations" element={<Recommendations />} />
          <Route path="doses" element={<Doses />} />
          <Route path="materials" element={<Materials />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="employees" element={<Employees />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="finance" element={<Finance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="/protocol" element={<ProtocolGuide />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Style definitions
const loadingContainerStyle = {
  width: "100vw",
  height: "100vh",
  background: "#04140e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const spinnerContainerStyle = {
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "16px",
};

const spinnerIconStyle = {
  animation: "spin 2s linear infinite",
};

const loadingTextStyle = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: 500,
  fontFamily: "var(--font-title)",
};

// Add standard inline CSS keyframe animation for the loader if needed, 
// but ri-icons and simple CSS can also handle transitions.
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
