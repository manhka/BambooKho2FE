export const API_BASE_URL = "http://localhost:3001/api";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
  },

  CATEGORIES: {
    LIST: "/categories",
    DETAIL: (id) => `/categories/${id}`,
    ARCHIVE: (id) => `/categories/${id}`,
    SEARCH_BY_NAME: (name) =>
      `/categories/search/by-name?name=${encodeURIComponent(name)}`,
    CREATE: "/categories",
    UPDATE: (id) => `/categories/${id}`,
    RESTORE: (id) => `/categories/${id}/restore`,
  },
  BRANDS: {
    LIST: "/brands",
    DETAIL: (id) => `/brands/${id}`,
    ARCHIVE: (id) => `/brands/${id}`,
    CREATE: "/brands",
    UPDATE: (id) => `/brands/${id}`,
    RESTORE: (id) => `/brands/${id}/restore`,
  },
  PRODUCTS: {
    LIST: "/products",
    CREATE: "/products",
    DETAIL: (id) => `products/view-detail/${id}`,
    UPDATE: (id) => `products/${id}`,
    ARCHIVE: (id) => `products/${id}`,
    RESTORE: (id) => `products/${id}/restore`,
    IMPORT: `products/import`,
    CONFIRM_IMPORT: `products/confirm-import`,
    SEARCH: (query) =>
      `/products/search?search=${encodeURIComponent(query || "")}`,
    BATCHES: (barcode) => `/products/${barcode}/batches`,
    SERIALS: (barcode) => `/products/${barcode}/serials`,

    // --- Chức năng Nhập/Xuất Kho (Dùng chung cho Inventory Module) ---
    // (Khuyến nghị tách ra module INVENTORY)
    // Nếu bạn muốn giữ lại trong PRODUCTS (ít được khuyến nghị):
    // IMPORT_VOUCHER: '/products/import-voucher',
    // EXPORT_VOUCHER: '/products/export-voucher',
  },
  LOCATIONS: {
    LIST: "/locations",
    DETAIL: (id) => `/locations/${id}`,
    ARCHIVE: (id) => `/locations/${id}`,
    CREATE: "/locations",
    UPDATE: (id) => `/locations/${id}`,
    DELETE: (id) => `/locations/${id}`,
    RESTORE: (id) => `/locations/restore/${id}`,
  },
  CUSTOMERS: {
    LIST: "/customers",
    DETAIL: (id) => `/customers/${id}`,
    CREATE: "/customers",
    UPDATE: (id) => `/customers/${id}`,
  },
  SUPPLIERS: {
    LIST: "/suppliers",
    DETAIL: (id) => `/suppliers/${id}`,
    CREATE: "/suppliers",
    UPDATE: (id) => `/suppliers/${id}`,
  },
  INVENTORY: {
    EXPORT: "/inventory/export",
    IMPORT: "/inventory/import",
    // RETURN: "/inventory/return",
    VOUCHERS: "/inventory/vouchers",
    VOUCHER_DETAIL: (id) => `/inventory/vouchers/${id}`,
  },
  DASHBOARD: {
    SUMMARY: "/dashboard/summary",
  },
};
