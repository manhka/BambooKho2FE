"use client";
import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
// import Chart from "../components/Chart";
export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user && user.role === "admin";
  if (!isAdmin) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100 bg-light text-center">
        <h3 className="text-danger mb-3 fw-semibold">
          Bạn không có quyền truy cập
        </h3>
        <button
          onClick={() => navigate("/login")}
          className="btn btn-primary px-4 py-2 shadow-sm"
        >
          Quay lại đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="d-flex vh-100 bg-light position-relative overflow-hidden p-3">
      <div className="d-flex flex-column flex-grow-1 w-100 gap-3">
        <div
          className="overflow-hidden bg-white rounded-4 shadow-sm border p-3 d-flex flex-column"
          style={{ borderColor: "#dee2e6", flex: "6", minHeight: "300px" }}
        >
          {/* <Chart /> */}
          <h2 className="text-center text-secondary mt-5">
            Biểu đồ đang được phát triển...
          </h2>
        </div>
      </div>
    </div>
  );
}
