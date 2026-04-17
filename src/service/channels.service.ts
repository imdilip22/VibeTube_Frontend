import { ChannelsEndpoints } from "../enums";
import { httpGet } from "./http.service";

export type Channel = {
  email: string;
  name: string;
  joinedAt: string;
  videoCount: number;
  subscriberCount: number;
};

/** Fetch all channels (excludes the logged-in user). */
export const getAllChannels = async (): Promise<Channel[]> => {
  try {
    const response = await httpGet(ChannelsEndpoints.BASE);
    return response.data.data ?? [];
  } catch (error) {
    console.log("channels.service.getAllChannels error", error);
    throw error;
  }
};
