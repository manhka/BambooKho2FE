import { api } from "./api";
import { API_ENDPOINTS } from "../constants/api";
// Giả định API_ENDPOINTS có cấu trúc như sau:
// API_ENDPOINTS.INVENTORY.IMPORT = '/api/inventory/import'
// API_ENDPOINTS.INVENTORY.EXPORT = '/api/inventory/export'
// API_ENDPOINTS.INVENTORY.VOUCHERS = '/api/inventory/vouchers'

/**
 * 📥 Xử lý Nhập Kho (Goods Receipt)
 * @param {object} importData - Dữ liệu nhập kho (SupplierID, details, description)
 */
export const createGoodsImport = async (importData) => {
  try {
    const res = await api.post(API_ENDPOINTS.INVENTORY.IMPORT, importData);
    return res.data;
  } catch (error) {
    console.error(
      "Create goods import error:",
      error.response?.data || error.message
    );
    // Ném lỗi để FE hiển thị thông báo nghiệp vụ (ví dụ: Tên lô đã tồn tại)
    throw error.response?.data || { message: "Lỗi tạo chứng từ nhập kho." };
  }
};

// -----------------------------------------------------------------

/**
 * 📤 Xử lý Xuất Kho (Goods Issue)
 * @param {object} exportData - Dữ liệu xuất kho (CustomerID, details, description)
 */
export const createGoodsExport = async (exportData) => {
  try {
    const res = await api.post(API_ENDPOINTS.INVENTORY.EXPORT, exportData);
    return res.data;
  } catch (error) {
    console.error(
      "Create goods export error:",
      error.response?.data || error.message
    );
    // Ném lỗi để FE hiển thị thông báo nghiệp vụ (ví dụ: Không đủ tồn kho)
    throw error.response?.data || { message: "Lỗi tạo chứng từ xuất kho." };
  }
};

// -----------------------------------------------------------------

/**
 * ↩️ Xử lý Trả Hàng (Goods Return)
 * @param {object} returnData - Dữ liệu trả hàng (CustomerID, referenceID, details, description)
 */
// export const createGoodsReturn = async (returnData) => {
//   try {
//     const res = await api.post(API_ENDPOINTS.INVENTORY.RETURN, returnData);
//     return res.data;
//   } catch (error) {
//     console.error(
//       "Create goods return error:",
//       error.response?.data || error.message
//     );
//     throw error.response?.data || { message: "Lỗi tạo chứng từ trả hàng." };
//   }
// };

// -----------------------------------------------------------------

export const fetchInventoryVouchers = async (params) => {
  try {
    const res = await api.get(API_ENDPOINTS.INVENTORY.VOUCHERS, {
      // Truyền đối tượng params trực tiếp
      params: params,
    });

    // Backend được thiết kế để trả về { success: true, data: [...], total: N }
    return res.data;
  } catch (error) {
    console.error(
      "Fetch vouchers error:",
      error.response?.data || error.message
    );
    // Ném lỗi để FE hiển thị thông báo
    throw error.response?.data || { message: "Lỗi lấy danh sách chứng từ." };
  }
};

// -----------------------------------------------------------------

/**
 * 📃 Lấy chi tiết Chứng từ theo ID
 * @param {number} voucherId
 */

export const getVoucherDetails = async (id) => {
  if (!id) {
    throw { message: "Mã chứng từ không hợp lệ." };
  }

  try {
    // Sử dụng endpoint đã được thiết lập để chấp nhận mã code trong URL
    // API_ENDPOINTS.INVENTORY.VOUCHER_DETAIL = (id) => `/inventory/vouchers/${id}`
    const url = API_ENDPOINTS.INVENTORY.VOUCHER_DETAIL(id);

    const res = await api.get(url);

    // Backend được thiết kế để trả về { success: true, data: voucherObject }
    console.log("dataaaaa:", res.data);
    return res.data;
  } catch (error) {
    console.error(
      `Get voucher ${id} details error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Lỗi lấy chi tiết chứng từ." };
  }
};
