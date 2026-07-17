import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function MainLayout() {
  return (
    <div className="main-layout-container">
      {/* Top navigation bar — brand + search + nav links all in one */}
      <Sidebar />

      {/* Page content below the top nav */}
      <div className="content-area">
        <main className="main-content">
          <div className="inner-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}