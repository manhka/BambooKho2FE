// services/dashboardService.js

import { api } from "./api";
import { API_ENDPOINTS } from "../constants/api";

export const getInventorySummary = async (params) => {
  try {
    // Gọi API: /api/dashboard/summary
    const res = await api.get(API_ENDPOINTS.DASHBOARD.SUMMARY, {
      params: params, // Truyền đối tượng params để gửi startDate, endDate, dataType
    });

    return res.data;
  } catch (error) {
    console.error(
      "Fetch dashboard summary error:",
      error.response?.data || error.message
    );
    // Ném lỗi để FE xử lý và hiển thị thông báo
    throw (
      error.response?.data || {
        message: "Lỗi kết nối hoặc lỗi máy chủ khi tải Dashboard.",
      }
    );
  }
};
