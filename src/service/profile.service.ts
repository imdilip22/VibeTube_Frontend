import axiosInstance from "../client/axios";
import { ProfileEndpoints } from "../enums";

export interface UserProfile {
  email: string;
  name: string;
  avatar: string | null;
  coverPhoto: string | null;
  createdAt: string;
}

export const getProfile = async (opts?: { skipRefresh?: boolean }): Promise<UserProfile> => {
  const config = opts?.skipRefresh ? ({ _skipRefresh: true } as any) : {};
  const res = await axiosInstance.get(ProfileEndpoints.GET, config);
  return res.data.data as UserProfile;
};

export const updateProfile = async (formData: FormData): Promise<UserProfile> => {
  const res = await axiosInstance.put(ProfileEndpoints.UPDATE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data as UserProfile;
};
