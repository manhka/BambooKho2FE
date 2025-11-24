import { api } from "./api";
import { API_ENDPOINTS } from "../constants/api";

export const fetchSuppliers = async (page = 1, limit = 10, search = "") => {
  try {
    const res = await api.get(API_ENDPOINTS.SUPPLIERS.LIST, {
      params: {
        page,
        limit,
        search,
      },
    });
    return res.data;
  } catch (error) {
    console.error(
      "Fetch suppliers error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const getSupplierDetail = async (supplierId) => {
  try {
    const url = API_ENDPOINTS.SUPPLIERS.DETAIL.replace(":id", supplierId);
    const res = await api.get(url);
    return res.data;
  } catch (error) {
    console.error(
      `Get supplier ${supplierId} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const createSupplier = async (data) => {
  try {
    const res = await api.post(API_ENDPOINTS.SUPPLIERS.CREATE, data);
    return res.data;
  } catch (error) {
    console.error(
      "Create supplier error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const updateSupplier = async (supplierId, data) => {
  try {
    const url = API_ENDPOINTS.SUPPLIERS.UPDATE(supplierId);
    const res = await api.put(url, data);
    return res.data;
  } catch (error) {
    console.error(
      `Update supplier ${supplierId} error:`,
      error.response?.data || error.message
    );

    if (error.response && error.response.data) {
      throw error.response.data;
    }

    throw { message: error.message || "Network or unknown error" };
  }
};
