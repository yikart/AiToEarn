import { request } from "@/utils/request";
import { SentPostsParams, SentPostsResponse } from "./types/sent.types";

// 获取已发布帖子列表
export const getSentPosts = (params: SentPostsParams) => {
  return request<SentPostsResponse>({
    url: "statistics/posts/list",
    method: "POST",
    data: params,
  });
};
