import { api } from "./api";
import { API_ENDPOINTS } from "../constants/api";

export const fetchCategories = async (
  page = 1,
  limit = 10,
  search = "",
  status = "active"
) => {
  try {
    const res = await api.get(API_ENDPOINTS.CATEGORIES.LIST, {
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
      "Fetch categories error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const getCategoryDetail = async (categoryId) => {
  try {
    const url = API_ENDPOINTS.CATEGORIES.DETAIL.replace(":id", categoryId);
    const res = await api.get(url);
    return res.data;
  } catch (error) {
    console.error(
      `Get category ${categoryId} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const createCategory = async (categoryData) => {
  try {
    const res = await api.post(API_ENDPOINTS.CATEGORIES.CREATE, categoryData);
    return res.data;
  } catch (error) {
    console.error(
      "Create category error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const updateCategory = async (categoryId, data) => {
  try {
    const url = API_ENDPOINTS.CATEGORIES.UPDATE(categoryId);

    // Sử dụng PUT/PATCH request để gửi dữ liệu cập nhật
    const res = await api.put(url, data);

    return res.data;
  } catch (error) {
    console.error(
      `Update category ${categoryId} error:`,
      error.response?.data || error.message
    );

    if (error.response && error.response.data) {
      throw error.response.data;
    }

    throw { message: error.message || "Network or unknown error" };
  }
};

export const archiveCategory = async (categoryId) => {
  try {
    const url = API_ENDPOINTS.CATEGORIES.ARCHIVE(categoryId);
    const res = await api.delete(url);
    return res.data;
  } catch (error) {
    console.error(
      `Archive category ${categoryId} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Network or unknown error" };
  }
};

export const restoreCategory = async (categoryId) => {
  try {
    const url = API_ENDPOINTS.CATEGORIES.RESTORE(categoryId);
    const res = await api.post(url);
    return res.data;
  } catch (error) {
    console.error(
      `Restore category ${categoryId} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};
