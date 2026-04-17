import { WatchHistoryEndpoints } from "../enums";
import { httpGet, httpPost, httpDelete } from "./http.service";

/** Record a video as watched (call when the video starts playing). */
export const recordWatchHistory = async (videoId: string) => {
  try {
    const response = await httpPost(`${WatchHistoryEndpoints.BASE}/${videoId}`);
    return response.data;
  } catch (error) {
    console.log("watchhistory.service.recordWatchHistory error", error);
    throw error;
  }
};

/** Fetch the full watch history for the current user. */
export const getWatchHistory = async () => {
  try {
    const response = await httpGet(WatchHistoryEndpoints.BASE);
    return response.data;
  } catch (error) {
    console.log("watchhistory.service.getWatchHistory error", error);
    throw error;
  }
};

/** Remove a single video from history. */
export const removeFromWatchHistory = async (videoId: string) => {
  try {
    const response = await httpDelete(`${WatchHistoryEndpoints.BASE}/${videoId}`);
    return response.data;
  } catch (error) {
    console.log("watchhistory.service.removeFromWatchHistory error", error);
    throw error;
  }
};

/** Clear the entire watch history. */
export const clearWatchHistory = async () => {
  try {
    const response = await httpDelete(`${WatchHistoryEndpoints.BASE}/clear`);
    return response.data;
  } catch (error) {
    console.log("watchhistory.service.clearWatchHistory error", error);
    throw error;
  }
};
