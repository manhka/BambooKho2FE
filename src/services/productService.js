import { api } from "./api";
import { API_ENDPOINTS } from "../constants/api";

// Lấy danh sách sản phẩm (có phân trang, tìm kiếm, lọc status)
// GET /products
export const fetchProducts = async (
  page = 1,
  limit = 8,
  search = "",
  status = "",
  locationId = ""
) => {
  try {
    const params = { page, limit, search };
    if (status) params.status = status;
    if (locationId) params.locationId = locationId;

    const res = await api.get("/products", { params });
    return res.data;
  } catch (err) {
    console.error("Fetch products error:", err.response?.data || err.message);
    throw err.response?.data || { message: err.message };
  }
};

// Lấy chi tiết sản phẩm theo Barcode
// GET /products/:barcode
export const getProductDetail = async (barcode) => {
  try {
    // Sử dụng function để tạo URL nếu trong constants định nghĩa dạng function
    const url = API_ENDPOINTS.PRODUCTS.DETAIL(barcode);
    // Hoặc nếu constants định nghĩa dạng string ":id" thì dùng replace như category:
    // const url = API_ENDPOINTS.PRODUCTS.DETAIL.replace(":id", barcode);

    const res = await api.get(url);
    return res.data;
  } catch (error) {
    console.error(
      `Get product ${barcode} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

// Tạo sản phẩm mới
// POST /products
export const createProduct = async (productData) => {
  try {
    const res = await api.post(API_ENDPOINTS.PRODUCTS.CREATE, productData);
    return res.data;
  } catch (error) {
    console.error(
      "Create product error:",
      error.response?.data || error.message
    );
    // Backend trả về lỗi validation có cấu trúc, cần throw đúng object đó
    throw error.response?.data || { message: error.message };
  }
};

// Cập nhật sản phẩm theo Barcode
// PUT /products/:barcode
export const updateProduct = async (barcode, data) => {
  try {
    const url = API_ENDPOINTS.PRODUCTS.UPDATE(barcode);
    const res = await api.put(url, data);
    return res.data;
  } catch (error) {
    console.error(
      `Update product ${barcode} error:`,
      error.response?.data || error.message
    );

    if (error.response && error.response.data) {
      throw error.response.data;
    }

    throw { message: error.message || "Network or unknown error" };
  }
};

// Lưu trữ (Xóa mềm) sản phẩm
// DELETE /products/:barcode
export const archiveProduct = async (barcode) => {
  try {
    const url = API_ENDPOINTS.PRODUCTS.ARCHIVE(barcode);
    const res = await api.delete(url);
    return res.data;
  } catch (error) {
    console.error(
      `Archive product ${barcode} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Network or unknown error" };
  }
};

// Khôi phục sản phẩm
// POST /products/:barcode/restore
export const restoreProduct = async (barcode) => {
  try {
    const url = API_ENDPOINTS.PRODUCTS.RESTORE(barcode);
    // Restore là phương thức POST và không cần body data
    const res = await api.post(url);
    return res.data;
  } catch (error) {
    console.error(
      `Restore product ${barcode} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const importProducts = async (file) => {
  try {
    const formData = new FormData();
    // Key "file" phải khớp với upload.single("file") trong router backend
    formData.append("file", file);

    const res = await api.post(API_ENDPOINTS.PRODUCTS.IMPORT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Trả về { message, results: { success, failed, items: [...], errors: [...] } }
    return res.data;
  } catch (error) {
    console.error(
      "Import products error:",
      error.response?.data || error.message
    );
    // Throw nguyên vẹn data để Frontend Component có thể đọc detailed errors
    throw (
      error.response?.data || {
        message: "Lỗi kết nối máy chủ khi import file.",
      }
    );
  }
};

// Hàm 2: Lưu trữ các sản phẩm đã được xác thực (Xác nhận)
// POST /products/confirm-import
export const saveImportedProducts = async (products) => {
  try {
    // products là mảng các sản phẩm đã được xác thực từ Giai đoạn 1
    const res = await api.post(API_ENDPOINTS.PRODUCTS.CONFIRM_IMPORT, {
      productsToSave: products,
    });

    // Trả về { message, count }
    return res.data;
  } catch (error) {
    console.error(
      "Save imported products error:",
      error.response?.data || error.message
    );
    throw (
      error.response?.data || {
        message: "Lỗi kết nối máy chủ khi lưu sản phẩm.",
      }
    );
  }
};

/**
 * 1. 🔍 Tìm kiếm Sản phẩm, Lô, Serial chung
 * @param {string} searchText - Barcode, Tên, hoặc Serial Number
 */
export const fetchProductsAndInventory = async (searchText) => {
  try {
    const query = searchText || "";
    const url = API_ENDPOINTS.PRODUCTS.SEARCH(query);

    const res = await api.get(url);
    console.log("ressss:", res);
    return res.data.data;
  } catch (error) {
    console.error(
      "Fetch products search error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Lỗi tìm kiếm sản phẩm." };
  }
};

/**
 * 2. 📦 Lấy tồn kho Lô theo Barcode (Đã viết lại)
 * @param {string} barcode - Barcode của sản phẩm
 */
export const fetchBatchesByProduct = async (barcode) => {
  try {
    // --- SỬA ĐỔI: Sử dụng hàm API_ENDPOINTS trực tiếp ---
    const url = API_ENDPOINTS.PRODUCTS.BATCHES(barcode);
    // --------------------------------------------------

    const res = await api.get(url);
    // Backend được thiết kế để trả về { success: true, data: [lô 1, lô 2, ...] }
    return res.data;
  } catch (error) {
    console.error(
      `Fetch batches for ${barcode} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Lỗi lấy danh sách lô." };
  }
};

// ----------------------------------------------------------------

/**
 * 3. 🔢 Lấy tồn kho Serial theo Barcode (Đã viết lại)
 * @param {string} barcode - Barcode của sản phẩm
 */
export const fetchSerialsByProduct = async (barcode) => {
  try {
    // --- SỬA ĐỔI: Sử dụng hàm API_ENDPOINTS trực tiếp ---
    const url = API_ENDPOINTS.PRODUCTS.SERIALS(barcode);
    // ---------------------------------------------------

    const res = await api.get(url);
    // Backend được thiết kế để trả về { success: true, data: [serial 1, serial 2, ...] }
    return res.data;
  } catch (error) {
    console.error(
      `Fetch serials for ${barcode} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Lỗi lấy danh sách serial." };
  }
};
