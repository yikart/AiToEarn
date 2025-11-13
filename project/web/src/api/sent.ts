import { request } from "@/utils/request";
import { SentPostsResponse } from "./types/sent.types";

// Get published posts list
export const getSentPosts = (params: any) => {
  return request<SentPostsResponse>({
    url: "plat/publish/statuses/published/posts",
    method: "POST",
    data: params,
  });
};
