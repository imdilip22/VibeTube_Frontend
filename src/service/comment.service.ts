import { VIDEO_BASE } from "../enums";
import { httpGet, httpPost, httpDelete } from "./http.service";

export type CommentRecord = {
  id: string;
  videoId: string;
  userEmail: string;
  content: string;
  parentId: string | null;
  createdAt: string;
  commenter?: { name: string };
};

export const getComments = async (videoId: string): Promise<CommentRecord[]> => {
  const response = await httpGet(`${VIDEO_BASE}/${videoId}/comments`);
  return response.data.data ?? [];
};

export const addComment = async (
  videoId: string,
  content: string,
  parentId: string | null = null
): Promise<CommentRecord> => {
  const response = await httpPost(`${VIDEO_BASE}/${videoId}/comments`, { content, parentId });
  return response.data.data as CommentRecord;
};

export const deleteComment = async (videoId: string, commentId: string): Promise<void> => {
  await httpDelete(`${VIDEO_BASE}/${videoId}/comments/${commentId}`);
};
