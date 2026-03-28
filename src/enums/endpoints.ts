// ─── Base URL ─────────────────────────────────────────────────────────────────
export const BASE_URL = "http://localhost:3000/api/v1";

// ─── Auth Endpoints ───────────────────────────────────────────────────────────
export enum AuthEndpoints {
  REGISTER = "/auth/register",
  LOGIN = "/auth/login",
  ME = "/auth/me",
  REFRESH = "/auth/refresh",
  LOGOUT = "/auth/logout",
}

// ─── Video Endpoints ──────────────────────────────────────────────────────────
export enum VideoEndpoints {
  UPLOAD = "/videos/upload",
  GET_ALL = "/videos",
  GET_STATUS = "/videos/status", // append /:id
}

export const VIDEO_BASE = "/videos";

// ─── Subscription Endpoints ───────────────────────────────────────────────────
// All append /:channelEmail  e.g. /subscriptions/user@example.com
export const SUBSCRIPTION_BASE = "/subscriptions";
