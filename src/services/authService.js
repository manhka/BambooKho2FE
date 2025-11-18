import { apiPublic, api } from "./api";
import { API_ENDPOINTS } from "../constants/api";

export const login = async (username, password) => {
  try {
    const res = await apiPublic.post(API_ENDPOINTS.AUTH.LOGIN, {
      username,
      password,
    });
    return res.data;
  } catch (error) {
    console.error("Login error:", error.response?.data || error.message);
    throw error.response?.data || { message: error.message };
  }
};

export const register = async (
  username,
  password,
  phone,
  roleId = 2,
  token
) => {
  try {
    const res = await api.post(
      API_ENDPOINTS.AUTH.REGISTER,
      { username, password, phone, roleId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Axios register error:", error.response || error.message);
    throw error;
  }
};
