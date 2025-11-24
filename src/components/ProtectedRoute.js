import React from "react";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem("token");

  // Không có token → chưa login
  if (!token) {
    return <Navigate to="/error/401" replace />;
  }

  let decoded = null;

  try {
    decoded = jwtDecode(token);
  } catch (error) {
    console.error("Invalid token:", error);
    return <Navigate to="/error/500" replace />;
  }

  // Lấy role từ token
  const role = decoded?.role;

  // Token không có role → lỗi
  if (!role) {
    return <Navigate to="/error/500" replace />;
  }

  // Nếu cần kiểm tra role
  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(role)) {
        return <Navigate to="/error/403" replace />;
      }
    } else {
      if (role !== requiredRole) {
        return <Navigate to="/error/403" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
