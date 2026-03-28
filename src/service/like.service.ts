import { VIDEO_BASE } from "../enums";
import { httpGet, httpPost } from "./http.service";

export type LikeInfo = {
  likeCount: number;
  isLiked: boolean;
};

export const getLikeInfo = async (videoId: string): Promise<LikeInfo> => {
  const response = await httpGet(`${VIDEO_BASE}/${videoId}/likes`);
  return response.data.data as LikeInfo;
};

export const toggleLike = async (videoId: string): Promise<LikeInfo> => {
  const response = await httpPost(`${VIDEO_BASE}/${videoId}/likes`);
  return response.data.data as LikeInfo;
};
