import { api } from "./api";
import { API_ENDPOINTS } from "../constants/api";

export const fetchBrands = async (
  page = 1,
  limit = 10,
  search = "",
  status = "active"
) => {
  try {
    const res = await api.get(API_ENDPOINTS.BRANDS.LIST, {
      params: {
        page,
        limit,
        search,
        status,
      },
    });
    return res.data;
  } catch (error) {
    console.error("Fetch brands error:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message };
  }
};

export const getBrandDetail = async (brandId) => {
  try {
    const url = API_ENDPOINTS.BRANDS.DETAIL.replace(":id", brandId);
    const res = await api.get(url);
    return res.data;
  } catch (error) {
    console.error(
      `Get brand ${brandId} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const createBrand = async (brandData) => {
  try {
    const res = await api.post(API_ENDPOINTS.BRANDS.CREATE, brandData);
    return res.data;
  } catch (error) {
    console.error("Create brand error:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message };
  }
};

export const updateBrand = async (brandId, data) => {
  try {
    const url = API_ENDPOINTS.BRANDS.UPDATE(brandId);

    const res = await api.put(url, data);

    return res.data;
  } catch (error) {
    console.error(
      `Update brand ${brandId} error:`,
      error.response?.data || error.message
    );

    if (error.response && error.response.data) {
      throw error.response.data;
    }

    throw { message: error.message || "Network or unknown error" };
  }
};

export const archiveBrand = async (brandId) => {
  try {
    const url = API_ENDPOINTS.BRANDS.ARCHIVE(brandId);
    const res = await api.delete(url);
    return res.data;
  } catch (error) {
    console.error(
      `Archive brand ${brandId} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: "Network or unknown error" };
  }
};

export const restoreBrand = async (brandId) => {
  try {
    const url = API_ENDPOINTS.BRANDS.RESTORE(brandId);
    const res = await api.post(url);
    return res.data;
  } catch (error) {
    console.error(
      `Restore brand ${brandId} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};
