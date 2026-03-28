import { SUBSCRIPTION_BASE } from "../enums";
import { httpGet, httpPost, httpDelete } from "./http.service";

export type SubscriptionInfo = {
  subscriberCount: number;
  isSubscribed: boolean;
};

export type SubscribedChannel = {
  email: string;
  name: string;
  subscriberCount: number;
  subscribedAt: string;
};

// ─── Per-channel info (count + isSubscribed) ──────────────────────────────────
export const getSubscriptionInfo = async (channelEmail: string): Promise<SubscriptionInfo> => {
  const response = await httpGet(`${SUBSCRIPTION_BASE}/${encodeURIComponent(channelEmail)}`);
  return response.data.data as SubscriptionInfo;
};

// ─── Subscribe / unsubscribe ──────────────────────────────────────────────────
export const subscribeToChannel = async (channelEmail: string): Promise<SubscriptionInfo> => {
  const response = await httpPost(`${SUBSCRIPTION_BASE}/${encodeURIComponent(channelEmail)}`);
  return response.data.data as SubscriptionInfo;
};

export const unsubscribeFromChannel = async (channelEmail: string): Promise<SubscriptionInfo> => {
  const response = await httpDelete(`${SUBSCRIPTION_BASE}/${encodeURIComponent(channelEmail)}`);
  return response.data.data as SubscriptionInfo;
};

// ─── Subscriptions feed ───────────────────────────────────────────────────────
export const getSubscriptionsFeed = async (): Promise<any[]> => {
  const response = await httpGet(`${SUBSCRIPTION_BASE}/feed`);
  return response.data.data ?? [];
};

// ─── Subscribed channels list ─────────────────────────────────────────────────
export const getSubscribedChannels = async (): Promise<SubscribedChannel[]> => {
  const response = await httpGet(`${SUBSCRIPTION_BASE}/channels`);
  return response.data.data ?? [];
};
