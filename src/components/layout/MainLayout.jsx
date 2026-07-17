import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function MainLayout() {
  return (
    <div style={layoutContainerStyle}>
      <Sidebar />

      <div style={contentAreaStyle}>
        <Navbar />
        
        <main style={mainContentStyle}>
          <div className="animate-fade-in" style={innerContainerStyle}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

const layoutContainerStyle = {
  display: "flex",
  height: "100vh",
  width: "100vw",
  overflow: "hidden",
  background: "var(--bg-app)",
};

const contentAreaStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  height: "100vh",
  overflow: "hidden",
};

const mainContentStyle = {
  flex: 1,
  overflowY: "auto",
  padding: "32px",
};

const innerContainerStyle = {
  maxWidth: "1400px",
  margin: "0 auto",
  width: "100%",
};