import { VideoEndpoints } from "../enums";
import { httpGet, httpPostForm } from "./http.service";

export const uploadVideo = async (file: File, title: string, thumbnail?: File) => {
  try {
    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    if (thumbnail) formData.append("thumbnail", thumbnail);
    const response = await httpPostForm(VideoEndpoints.UPLOAD, formData);
    return response.data;
  } catch (error) {
    console.log("video.service.uploadVideo error", error);
    throw error;
  }
};

export const getAllVideos = async () => {
  try {
    const response = await httpGet(VideoEndpoints.GET_ALL);
    return response.data;
  } catch (error) {
    console.log("video.service.getAllVideos error", error);
    throw error;
  }
};

export const getVideosByChannel = async (channelEmail: string) => {
  try {
    const response = await httpGet(`${VideoEndpoints.GET_ALL}?createdBy=${encodeURIComponent(channelEmail)}`);
    return response.data;
  } catch (error) {
    console.log("video.service.getVideosByChannel error", error);
    throw error;
  }
};

export const getVideoStatus = async (videoId: string) => {
  try {
    const response = await httpGet(`${VideoEndpoints.GET_STATUS}/${videoId}`);
    return response.data;
  } catch (error) {
    console.log("video.service.getVideoStatus error", error);
    throw error;
  }
};
