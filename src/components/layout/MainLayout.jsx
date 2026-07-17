import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function MainLayout() {
  return (
    <div className="main-layout-container">
      <Sidebar />
      <div className="content-area">
        <Navbar />
        <main className="main-content">
          <div className="animate-fade-in inner-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}