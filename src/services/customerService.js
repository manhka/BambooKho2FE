import { api } from "./api";
import { API_ENDPOINTS } from "../constants/api";

export const fetchCustomers = async (page = 1, limit = 10, search = "") => {
  try {
    const res = await api.get(API_ENDPOINTS.CUSTOMERS.LIST, {
      params: {
        page,
        limit,
        search,
      },
    });
    return res.data;
  } catch (error) {
    console.error(
      "Fetch customers error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const getCustomerDetail = async (customerId) => {
  try {
    const url = API_ENDPOINTS.CUSTOMERS.DETAIL.replace(":id", customerId);
    const res = await api.get(url);
    return res.data;
  } catch (error) {
    console.error(
      `Get customer ${customerId} error:`,
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const createCustomer = async (data) => {
  try {
    const res = await api.post(API_ENDPOINTS.CUSTOMERS.CREATE, data);
    return res.data;
  } catch (error) {
    console.error(
      "Create customer error:",
      error.response?.data || error.message
    );
    throw error.response?.data || { message: error.message };
  }
};

export const updateCustomer = async (customerId, data) => {
  try {
    const url = API_ENDPOINTS.CUSTOMERS.UPDATE(customerId);
    const res = await api.put(url, data);
    return res.data;
  } catch (error) {
    console.error(
      `Update customer ${customerId} error:`,
      error.response?.data || error.message
    );

    if (error.response && error.response.data) {
      throw error.response.data;
    }

    throw { message: error.message || "Network or unknown error" };
  }
};
