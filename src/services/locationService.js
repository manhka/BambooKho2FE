import { api } from "./api";
import { API_ENDPOINTS } from "../constants/api";

// ============================================================
// 1. READ: LẤY DANH SÁCH VỊ TRÍ
// ============================================================
export const fetchLocations = async (
  page = 1,
  limit = 10,
  search = "",
  status = "active" // Trong LocationController, ta dùng IsActive, giả định backend map status -> IsActive
) => {
  try {
    const res = await api.get(API_ENDPOINTS.LOCATIONS.LIST, {
      params: {
        page,
        limit,
        search,
        status,
      },
    });
    return res.data;
  } catch (error) {
    console.error(
      "Fetch locations error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

// ============================================================
// 2. READ: LẤY CHI TIẾT VỊ TRÍ (Giả định backend có route này)
// ============================================================
export const getLocationDetail = async (locationId) => {
  try {
    const url = API_ENDPOINTS.LOCATIONS.DETAIL.replace(":id", locationId);
    const res = await api.get(url);
    return res.data;
  } catch (error) {
    console.error(
      `Get location ${locationId} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

// ============================================================
// 3. CREATE: TẠO VỊ TRÍ MỚI
// ============================================================
export const createLocation = async (locationData) => {
  try {
    const res = await api.post(API_ENDPOINTS.LOCATIONS.CREATE, locationData);
    return res.data;
  } catch (error) {
    console.error(
      "Create location error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

// ============================================================
// 4. UPDATE: CẬP NHẬT VỊ TRÍ
// ============================================================
export const updateLocation = async (locationId, data) => {
  try {
    const url = API_ENDPOINTS.LOCATIONS.UPDATE(locationId);

    const res = await api.put(url, data);

    return res.data;
  } catch (error) {
    console.error(
      `Update location ${locationId} error:`,
      error.response?.data || error.message
    );

    if (error.response && error.response.data) {
      throw error.response.data;
    }

    throw { message: error.message || "Network or unknown error" };
  }
};

// ============================================================
// 5. ARCHIVE: XÓA MỀM VỊ TRÍ (DELETE)
// ============================================================
export const removeLocation = async (locationId) => {
  try {
    const url = API_ENDPOINTS.LOCATIONS.DELETE(locationId);
    const res = await api.delete(url);
    return res.data;
  } catch (error) {
    console.error(
      `Delete location ${locationId} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Network or unknown error" };
  }
};

// ============================================================
// 6. RESTORE: KHÔI PHỤC VỊ TRÍ (Giả định backend có route này)
// ============================================================
export const restoreLocation = async (locationId) => {
  if (!locationId) throw { message: "locationId không hợp lệ" };

  try {
    const url = API_ENDPOINTS.LOCATIONS.RESTORE(locationId);
    const response = await api.post(url);
    return response.data;
  } catch (err) {
    const errorData = err.response?.data || {
      message: err.message || "Lỗi máy chủ",
    };
    console.error(`Restore location ${locationId} error:`, errorData);
    throw errorData;
  }
};
