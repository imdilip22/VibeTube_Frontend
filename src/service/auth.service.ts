import { AuthEndpoints } from "../enums";
import { httpPost, httpGet } from "./http.service";

export const registerUser = async (email: string, name: string, password: string) => {
  try {
    const response = await httpPost(AuthEndpoints.REGISTER, { email, name, password });
    // No tokens returned — user must log in after registration
    return response.data;
  } catch (error) {
    console.log("auth.service.registerUser error", error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await httpPost(AuthEndpoints.LOGIN, { email, password });
    // Tokens are set as HTTP-only cookies by the backend
    return response.data;
  } catch (error) {
    console.log("auth.service.loginUser error", error);
    throw error;
  }
};

export const getMe = async () => {
  try {
    const response = await httpGet(AuthEndpoints.ME);
    return response.data;
  } catch (error) {
    console.log("auth.service.getMe error", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await httpPost(AuthEndpoints.LOGOUT);
  } catch (error) {
    console.log("auth.service.logoutUser error", error);
  }
};
