import React, { useState } from "react";
import {
  LogOut,
  ChevronDown,
  Layers,
  Tag,
  Users,
  Box,
  ShoppingCart,
  MapPin,
  User,
  Truck,
  ClipboardList,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Sidebar({ isOpen, onLogout }) {
  const [expandedMenu, setExpandedMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // =============================
  // Decode JWT
  // =============================
  const token = localStorage.getItem("token");

  let decoded = null;
  if (token) {
    try {
      decoded = jwtDecode(token);
    } catch (err) {
      console.error("Token decode error:", err);
    }
  }

  const roleID = decoded?.role || null;

  // =============================
  // Menu theo role
  // =============================
  const menuItems = [
    {
      id: "dashboard",
      label: "Bảng điều khiển",
      icon: Layers, // tổng quan / dashboard
      roles: ["admin"],
      path: "/dashboard",
    },
    {
      id: "staffs",
      label: "Quản lý nhân viên",
      icon: Users, // biểu tượng nhân viên
      roles: ["admin"],
      path: "/staffs",
    },
    {
      id: "categories",
      label: "Quản lý danh mục",
      icon: Tag, // danh mục / nhãn
      roles: ["admin", "staff"],
      path: "/categories/list",
    },
    {
      id: "brands",
      label: "Quản lý thương hiệu",
      icon: Tag, // thương hiệu cũng có thể dùng Tag
      roles: ["admin", "staff"],
      path: "/brands/list",
    },
    {
      id: "products",
      label: "Sản phẩm",
      icon: Box, // sản phẩm / hộp
      roles: ["admin", "staff"],
      submenu: [
        { label: "Danh sách sản phẩm", path: "/products/list" },
        { label: "Thêm sản phẩm", path: "/products/create" },
      ],
    },
    {
      id: "locations",
      label: "Quản lý vị trí kho",
      icon: MapPin, // vị trí
      roles: ["admin", "staff"],
      path: "/locations/list",
    },
    {
      id: "customers",
      label: "Quản lý khách hàng",
      icon: User, // khách hàng
      roles: ["admin", "staff"],
      path: "/customers/list",
    },
    {
      id: "suppliers",
      label: "Quản lý nhà cung cấp",
      icon: Truck, // nhà cung cấp / vận chuyển
      roles: ["admin", "staff"],
      path: "/suppliers/list",
    },
    {
      id: "inventory",
      label: "Quản lý kho",
      icon: ShoppingCart, // kho / hàng hóa
      roles: ["admin", "staff"],
      submenu: [
        { label: "Xuất hàng", path: "/inventory/export" },
        { label: "Nhập hàng", path: "/inventory/import" },
        { label: "Lịch sử giao dịch", path: "/inventory/vouchers" },
      ],
    },
  ];

  return (
    <aside
      className="position-fixed top-0 start-0 h-100 d-flex flex-column justify-content-between shadow-sm"
      style={{
        width: "270px",
        background: "linear-gradient(180deg, #ffffff, #f8fafc)",
        borderRight: "1px solid #e2e8f0",
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.35s ease, opacity 0.3s ease",
        opacity: isOpen ? 1 : 0,
        zIndex: 1100,
        overflowY: "auto",
      }}
    >
      <div className="d-flex flex-column justify-content-between h-100 p-3">
        {/* Logo */}
        <div className="d-flex justify-content-center mb-4">
          <div
            className="d-flex align-items-center justify-content-center overflow-hidden rounded-2 border"
            style={{ width: "100%", height: 90, backgroundColor: "#17412eff" }}
          >
            <img
              src="/assets/logo.png"
              alt="logo"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </div>
        </div>

        {/* --- MENU --- */}
        <ul className="nav flex-column" style={{ gap: "6px" }}>
          {menuItems
            .filter((item) => !item.roles || item.roles.includes(roleID))
            .map((item) => {
              // Active cha nếu path khớp hoặc submenu chứa path
              const isParentActive =
                item.path === currentPath ||
                (item.submenu &&
                  item.submenu.some((s) => s.path === currentPath));

              return (
                <li key={item.id} className="nav-item">
                  {/* Menu cha */}
                  <button
                    onClick={() => {
                      if (item.submenu) {
                        setExpandedMenu(
                          expandedMenu === item.id ? null : item.id
                        );
                      } else if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    className="nav-link d-flex align-items-center gap-2 py-2 px-3 rounded w-100 text-start border-0"
                    style={{
                      color: isParentActive ? "#1e293b" : "#334155",
                      backgroundColor: isParentActive
                        ? "#e2e8f0"
                        : "transparent",
                      fontWeight: isParentActive ? 600 : 500,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>

                    {item.submenu && (
                      <ChevronDown
                        size={16}
                        className={`ms-auto ${
                          expandedMenu === item.id ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {/* Submenu */}
                  {item.submenu &&
                    expandedMenu === item.id &&
                    item.submenu.map((sub, idx) => {
                      const isActive = sub.path === currentPath;

                      return (
                        <button
                          key={idx}
                          onClick={() => navigate(sub.path)}
                          className="btn w-100 text-start ps-3 py-1 small border-0"
                          style={{
                            color: isActive ? "#0f172a" : "#64748b",
                            backgroundColor: isActive
                              ? "#cbd5e1"
                              : "transparent",
                            fontWeight: isActive ? 600 : 400,
                            transition: "all 0.2s ease",
                          }}
                        >
                          • {sub.label}
                        </button>
                      );
                    })}
                </li>
              );
            })}
        </ul>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="btn d-flex align-items-center gap-2 mt-auto"
          style={{
            color: "#dc2626",
            fontWeight: 500,
            background: "#fee2e2",
            border: "none",
            borderRadius: "8px",
            padding: "8px 12px",
          }}
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
