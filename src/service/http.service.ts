import axiosInstance from "../client/axios";

// ─── Generic HTTP helpers ─────────────────────────────────────────────────────
// Components never call axios directly — they use service functions.
// These wrappers are consumed by domain services (auth.service, video.service).

export const httpGet = async (url: string) => {
  try {
    const response = await axiosInstance.get(url);
    return response;
  } catch (error) {
    console.log("httpGet error", error);
    throw error;
  }
};

export const httpPost = async (url: string, data?: unknown, headers?: Record<string, string>) => {
  try {
    const response = await axiosInstance.post(url, data, headers ? { headers } : undefined);
    return response;
  } catch (error) {
    console.log("httpPost error", error);
    throw error;
  }
};

export const httpPostForm = async (url: string, formData: FormData) => {
  try {
    const response = await axiosInstance.post(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  } catch (error) {
    console.log("httpPostForm error", error);
    throw error;
  }
};

export const httpPut = async (url: string, data?: unknown, headers?: Record<string, string>) => {
  try {
    const response = await axiosInstance.put(url, data, headers ? { headers } : undefined);
    return response;
  } catch (error) {
    console.log("httpPut error", error);
    throw error;
  }
};

export const httpPatch = async (url: string, data?: unknown) => {
  try {
    const response = await axiosInstance.patch(url, data);
    return response;
  } catch (error) {
    console.log("httpPatch error", error);
    throw error;
  }
};

export const httpDelete = async (url: string, body?: unknown) => {
  try {
    const response = await axiosInstance.delete(url, body ? { data: body } : undefined);
    return response;
  } catch (error) {
    console.log("httpDelete error", error);
    throw error;
  }
};
