import axios from "axios";
import { BASE_URL, AuthEndpoints } from "../enums";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // always send the accessToken cookie
});

// ─── 401 interceptor ─────────────────────────────────────────────────────────
// On 401: attempt one silent token refresh, then retry.
// On double-401 (refresh also failed): redirect to /login with session-expired flag.

let isRefreshing = false;
let pendingQueue: { resolve: () => void; reject: (err: unknown) => void }[] = [];

const drainQueue = (error: unknown) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve()));
  pendingQueue = [];
};

axiosInstance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Only handle 401; ignore non-401 errors, and skip auth endpoints to prevent loops
    const isAuthEndpoint = original?.url?.includes("/auth/refresh") || original?.url?.includes("/auth/login");
    if (error.response?.status !== 401 || original?._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (isRefreshing) {
      // Queue requests while a refresh is in flight
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: () => resolve(axiosInstance(original)),
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      await axiosInstance.post(AuthEndpoints.REFRESH);
      drainQueue(null);
      return axiosInstance(original); // silent retry
    } catch (refreshError) {
      drainQueue(refreshError);
      // Both tokens are dead — redirect to login with session-expired flag.
      // The AuthContext will clear in-memory user state when it sees this URL param.
      window.location.href = "/login?reason=session_expired";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;
