import { AuthEndpoints } from "../enums";
import { httpPost } from "./http.service";

export const registerUser = async (email: string, name: string, password: string) => {
  const response = await httpPost(AuthEndpoints.REGISTER, { email, name, password });
  return response.data;
};

export const loginUser = async (email: string, password: string) => {
  // Backend sets the accessToken cookie; response body contains { user: { email, name } }
  const response = await httpPost(AuthEndpoints.LOGIN, { email, password });
  return response.data;
};

export const logoutUser = async () => {
  await httpPost(AuthEndpoints.LOGOUT);
};
