import React, { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Menu, User, LogOut } from "lucide-react";
import AppToast from "../components/AppToast";

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh", overflow: "hidden" }}>
      <AppToast />

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onLogout={handleLogout} />

      {/* Main */}
      <div
        className="flex-grow-1 d-flex flex-column"
        style={{
          marginLeft: isSidebarOpen ? "270px" : "0",
          width: isSidebarOpen ? "calc(100% - 270px)" : "100%",
          transition: "all 0.35s ease",
          backgroundColor: "#f8f9fa",
          minHeight: "100vh",
        }}
      >
        {/* Header */}
        <div
          className="d-flex align-items-center justify-content-between px-3 shadow-sm"
          style={{
            position: "fixed",
            top: 0,
            height: "72px",
            left: isSidebarOpen ? "270px" : "0",
            width: isSidebarOpen ? "calc(100% - 270px)" : "100%",
            backgroundColor: "#ffffff",
            transition: "all 0.35s ease",
            zIndex: 10,
          }}
        >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="btn btn-light border rounded-circle shadow-sm"
            style={{ width: "42px", height: "42px" }}
          >
            <Menu size={20} />
          </button>

          {/* Right profile section */}
          <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center">
              <User size={22} className="me-2" />
              <span style={{ fontWeight: 500 }}>Admin</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-outline-danger d-flex align-items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-grow-1 overflow-auto p-3"
          style={{
            marginTop: "72px",
            backgroundColor: "#ffffff",
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
