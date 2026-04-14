import { WatchLaterEndpoints } from "../enums";
import { httpGet, httpPost, httpDelete } from "./http.service";

export const addToWatchLater = async (videoId: string) => {
  try {
    const response = await httpPost(`${WatchLaterEndpoints.BASE}/${videoId}`);
    return response.data;
  } catch (error) {
    console.log("watchlater.service.addToWatchLater error", error);
    throw error;
  }
};

export const removeFromWatchLater = async (videoId: string) => {
  try {
    const response = await httpDelete(`${WatchLaterEndpoints.BASE}/${videoId}`);
    return response.data;
  } catch (error) {
    console.log("watchlater.service.removeFromWatchLater error", error);
    throw error;
  }
};

export const getWatchLaterVideos = async () => {
  try {
    const response = await httpGet(WatchLaterEndpoints.BASE);
    return response.data;
  } catch (error) {
    console.log("watchlater.service.getWatchLaterVideos error", error);
    throw error;
  }
};

export const getWatchLaterStatus = async (videoId: string) => {
  try {
    const response = await httpGet(`${WatchLaterEndpoints.BASE}/${videoId}/status`);
    return response.data;
  } catch (error) {
    console.log("watchlater.service.getWatchLaterStatus error", error);
    throw error;
  }
};
