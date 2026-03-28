import axios from "axios";
import { BASE_URL, AuthEndpoints } from "../enums";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // ← send cookies with every request
});

// ─── Response interceptor: auto-refresh on 401 ───────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (v: unknown) => void; reject: (e: unknown) => void }[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(undefined);
    }
  });
  failedQueue = [];
};

// Endpoints that should NOT trigger a refresh loop or redirect
const SKIP_REFRESH_URLS = [AuthEndpoints.REFRESH, AuthEndpoints.ME, AuthEndpoints.LOGIN, AuthEndpoints.REGISTER];

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest || !error.response) {
      return Promise.reject(error);
    }

    // Only attempt refresh on 401 and if we haven't already retried
    if (error.response.status === 401 && !originalRequest._retry) {
      // Don't attempt refresh for auth-related endpoints
      if (SKIP_REFRESH_URLS.includes(originalRequest.url)) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until the refresh resolves
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh token is sent automatically via cookie (withCredentials)
        await axiosInstance.post(AuthEndpoints.REFRESH);

        processQueue(null);

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log("axios refresh token failed", refreshError);
        processQueue(refreshError);
        // Let the app handle redirect via AuthContext — don't force window.location
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
