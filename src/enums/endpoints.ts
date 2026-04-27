// ─── Base URL ─────────────────────────────────────────────────────────────────
export const BASE_URL = "http://localhost:3000/api/v1";

// ─── Auth Endpoints ───────────────────────────────────────────────────────────
export enum AuthEndpoints {
  REGISTER = "/auth/register",
  LOGIN = "/auth/login",
  REFRESH = "/auth/refresh",
  LOGOUT = "/auth/logout",
  GOOGLE = "/auth/google",                       // GET — initiates redirect
  GOOGLE_CALLBACK = "/auth/google/callback",     // GET — backend callback (not called by frontend directly)
}

// ─── Video Endpoints ──────────────────────────────────────────────────────────
export enum VideoEndpoints {
  UPLOAD = "/videos/upload",
  GET_ALL = "/videos",
  GET_LIKED = "/videos/liked",
  GET_STATUS = "/videos/status", // append /:id
}

export const VIDEO_BASE = "/videos";

// ─── Watch Later Endpoints ────────────────────────────────────────────────────
export enum WatchLaterEndpoints {
  BASE = "/watch-later",
}

// ─── Watch History Endpoints ──────────────────────────────────────────────────
export enum WatchHistoryEndpoints {
  BASE = "/watch-history",
}

// ─── Channels Endpoints ───────────────────────────────────────────────────────
export enum ChannelsEndpoints {
  BASE = "/channels",
}

// ─── Subscription Endpoints ───────────────────────────────────────────────────
// All append /:channelEmail  e.g. /subscriptions/user@example.com
export const SUBSCRIPTION_BASE = "/subscriptions";
