import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
// import RegisterPage from "./pages/RegisterPage";

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    {/* <Route path="/register" element={<LoginPage />} /> */}
  </Routes>
);

export default AppRoutes;
